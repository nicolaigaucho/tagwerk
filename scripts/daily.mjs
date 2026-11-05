// Tagwerk: täglicher Überblick als Push-Mitteilung. Läuft als GitHub Action.
import webpush from 'web-push';
import {readFileSync} from 'node:fs';

const clean = v => String(v || '').replace(/\s+/g, '');
const env = process.env, FORCE = env.FORCE, VAPID_SUBJECT = env.VAPID_SUBJECT || 'mailto:tagwerk@example.com';
const SUPABASE_URL = clean(env.SUPABASE_URL).replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SUPABASE_SECRET_KEY = clean(env.SUPABASE_SECRET_KEY), VAPID_PRIVATE_KEY = clean(env.VAPID_PRIVATE_KEY);
// Öffentlicher Schlüssel kommt aus config.js (ist ohnehin öffentlich), Secret nur als Ersatz.
const fromConfig = (readFileSync(new URL('../config.js', import.meta.url), 'utf8').match(/vapidPublicKey:\s*'([^']+)'/) || [])[1];
const VAPID_PUBLIC_KEY = fromConfig && !fromConfig.includes('HIER') ? fromConfig : clean(env.VAPID_PUBLIC_KEY);
const missing = Object.entries({SUPABASE_URL, SUPABASE_SECRET_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY}).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) { console.error('Secrets fehlen:', missing.join(', ')); process.exit(1); }
console.log('Längen: URL', SUPABASE_URL.length, '| Secret', SUPABASE_SECRET_KEY.length, '| VAPID privat', VAPID_PRIVATE_KEY.length, '(soll 43)');
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const headers = {apikey: SUPABASE_SECRET_KEY, 'Content-Type': 'application/json', ...(SUPABASE_SECRET_KEY.startsWith('eyJ') ? {Authorization: `Bearer ${SUPABASE_SECRET_KEY}`} : {})};

/* Zeit in Berlin */
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false}).formatToParts(new Date()).map(p => [p.type, p.value]));
const today = `${parts.year}-${parts.month}-${parts.day}`, hour = Number(parts.hour) % 24;
if (!FORCE && !(hour === 9 || hour === 10)) { console.log('Nicht im 10-Uhr-Fenster:', hour); process.exit(0); }

/* Datums-Helfer */
const pd = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const iso = t => new Date(t).toISOString().slice(0, 10);
const addDays = (s, n) => iso(pd(s) + n * 864e5);
const diff = (a, b) => Math.round((pd(a) - pd(b)) / 864e5);
const WD = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];
const fmt = n => Number(n || 0).toLocaleString('de-DE');

/* Daten laden */
const res = await fetch(`${SUPABASE_URL}/rest/v1/docs?select=user_id,path,data&limit=100000`, {headers});
if (!res.ok) { console.error('Lesen fehlgeschlagen', res.status, await res.text()); process.exit(1); }
const users = {};
for (const r of await res.json()) (users[r.user_id] ||= {})[r.path] = r.data;

