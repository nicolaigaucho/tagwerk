// Tagwerk: Essensfoto auswerten. Läuft als Supabase Edge Function, der API-Schlüssel liegt nur hier (Secret ANTHROPIC_API_KEY).
import Anthropic from "npm:@anthropic-ai/sdk@^0.136.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const client = new Anthropic(); // liest ANTHROPIC_API_KEY aus der Umgebung

const ITEM = {
  type: "object",
  additionalProperties: false,
  required: ["food_id", "name", "grams", "kcal", "p", "c", "f"],
  properties: {
    food_id: { type: "string" },
    name: { type: "string" },
    grams: { type: "number" },
    kcal: { type: "number" },
    p: { type: "number" },
    c: { type: "number" },
    f: { type: "number" },
  },
};
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "items", "confidence", "note"],
  properties: {
    title: { type: "string" },
    items: { type: "array", items: ITEM },
    confidence: { type: "string", enum: ["hoch", "mittel", "niedrig"] },
    note: { type: "string" },
  },
};
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: { image?: unknown; mediaType?: unknown; foods?: unknown; text?: unknown };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const image = typeof body.image === "string" ? body.image : "";
  const mediaType = TYPES.includes(String(body.mediaType)) ? String(body.mediaType) : "image/jpeg";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 300) : "";
  if (!text && (image.length < 100 || image.length > 7_000_000)) return json({ error: "bad_image" }, 400);
  const foods = Array.isArray(body.foods) ? body.foods.slice(0, 60) : [];
  const list = foods
    .map((f: Record<string, unknown>) => `- ID "${String(f.id)}": ${String(f.name)}, 1 Portion = ${String(f.plabel || `${f.portion} g`)} (${Number(f.portion) || 100} g)`)
    .join("\n");

  const textPrompt = `Die Person beschreibt, was sie gegessen hat: »${text}«
Schätze, aus welchen Komponenten das besteht, wie viel davon üblicherweise drin ist und welche Nährwerte das hat. Beispiel: ein Leberkäsweck ist ein Brötchen (ca. 60 g) mit einer Scheibe Leberkäse (ca. 100 g). Zahlen und Mengenwörter (zwei, halbe, große Portion) genau beachten.

Die Person isst meistens diese Lebensmittel:
${list || "(keine Liste)"}

So gehst du vor:
- Ordne eine Komponente nur dann einer ID aus der Liste zu, wenn sie wirklich dasselbe Lebensmittel ist. Sonst food_id leer ("").
- grams: übliche Menge für die beschriebene Portion, gezählt wie in der Liste (Nudeln und Reis dort ungekocht, Pommes als TK-Gewicht).
- kcal, p (Eiweiß), c (Kohlenhydrate), f (Fett): realistische Schätzung für genau diese Menge, in kcal bzw. Gramm.
- title: kurzer deutscher Name, so wie die Person es sagen würde, zum Beispiel "2 Leberkäswecken".
- confidence: wie sicher die Schätzung ist. note: ein kurzer deutscher Satz zu Annahmen (z. B. Größe), sonst leer.
- Ist die Beschreibung kein Essen oder Getränk, gib items leer zurück und erkläre es in note.`;

  const prompt = `Auf dem Foto ist eine Mahlzeit. Schätze, was darauf liegt und wie viel davon.

Die Person isst meistens diese Lebensmittel:
${list || "(keine Liste)"}

So gehst du vor:
- Ordne jede erkannte Komponente der passenden ID aus der Liste zu. Passt keine, lass food_id leer ("").
- grams: geschätzte Menge auf dem Teller, gezählt wie in der Liste. Nudeln und Reis stehen dort ungekocht: rechne die gekochte Menge auf dem Teller in ungekochtes Gewicht um (gekocht geteilt durch etwa 2,5). Pommes zählen als TK-Gewicht.
- kcal, p (Eiweiß), c (Kohlenhydrate), f (Fett): deine Schätzung für genau diese Menge, in kcal bzw. Gramm.
- Sichtbare Soße, Butter oder Öl als eigene Komponente ohne ID.
- title: kurzer deutscher Name der Mahlzeit, zum Beispiel "Hähnchen mit Reis und Paprika".
- confidence: wie sicher die Mengenschätzung ist. note: ein kurzer deutscher Satz, was unsicher ist, sonst leer.
- Ist kein Essen zu sehen, gib items leer zurück und erkläre es in note.`;

  try {
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{
        role: "user",
        content: text
          ? [{ type: "text", text: textPrompt }]
          : [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            { type: "text", text: prompt },
          ],
      }],
    } as never);
    // deno-lint-ignore no-explicit-any
    const r = res as any;
    if (r.stop_reason === "refusal") return json({ error: "refusal" });
    const text = (r.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    try {
      return json({ result: JSON.parse(text), usage: { in: r.usage?.input_tokens, out: r.usage?.output_tokens } });
    } catch {
      return json({ error: "parse" }, 502);
    }
  } catch (e) {
    // Originaltext von Claude mitschicken (enthält keine Geheimnisse), damit die App ihn anzeigen kann
    const detail = String((e as Error)?.message || e).replace(/sk-ant-[\w-]+/g, "***").slice(0, 300);
    console.error(e);
    if (e instanceof Anthropic.APIConnectionError) return json({ error: "upstream", detail });
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "key", detail });
    if (e instanceof Anthropic.PermissionDeniedError) return json({ error: "permission", detail });
    if (e instanceof Anthropic.RateLimitError) return json({ error: "rate", detail });
    if (e instanceof Anthropic.BadRequestError && /credit balance|too low|reached your specified API usage limits|spend limit/i.test(detail)) return json({ error: "credit", detail });
    if (e instanceof Anthropic.APIError) return json({ error: "api", status: (e as { status?: number }).status ?? 0, detail });
    return json({ error: "upstream", detail });
  }
});
