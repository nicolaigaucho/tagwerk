// Tagwerk: Läufe aus Garmin Connect (Personal API) holen und in die eigene Datenbank schreiben.
// Der Garmin-Schlüssel liegt nur hier als Secret GARMIN_API_KEY.
// Adressen laut Garmins offiziellem Client github.com/garmin/connect-personal-api-python.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const GARMIN = "https://personal.connectapi.garmin.com";
const TOKEN_PATH = "/personalapitoken-service/personal-api/personal-api-key/token";
let cached: { key: string; token: string; exp: number } | null = null;

function jwtExp(t: string): number {
  try {
    const p = t.split(".")[1];
    const s = atob(p.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - p.length % 4) % 4));
    return Number(JSON.parse(s).exp) || 0;
  } catch { return 0; }
}
async function garminToken(key: string): Promise<string> {
  const now = Date.now() / 1000;
  if (cached && cached.key === key && cached.exp - now > 3600) return cached.token;
  const r = await fetch(GARMIN + TOKEN_PATH, { method: "POST", headers: { Accept: "*/*", Authorization: `ApiKey ${key}` } });
  const text = (await r.text()).trim();
  if (!r.ok) throw Object.assign(new Error(`Token HTTP ${r.status}: ${text.slice(0, 200)}`), { code: r.status === 401 || r.status === 403 ? "garmin_key" : "garmin" });
  cached = { key, token: text, exp: jwtExp(text) || now + 3600 };
  return text;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const key = (Deno.env.get("GARMIN_API_KEY") || "").trim();
  if (!key) return json({ error: "no_key", detail: "Der Garmin-Schlüssel ist noch nicht hinterlegt." });

  // Als angemeldeter Nutzer arbeiten (RLS schützt die Daten)
  const auth = req.headers.get("Authorization") || "";
  const apikey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, apikey, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: u, error: ue } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
  if (ue || !u?.user) return json({ error: "auth", detail: "Nicht angemeldet." });
  const uid = u.user.id;

  let body: { days?: number } = {};
  try { body = await req.json(); } catch { /* leer ist ok */ }
  const days = Math.min(365, Math.max(1, Number(body.days) || 60));

  try {
    const token = await garminToken(key);
    const end = new Date(), start = new Date(Date.now() - days * 864e5);
    const url = `${GARMIN}/activitylist-service/activities/search/activities?start=0&limit=100&startDate=${iso(start)}&endDate=${iso(end)}`;
    const r = await fetch(url, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    const raw = await r.text();
    if (r.status === 401) { cached = null; return json({ error: "garmin_key", detail: `Garmin lehnt den Zugang ab (401). ${raw.slice(0, 150)}` }); }
    if (!r.ok) return json({ error: "garmin", detail: `Garmin HTTP ${r.status}: ${raw.slice(0, 200)}` });
    let list: Record<string, unknown>[] = [];
    try { const j = JSON.parse(raw); list = Array.isArray(j) ? j : (j.activityList || j.activities || []); } catch { return json({ error: "garmin", detail: "Antwort von Garmin nicht lesbar: " + raw.slice(0, 150) }); }

    // deno-lint-ignore no-explicit-any
    const typeOf = (a: any) => String(a?.activityType?.typeKey || a?.activityTypeDTO?.typeKey || a?.activityType || "");
    // deno-lint-ignore no-explicit-any
    const runs = list.filter((a: any) => /running/i.test(typeOf(a)) && Number(a.distance) > 100);

    const { data: rows, error: re } = await sb.from("docs").select("path,data").eq("user_id", uid).like("path", "runs/items/%");
    if (re) return json({ error: "db", detail: re.message });
    const have = new Map((rows || []).map((x: { path: string; data: Record<string, unknown> }) => [x.path, x.data]));

    let added = 0, replaced = 0;
    const upserts: { user_id: string; path: string; data: Record<string, unknown>; updated_at: string }[] = [];
    const deletes: string[] = [];
    // deno-lint-ignore no-explicit-any
    for (const a of runs as any[]) {
      const path = `runs/items/g${a.activityId}`;
      if (have.has(path)) continue;
      const date = String(a.startTimeLocal || a.startTimeGMT || "").slice(0, 10) || iso(new Date());
      const km = Math.round(Number(a.distance) / 10) / 100;
      const sec = Math.round(Number(a.duration || a.movingDuration || a.elapsedDuration) || 0);
      if (!(sec > 0)) continue;
      // Von Hand eingetragenen Lauf am selben Tag mit ähnlicher Distanz ersetzen
      for (const [p, d] of have) {
        if (p.startsWith("runs/items/g") || d.date !== date) continue;
        if (Math.abs(Number(d.km) - km) / km < 0.2) { deletes.push(p); have.delete(p); replaced++; }
      }
      const data: Record<string, unknown> = {
        date, km, sec, note: "", source: "garmin", garminId: a.activityId, name: a.activityName || "",
        start: a.startTimeLocal || "", ts: Date.now(),
        ...(a.averageHR ? { hr: Math.round(a.averageHR) } : {}),
        ...(a.maxHR ? { hrMax: Math.round(a.maxHR) } : {}),
        ...(a.elevationGain != null ? { elev: Math.round(a.elevationGain) } : {}),
        ...(a.calories ? { kcal: Math.round(a.calories) } : {}),
        ...(a.averageRunningCadenceInStepsPerMinute ? { cad: Math.round(a.averageRunningCadenceInStepsPerMinute) } : {}),
      };
      upserts.push({ user_id: uid, path, data, updated_at: new Date().toISOString() });
      have.set(path, data); added++;
    }
    for (const p of deletes) await sb.from("docs").delete().eq("user_id", uid).eq("path", p);
    if (upserts.length) { const { error } = await sb.from("docs").upsert(upserts); if (error) return json({ error: "db", detail: error.message }); }
    const status = { last: new Date().toISOString(), added, replaced, found: runs.length, total: list.length, keys: list[0] ? Object.keys(list[0]).slice(0, 40) : [] };
    await sb.from("docs").upsert({ user_id: uid, path: "garminsync", data: status, updated_at: new Date().toISOString() });
    return json({ ok: true, ...status });
  } catch (e) {
    const err = e as Error & { code?: string };
    return json({ error: err.code || "garmin", detail: String(err.message || e).slice(0, 300) });
  }
});