for (const [uid, docs] of Object.entries(users)) {
  const col = n => Object.entries(docs).filter(([p]) => p.startsWith(n + '/items/')).map(([p, d]) => ({id: p.split('/').pop(), ...d}));
  const subs = col('pushsubs'); if (!subs.length) continue;
  const state = docs.pushstate || {};
  if (!FORCE && state.last === today) { console.log(uid, 'heute schon gesendet'); continue; }
  const plan = docs.plan || {}, lines = [];

  // 1 Training
  const p = plan[WD[new Date(pd(today)).getUTCDay()]] || {};
  const runs = col('runs').sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || 0) - (a.ts || 0));
  const trained = runs.some(r => r.date === today) || col('lifts').some(l => l.date === today);
  if (p.type === 'lauf') {
    const rot = Array.isArray(plan.rotation) && plan.rotation.length ? plan.rotation : [5, 8, 10];
    let i = 0; if (runs[0]) { let bi = 0; rot.forEach((k, j) => { if (Math.abs(k - runs[0].km) < Math.abs(rot[bi] - runs[0].km)) bi = j; }); i = (bi + 1) % rot.length; }
    lines.push(`🏃 ${trained ? 'Lauf erledigt' : `Lauf ${fmt(rot[i])} km`}`);
  } else if (p.type === 'kraft') lines.push(`🏋️ ${p.text || 'Krafttraining'}${trained ? ' (erledigt)' : ''}`);
  else if (p.type === 'ruhe') lines.push('😌 Ruhetag');

  // 2 Putzen
  const chores = col('chores');
  const due = chores.filter(c => (c.kind || 'putz') === 'putz' && c.every > 0).filter(c => diff(c.last ? addDays(c.last, c.every) : (c.next || today), today) <= 0).map(c => c.name);
  if (due.length) lines.push(`🧽 ${due.join(', ')}`);

  // 3 Wäsche
  const rotL = chores.filter(c => c.kind === 'waesche' && c.every > 0).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.ts || 0) - (b.ts || 0));
  if (rotL.length) {
    const key = c => (c.last || '') + '|' + String(c.doneAt || 0).padStart(15, '0');
    let li = -1; rotL.forEach((c, i) => { if (c.last && (li < 0 || key(c) > key(rotL[li]))) li = i; });
    const nx = li >= 0 ? rotL[(li + 1) % rotL.length] : rotL[0];
    const dd = li >= 0 ? addDays(rotL[li].last, rotL[0].every || 7) : (rotL.map(c => c.next).filter(Boolean).sort()[0] || today);
    if (diff(dd, today) <= 0) lines.push(`🧺 ${nx.name}${nx.info ? ' (' + nx.info + ')' : ''}`);
  }

  // 4 Gericht
  const L = col('dishes').sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.ts || 0) - (b.ts || 0));
  const meals = col('meals');
  const dishFor = d => { if (!L.length) return null; const ex = meals.filter(m => m.dish && m.date <= d && L.some(x => x.id === m.dish)).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (ex) { const i = L.findIndex(x => x.id === ex.dish); return L[(i + diff(d, ex.date)) % L.length]; } const n = Math.round(pd(d) / 864e5); return L[((n % L.length) + L.length) % L.length]; };
  const dt = dishFor(today); if (dt) lines.push(`🍽️ ${dt.name} (${fmt(dt.kcal)} kcal)`);

  // 5 Einkauf
  const auto = docs.autoshop || {}, anchor = auto.anchor || '2026-11-04', dd = diff(today, anchor);
  if (!auto.off && dd >= 0 && dd % 2 === 0 && dt) { const dm = dishFor(addDays(today, 1)); lines.push(`🛒 Einkaufstag: ${dt.name}${dm ? ' und ' + dm.name : ''}`); }
  else { const open = col('shop').filter(i => !i.done).length; if (open) lines.push(`🛒 ${open} Sachen auf der Einkaufsliste`); }

  // 6 Wiegen: letzter Eintrag 7 Tage oder länger her
  const lastW = col('weights').filter(w => w.kg > 0).map(w => w.date).sort().pop();
  if (!lastW || diff(today, lastW) >= 7) lines.push('⚖️ Heute wiegen (morgens, vor dem Frühstück)');

  const payload = JSON.stringify({title: 'Guten Morgen! Heute:', body: lines.join('\n') || 'Heute steht nichts an. Genieß den Tag!'});
  let sent = 0;
  for (const s of subs) {
    try { await webpush.sendNotification({endpoint: s.endpoint, keys: s.keys}, payload); sent++; }
    catch (e) {
      console.warn('Push fehlgeschlagen', e.statusCode);
      if (e.statusCode === 404 || e.statusCode === 410) await fetch(`${SUPABASE_URL}/rest/v1/docs?user_id=eq.${uid}&path=eq.${encodeURIComponent('pushsubs/items/' + s.id)}`, {method: 'DELETE', headers});
    }
  }
  if (sent) await fetch(`${SUPABASE_URL}/rest/v1/docs`, {method: 'POST', headers: {...headers, Prefer: 'resolution=merge-duplicates'}, body: JSON.stringify({user_id: uid, path: 'pushstate', data: {last: today}})});
  console.log(uid, 'gesendet an', sent, 'Geräte:', lines.join(' | '));
}
