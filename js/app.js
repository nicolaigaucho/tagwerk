(() => {
/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y, (m||1)-1, d||1); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate()+n); return iso(d); };
const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 864e5);
const dn = s => { const [y,m,d] = String(s).split('-').map(Number); return Math.round(Date.UTC(y, m-1, d) / 864e5); };
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const rnd = (v, d = 0) => Math.round(v * 10**d) / 10**d;
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('de-DE', {minimumFractionDigits: d, maximumFractionDigits: d});
const fDate = s => parseISO(s).toLocaleDateString('de-DE', {weekday:'short', day:'numeric', month:'short'});
const fDateLong = s => parseISO(s).toLocaleDateString('de-DE', {weekday:'long', day:'numeric', month:'long'});
const WD = ['so','mo','di','mi','do','fr','sa'];
const ORDER = ['mo','di','mi','do','fr','sa','so'];
const WDN = {mo:'Montag',di:'Dienstag',mi:'Mittwoch',do:'Donnerstag',fr:'Freitag',sa:'Samstag',so:'Sonntag'};
const wdOf = s => WD[parseISO(s).getDay()];
const mondayOf = s => { const d = parseISO(s); d.setDate(d.getDate() - (d.getDay()+6)%7); return iso(d); };
const fDur = s => { s = Math.round(s||0); const h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`; };
const pace = (sec, km) => km > 0 ? fDur(sec/km) : '0:00';
const isoWeek = s => { const d = parseISO(s); d.setDate(d.getDate() + 3 - (d.getDay()+6)%7); const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - w1)/864e5 - 3 + (w1.getDay()+6)%7)/7); };
const sum = (a, f) => a.reduce((t, x) => t + (f(x) || 0), 0);
const arr = v => Array.isArray(v) ? v : [];
const store = { get(k, d) { try { const v = localStorage.getItem('tw.'+k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('tw.'+k, JSON.stringify(v)); } catch {} } };

const ICON = {
  heute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6.2"/><circle cx="9.5" cy="20" r="1.2"/><circle cx="17.5" cy="20" r="1.2"/></svg>',
  train:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
  food:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10"/><path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 7v3H17"/></svg>',
  car:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="13" r=".8"/><circle cx="16.5" cy="13" r=".8"/></svg>',
  scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0M12 9.5l1.2-1.6"/></svg>',
  drop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/></svg>',
  fuel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M3 20h12M4 10h10M14 8l3 2v7a1.5 1.5 0 0 0 3 0V9l-3-3"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>'
};
const TABS = [
  {id:'heute', label:'Heute', c:'--today'}, {id:'shop', label:'Einkauf', c:'--shop'}, {id:'train', label:'Training', c:'--train'},
  {id:'home', label:'Haushalt', c:'--home'}, {id:'food', label:'Essen', c:'--food'}, {id:'car', label:'Auto', c:'--car'}
];
const TITLES = {heute:'Heute', shop:'Einkaufsliste', train:'Training', home:'Haushalt', food:'Essen', car:'Fahrtenbuch'};
const SUBS = {
  train:[['plan','Wochenplan'],['kraft','Kraft'],['lauf','Läufe'],['analyse','Analyse']],
  home:[['putz','Putzplan'],['waesche','Wäsche']],
  food:[['tag','Ernährung'],['koch','Kochplan']],
  shop:[['liste','Einkaufen'],['vorrat','Zuhause']],
  car:[['fahrten','Fahrten'],['tanken','Tanken']]
};
const DEF_SET = {kcal:2600, p:140, c:320, f:80, water:3000};
const DEF_ROT = [5, 8, 10];
const PLAN_TYPES = {kraft:'Kraft', lauf:'Lauf', ruhe:'Ruhe', sonst:'Sonstiges'};
const DEF_SHOP = ['Milch','Butter','Öl','Kaffee','Toilettenpapier','Küchenrolle','Spülmittel','Müllbeutel'];
const foodNames = () => [...S.foods].sort((a,b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name, 'de')).map(f => f.name);
const PURPOSES = ['Arbeit','Einkauf','Sport','Freizeit','Besuch','Urlaub','Sonstiges'];

/* ---------- state ---------- */
const S = {
  tab: store.get('tab', 'heute'),
  sub: Object.assign({train:'plan', home:'putz', food:'tag', car:'fahrten', shop:'liste'}, store.get('sub', {})),
  daysRecent:{}, weekreview:{},
  shop:[], lifts:[], runs:[], weights:[], aimeals:[], workout:null, wDraft:null, anaEx: store.get('anaEx', ''), chores:[], foods:[], trips:[], fuel:[], pantry:[], recipes:[], dishes:[], meals:{},
  settings:{...DEF_SET}, plan:{}, shopstats:{counts:{}}, autoshop:{}, gotAutoshop:false,
  recipe:null, rState:'idle', rErr:'', rOpt:{meal:'Abendessen', time:'30', servings:'1', wish:''},
  day:{entries:[], water:0}, dayDate: today(), dayDirty:false,
  weekStart: mondayOf(today()),
  status:'loading', got:new Set()
};
if (!TABS.some(t => t.id === S.tab)) S.tab = 'heute';
for (const [m, list] of Object.entries(SUBS)) if (!list.some(([k]) => k === S.sub[m])) S.sub[m] = list[0][0];

let db = null, base = null, downloads = null, sampleFn = null, rCtl = null, unsubDay = null;
const col = n => db.doc(`${base}/${n}`).collection('items');
const one = n => db.doc(`${base}/${n}`);

/* ---------- toast ---------- */
let toastT, toastCtx = null;
function toast(msg, {undo, edit} = {}) {
  let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role','status'); document.body.appendChild(el); }
  toastCtx = {undo, edit};
  el.innerHTML = `<span>${esc(msg)}</span>${edit ? '<button class="tbtn" data-act="toast-edit">Ändern</button>' : ''}${undo ? '<button class="tbtn" data-act="toast-undo">Rückgängig</button>' : ''}`;
  el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; toastCtx = null; }, undo || edit ? 5000 : 2600);
}
function hideToast() { const el = $('.toast'); if (el) el.hidden = true; toastCtx = null; }
const errMsg = e => e?.code === 'quota_exceeded' ? 'Speicher ist voll. Lösche alte Einträge und versuche es erneut.'
  : e?.code === 'revoked' ? 'Zugriff wurde beendet. Lade die Seite neu.'
  : 'Speichern hat nicht geklappt. Prüfe die Verbindung und versuche es erneut.';
async function save(p) { try { await p; return true; } catch (e) { toast(errMsg(e)); return false; } }
function needDb() { if (!db) { toast('Nicht angemeldet.'); return false; } return true; }
const addItem = (n, data) => needDb() && save(col(n).doc().set({...data, ts: Date.now()}));
const updItem = (n, id, data) => needDb() && save(col(n).doc(id).update(data));
const delItem = (n, id) => needDb() && save(col(n).doc(id).delete());
function addNow(n, data) { if (!needDb()) return null; const ref = col(n).doc(); save(ref.set({...data, ts: Date.now()})); return ref.id; }
function delUndo(n, id, label) {
  const it = S[n]?.find(x => x.id === id); if (!it || !needDb()) return;
  const {id: _, ...data} = it; save(col(n).doc(id).delete());
  toast(`${label || it.name || 'Eintrag'} gelöscht`, {undo: () => save(col(n).doc(id).set(data))});
}
let statsQ = Promise.resolve();
function bumpShop(name) {
  if (!db) return;
  const k = name.trim(); if (!k) return;
  const counts = {...(S.shopstats.counts || {})}; counts[k] = (counts[k] || 0) + 1;
  S.shopstats = {counts};
  statsQ = statsQ.then(() => one('shopstats').set({counts})).catch(() => {});
}

/* ---------- data boot ---------- */
async function boot() {
  render();
  const slow = setTimeout(() => { if (S.status === 'loading') { S.status = 'slow'; render(); } }, 10000);
  if (window.TW_READY) await window.TW_READY;
  if (!window.claude?.use) { clearTimeout(slow); S.status = 'offline'; render(); return; }
  const [d, u, dl, sm] = await Promise.all(['db','user','downloads','sample'].map(n => window.claude.use(n)));
  clearTimeout(slow);
  downloads = dl; sampleFn = sm;
  const id = u ? await u.id() : null;
  if (!d || !id) { clearTimeout(slow); S.status = 'offline'; render(); return; }
  db = d; base = `data/users/${id}`;
  const got = n => { S.got.add(n); if (S.got.size >= 3 && S.status !== 'ready') { S.status = 'ready'; clearTimeout(slow); } render(); scheduleSync(); };
  const onErr = e => { clearTimeout(slow); if (e?.code === 'revoked') S.status = 'offline'; toast(errMsg(e)); render(); };
  ['shop','lifts','runs','chores','foods','trips','fuel','pantry','recipes','dishes','weights','aimeals'].forEach(n =>
    col(n).onSnapshot(s => { S[n] = s.docs.map(x => ({id:x.id, ...x.data()})); got(n); }, onErr));
  col('meals').where('date', '>=', addDays(today(), -60)).onSnapshot(s => {
    const m = {}; s.docs.forEach(x => m[x.id] = x.data()); S.meals = m; got('meals'); }, onErr);
  one('settings').onSnapshot(s => { S.settings = {...DEF_SET, ...(s.exists ? s.data() : {})}; got('settings'); }, onErr);
  one('plan').onSnapshot(s => { S.plan = s.exists ? {...s.data()} : {}; got('plan'); }, onErr);
  one('autoshop').onSnapshot(s => { S.autoshop = s.exists ? {...s.data()} : {}; S.gotAutoshop = true; scheduleSync(); render(); }, onErr);
  col('days').where('date', '>=', addDays(today(), -14)).onSnapshot(s => { const m = {}; s.docs.forEach(x => m[x.id] = x.data()); S.daysRecent = m; render(); }, onErr);
  one('workout').onSnapshot(s => { const w = s.exists ? s.data() : null; if (JSON.stringify(w) !== JSON.stringify(S.workout)) { S.workout = w && arr(w.ex).length ? JSON.parse(JSON.stringify(w)) : null; woTicker(); render(); } }, onErr);
  one('weekreview').onSnapshot(s => { S.weekreview = s.exists ? {...s.data()} : {}; render(); }, onErr);
  one('shopstats').onSnapshot(s => { S.shopstats = s.exists ? {counts:{...(s.data().counts || {})}} : {counts:{}}; got('shopstats'); }, onErr);
  subDay(S.dayDate);
}
function subDay(date) {
  if (unsubDay) unsubDay();
  S.dayDate = date; S.day = {entries:[], water:0};
  if (!db) return;
  unsubDay = col('days').doc(date).onSnapshot(s => {
    if (S.dayDate !== date || S.dayDirty) return;
    const d = s.exists ? s.data() : {};
    S.day = {entries:[...(d.entries || [])], water: d.water || 0};
    render();
  }, () => {});
}
let dayT;
function touchDay() {
  if (!needDb()) return;
  S.dayDirty = true; clearTimeout(dayT);
  const date = S.dayDate, body = {date, entries:S.day.entries, water:S.day.water};
  dayT = setTimeout(async () => { await save(col('days').doc(date).set(body)); S.dayDirty = false; }, 500);
  render();
}
function ensureToday() { if (S.dayDate !== today()) subDay(today()); }

/* ---------- derived: laundry rotation ---------- */
let LC = null;
function laundry() {
  if (LC) return LC;
  const rot = S.chores.filter(c => c.kind === 'waesche' && c.every > 0).sort((a,b) => (a.order ?? 99) - (b.order ?? 99) || (a.ts||0) - (b.ts||0));
  const due = {}; if (!rot.length) return LC = {rot, due, nextId:null};
  const every = rot[0].every || 7, key = c => (c.last || '') + '|' + String(c.doneAt || 0).padStart(15, '0');
  let li = -1; rot.forEach((c, i) => { if (c.last && (li < 0 || key(c) > key(rot[li]))) li = i; });
  let si, start;
  if (li >= 0) { si = (li + 1) % rot.length; start = addDays(rot[li].last, every); }
  else { si = 0; start = rot.map(c => c.next).filter(Boolean).sort()[0] || today(); }
  for (let k = 0; k < rot.length; k++) due[rot[(si + k) % rot.length].id] = addDays(start, every * k);
  return LC = {rot, due, nextId: rot[si].id, every, si};
}
const dueIn = c => {
  if (!(c.every > 0)) return Infinity;
  if (c.kind === 'waesche') { const d = laundry().due[c.id]; return d ? diffDays(d, today()) : Infinity; }
  return c.last ? diffDays(addDays(c.last, c.every), today()) : c.next ? diffDays(c.next, today()) : 0;
};
const dueDate = c => c.kind === 'waesche' ? laundry().due[c.id] : (c.last ? addDays(c.last, c.every) : c.next || today());
function duePill(d) {
  if (d === Infinity) return `<span class="pill">bei Bedarf</span>`;
  if (d < 0) return `<span class="pill bad">${-d} T überfällig</span>`;
  if (d === 0) return `<span class="pill solid">heute</span>`;
  if (d === 1) return `<span class="pill">morgen</span>`;
  return `<span class="pill">in ${d} T</span>`;
}

/* ---------- derived: dish rotation ---------- */
const dishList = () => [...S.dishes].sort((a,b) => (a.order ?? 999) - (b.order ?? 999) || (a.ts||0) - (b.ts||0));
function dishFor(date) {
  const L = dishList(); if (!L.length) return null;
  const ids = new Set(L.map(d => d.id));
  const ex = Object.values(S.meals).filter(m => m.dish && ids.has(m.dish) && m.date <= date).sort((a,b) => b.date.localeCompare(a.date))[0];
  if (ex) { const i = L.findIndex(x => x.id === ex.dish); return {dish: L[(i + diffDays(date, ex.date)) % L.length], fixed: ex.date === date && !ex.anchor}; }
  return {dish: L[((dn(date) % L.length) + L.length) % L.length], fixed:false};
}

/* ---------- derived: other ---------- */
const dayTotals = () => ({kcal: sum(S.day.entries, e => e.kcal), p: sum(S.day.entries, e => e.p), c: sum(S.day.entries, e => e.c), f: sum(S.day.entries, e => e.f)});
const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts||0) - (a.ts||0);
const inMonth = (d, ref = today()) => (d || '').slice(0,7) === ref.slice(0,7);
function fuelStats() {
  const f = [...S.fuel].sort((a,b) => a.odo - b.odo), cons = {};
  for (let i = 1; i < f.length; i++) { const dist = f[i].odo - f[i-1].odo; if (dist > 0 && f[i].full !== false && f[i-1].full !== false) cons[f[i].id] = f[i].liters / dist * 100; }
  let avg = 0; if (f.length > 1) { const dist = f[f.length-1].odo - f[0].odo; const l = sum(f.slice(1), x => x.liters); if (dist > 0) avg = l / dist * 100; }
  return {cons, avg};
}
const rotation = () => (arr(S.plan.rotation).length ? S.plan.rotation : DEF_ROT);
function nextRunIdx() {
  const rot = rotation(), last = [...S.runs].sort(byDateDesc)[0];
  if (!last) return 0;
  let bi = 0; rot.forEach((k, i) => { if (Math.abs(k - last.km) < Math.abs(rot[bi] - last.km)) bi = i; });
  return (bi + 1) % rot.length;
}
function runPlan() {
  const rot = rotation(), ws = mondayOf(today()), t = today(), out = {}; let k = nextRunIdx();
  ORDER.forEach((d, i) => {
    const date = addDays(ws, i); if (S.plan[d]?.type !== 'lauf') return;
    const r = S.runs.find(x => x.date === date);
    if (r) out[d] = {km: r.km, done: true};
    else if (date >= t) { out[d] = {km: rot[k % rot.length]}; k++; }
    else out[d] = {km: null};
  });
  return out;
}
const planTitle = (d, p, rp) => p.type === 'lauf' ? (rp?.[d]?.km ? `Lauf · ${fmt(rp[d].km, rp[d].done ? 1 : 0)} km` : 'Lauf') : (p.text || (p.type ? PLAN_TYPES[p.type] : 'frei'));
const lastOdo = () => Math.max(0, ...S.trips.map(t => t.endKm || 0), ...S.fuel.map(f => f.odo || 0));
const avgPace = () => { const r = [...S.runs].sort(byDateDesc).slice(0, 10); const km = sum(r, x => x.km); return km > 0 ? sum(r, x => x.sec) / km : 360; };
function shopSuggest(exclude) {
  const c = S.shopstats.counts || {}, ex = new Set(exclude.map(x => x.toLowerCase()));
  const names = [...new Set([...foodNames(), ...Object.keys(c).sort((a,b) => c[b] - c[a]), ...DEF_SHOP])];
  return names.filter(n => !ex.has(n.toLowerCase()));
}

/* ---------- auto shopping every 2 days ---------- */
const AUTO_ANCHOR = () => S.autoshop.anchor || '2026-11-04';
const shopWindow = (d = today()) => addDays(d, -(((diffDays(d, AUTO_ANCHOR()) % 2) + 2) % 2));
const slug = x => x.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0, 60) || 'x';
const splitIngr = x => { const m = String(x).match(/^(.*?)\s*(\d.*)?$/); return {name: (m?.[1] || String(x)).trim(), amt: (m?.[2] || '').trim()}; };
let syncing = false, syncT;
function scheduleSync() { clearTimeout(syncT); syncT = setTimeout(syncAutoShop, 1200); }
async function syncAutoShop() {
  if (!db || syncing || S.status !== 'ready' || !S.gotAutoshop || S.autoshop.off || !S.dishes.length) return;
  const ws = shopWindow(), t = today(); if (ws < AUTO_ANCHOR()) return;
  syncing = true;
  try {
    const days = [ws, addDays(ws, 1)].filter(d => d >= t), pantry = S.pantry.map(x => x.name.toLowerCase()), want = {};
    days.forEach(d => { const r = dishFor(d); if (!r) return; arr(r.dish.ingr).forEach(x => {
      const {name, amt} = splitIngr(x); if (!name || pantry.includes(name.toLowerCase())) return;
      const w = (want[name.toLowerCase()] ||= {name, amts:[], days:new Set()}); if (amt) w.amts.push(amt); w.days.add(d); }); });
    const created = new Set(S.autoshop.win === ws ? arr(S.autoshop.created) : []); let changed = S.autoshop.win !== ws;
    const existing = S.shop.filter(i => i.auto && i.win === ws), wantIds = new Set();
    for (const [key, w] of Object.entries(want)) {
      const id = `auto-${ws}-${slug(key)}`; wantIds.add(id);
      const label = w.amts.length ? `${w.name} (${w.amts.join(' + ')})` : w.days.size > 1 ? `${w.name} (2×)` : w.name, ex = existing.find(i => i.id === id);
      if (ex) { if (!ex.done && ex.name !== label) await save(col('shop').doc(id).update({name: label, days: [...w.days]})); }
      else if (!created.has(id)) { await save(col('shop').doc(id).set({name: label, done:false, auto:true, win: ws, days: [...w.days], ts: Date.now()})); created.add(id); changed = true; }
    }
    for (const i of existing) if (!i.done && !wantIds.has(i.id)) { await save(col('shop').doc(i.id).delete()); created.delete(i.id); changed = true; }
    if (changed) { S.autoshop = {...S.autoshop, win: ws, created: [...created]}; await save(one('autoshop').set(S.autoshop)); }
  } finally { syncing = false; }
}
function autoShopCard() {
  const t = today(), ws = shopWindow(), a = AUTO_ANCHOR(), dshort = d => parseISO(d).toLocaleDateString('de-DE', {weekday:'short'}).replace('.', '');
  let txt;
  if (S.autoshop.off) txt = 'Automatik ist aus. Zutaten aus dem Kochplan kommen nicht von selbst auf die Liste.';
  else if (t < a) txt = `Ab ${fDate(a)} kommen alle 2 Tage die Zutaten aus dem Kochplan automatisch auf die Liste, immer für 2 Tage.`;
  else if (ws === t) { const ds = [t, addDays(t, 1)].map(d => dishFor(d)?.dish.name).filter(Boolean); txt = `<b>Heute ist Einkaufstag</b> für ${dshort(t)} und ${dshort(addDays(t,1))}: ${ds.map(esc).join(' und ')}. Die Zutaten stehen unten auf der Liste.`; }
  else txt = `Einkauf für heute ist erledigt. <b>Nächster Einkaufstag: morgen</b> (${fDate(addDays(t,1))}).`;
  return `<section class="card"><div class="card-h"><span class="tag"><span class="ti" style="--m:var(--food)">${ICON.food}</span>Aus dem Kochplan</span><button class="link" data-act="auto-toggle">${S.autoshop.off ? 'Einschalten' : 'Ausschalten'}</button></div><p class="small" style="margin:0">${txt}</p></section>`;
}

/* ---------- render ---------- */
let raf = 0;
function render() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; draw(); }); }
function draw() {
  LC = null;
  document.body.dataset.mod = S.tab;
  const a = document.activeElement, keep = a && a.id && $('#app').contains(a) ? {id:a.id, v:a.value, s:a.selectionStart} : null;
  $('#tabs').innerHTML = TABS.map(t => `<button data-act="tab" data-v="${t.id}" style="--c:var(${t.c})" ${t.id === S.tab ? 'aria-current="page"' : ''}>${ICON[t.id]}<span>${t.label}</span></button>`).join('');
  const sub = SUBS[S.tab] ? `<div class="seg ${SUBS[S.tab].length > 3 ? 'four' : ''}" role="tablist">${SUBS[S.tab].map(([k,l]) => `<button role="tab" data-act="sub" data-v="${k}" aria-pressed="${S.sub[S.tab] === k}">${l}</button>`).join('')}</div>` : '';
  const views = {heute:vToday, shop:vShop, train:vTrain, home:vHome, food:vFood, car:vCar};
  $('#app').innerHTML = `
    <header class="top">
      <div><div class="eyebrow"><i></i>${esc(fDateLong(today()))}</div><h1>${TITLES[S.tab]}</h1></div>
      <button class="iconbtn" data-act="settings" aria-label="Einstellungen">${ICON.gear}</button>
    </header>
    ${statusNote()}${sub}${views[S.tab]()}
    <button class="fab" data-act="quick" aria-label="Schnell eintragen">+</button>`;
  if (S.workout) woTicker();
  syncWake();
  if (keep) { const el = document.getElementById(keep.id); if (el) { el.value = keep.v; el.focus(); try { el.setSelectionRange(keep.s, keep.s); } catch {} } }
}
let wake = null;
async function syncWake() {
  const want = S.tab === 'shop' && S.sub.shop === 'liste' && document.visibilityState === 'visible';
  try { if (want && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } else if (!want && wake) { const w = wake; wake = null; await w.release(); } } catch {}
}
document.addEventListener('visibilitychange', syncWake);
function statusNote() {
  if (S.status === 'offline') return `<p class="note" style="margin-bottom:14px">Keine Verbindung. Du siehst den zuletzt geladenen Stand, Änderungen werden gespeichert, sobald du wieder online bist.</p>`;
  if (S.status === 'slow') return `<p class="note" style="margin-bottom:14px">Deine Daten sind noch nicht erreichbar. Prüfe die Internetverbindung.</p>`;
  if (S.status === 'loading') return `<p class="note" style="margin-bottom:14px">Lade deine Daten …</p>`;
  return '';
}
const card = (mod, label, body, go) => `<section class="card"><div class="card-h"><span class="tag"><span class="ti" style="--m:var(--${mod})">${ICON[mod]}</span>${label}</span>${go ? `<button class="link" data-act="go" data-v="${go}">Öffnen</button>` : ''}</div>${body}</section>`;
const ring = (label, val, goal, col) => { const r = 24, C = 2*Math.PI*r, pct = goal > 0 ? Math.min(1, val/goal) : 0; return `<div class="ring"><svg viewBox="0 0 58 58" aria-hidden="true"><circle cx="29" cy="29" r="${r}" fill="none" stroke-width="7" style="stroke:var(--soft)"/><circle cx="29" cy="29" r="${r}" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}" style="stroke:var(${col})"/></svg><div style="min-width:0"><div class="rv">${fmt(val)}</div><div class="rk">${label}</div><div class="rk">Ziel ${fmt(goal)}</div></div></div>`; };
const empty = (title, text, btn) => `<div class="empty"><b>${title}</b><span class="small">${text}</span>${btn || ''}</div>`;
const meter = (label, val, goal, unit) => { const pct = goal > 0 ? Math.min(100, val/goal*100) : 0; return `<div class="meter"><div class="l"><span>${label}</span><span>${fmt(val)} / ${fmt(goal)} ${unit}</span></div><div class="bar ${val > goal*1.05 ? 'over':''}"><span style="width:${pct}%"></span></div></div>`; };
const waterBtns = () => `<div class="row-actions"><button class="btn sm ghost" data-act="water" data-v="250">+250 ml</button><button class="btn sm ghost" data-act="water" data-v="500">+500 ml</button><button class="btn sm ghost" data-act="water" data-v="750">+750 ml</button><button class="btn sm ghost" data-act="water" data-v="-250">−250</button></div>`;
const quickFoods = (n = 12) => {
  const f = [...S.foods].sort((a,b) => (b.uses||0) - (a.uses||0) || a.name.localeCompare(b.name, 'de')).slice(0, n);
  return f.length ? `<div class="qchips">${f.map(x => `<button class="qc" data-act="food-quick" data-id="${x.id}">${esc(x.name)}<small>${esc(x.plabel || fmt(x.portion || 100) + ' g')}</small></button>`).join('')}</div>` : '';
};

/* --- Heute --- */
function vToday() {
  const t = today(), wd = WD[new Date().getDay()], p = S.plan[wd] || {};
  ensureToday();
  const trained = S.runs.some(r => r.date === t) || S.lifts.some(l => l.date === t);
  const due = S.chores.filter(c => dueIn(c) <= 0).sort((a,b) => dueIn(a) - dueIn(b));
  const tot = dayTotals(), st = S.settings, df = dishFor(t);
  const open = S.shop.filter(i => !i.done), rp = runPlan();
  const kmMonth = sum(S.trips.filter(x => inMonth(x.date)), x => x.endKm - x.startKm);
  const costMonth = sum(S.fuel.filter(x => inMonth(x.date)), x => x.cost);
  const eatenDish = df && S.day.entries.some(e => e.dish === df.dish.id);

  const trainBody = p.type || p.text
    ? `<div class="item" style="padding-top:0"><div class="main"><div class="t" style="font-size:18px">${esc(planTitle(wd, p, rp))}</div><div class="s">${p.type === 'lauf' ? 'Rotation '+rotation().join(' · ')+' km' : PLAN_TYPES[p.type] || ''}</div></div>${trained ? '<span class="pill solid">erledigt</span>' : p.type === 'ruhe' ? '<span class="pill">Ruhetag</span>' : ''}</div>${!trained && p.type === 'lauf' ? `<div class="row-actions"><button class="btn sm acc" style="--accent:var(--train);flex:1" data-act="run-quick" data-v="${rotation()[nextRunIdx()]}">✓ ${fmt(rotation()[nextRunIdx()])} km gelaufen</button><button class="btn sm ghost" style="--accent:var(--train)" data-act="run-new">Details</button></div>` : !trained && p.type === 'kraft' ? `<div class="row-actions"><button class="btn sm acc" style="--accent:var(--train);flex:1" data-act="wo-start" data-v="${esc(p.text || '')}">▶ Training starten</button><button class="btn sm ghost" style="--accent:var(--train)" data-act="lift-quick">✓ Geschafft</button></div>` : ''}`
    : `<p class="muted small" style="margin:0">Für heute ist nichts geplant.</p>`;
  const homeBody = due.length
    ? `<div class="list">${due.slice(0,6).map(c => `<div class="item" data-sr="chore-done" data-id="${c.id}"><div class="main"><div class="t">${esc(c.name)}</div><div class="s">${c.kind === 'waesche' ? 'Wäsche' : 'Putzen'}${c.info ? ' · '+esc(c.info) : ''}</div></div>${duePill(dueIn(c))}<button class="check" data-act="chore-done" data-id="${c.id}" aria-label="${esc(c.name)} erledigt">${ICON.check}</button></div>`).join('')}</div>`
    : `<p class="muted small" style="margin:0">Heute ist nichts fällig.</p>`;
  const foodBody = `<div class="stack" style="gap:12px">
      ${df ? `<div class="item" style="padding:0;border:0"><div class="main"><div class="s">Gericht des Tages</div><div class="t" style="font-size:17px">${esc(df.dish.name)}</div><div class="s">${fmt(df.dish.kcal)} kcal · ${fmt(df.dish.p)} g Eiweiß</div></div>${eatenDish ? '<span class="pill solid" style="--accent:var(--food)">gegessen</span>' : `<button class="btn sm acc" style="--accent:var(--food)" data-act="eat-today">✓ Gegessen</button>`}</div>` : ''}
      <div class="rings">${ring('kcal', tot.kcal, st.kcal, '--food')}${ring('ml Wasser', S.day.water, st.water, '--home')}</div>
      ${meter('Eiweiß', tot.p, st.p, 'g')}
      ${waterBtns()}
      <button class="btn sm ghost" style="--accent:var(--food);align-self:flex-start" data-act="photo">📷 Essen fotografieren</button>
    </div>`;
  const shopBody = open.length
    ? `<div class="list">${open.slice(0,4).map(i => `<div class="item"><button class="check" data-act="shop-toggle" data-id="${i.id}" aria-label="${esc(i.name)} abhaken">${ICON.check}</button><div class="main"><div class="t">${esc(i.name)}</div></div></div>`).join('')}</div>${open.length > 4 ? `<p class="muted small" style="margin:8px 0 0">und ${open.length-4} weitere</p>` : ''}`
    : `<p class="muted small" style="margin:0">Die Einkaufsliste ist leer.</p>`;
  const h = new Date().getHours();
  const base = h < 11 ? ['train','home','food','shop','car'] : h < 15 ? ['food','shop','train','home','car'] : h < 19 ? ['train','shop','food','home','car'] : ['home','food','train','shop','car'];
  const settled = {train: trained || p.type === 'ruhe' || !(p.type || p.text), home: !due.length, food: !!eatenDish, shop: !open.length, car: true};
  const order = [...base.filter(k => !settled[k]), ...base.filter(k => settled[k])];
  const rw = reviewWeek();
  const cards = {
    train: card('train', 'Training · ' + WDN[wd], trainBody, 'train'),
    home: card('home', `Haushalt · ${due.length} fällig`, homeBody, 'home'),
    food: card('food', 'Essen', foodBody, 'food'),
    shop: card('shop', `Einkauf · ${open.length} offen`, shopBody, 'shop'),
    car: card('car', 'Auto · ' + new Date().toLocaleDateString('de-DE',{month:'long'}), `<div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><div class="k">Gefahren</div><div class="v">${fmt(kmMonth)} <small>km</small></div></div><div class="stat"><div class="k">Tankkosten</div><div class="v">${fmt(costMonth,2)} <small>€</small></div></div></div><div class="row-actions" style="margin-top:10px"><button class="btn sm ghost" data-act="trip-new">Fahrt eintragen</button><button class="btn sm ghost" data-act="fuel-new">Tanken</button></div>`, 'car')
  };
  const woCard = S.workout ? `<section class="card"><div class="hero"><span class="ti" style="--m:var(--train)">${ICON.train}</span><div style="flex:1;min-width:0"><div class="t" style="font-weight:600">${esc(S.workout.title.replace(/ · .*/, ''))} läuft</div><div class="muted small">${sum(S.workout.ex, x => x.log.length)} Sätze · <span data-tick="start">${clock(Date.now() - S.workout.startedAt)}</span></div></div><button class="btn sm acc" style="--accent:var(--train)" data-act="wo-resume">Fortsetzen</button></div></section>` : '';
  return `<div class="stack">${woCard}${rw ? vReview(rw) : ''}${weighDue() ? weighCard() : ''}${order.map(k => cards[k]).join('')}</div>`;
}
function reviewWeek() {
  const t = today(), d = new Date().getDay();
  const ws = d === 0 ? mondayOf(t) : d === 1 ? addDays(mondayOf(t), -7) : null;
  return ws && S.weekreview.last !== ws ? ws : null;
}
function vReview(ws) {
  const we = addDays(ws, 6), inW = x => x.date >= ws && x.date <= we;
  const runs = S.runs.filter(inW), lifts = S.lifts.filter(inW), km = sum(runs, r => r.km);
  const planR = ORDER.filter(k => S.plan[k]?.type === 'lauf').length, planL = ORDER.filter(k => S.plan[k]?.type === 'kraft').length;
  const chores = sum(S.chores, c => arr(c.hist).filter(x => x >= ws && x <= we).length);
  const days = Object.values(S.daysRecent).filter(x => x.date >= ws && x.date <= we && arr(x.entries).length);
  const avgK = days.length ? Math.round(sum(days, x => sum(arr(x.entries), e => e.kcal)) / days.length) : 0;
  const avgP = days.length ? Math.round(sum(days, x => sum(arr(x.entries), e => e.p)) / days.length) : 0;
  const goodRuns = runs.length >= planR, goodLifts = lifts.length >= planL;
  return `<section class="card review"><div class="card-h"><span class="tag"><span class="ti" style="--m:var(--today)">${ICON.heute}</span>Deine Woche · KW ${isoWeek(ws)}</span></div>
    <p style="margin:0 0 10px;font-size:17px;font-weight:600">${goodRuns && goodLifts ? 'Starke Woche, alle Trainings geschafft! 💪' : runs.length + lifts.length ? 'Gute Woche. Da geht nächste Woche noch was.' : 'Neue Woche, neuer Anlauf.'}</p>
    <div class="stats" style="grid-template-columns:1fr 1fr">
      <div class="stat"><div class="k">Läufe</div><div class="v">${runs.length}/${planR} <small>${fmt(km, 1)} km</small></div></div>
      <div class="stat"><div class="k">Krafttraining</div><div class="v">${lifts.length}/${planL}</div></div>
      <div class="stat"><div class="k">Haushalt erledigt</div><div class="v">${chores} <small>Aufgaben</small></div></div>
      <div class="stat"><div class="k">Ø pro Tag</div><div class="v">${fmt(avgK)} <small>kcal · ${fmt(avgP)} g E</small></div></div>
    </div>
    <button class="btn wide" style="margin-top:12px" data-act="review-done" data-v="${ws}">Woche abschließen</button></section>`;
}

/* --- Einkauf --- */
function vShop() {
  if (S.sub.shop === 'vorrat') return vPantry();
  const open = S.shop.filter(i => !i.done).sort((a,b) => (a.ts||0) - (b.ts||0));
  const done = S.shop.filter(i => i.done).sort((a,b) => (b.doneAt||0) - (a.doneAt||0));
  const sug = shopSuggest(S.shop.map(i => i.name)).slice(0, 16);
  const row = i => `<div class="item ${i.done ? 'done':''}" data-sr="shop-toggle" data-srl="${i.done ? 'Zurück' : 'Im Wagen'}" data-sl="shop-del" data-id="${i.id}"><button class="check ${i.done ? 'on':''}" data-act="shop-toggle" data-id="${i.id}" aria-label="${esc(i.name)} ${i.done ? 'wieder offen' : 'abhaken'}">${ICON.check}</button><button class="main" data-act="shop-toggle" data-id="${i.id}"><div class="t">${esc(i.name)}</div>${i.auto ? `<div class="s">Kochplan · für ${arr(i.days).map(d => esc(parseISO(d).toLocaleDateString('de-DE', {weekday:'short'}))).join(' und ')}</div>` : ''}</button><button class="x" data-act="shop-del" data-id="${i.id}" aria-label="${esc(i.name)} löschen">×</button></div>`;
  return `<div class="stack">
    ${autoShopCard()}
    <section class="card"><div class="card-h"><h2>Schnell hinzufügen</h2></div><div class="qchips">${sug.map(n => `<button class="qc" data-act="shop-quick" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <details class="more" style="margin-top:12px"><summary>Etwas anderes eintippen</summary><form class="addbar" data-form="shop"><input id="shop-in" name="item" placeholder="z. B. Backpapier" autocomplete="off" enterkeyhint="done"><button class="btn acc" type="submit">Hinzufügen</button></form></details></section>
    ${open.length ? `<section class="card"><div class="card-h"><h2>Auf der Liste · ${open.length}</h2></div><div class="list">${open.map(row).join('')}</div></section>` : empty('Alles eingekauft', 'Tippe oben auf Artikel. Was du oft kaufst, rutscht automatisch nach vorne.')}
    ${done.length ? `<section class="card"><div class="card-h"><h2>Im Wagen · ${done.length}</h2><button class="link" data-act="shop-clear">Entfernen</button></div><div class="list">${done.map(row).join('')}</div><button class="btn sm acc wide" style="margin-top:10px" data-act="shop-to-pantry">Gekauftes in den Vorrat legen</button></section>` : ''}
  </div>`;
}

/* --- Training --- */
function vTrain() {
  const s = S.sub.train;
  if (s === 'analyse') return vAnalysis();
  if (s === 'plan') {
    const twd = WD[new Date().getDay()], rp = runPlan();
    return `<div class="stack">
      <section class="card week"><div class="list">${ORDER.map(k => { const p = S.plan[k] || {}, r = rp[k]; return `<div class="item ${k === twd ? 'today':''}"><span class="daylabel">${k}</span><div class="main"><div class="t">${esc(planTitle(k, p, rp))}</div><div class="s">${WDN[k]}</div></div>${r?.done ? '<span class="pill solid">gelaufen</span>' : p.type ? `<span class="pill ${p.type !== 'ruhe' ? 'acc':''}">${PLAN_TYPES[p.type]}</span>` : ''}</div>`; }).join('')}</div></section>
      <p class="muted small" style="margin:0">Lauf-Rotation: ${rotation().map(k => fmt(k)+' km').join(' → ')}. Die nächste Distanz richtet sich nach deinem letzten Lauf.</p>
      <div class="row-actions"><button class="btn acc" style="flex:1" data-act="lift-quick">✓ Kraft geschafft</button><button class="btn acc" style="flex:1" data-act="run-quick" data-v="${rotation()[nextRunIdx()]}">✓ ${fmt(rotation()[nextRunIdx()])} km gelaufen</button></div>
      <button class="btn ghost wide" data-act="plan-edit">Wochenplan bearbeiten</button>
    </div>`;
  }
  if (s === 'kraft') return S.workout ? vWorkout() : vStrength();
  const runs = [...S.runs].sort(byDateDesc), t = today(), wk = mondayOf(t);
  const wKm = sum(runs.filter(r => mondayOf(r.date) === wk), r => r.km);
  const mRuns = runs.filter(r => inMonth(r.date)), mKm = sum(mRuns, r => r.km);
  const yKm = sum(runs.filter(r => (r.date||'').slice(0,4) === t.slice(0,4)), r => r.km);
  const mPace = mKm > 0 ? pace(sum(mRuns, r => r.sec), mKm) : '0:00';
  const weeks = []; for (let i = 7; i >= 0; i--) { const ws = addDays(wk, -7*i); weeks.push({ws, km: sum(runs.filter(r => mondayOf(r.date) === ws), r => r.km)}); }
  return `<div class="stack">
    <div class="row-actions"><button class="btn acc" style="flex:1" data-act="run-quick" data-v="${rotation()[nextRunIdx()]}">✓ ${fmt(rotation()[nextRunIdx()])} km gelaufen</button><button class="btn ghost" data-act="run-new">Details</button></div>
    <div class="stats">
      <div class="stat"><div class="k">Diese Woche</div><div class="v">${fmt(wKm,1)} <small>km</small></div></div>
      <div class="stat"><div class="k">Dieser Monat</div><div class="v">${fmt(mKm,1)} <small>km</small></div></div>
      <div class="stat"><div class="k">Dieses Jahr</div><div class="v">${fmt(yKm,0)} <small>km</small></div></div>
      <div class="stat"><div class="k">Ø Pace Monat</div><div class="v">${mPace} <small>/km</small></div></div>
    </div>
    <section class="card"><div class="card-h"><h2>Kilometer pro Woche</h2></div>${weekChart(weeks)}</section>
    ${runs.length ? `<section class="card"><div class="card-h"><h2>Alle Läufe</h2></div><div class="list">${runs.map(r => `<div class="item" data-sl="run-del" data-id="${r.id}"><button class="main" data-act="run-edit" data-id="${r.id}"><div class="t num">${fmt(r.km,1)} km · ${fDur(r.sec)}</div><div class="s">${fDate(r.date)}${r.note ? ' · '+esc(r.note) : ''}</div></button><div class="r num small">${pace(r.sec, r.km)}<span class="muted"> /km</span></div></div>`).join('')}</div></section>`
    : empty('Noch kein Lauf', 'Tippe auf „Lauf eintragen“. Distanz und Zeit stellst du per Buttons ein, die Pace rechnet die App.')}
  </div>`;
}
/* ---------- Kraft: Übersicht, Live-Training, Übungsdetails ---------- */
const planLetter = t => (t.match(/Oberkörper\s+([A-Z])/) || [])[1] || (t.trim()[0] || '?').toUpperCase();
const planFocus = t => t.split(' · ')[1] || '';
const exLogText = e => arr(e.log).length ? `${e.log.map(x => x.reps).join(' · ')} Wdh. × ${fmt(e.kg || 0, 1)} kg` : `${e.sets}×${e.reps}${e.kg ? ` · ${fmt(e.kg, 1)} kg` : ''}`;
const fmtMin = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
function vStrength() {
  const t = today(), wk = mondayOf(t), lifts = [...S.lifts].sort(byDateDesc);
  const planL = ORDER.filter(k => S.plan[k]?.type === 'kraft').length;
  const weekL = S.lifts.filter(l => mondayOf(l.date) === wk);
  const vol = l => sum(arr(l.ex), e => arr(e.log).length ? sum(e.log, x => x.reps * x.kg) : (e.sets || 0) * (e.reps || 0) * (e.kg || 0));
  const prs30 = prList().filter(r => r.date >= addDays(t, -30)).length;
  const durs = S.lifts.filter(l => l.dur > 0).slice(-10), avgDur = durs.length ? sum(durs, l => l.dur) / durs.length : 0;
  const weeks = []; for (let i = 7; i >= 0; i--) { const ws = addDays(wk, -7 * i); weeks.push({label: 'KW' + isoWeek(ws), v: Math.round(sum(S.lifts.filter(l => mondayOf(l.date) === ws), vol) / 100) / 10}); }
  const todayTitle = S.plan[WD[new Date().getDay()]]?.type === 'kraft' ? S.plan[WD[new Date().getDay()]].text : '';
  const titles = liftTitles();
  const names = exNames().filter(n => exHistory(n).length);
  return `<div class="stack">
    <div class="stats">
      <div class="stat"><div class="k">Diese Woche</div><div class="v">${weekL.length}<small>/${planL}</small></div></div>
      <div class="stat"><div class="k">Volumen Woche</div><div class="v">${fmt(sum(weekL, vol) / 1000, 1)} <small>t</small></div></div>
      <div class="stat"><div class="k">Rekorde 30 Tage</div><div class="v">${prs30}</div></div>
      <div class="stat"><div class="k">Ø Dauer</div><div class="v">${avgDur ? Math.round(avgDur / 60000) : 0} <small>min</small></div></div>
    </div>
    <section class="card"><div class="card-h"><h2>Deine Trainingspläne</h2></div><div class="list">${titles.map(title => {
      const last = lifts.find(l => l.title === title), n = liftRows(title).length, isToday = title === todayTitle;
      return `<div class="item"><span class="daylabel" style="${isToday ? 'background:var(--accent);color:#fff' : ''}">${esc(planLetter(title))}</span><div class="main"><div class="t">${esc(title.replace(/ · .*/, ''))}${isToday ? ' <span class="pill acc">heute</span>' : ''}</div><div class="s">${esc(planFocus(title))} · ${n} Übungen${last ? ` · zuletzt ${fDate(last.date)}` : ''}</div></div><button class="btn sm ${isToday ? 'acc' : 'ghost'}" data-act="wo-start" data-v="${esc(title)}">▶ Start</button></div>`; }).join('')}</div>
      <p class="muted small" style="margin:10px 0 0">Ohne Live-Eintrag? <button class="link" style="font-size:13px" data-act="lift-quick">✓ Heutiges Training als geschafft eintragen</button></p></section>
    ${names.length ? `<section class="card"><div class="card-h"><h2>Übungen</h2><span class="muted small">zuletzt · Trend 4 Wochen</span></div><div class="list">${names.map(n => {
      const h = exHistory(n), l = h[h.length - 1], old = [...h].reverse().find(x => x.date <= addDays(t, -28)) || h[0], ch = old.v ? Math.round((l.v / old.v - 1) * 100) : 0;
      return `<div class="item"><button class="main" data-act="ex-detail" data-v="${esc(n)}"><div class="t">${esc(n)}</div><div class="s">${l.sets}×${l.reps}${l.kg ? ` · ${fmt(l.kg, 1)} kg` : ''} · ${fDate(l.date)}</div></button><span class="pill ${ch > 0 ? 'acc' : ch < 0 ? 'bad' : ''}">${ch > 0 ? '▲' : ch < 0 ? '▼' : '■'} ${Math.abs(ch)} %</span><span class="muted">›</span></div>`; }).join('')}</div></section>` : ''}
    <section class="card"><div class="card-h"><h2>Bewegtes Gewicht pro Woche</h2><span class="muted small">Tonnen</span></div>${barChart(weeks, {dec: 1})}</section>
    ${lifts.length ? `<section class="card"><div class="card-h"><h2>Verlauf</h2></div><div class="list">${lifts.slice(0, 15).map(l => `<div class="item" data-sl="lift-del" data-id="${l.id}"><button class="main" data-act="lift-edit" data-id="${l.id}"><div class="t">${esc((l.title || 'Krafttraining').replace(/ · .*/, ''))}</div><div class="s">${fDate(l.date)} · ${arr(l.ex).length} Übungen · ${fmt(vol(l) / 1000, 1)} t${l.dur ? ` · ${fmtMin(l.dur)}` : ''}</div></button><span class="muted">›</span></div>`).join('')}</div></section>`
    : empty('Noch kein Krafttraining', 'Tippe bei einem Plan auf „▶ Start“. Die App führt dich Satz für Satz durch das Training.')}
  </div>`;
}
function shExercise(name) {
  const h = exHistory(name), sessions = liftsAsc().filter(l => arr(l.ex).some(e => e.name === name)).reverse().slice(0, 8);
  const bw = h.length && h[h.length - 1].bw, best = h.length ? Math.max(...h.map(x => x.v)) : 0;
  const tpl = Object.values(S.plan.templates || {}).flat().find(e => e.name === name) || {};
  sheet(name, `
    <div class="stats" style="grid-template-columns:1fr 1fr 1fr"><div class="stat"><div class="k">${bw ? 'Beste Wdh.' : 'Bestes 1RM'}</div><div class="v">${fmt(best, bw ? 0 : 1)}${bw ? '' : '<small> kg</small>'}</div></div><div class="stat"><div class="k">Trainings</div><div class="v">${h.length}</div></div><div class="stat"><div class="k">Bereich</div><div class="v">${tpl.min || 8}–${tpl.max || 12}<small> Wdh.</small></div></div></div>
    <div class="card" style="padding:12px 14px">${lineChart(h.map(x => ({x: shortDate(x.date), y: x.v})), {unit: bw ? 'Wdh.' : 'kg', dec: bw ? 0 : 1})}</div>
    <p class="muted small" style="margin:0">${bw ? 'Ohne Zusatzgewicht zählen die Wiederholungen.' : 'Geschätzte Maximalkraft (1RM) aus Gewicht und Wiederholungen.'}${tpl.hint ? ' ' + esc(tpl.hint) + '.' : ''}</p>
    ${sessions.length ? `<div class="card" style="padding:2px 14px"><div class="list">${sessions.map(l => { const e = l.ex.find(x => x.name === name); return `<div class="item"><div class="main"><div class="t">${fDate(l.date)}</div><div class="s">${esc(exLogText(e))}</div></div></div>`; }).join('')}</div></div>` : ''}`, {mod: 'train', submit: ''});
}

/* Live-Training */
let woSaveT, woTick;
function woSave() { clearTimeout(woSaveT); const w = S.workout; woSaveT = setTimeout(() => { if (db) save(w ? one('workout').set(w) : one('workout').delete()); }, 400); }
function woStart(title) {
  if (S.workout) { ACT.tab('train'); S.sub.train = 'kraft'; return render(); }
  const ex = liftRows(title).map(e => ({name: e.name, sets: e.sets || 3, reps: e.reps || 8, kg: e.kg || 0, min: e.min, max: e.max, step: e.step, hint: e.hint || '', up: e.up || '', prev: e.prev || null, log: []}));
  if (!ex.length) return toast('Dieser Plan hat noch keine Übungen.');
  S.workout = {title, date: today(), startedAt: Date.now(), cur: 0, ex, lastSetAt: 0};
  S.wDraft = null; S.tab = 'train'; S.sub.train = 'kraft'; store.set('tab', 'train'); store.set('sub', S.sub);
  woSave(); render(); scrollTo(0, 0);
}
function woDraft() {
  const w = S.workout, e = w.ex[w.cur], lastLog = e.log[e.log.length - 1];
  if (!S.wDraft || S.wDraft.i !== w.cur || S.wDraft.n !== e.log.length) S.wDraft = {i: w.cur, n: e.log.length, reps: lastLog ? Math.min(lastLog.reps, e.reps) : e.reps, kg: lastLog ? lastLog.kg : e.kg};
  return S.wDraft;
}
function vWorkout() {
  const w = S.workout, e = w.ex[w.cur], d = woDraft();
  const total = sum(w.ex, x => Math.max(x.sets, x.log.length)), done = sum(w.ex, x => x.log.length);
  const setNo = e.log.length + 1, allDone = e.log.length >= e.sets;
  const nextIdx = w.ex.findIndex((x, i) => i > w.cur && x.log.length < x.sets);
  return `<div class="stack">
    <section class="card wo-head"><div class="card-h"><span class="tag"><span class="ti" style="--m:var(--train)">${ICON.train}</span>${esc(w.title.replace(/ · .*/, ''))} läuft</span><span class="num" data-tick="start" style="font-weight:600">${clock(Date.now() - w.startedAt)}</span></div>
      <div class="bar"><span style="width:${total ? done / total * 100 : 0}%"></span></div>
      <div class="muted small" style="margin-top:6px">${done} von ${total} Sätzen${w.lastSetAt ? ` · Pause <span class="num" data-tick="rest">${clock(Date.now() - w.lastSetAt)}</span>` : ''}</div></section>

    <section class="card stack" style="gap:12px">
      <div><div class="muted small">Übung ${w.cur + 1} von ${w.ex.length}${e.hint ? ' · ' + esc(e.hint) : ''}</div><div style="font-size:24px;font-weight:700;letter-spacing:-.02em">${esc(e.name)}</div>
        <div class="small">Ziel: <b>${e.sets} × ${e.reps} Wdh.${e.kg ? ` mit ${fmt(e.kg, 1)} kg` : ''}</b>${e.up ? ` <span class="pill acc">${e.up === 'kg' ? '+' + fmt(e.step || 2.5, 1) + ' kg' : '+1 Wdh.'}</span>` : ''}</div>
        ${e.prev ? `<div class="muted small">Letztes Mal: ${e.prev.sets}×${e.prev.reps}${e.prev.kg ? ` mit ${fmt(e.prev.kg, 1)} kg` : ''}</div>` : ''}</div>
      ${e.log.length ? `<div class="setlist">${e.log.map((x, k) => `<button class="setchip" data-act="wo-undo" data-v="${k}" aria-label="Satz ${k + 1} entfernen"><b>${k + 1}</b> ${x.reps} × ${fmt(x.kg, 1)} kg <span>×</span></button>`).join('')}</div>` : ''}
      <div class="stack" style="gap:8px">
        ${stepper('w_reps', `Satz ${setNo} · Wdh.`, d.reps, {steps: [1]})}
        ${stepper('w_kg', 'Gewicht', d.kg, {steps: [e.step || 2.5], dec: 1, unit: 'kg'})}
      </div>
      <button class="btn acc wide wo-big" data-act="wo-set">✓ Satz ${setNo}${allDone ? ' (Extra)' : ''} erledigt</button>
      ${allDone ? (nextIdx >= 0 ? `<button class="btn wide" data-act="wo-go" data-v="${nextIdx}">Weiter: ${esc(w.ex[nextIdx].name)} ›</button>` : `<button class="btn wide" data-act="wo-finish">Training abschließen</button>`) : ''}
    </section>

    <section class="card"><div class="card-h"><h2>Alle Übungen</h2></div><div class="list">${w.ex.map((x, i) => `<div class="item ${i === w.cur ? 'today' : ''}"><span class="num-badge" style="${x.log.length >= x.sets ? 'background:var(--shop);color:#fff' : i === w.cur ? 'background:var(--train);color:#fff' : ''}">${x.log.length >= x.sets ? '✓' : i + 1}</span><button class="main" data-act="wo-go" data-v="${i}"><div class="t">${esc(x.name)}</div><div class="s">${x.log.length}/${x.sets} Sätze · Ziel ${x.reps} × ${fmt(x.kg, 1)} kg</div></button></div>`).join('')}</div></section>

    <div class="row-actions"><button class="btn acc" style="flex:1;--accent:var(--shop)" data-act="wo-finish">Training abschließen</button><button class="btn danger" data-act="wo-cancel">Abbrechen</button></div>
  </div>`;
}
function woTicker() {
  clearInterval(woTick);
  if (!S.workout) return;
  woTick = setInterval(() => {
    if (!S.workout) return clearInterval(woTick);
    document.querySelectorAll('[data-tick="start"]').forEach(el => el.textContent = clock(Date.now() - S.workout.startedAt));
    document.querySelectorAll('[data-tick="rest"]').forEach(el => el.textContent = clock(Date.now() - S.workout.lastSetAt));
  }, 1000);
}
function woFinish() {
  const w = S.workout; if (!w) return;
  const ex = w.ex.filter(e => e.log.length).map(e => {
    const top = Math.max(...e.log.map(x => x.kg)), atTop = e.log.filter(x => x.kg === top);
    return exMeta({name: e.name, sets: e.log.length, reps: Math.min(...atTop.map(x => x.reps)), kg: top, min: e.min, max: e.max, step: e.step, log: e.log});
  });
  if (!ex.length) return toast('Noch kein Satz eingetragen. Zum Verwerfen auf „Abbrechen“.');
  const before = new Set(prList().map(r => r.name + r.date));
  const dur = Date.now() - w.startedAt;
  const id = addNow('lifts', {date: w.date, title: w.title, ex: ex.map(e => ({...e, log: arr(w.ex.find(x => x.name === e.name)?.log)})), start: w.startedAt, end: Date.now(), dur});
  S.workout = null; S.wDraft = null; woSave(); clearInterval(woTick);
  setTimeout(() => {
    const prs = prList().filter(r => !before.has(r.name + r.date) && r.date === w.date);
    toast(`${w.title.replace(/ · .*/, '')} gespeichert · ${fmtMin(dur)}${prs.length ? ` · 🏆 ${prs.length} neue ${prs.length === 1 ? 'Bestleistung' : 'Bestleistungen'}` : ''}`, {edit: () => shLift(find('lifts', id))});
  }, 300);
  render();
}

/* ---------- Trainingsanalyse ---------- */
const e1rm = e => (e.kg || 0) * (1 + (e.reps || 0) / 30);
const exValue = e => e.kg > 0 ? e1rm(e) : (e.reps || 0);
const liftsAsc = () => [...S.lifts].sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.ts || 0) - (b.ts || 0));
function exNames() {
  const n = []; Object.values(S.plan.templates || {}).forEach(t => arr(t).forEach(e => { if (!n.includes(e.name)) n.push(e.name); }));
  S.lifts.forEach(l => arr(l.ex).forEach(e => { if (e.name && !n.includes(e.name)) n.push(e.name); }));
  return n;
}
function exHistory(name) {
  return liftsAsc().map(l => ({l, e: arr(l.ex).find(x => x.name === name)})).filter(x => x.e && (x.e.kg > 0 || x.e.reps > 0))
    .map(({l, e}) => ({date: l.date, kg: e.kg || 0, reps: e.reps || 0, sets: e.sets || 0, v: exValue(e), bw: !(e.kg > 0)}));
}
function prList() {
  const best = {}, out = [];
  liftsAsc().forEach(l => arr(l.ex).forEach(e => { const v = exValue(e); if (!e.name || !v) return; if (best[e.name] != null && v > best[e.name] + 0.01) out.push({date: l.date, name: e.name, kg: e.kg, reps: e.reps, v}); if (best[e.name] == null || v > best[e.name]) best[e.name] = v; }));
  return out.reverse();
}
function lineChart(pts, {unit = '', dec = 0, invert = false, fmtY} = {}) {
  if (pts.length < 2) return `<p class="muted small" style="margin:0">Ab zwei Einträgen erscheint hier der Verlauf.</p>`;
  const W = 320, H = 150, L = 36, R = 10, T = 14, B = 22;
  const ys = pts.map(p => p.y); let lo = Math.min(...ys), hi = Math.max(...ys); if (hi - lo < 1e-9) { lo -= 1; hi += 1; } const padY = (hi - lo) * 0.15; lo -= padY; hi += padY;
  const x = i => L + (W - L - R) * (pts.length === 1 ? 0.5 : i / (pts.length - 1));
  const y = v => { const t = (v - lo) / (hi - lo); return T + (H - T - B) * (invert ? t : 1 - t); };
  const f = fmtY || (v => fmt(v, dec));
  let g = '';
  [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15].forEach(v => { g += `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-5}" y="${y(v)+3.5}" text-anchor="end" font-size="9.5" style="fill:var(--muted);font-family:var(--font)">${f(v)}</text>`; });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  g += `<path d="${d}" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--accent)"/>`;
  pts.forEach((p, i) => { const last = i === pts.length - 1; g += `<circle cx="${x(i)}" cy="${y(p.y)}" r="${last ? 4.5 : 2.5}" style="fill:${last ? 'var(--accent)' : 'var(--raise)'};stroke:var(--accent)" stroke-width="2"/>`; });
  const lastP = pts[pts.length - 1];
  g += `<text x="${Math.min(x(pts.length - 1), W - R)}" y="${y(lastP.y) - 9}" text-anchor="end" font-size="10.5" font-weight="700" style="fill:var(--fg);font-family:var(--font)">${f(lastP.y)}${unit ? ' ' + unit : ''}</text>`;
  g += `<text x="${L}" y="${H-6}" font-size="9.5" style="fill:var(--muted);font-family:var(--font)">${esc(pts[0].x)}</text><text x="${W-R}" y="${H-6}" text-anchor="end" font-size="9.5" style="fill:var(--muted);font-family:var(--font)">${esc(lastP.x)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf">${g}</svg>`;
}
function barChart(bars, {dec = 0} = {}) {
  const W = 320, H = 130, L = 8, R = 8, T = 16, B = 22, max = Math.max(1, ...bars.map(b => b.v)), bw = (W - L - R) / bars.length;
  let g = '';
  bars.forEach((b, i) => { const h = (H - T - B) * b.v / max, x = L + i * bw + bw * 0.18, w = bw * 0.64, last = i === bars.length - 1;
    g += `<rect x="${x}" y="${H - B - h}" width="${w}" height="${Math.max(0, h)}" rx="3" style="fill:var(--accent)" opacity="${last ? 1 : .5}"/>`;
    if (b.v > 0) g += `<text x="${x + w/2}" y="${H - B - h - 4}" text-anchor="middle" font-size="9" font-weight="700" style="fill:var(--fg);font-family:var(--font)">${fmt(b.v, dec)}</text>`;
    g += `<text x="${x + w/2}" y="${H - 7}" text-anchor="middle" font-size="9.5" style="fill:var(--muted);font-family:var(--font)">${esc(b.label)}</text>`; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wochenwerte">${g}</svg>`;
}
const shortDate = s => parseISO(s).toLocaleDateString('de-DE', {day: 'numeric', month: 'numeric'});
function vAnalysis() {
  const t = today(), wk = mondayOf(t);
  // Regelmäßigkeit: letzte 4 abgeschlossene Wochen plus aktuelle
  const planL = ORDER.filter(k => S.plan[k]?.type === 'kraft').length, planR = ORDER.filter(k => S.plan[k]?.type === 'lauf').length;
  const from = addDays(wk, -28), inRange = x => x.date >= from && x.date < wk;
  const doneL = S.lifts.filter(inRange).length, doneR = S.runs.filter(inRange).length;
  const pct = (a, b) => b ? Math.min(100, Math.round(a / b * 100)) : 0;
  const cons = pct(doneL + doneR, (planL + planR) * 4);
  // Volumen pro Woche
  const weeks = []; for (let i = 7; i >= 0; i--) { const ws = addDays(wk, -7 * i); weeks.push({label: 'KW' + isoWeek(ws), v: Math.round(sum(S.lifts.filter(l => mondayOf(l.date) === ws), l => sum(arr(l.ex), e => (e.sets || 0) * (e.reps || 0) * (e.kg || 0))) / 100) / 10}); }
  // Übung
  const names = exNames(); const ex = names.includes(S.anaEx) ? S.anaEx : (names.find(n => exHistory(n).length) || names[0] || '');
  const hist = ex ? exHistory(ex) : [], bw = hist.length && hist[hist.length - 1].bw;
  const first = hist[0], last = hist[hist.length - 1];
  const change = hist.length > 1 && first.v ? Math.round((last.v / first.v - 1) * 100) : 0;
  const prs = prList().slice(0, 6);
  // Laufen
  const runs = [...S.runs].filter(r => r.km > 0 && r.sec > 0).sort((a, b) => a.date.localeCompare(b.date)), lastRuns = runs.slice(-12);
  const bestBy = {}; runs.forEach(r => { const k = rotation().reduce((b, d) => Math.abs(d - r.km) < Math.abs(b - r.km) ? d : b, rotation()[0]); const p = r.sec / r.km; if (!bestBy[k] || p < bestBy[k].p) bestBy[k] = {p, r}; });
  // Gewicht
  const ws = [...S.weights].filter(w => w.kg > 0).sort((a, b) => a.date.localeCompare(b.date)), wl = ws[ws.length - 1];
  const w4 = ws.filter(w => w.date >= addDays(t, -28)); let rate = null;
  if (w4.length >= 2) { const a = w4[0], b = w4[w4.length - 1], days = diffDays(b.date, a.date); if (days >= 6) rate = (b.kg - a.kg) / days * 7; }
  const rateNote = rate == null ? 'Wieg dich einmal pro Woche morgens, dann erscheint hier dein Trend.' : rate < 0.2 ? 'Etwas langsam für Muskelaufbau. Wenn das 2 Wochen so bleibt: etwa 200 kcal mehr am Tag.' : rate > 0.6 ? 'Etwas schnell. Wenn das 2 Wochen so bleibt: etwa 200 kcal weniger am Tag.' : 'Im Zielbereich. Weiter so!';
  return `<div class="stack">
    <section class="card"><div class="card-h"><h2>Letzte 4 Wochen</h2></div>
      <div class="stats" style="grid-template-columns:1fr 1fr 1fr">
        <div class="stat"><div class="k">Kraft</div><div class="v">${doneL}<small>/${planL * 4}</small></div></div>
        <div class="stat"><div class="k">Läufe</div><div class="v">${doneR}<small>/${planR * 4}</small></div></div>
        <div class="stat"><div class="k">Plan erfüllt</div><div class="v">${cons}<small> %</small></div></div>
      </div>
      <div class="bar" style="margin-top:12px"><span style="width:${cons}%"></span></div></section>

    <section class="card"><div class="card-h"><h2>Kraftverlauf</h2>${hist.length > 1 ? `<span class="pill ${change >= 0 ? 'acc' : 'bad'}">${change >= 0 ? '+' : ''}${change} %</span>` : ''}</div>
      ${names.length ? `<div class="picks hscroll" style="margin-bottom:10px">${names.map(n => `<button class="pk" data-act="ana-ex" data-v="${esc(n)}" aria-pressed="${n === ex}">${esc(n)}</button>`).join('')}</div>` : ''}
      ${lineChart(hist.map(h => ({x: shortDate(h.date), y: h.v})), {unit: bw ? 'Wdh.' : 'kg', dec: bw ? 0 : 1})}
      <p class="muted small" style="margin:8px 0 0">${bw ? 'Ohne Zusatzgewicht zählt die Zahl der Wiederholungen.' : 'Geschätzte Maximalkraft für 1 Wiederholung (1RM) aus Gewicht und Wiederholungen.'}${last ? ` Zuletzt: ${last.sets}×${last.reps}${last.kg ? ` mit ${fmt(last.kg, 1)} kg` : ''}.` : ''}</p></section>

    <section class="card"><div class="card-h"><h2>Bewegtes Gewicht pro Woche</h2><span class="muted small">Tonnen</span></div>${barChart(weeks, {dec: 1})}</section>

    <section class="card"><div class="card-h"><h2>Neue Bestleistungen</h2></div>
      ${prs.length ? `<div class="list">${prs.map(r => `<div class="item"><div class="main"><div class="t">🏆 ${esc(r.name)}</div><div class="s">${fDate(r.date)}</div></div><div class="r num">${r.kg ? `${fmt(r.kg, 1)} kg × ${r.reps}` : `${r.reps} Wdh.`}</div></div>`).join('')}</div>` : '<p class="muted small" style="margin:0">Sobald du eine Übung steigerst, erscheint sie hier.</p>'}</section>

    <section class="card"><div class="card-h"><h2>Lauf-Pace</h2><span class="muted small">min/km, oben = schneller</span></div>
      ${lineChart(lastRuns.map(r => ({x: shortDate(r.date), y: r.sec / r.km})), {invert: true, fmtY: v => fDur(v)})}
      ${Object.keys(bestBy).length ? `<div class="muted small" style="margin:10px 0 6px">Bestzeiten pro km</div><div class="stats" style="grid-template-columns:repeat(${Object.keys(bestBy).length},1fr)">${Object.entries(bestBy).sort((a, b) => a[0] - b[0]).map(([k, b]) => `<div class="stat"><div class="k">${fmt(k)} km</div><div class="v">${fDur(b.p)}</div></div>`).join('')}</div>` : ''}</section>

    <section class="card"><div class="card-h"><h2>Körpergewicht</h2><button class="link" data-act="weight-new">Eintragen</button></div>
      ${wl ? `<div class="stats" style="grid-template-columns:1fr 1fr;margin-bottom:10px"><div class="stat"><div class="k">Aktuell</div><div class="v">${fmt(wl.kg, 1)}<small> kg</small></div></div><div class="stat"><div class="k">Trend pro Woche</div><div class="v">${rate == null ? '–' : (rate >= 0 ? '+' : '') + fmt(rate, 2)}<small> kg</small></div></div></div>` : ''}
      ${lineChart(ws.slice(-16).map(w => ({x: shortDate(w.date), y: w.kg})), {unit: 'kg', dec: 1})}
      <p class="muted small" style="margin:8px 0 0">Ziel Muskelaufbau: +0,25 bis 0,5 kg pro Woche. ${rateNote}</p></section>
  </div>`;
}
const lastWeight = () => [...S.weights].filter(w => w.kg > 0).sort((a, b) => b.date.localeCompare(a.date))[0];
const weighDue = () => { const w = lastWeight(); return !w || diffDays(today(), w.date) >= 7; };
function weighCard() {
  const w = lastWeight();
  return `<section class="card"><div class="card-h"><span class="tag"><span class="ti" style="--m:var(--train)">${ICON.scale}</span>Zeit zum Wiegen</span></div>
    <div class="hero"><div style="flex:1;min-width:0"><div class="muted small">${w ? `Zuletzt ${fmt(w.kg, 1)} kg am ${fDate(w.date)}` : 'Noch kein Gewicht eingetragen'}</div><div class="small">Einmal pro Woche, morgens nach dem Aufstehen.</div></div><button class="btn acc" style="--accent:var(--train)" data-act="weight-new">Eintragen</button></div></section>`;
}
function shWeight() {
  const last = [...S.weights].sort((a, b) => b.date.localeCompare(a.date))[0];
  sheet('Körpergewicht', `${datePicks(today())}${stepper('kg', 'Gewicht', last?.kg || 87.5, {steps: [0.1, 1], dec: 1, unit: 'kg'})}<p class="muted small" style="margin:0">Am besten morgens nach dem Aufstehen, vor dem Frühstück.</p>`,
  {mod: 'train', onSubmit: f => { const kg = num(f.kg), d = f.date || today(); if (!(kg > 30)) { toast('Bitte ein gültiges Gewicht einstellen.'); return false; }
    if (!needDb()) return false; const prev = S.weights.find(w => w.date === d);
    save(col('weights').doc(d).set({date: d, kg, ts: Date.now()}));
    toast(`${fmt(kg, 1)} kg eingetragen`, {undo: () => prev ? save(col('weights').doc(d).set(prev)) : save(col('weights').doc(d).delete())}); }});
}

function weekChart(weeks) {
  const W = 320, H = 130, L = 26, B = 22, T = 14, R = 4;
  const max = Math.max(5, ...weeks.map(w => w.km)); const step = max > 40 ? 20 : max > 20 ? 10 : 5; const top = Math.ceil(max/step)*step;
  const y = v => T + (H - T - B) * (1 - v/top); const bw = (W - L - R) / weeks.length;
  let g = '';
  for (let v = 0; v <= top; v += step) g += `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-6}" y="${y(v)+3.5}" text-anchor="end" font-size="9.5" style="fill:var(--muted);font-family:var(--font)">${v}</text>`;
  weeks.forEach((w, i) => {
    const x = L + i*bw + bw*0.2, bwid = bw*0.6, h = y(0) - y(w.km), last = i === weeks.length-1;
    g += `<rect x="${x}" y="${y(w.km)}" width="${bwid}" height="${Math.max(0,h)}" rx="3" style="fill:var(--accent)" opacity="${last ? 1 : .5}"/>`;
    g += `<text x="${x+bwid/2}" y="${H-7}" text-anchor="middle" font-size="9.5" style="fill:var(--muted);font-family:var(--font)">KW${isoWeek(w.ws)}</text>`;
    if (w.km > 0) g += `<text x="${x+bwid/2}" y="${y(w.km)-4}" text-anchor="middle" font-size="9.5" font-weight="700" style="fill:var(--fg);font-family:var(--font)">${fmt(w.km,0)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Laufkilometer der letzten acht Wochen">${g}</svg>`;
}

/* --- Haushalt --- */
function vHome() {
  if (S.sub.home === 'waesche') return vLaundry();
  const list = S.chores.filter(c => (c.kind || 'putz') === 'putz').sort((a,b) => dueIn(a) - dueIn(b));
  return `<div class="stack">
    ${list.length ? `<section class="card"><div class="list">${list.map(c => { const d = dueIn(c); return `<div class="item" data-sr="chore-done" data-id="${c.id}"><button class="main" data-act="chore-edit" data-id="${c.id}"><div class="t">${esc(c.name)}</div><div class="s">${c.info ? esc(c.info)+' · ' : ''}alle ${c.every} Tage · ${c.last ? 'zuletzt '+fDate(c.last) : 'erstmals '+fDate(c.next || today())}</div></button>${duePill(d)}<button class="check ${d > 0 ? 'on' : ''}" data-act="chore-done" data-id="${c.id}" aria-label="${esc(c.name)} heute erledigt">${ICON.check}</button></div>`; }).join('')}</div></section>`
    : empty('Noch kein Putzplan', 'Lege eine Aufgabe mit Rhythmus an.')}
    <button class="btn ghost wide" data-act="chore-new">Putzaufgabe hinzufügen</button>
    <p class="muted small" style="margin:0">Haken setzen heißt: heute erledigt. Der nächste Termin rechnet sich danach neu.</p>
  </div>`;
}
function vLaundry() {
  const L = laundry(), extra = S.chores.filter(c => c.kind === 'waesche' && !(c.every > 0));
  const next = L.rot.find(c => c.id === L.nextId);
  const seq = L.rot.length ? [...Array(L.rot.length)].map((_, k) => L.rot[(L.si + k) % L.rot.length]) : [];
  return `<div class="stack">
    ${next ? `<section class="card"><div class="card-h"><span class="tag"><span class="ti" style="--m:var(--home)">${ICON.home}</span>Nächste Wäsche</span>${duePill(dueIn(next))}</div>
      <div class="hero"><div style="flex:1;min-width:0"><div class="big">${esc(next.name)}</div><div class="muted small">${esc(next.info || '')} · ${fDate(L.due[next.id])}</div></div><button class="btn acc" data-act="chore-done" data-id="${next.id}">Gewaschen</button></div></section>
    <section class="card"><div class="card-h"><h2>Rotation · alle ${L.every} Tage</h2></div><div class="list">${seq.map((c, k) => `<div class="item"><span class="num-badge">${k+1}</span><button class="main" data-act="chore-edit" data-id="${c.id}"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.info || '')}${c.last ? ' · zuletzt '+fDate(c.last) : ''}</div></button><span class="pill ${k === 0 ? 'acc' : ''}">${fDate(L.due[c.id])}</span><button class="btn sm ghost" data-act="chore-done" data-id="${c.id}">Heute</button></div>`).join('')}</div>
      <p class="muted small" style="margin:10px 0 0">Wäschst du eine andere Sorte als geplant, tippe dort auf „Heute“. Die Reihenfolge danach passt sich automatisch an.</p></section>`
    : empty('Noch keine Wäsche-Rotation', 'Lege Waschgänge an, sie wechseln sich dann automatisch ab.')}
    ${extra.length ? `<section class="card"><div class="card-h"><h2>Bei Bedarf</h2></div><div class="list">${extra.map(c => `<div class="item"><button class="main" data-act="chore-edit" data-id="${c.id}"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.info || '')}${c.last ? ' · zuletzt '+fDate(c.last) : ''}</div></button><button class="btn sm ghost" data-act="chore-done" data-id="${c.id}">Heute gewaschen</button></div>`).join('')}</div></section>` : ''}
    <button class="btn ghost wide" data-act="chore-new">Waschgang hinzufügen</button>
  </div>`;
}

/* --- Essen --- */
function vFood() {
  const s = S.sub.food;
  if (s === 'tag') {
    const tot = dayTotals(), st = S.settings, isToday = S.dayDate === today(), df = dishFor(S.dayDate);
    const eatenDish = df && S.day.entries.some(e => e.dish === df.dish.id);
    return `<div class="stack">
      <div class="daynav"><button class="btn sm ghost" data-act="day" data-v="-1" aria-label="Vorheriger Tag">‹</button><strong>${isToday ? 'Heute' : esc(fDate(S.dayDate))}</strong><button class="btn sm ghost" data-act="day" data-v="1" aria-label="Nächster Tag" ${isToday ? 'disabled' : ''}>›</button></div>
      <section class="card stack" style="gap:12px">
        <div class="card-h" style="margin:0"><h2>Tagesziele</h2><button class="link" data-act="goals">Ziele anpassen</button></div>
        <div class="rings">${ring('kcal', tot.kcal, st.kcal, '--food')}${ring('ml Wasser', S.day.water, st.water, '--home')}</div>
        ${meter('Eiweiß', tot.p, st.p, 'g')}${meter('Kohlenhydrate', tot.c, st.c, 'g')}${meter('Fett', tot.f, st.f, 'g')}
      </section>
      ${df ? `<section class="card"><div class="item" style="padding:0;border:0"><div class="main"><div class="s">Gericht des Tages</div><div class="t" style="font-size:17px">${esc(df.dish.name)}</div><div class="s">${fmt(df.dish.kcal)} kcal · E ${fmt(df.dish.p)} · K ${fmt(df.dish.c)} · F ${fmt(df.dish.f)}</div></div>${eatenDish ? '<span class="pill solid">gegessen</span>' : `<button class="btn sm acc" data-act="dish-eat" data-v="${S.dayDate}">✓ Gegessen</button>`}</div></section>` : ''}
      <section class="card stack" style="gap:10px"><div class="card-h" style="margin:0"><h2>Was hast du gegessen?</h2></div>${typeBox()}${recentEstimates() ? `<div class="muted small">Zuletzt geschätzt · 1 Tipp, kostenlos</div>${recentEstimates()}` : '<p class="muted small" style="margin:0">Beschreib dein Essen in eigenen Worten. Claude schätzt Menge und Nährwerte.</p>'}</section>
      <div class="row-actions"><button class="btn acc" style="flex:1" data-act="photo">📷 Foto vom Essen</button><button class="btn ghost" style="flex:1" data-act="combo">Selbst zusammenstellen</button></div>
      <section class="card"><div class="card-h"><h2>Schnell eintragen · 1 Portion</h2><button class="link" data-act="food-add">Menge wählen</button></div>${quickFoods(14) || '<p class="muted small" style="margin:0">Lege unter „Nährwerte“ Lebensmittel an.</p>'}</section>
      <section class="card stack" style="gap:11px"><div class="card-h" style="margin:0"><h2>Wasser</h2><span class="muted small num">${fmt(S.day.water)} / ${fmt(st.water)} ml</span></div>${waterBtns()}</section>
      ${S.day.entries.length ? `<section class="card"><div class="card-h"><h2>Gegessen</h2></div><div class="list">${S.day.entries.map((e,i) => `<div class="item" data-sl="entry-del" data-v="${i}"><div class="main" ${e.pid ? `data-act="photo-edit" data-v="${e.pid}" role="button"` : ''}><div class="t">${e.photo ? '📷 ' : e.typed ? '✍️ ' : ''}${esc(e.name)}${e.g ? ` <span class="muted num small">${fmt(e.g)} g</span>` : ''}</div><div class="s num">${fmt(e.kcal)} kcal · E ${fmt(e.p)} · K ${fmt(e.c)} · F ${fmt(e.f)}</div></div><button class="x" data-act="entry-del" data-v="${i}" aria-label="${esc(e.name)} entfernen">×</button></div>`).join('')}</div></section>` : ''}
    </div>`;
  }
  return vMeals();
}
function shFoods() {
  const foods = [...S.foods].sort((a,b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name, 'de'));
  sheet('Lebensmittel und Nährwerte', `<p class="muted small" style="margin:0">Werte pro 100 g. Tippe ein Lebensmittel an, um es anzupassen.</p>
    <div class="card" style="padding:2px 14px"><div class="list">${foods.map(f => `<div class="item"><button type="button" class="main" data-act="lm-edit" data-id="${f.id}"><div class="t">${esc(f.name)}</div><div class="s num">${fmt(f.kcal)} kcal · E ${fmt(f.p,1)} · K ${fmt(f.c,1)} · F ${fmt(f.f,1)} · Portion ${esc(f.plabel || fmt(f.portion || 100) + ' g')}</div></button><span class="muted">›</span></div>`).join('')}</div></div>
    <button type="button" class="btn ghost" data-act="lm-new">Lebensmittel hinzufügen</button>`, {mod:'food', submit:''});
}
function vMeals() {
  const ws = S.weekStart, days = [...Array(7)].map((_, i) => addDays(ws, i)), t = today(), L = dishList();
  if (!L.length) return `<div class="stack">${empty('Noch keine Gerichte', 'Füge Gerichte hinzu, dann füllt sich der Kochplan von selbst.', '<button class="btn sm acc" data-act="dish-new">Gericht hinzufügen</button>')}</div>`;
  const avgK = Math.round(sum(L, d => d.kcal) / L.length), avgP = Math.round(sum(L, d => d.p) / L.length);
  return `<div class="stack">
    <div class="daynav"><button class="btn sm ghost" data-act="week" data-v="-7" aria-label="Vorherige Woche">‹</button><strong>KW ${isoWeek(ws)} · ${esc(fDate(ws))} bis ${esc(fDate(days[6]))}</strong><button class="btn sm ghost" data-act="week" data-v="7" aria-label="Nächste Woche">›</button></div>
    <section class="card week"><div class="list">${days.map(d => { const r = dishFor(d); return `<div class="item ${d === t ? 'today':''}"><span class="daylabel">${wdOf(d)}</span><button class="main" data-act="dish-pick" data-v="${d}"><div class="t">${esc(r.dish.name)}</div><div class="s">${fmt(r.dish.kcal)} kcal · ${fmt(r.dish.p)} g Eiweiß${r.fixed ? ' · getauscht' : ''}</div></button><button class="btn sm ghost" data-act="dish-next" data-v="${d}" aria-label="Anderes Gericht">Tauschen</button></div>`; }).join('')}</div></section>
    <button class="btn wide acc" data-act="week-shop">Zutaten der Woche auf die Einkaufsliste</button>
    <p class="muted small" style="margin:0">Eine Hauptmahlzeit pro Tag, im Schnitt ${fmt(avgK)} kcal und ${fmt(avgP)} g Eiweiß. Tauschst du ein Gericht, rotieren die folgenden Tage ab dort weiter.</p>
    <section class="card"><div class="card-h"><h2>Gerichte in der Rotation · ${L.length}</h2><button class="link" data-act="combo-new">Hinzufügen</button></div><div class="list">${L.map((d, i) => `<div class="item"><span class="num-badge">${i+1}</span><button class="main" data-act="dish-edit" data-id="${d.id}"><div class="t">${esc(d.name)}</div><div class="s num">${fmt(d.kcal)} kcal · E ${fmt(d.p)} · K ${fmt(d.c)} · F ${fmt(d.f)}</div>${arr(d.ingr).length ? `<div class="s">${esc(arr(d.ingr).join(', '))}</div>` : ''}</button><span class="muted">›</span></div>`).join('')}</div></section>
  </div>`;
}

/* --- Vorrat & Rezept --- */
function vPantry() {
  const items = [...S.pantry].sort((a,b) => a.name.localeCompare(b.name, 'de')), o = S.rOpt;
  const have = new Set(items.map(i => i.name.toLowerCase()));
  const sug = [...new Set([...foodNames(), ...Object.keys(S.shopstats.counts || {})])].filter(n => !have.has(n.toLowerCase())).slice(0, 20);
  const ideas = items.length ? cookIdeas() : [];
  const pk = (key, opts) => `<div class="picks">${opts.map(([v,l]) => `<button class="pk" data-act="ropt" data-t="${key}" data-v="${v}" aria-pressed="${String(o[key]) === v}">${l}</button>`).join('')}</div>`;
  return `<div class="stack">
    <section class="card"><div class="card-h"><h2>Was ist noch da?</h2></div><div class="qchips">${sug.map(n => `<button class="qc" data-act="pantry-quick" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <details class="more" style="margin-top:12px"><summary>Etwas anderes eintippen</summary><form class="addbar" data-form="pantry"><input id="pantry-in" placeholder="z. B. Halloumi" autocomplete="off" enterkeyhint="done"><button class="btn acc" type="submit">Hinzufügen</button></form></details></section>
    ${items.length ? `<section class="card"><div class="card-h"><h2>Zuhause vorrätig · ${items.length}</h2><button class="link" data-act="pantry-clear">Alle löschen</button></div><div class="chips">${items.map(i => `<span class="chip"><span>${esc(i.name)}</span><button class="x" data-act="pantry-del" data-id="${i.id}" aria-label="${esc(i.name)} entfernen">×</button></span>`).join('')}</div></section>` : ''}
    ${ideas.length ? `<section class="card"><div class="card-h"><h2>Daraus kannst du kochen</h2></div><div class="list">${ideas.map(x => `<div class="item"><div class="main"><div class="t">${esc(x.d.name)}</div><div class="s">${x.miss.length ? 'Fehlt: ' + esc(x.miss.join(', ')) : 'Alles da'} · ${fmt(x.d.kcal)} kcal</div></div><button class="btn sm ${x.miss.length ? 'ghost' : 'acc'}" data-act="cook-today" data-id="${x.d.id}">Heute</button></div>`).join('')}</div></section>` : ''}
    ${items.length && sampleFn ? `<section class="card stack" style="gap:12px">
      <h2>Rezept-Wünsche</h2>
      <div class="fld"><span class="lab">Mahlzeit</span>${pk('meal', [['Frühstück','Frühstück'],['Mittagessen','Mittag'],['Abendessen','Abend'],['Snack','Snack']])}</div>
      <div class="fld"><span class="lab">Zeit</span>${pk('time', [['15','15 Min.'],['30','30 Min.'],['60','60 Min.']])}</div>
      <div class="fld"><span class="lab">Portionen</span>${pk('servings', [['1','1'],['2','2'],['4','4']])}</div>
      <div class="fld"><span class="lab">Wunsch</span>${pk('wish', [['','egal'],['eiweißreich','eiweißreich'],['vegetarisch','vegetarisch'],['leicht','leicht'],['herzhaft','herzhaft']])}</div>
      ${!sampleFn ? `<p class="note" style="margin:0">Rezeptvorschläge funktionieren nur, wenn die App angemeldet auf claude.ai geöffnet ist.</p>`
        : S.rState === 'loading' ? `<div class="thinking"><span class="dots"><i></i><i></i><i></i></span>Claude erstellt dein Rezept …<button class="btn sm ghost" data-act="recipe-stop" style="margin-left:auto">Stopp</button></div>`
        : `<button class="btn wide acc" data-act="recipe-go">${S.recipe ? 'Neues Rezept vorschlagen' : 'Rezept vorschlagen'}</button>`}
      ${S.rErr ? `<p class="note" style="margin:0;color:var(--danger)">${esc(S.rErr)}</p>` : ''}
    </section>` : ''}
    ${S.recipe ? vRecipe(S.recipe) : ''}
    ${S.recipes.length ? `<section class="card"><div class="card-h"><h2>Gespeicherte Rezepte</h2></div><div class="list">${[...S.recipes].sort((a,b) => (b.ts||0) - (a.ts||0)).map(r => `<div class="item"><button class="main" data-act="recipe-open" data-id="${r.id}"><div class="t">${esc(r.title)}</div><div class="s">${fmt(r.time_min)} Min. · ${fmt(r.kcal)} kcal · ${fmt(r.p)} g Eiweiß</div></button><button class="x" data-act="recipe-del" data-id="${r.id}" aria-label="Rezept löschen">×</button></div>`).join('')}</div></section>` : ''}
  </div>`;
}
function vRecipe(r) {
  const miss = new Set(arr(r.missing).map(x => String(x).toLowerCase()));
  const saved = r.id || S.recipes.some(x => x.title === r.title), inRot = S.dishes.some(d => d.name === r.title);
  return `<section class="card recipe stack" style="gap:14px" id="recipe">
    <div class="stack" style="gap:8px"><span class="tag"><span class="ti" style="--m:var(--food)">${ICON.food}</span>${esc(r.meal || 'Rezeptvorschlag')}</span><h3>${esc(r.title)}</h3>${r.summary ? `<p class="muted" style="margin:0">${esc(r.summary)}</p>` : ''}</div>
    <div class="row-actions"><span class="pill acc">${fmt(r.time_min)} Min.</span><span class="pill">${fmt(r.servings)} ${Number(r.servings) === 1 ? 'Portion' : 'Portionen'}</span></div>
    <div class="stats"><div class="stat"><div class="k">kcal / Portion</div><div class="v">${fmt(r.kcal)}</div></div><div class="stat"><div class="k">Eiweiß</div><div class="v">${fmt(r.p)} <small>g</small></div></div><div class="stat"><div class="k">Kohlenhydrate</div><div class="v">${fmt(r.c)} <small>g</small></div></div><div class="stat"><div class="k">Fett</div><div class="v">${fmt(r.f)} <small>g</small></div></div></div>
    <div><h2 style="margin-bottom:6px">Zutaten</h2>${arr(r.ingredients).map(i => `<div class="ing ${miss.has(String(i.item||'').toLowerCase()) ? 'miss' : ''}"><span>${esc(i.item)}</span><span>${esc(i.amount)}</span></div>`).join('')}</div>
    <div><h2 style="margin-bottom:10px">Zubereitung</h2><ol>${arr(r.steps).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    ${r.tip ? `<p class="note" style="margin:0">Tipp: ${esc(r.tip)}</p>` : ''}
    <div class="row-actions">
      <button class="btn sm acc" data-act="recipe-eat">Gegessen eintragen</button>
      ${inRot ? '' : '<button class="btn sm ghost" data-act="recipe-rot">In die Gerichte-Rotation</button>'}
      ${arr(r.missing).length ? '<button class="btn sm ghost" data-act="recipe-shop">Fehlendes auf Einkaufsliste</button>' : ''}
      ${arr(r.uses).length ? '<button class="btn sm ghost" data-act="recipe-used">Verbrauchtes aus Vorrat entfernen</button>' : ''}
      ${saved ? '' : '<button class="btn sm ghost" data-act="recipe-save">Rezept speichern</button>'}
    </div>
  </section>`;
}
const R_ERR = {not_granted:'Du hast die Nutzung von Claude für diese App nicht erlaubt. Lade die Seite neu, um erneut gefragt zu werden.', rate_limited:'Gerade zu viele Anfragen. Versuche es in ein paar Minuten noch einmal.', session_expired:'Bitte melde dich bei claude.ai neu an.', sampling_disabled:'Claude ist für dein Konto hier nicht verfügbar.', invalid_json:'Das Rezept kam unvollständig an. Tippe noch einmal auf „Rezept vorschlagen“.', refused:'Dazu gab es keinen Vorschlag. Ändere deinen Wunsch und versuche es erneut.'};
async function suggestRecipe() {
  if (!sampleFn || S.rState === 'loading') return;
  const o = S.rOpt, st = S.settings, tot = S.dayDate === today() ? dayTotals() : {kcal:0, p:0};
  const kcalLeft = Math.max(0, Math.round(st.kcal - tot.kcal)), pLeft = Math.max(0, Math.round(st.p - tot.p));
  const avoid = S.recipe?.title ? `\nSchlage etwas anderes vor als „${S.recipe.title}“.` : '';
  const prompt = `Du bist ein erfahrener Hobbykoch-Assistent. Schlage genau EIN alltagstaugliches Rezept vor, das hauptsächlich mit diesen Vorräten auskommt:
${S.pantry.map(i => '- ' + i.name).join('\n')}

Rahmen:
- Mahlzeit: ${o.meal}
- Maximale Zubereitungszeit: ${o.time} Minuten
- Portionen: ${o.servings}
- Wunsch: ${o.wish || 'keiner'}
- Für heute sind noch etwa ${kcalLeft} kcal und ${pLeft} g Eiweiß offen (Tagesziel ${st.kcal} kcal, ${st.p} g Eiweiß). Richte die Portion grob danach aus, gern eiweißreich.
- Salz, Pfeffer, Öl, Wasser und übliche Gewürze sind immer da. Andere fehlende Zutaten höchstens 3, nur wenn wirklich nötig.${avoid}

Antworte nur mit einem JSON-Objekt auf Deutsch in genau dieser Form:
{"title":"…","summary":"ein Satz","meal":"${o.meal}","time_min":25,"servings":${o.servings},"kcal":650,"p":45,"c":60,"f":20,"uses":["Vorrat genau wie oben geschrieben"],"missing":["fehlende Zutat"],"ingredients":[{"item":"Eier","amount":"3 Stück"}],"steps":["kurzer Schritt"],"tip":"optionaler Tipp"}
Nährwerte pro Portion, realistisch geschätzt. 4 bis 8 Schritte.`;
  rCtl = new AbortController(); S.rState = 'loading'; S.rErr = ''; render();
  try {
    const r = await sampleFn.json(prompt, {signal: rCtl.signal, cache: false});
    if (!r || typeof r !== 'object' || !r.title) throw {code:'invalid_json'};
    const n = v => Math.round(num(v));
    S.recipe = {title: String(r.title), summary: String(r.summary || ''), meal: String(r.meal || o.meal), time_min: n(r.time_min), servings: n(r.servings) || Number(o.servings), kcal: n(r.kcal), p: n(r.p), c: n(r.c), f: n(r.f),
      uses: arr(r.uses).map(String), missing: arr(r.missing).map(String), ingredients: arr(r.ingredients).map(i => ({item: String(i?.item ?? ''), amount: String(i?.amount ?? '')})), steps: arr(r.steps).map(String), tip: String(r.tip || '')};
    S.rState = 'idle'; render();
    setTimeout(() => document.getElementById('recipe')?.scrollIntoView({behavior:'smooth', block:'start'}), 80);
  } catch (e) {
    S.rState = 'idle';
    if (e?.code !== 'cancelled') S.rErr = R_ERR[e?.code] || 'Das hat nicht geklappt. Prüfe die Verbindung und versuche es erneut.';
    render();
  }
}

/* --- Auto --- */
function vCar() {
  const s = S.sub.car, {cons, avg} = fuelStats();
  const kmMonth = sum(S.trips.filter(x => inMonth(x.date)), x => x.endKm - x.startKm);
  const costMonth = sum(S.fuel.filter(x => inMonth(x.date)), x => x.cost);
  const stats = `<div class="stats">
    <div class="stat"><div class="k">km diesen Monat</div><div class="v">${fmt(kmMonth)}</div></div>
    <div class="stat"><div class="k">Tanken diesen Monat</div><div class="v">${fmt(costMonth,2)} <small>€</small></div></div>
    <div class="stat"><div class="k">Ø Verbrauch</div><div class="v">${avg ? fmt(avg,1) : '0'} <small>l/100</small></div></div>
    <div class="stat"><div class="k">Kilometerstand</div><div class="v">${fmt(lastOdo())}</div></div></div>`;
  if (s === 'fahrten') {
    const trips = [...S.trips].sort(byDateDesc), routes = topRoutes();
    return `<div class="stack">
      ${routes.length ? `<section class="card"><div class="card-h"><h2>Häufige Fahrten · 1 Tipp</h2></div><div class="qchips">${routes.map((r, i) => `<button class="qc" data-act="route-quick" data-v="${i}">${esc(r.label)}<small>${fmt(r.dist)} km</small></button>`).join('')}</div></section>` : ''}
      <button class="btn wide acc" data-act="trip-new">Fahrt eintragen</button>${stats}
      ${trips.length ? `<section class="card"><div class="list">${trips.map(t => `<div class="item" data-sl="trip-del" data-id="${t.id}"><button class="main" data-act="trip-edit" data-id="${t.id}"><div class="t">${esc(t.note || [t.from, t.to].filter(Boolean).join(' → ') || 'Fahrt')}</div><div class="s">${fDate(t.date)} · <span class="num">${fmt(t.startKm)} bis ${fmt(t.endKm)}</span></div></button><div class="r num">${fmt(t.endKm - t.startKm)} <span class="muted small">km</span></div></div>`).join('')}</div></section>`
      : empty('Noch keine Fahrt', 'Strecke und Zweck stellst du per Buttons ein. Häufige Fahrten erscheinen danach oben als 1-Tipp-Buttons.')}</div>`;
  }
  const fuel = [...S.fuel].sort((a,b) => (b.odo||0) - (a.odo||0));
  return `<div class="stack"><button class="btn wide acc" data-act="fuel-new">Tankstopp eintragen</button>${stats}
    ${fuel.length ? `<section class="card"><div class="list">${fuel.map(f => `<div class="item" data-sl="fuel-del" data-id="${f.id}"><button class="main" data-act="fuel-edit" data-id="${f.id}"><div class="t num">${fmt(f.liters,2)} l · ${fmt(f.cost,2)} €</div><div class="s">${fDate(f.date)} · ${fmt(f.odo)} km · ${f.liters ? fmt(f.cost/f.liters,3) : '0'} €/l${f.full === false ? ' · Teilfüllung' : ''}</div></button><div class="r num small">${cons[f.id] ? fmt(cons[f.id],1)+'<span class="muted"> l/100</span>' : ''}</div></div>`).join('')}</div></section>`
    : empty('Noch kein Tankstopp', 'Liter und Preis stellst du per Plus und Minus ein. Der Verbrauch wird ab dem zweiten Volltanken berechnet.')}</div>`;
}
function topRoutes() {
  const m = {};
  S.trips.forEach(t => { const label = t.note || [t.from, t.to].filter(Boolean).join(' → '); if (!label) return; const dist = t.endKm - t.startKm; const k = label + '|' + dist; (m[k] ||= {label, dist, n:0, note:t.note||'', from:t.from||'', to:t.to||''}).n++; });
  return Object.values(m).sort((a,b) => b.n - a.n).slice(0, 6);
}

/* ---------- form controls ---------- */
function stepper(name, label, val, {steps = [1], dec = 0, unit = '', min = 0} = {}) {
  const b = (s, sign) => `<button type="button" class="sb" data-act="step" data-t="${name}" data-d="${sign*s}" aria-label="${esc(label)} ${sign > 0 ? 'plus' : 'minus'} ${fmt(s, dec)}">${sign > 0 ? '+' : '−'}${steps.length > 1 ? fmt(s, dec) : ''}</button>`;
  return `<div class="stp"><span class="stp-l">${label}</span><div class="stp-c">${[...steps].reverse().map(s => b(s, -1)).join('')}<output class="sv" id="o-${name}">${fmt(val, dec)}${unit ? ` <small>${unit}</small>` : ''}</output>${steps.map(s => b(s, 1)).join('')}</div><input type="hidden" name="${name}" id="f-${name}" value="${val}" data-dec="${dec}" data-unit="${unit}" data-min="${min}"></div>`;
}
const miniStep = (name, label, val, step, dec = 0) => `<div class="ms"><span class="ml">${label}</span><div class="mr"><button type="button" data-act="step" data-t="${name}" data-d="${-step}" aria-label="${label} minus">−</button><output id="o-${name}">${fmt(val, dec)}</output><button type="button" data-act="step" data-t="${name}" data-d="${step}" aria-label="${label} plus">+</button></div><input type="hidden" name="${name}" id="f-${name}" value="${val}" data-dec="${dec}" data-min="0"></div>`;
const picks = (name, opts, cur, {hidden = true} = {}) => `<div class="picks" data-group="${name}">${opts.map(([v, l]) => `<button type="button" class="pk" data-act="pick" data-t="${name}" data-v="${esc(v)}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>${hidden ? `<input type="hidden" name="${name}" id="f-${name}" value="${esc(cur)}">` : ''}`;
const fld = (label, inner) => `<div class="fld"><span class="lab">${label}</span>${inner}</div>`;
const datePicks = (cur = today()) => { const opts = [[today(),'Heute'],[addDays(today(),-1),'Gestern'],[addDays(today(),-2),'Vorgestern']]; if (!opts.some(o => o[0] === cur)) opts.push([cur, fDate(cur)]); return fld('Datum', picks('date', opts, cur)); };
function setField(name, v) {
  document.querySelectorAll(`.picks[data-group="${name}"] .pk`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
  const inp = document.getElementById('f-' + name); if (!inp) return;
  inp.value = v;
  const out = document.getElementById('o-' + name);
  if (out) { const dec = Number(inp.dataset.dec || 0), unit = inp.dataset.unit; out.innerHTML = `${fmt(num(v), dec)}${unit ? ` <small>${unit}</small>` : ''}`; }
  inp.dispatchEvent(new Event('input', {bubbles:true}));
}
function stepField(name, d) {
  const inp = document.getElementById('f-' + name); if (!inp) return;
  const dec = Number(inp.dataset.dec || 0), min = Number(inp.dataset.min || 0);
  setField(name, Math.max(min, rnd(num(inp.value) + Number(d), dec)));
}

/* ---------- sheets ---------- */
let sheetCtx = null;
function sheet(title, body, {onSubmit, onDelete, submit = 'Speichern', after, mod} = {}) {
  sheetCtx = {onSubmit, onDelete};
  $('#sheet-root').innerHTML = `<div class="overlay" data-act="sheet-close"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}" style="${mod ? `--accent:var(--${mod})` : ''}">
    <div class="sheet-h"><h3>${esc(title)}</h3><button class="iconbtn" data-act="sheet-close" aria-label="Schließen">×</button></div>
    <form id="sheet-form" novalidate>${body}<div class="foot">${onDelete ? '<button type="button" class="btn danger" data-act="sheet-del">Löschen</button>' : ''}${submit ? `<button class="btn acc" type="submit">${submit}</button>` : ''}</div></form>
  </div></div>`;
  const form = $('#sheet-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const res = await sheetCtx?.onSubmit?.(Object.fromEntries(new FormData(form)), form);
    if (res !== false) closeSheet();
  });
  after?.(form);
}
function closeSheet() { $('#sheet-root').innerHTML = ''; sheetCtx = null; }
const inp = (name, label, val = '', o = {}) => `<label>${label}<input name="${name}" id="f-${name}" value="${esc(val)}" ${o.type ? `type="${o.type}"` : ''} ${o.dec ? 'inputmode="decimal"' : ''} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} autocomplete="off"></label>`;
const vals = (o, keys) => keys.reduce((r,k) => (r[k] = num(o[k]), r), {});

function shSettings() {
  const TW = window.TW || {};
  sheet('Einstellungen', `
    <p class="muted small" style="margin:0">Angemeldet als ${esc(TW.email?.() || '')}. Deine Daten liegen privat in deiner eigenen Datenbank.</p>
    <div class="fld"><span class="lab">Tagesüberblick um 10 Uhr</span><p class="small muted" style="margin:0" id="push-state">${esc(TW.pushState?.() || '')}</p>
      <button type="button" class="btn ghost" data-act="push-on">Mitteilungen aktivieren</button></div>
    <div class="fld"><span class="lab">Essen</span><button type="button" class="btn ghost" data-act="foods">Lebensmittel und Nährwerte</button></div>
    <div class="fld"><span class="lab">Daten</span>
      <button type="button" class="btn ghost" data-act="import">Daten importieren (JSON)</button>
      ${downloads ? '<button type="button" class="btn ghost" data-act="backup">Backup herunterladen (JSON)</button>' : ''}</div>
    <button type="button" class="btn danger" data-act="logout">Abmelden</button>
    <p class="muted small" style="margin:0;text-align:center">Tagwerk Version ${window.TAGWERK_VERSION || '?'}</p>`, {submit:'Fertig', onSubmit: () => {}});
}
async function backup() {
  const data = {exportiert: new Date().toISOString(), einstellungen:S.settings, wochenplan:S.plan, einkauf:S.shop, kraft:S.lifts, laeufe:S.runs, haushalt:S.chores, lebensmittel:S.foods, gerichte:S.dishes, kochplan:S.meals, vorrat:S.pantry, rezepte:S.recipes, fahrten:S.trips, tanken:S.fuel};
  try { await downloads.save({filename:`tagwerk-backup-${today()}.json`, data: JSON.stringify(data, null, 2)}); } catch (e) { if (e?.code !== 'declined' && e?.code !== 'cancelled') toast('Backup wurde nicht gespeichert.'); }
}
function shPlan() {
  sheet('Wochenplan', `${inp('rot', 'Lauf-Rotation in km (mit Komma trennen)', rotation().join(', '), {ph:'5, 8, 10'})}` + ORDER.map(k => { const p = S.plan[k] || {}; return `<div class="grid2" style="grid-template-columns:110px 1fr;align-items:end">
    <label>${WDN[k]}<select name="${k}_type" id="f-${k}_type"><option value="">frei</option>${Object.entries(PLAN_TYPES).map(([v,l]) => `<option value="${v}" ${p.type === v ? 'selected':''}>${l}</option>`).join('')}</select></label>
    <label>Beschreibung<input name="${k}_text" id="f-${k}_text" value="${esc(p.text || '')}" autocomplete="off"></label></div>`; }).join(''),
  {mod:'train', onSubmit: f => { if (!needDb()) return false; const plan = {...S.plan}; ORDER.forEach(k => plan[k] = {type: f[k+'_type'] || '', text: (f[k+'_text'] || '').trim()}); const rot = String(f.rot || '').split(/[;\s,]+/).map(num).filter(x => x > 0); plan.rotation = rot.length ? rot : DEF_ROT; save(one('plan').set(plan)); }});
}

/* lifts */
const liftTitles = () => { const t = Object.keys(S.plan.templates || {}); S.lifts.forEach(l => { if (l.title && !t.includes(l.title)) t.push(l.title); }); return t; };
/* Doppelte Progression: im Wiederholungsbereich +1 Wdh., am oberen Ende +Gewicht und zurück an den Anfang */
const nextTarget = e => {
  const min = e.min || 8, max = e.max || 12, step = e.step || 2.5;
  return (e.reps || 0) >= max ? {...e, reps: min, kg: rnd((e.kg || 0) + step, 2), up: 'kg'} : {...e, reps: Math.max(min, (e.reps || min) + 1), up: 'reps'};
};
const exMeta = e => ({name: e.name, sets: e.sets, reps: e.reps, kg: e.kg, ...(e.min ? {min: e.min} : {}), ...(e.max ? {max: e.max} : {}), ...(e.step ? {step: e.step} : {}), ...(arr(e.log).length ? {log: e.log} : {})});
function liftRows(title) {
  const tpl = arr(S.plan.templates?.[title]);
  const lifts = [...S.lifts].sort(byDateDesc), last = lifts.find(l => l.title === title);
  // Alle Übungen der Vorlage, plus Zusatzübungen der letzten Einheit dieses Plans
  const names = [...tpl.map(e => e.name), ...arr(last?.ex).map(e => e.name).filter(n => !tpl.some(t => t.name === n))];
  return names.map(name => {
    const t = tpl.find(x => x.name === name) || {};
    const prevL = lifts.find(l => arr(l.ex).some(e => e.name === name && (e.kg > 0 || e.reps > 0)));
    const e = prevL && prevL.ex.find(x => x.name === name);
    if (!e) return {...t, name};
    const base = {...e, min: e.min ?? t.min, max: e.max ?? t.max, step: e.step ?? t.step, hint: t.hint};
    delete base.log;
    if (!(e.kg > 0) && t.kg > 0) return {...t};
    return {...nextTarget(base), prev: {sets: e.sets, reps: e.reps, kg: e.kg}};
  });
}
let liftDraft = null;
function shLift(l, preset) {
  const wd = WD[new Date().getDay()], p = S.plan[wd];
  const titles = liftTitles();
  const title = l?.title ?? preset?.title ?? (p?.type === 'kraft' && p.text ? p.text : titles[0] || 'Krafttraining');
  const date = l?.date ?? preset?.date ?? today();
  liftDraft = {l, title, date, rows: preset?.rows || (l ? arr(l.ex).map(e => ({...e})) : liftRows(title))};
  const rows = liftDraft.rows;
  sheet(l ? 'Krafteinheit bearbeiten' : 'Krafteinheit', `
    ${datePicks(date)}
    ${titles.length ? fld('Einheit', `<div class="picks">${titles.map(t => `<button type="button" class="pk" data-act="lift-title" data-v="${esc(t)}" aria-pressed="${t === title}">${esc(t.replace(/ · .*/, ''))}<small>${esc((t.split(' · ')[1] || ''))}</small></button>`).join('')}</div>`) : ''}
    <input type="hidden" name="title" value="${esc(title)}">
    ${rows.length && !l ? `<p class="muted small" style="margin:0">Das ist dein Ziel für heute: eine Wiederholung mehr als letztes Mal, am oberen Ende mehr Gewicht. Schaffst du weniger, trag einfach ein, was du geschafft hast.</p>` : ''}
    <div class="stack" style="gap:8px">${rows.map((e, i) => `<div class="exc"><div class="hd"><span>${esc(e.name)}${e.up ? ` <span class="pill acc">${e.up === 'kg' ? '+' + fmt(e.step || 2.5, 1) + ' kg' : '+1 Wdh.'}</span>` : ''}</span><button type="button" class="x" data-act="ex-del" data-v="${i}" aria-label="${esc(e.name)} entfernen">×</button></div>
      ${e.hint || e.prev || e.min ? `<div class="muted small" style="margin-top:-6px">${[e.min && e.max ? `Bereich ${e.min} bis ${e.max} Wdh.` : '', e.hint || '', e.prev ? `zuletzt ${e.prev.sets}×${e.prev.reps} mit ${fmt(e.prev.kg, 1)} kg` : ''].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
      <div class="mini">${miniStep(`ex${i}_sets`, 'Sätze', e.sets ?? 3, 1)}${miniStep(`ex${i}_reps`, 'Wdh.', e.reps ?? 10, 1)}${miniStep(`ex${i}_kg`, 'kg', e.kg ?? 0, e.step || 2.5, 1)}</div></div>`).join('')}</div>
    <details class="more"><summary>Übung hinzufügen</summary><div class="addbar"><input id="ex-new" placeholder="z. B. Butterfly" autocomplete="off"><button type="button" class="btn acc" data-act="ex-add">Hinzufügen</button></div></details>`,
  {mod:'train', onSubmit: (f) => {
    const ex = liftDraft.rows.map((e, i) => exMeta({...e, sets: num(f[`ex${i}_sets`]), reps: num(f[`ex${i}_reps`]), kg: num(f[`ex${i}_kg`])})).filter(e => e.name);
    if (!ex.length) { toast('Füge mindestens eine Übung hinzu.'); return false; }
    const data = {date: f.date || today(), title: f.title, ex};
    l ? updItem('lifts', l.id, data) : addItem('lifts', data);
  }, onDelete: l && (() => delItem('lifts', l.id))});
}
function liftSnapshot() {
  const f = Object.fromEntries(new FormData($('#sheet-form')));
  return {date: f.date, rows: liftDraft.rows.map((e, i) => ({...e, sets: num(f[`ex${i}_sets`]), reps: num(f[`ex${i}_reps`]), kg: num(f[`ex${i}_kg`])}))};
}

/* runs */
function shRun(r) {
  const rot = rotation(), km = r ? r.km : rot[nextRunIdx()];
  const mins = r ? Math.round(r.sec / 60) : Math.round(km * avgPace() / 60);
  const opts = [...new Set([...rot, ...(r ? [r.km] : [])])].map(k => [String(k), `${fmt(k, k % 1 ? 1 : 0)} km`]);
  sheet(r ? 'Lauf bearbeiten' : 'Lauf eintragen', `
    ${datePicks(r?.date || today())}
    ${fld('Distanz', picks('kmp', opts, String(km), {hidden:false}))}
    ${stepper('km', 'Distanz genau', km, {steps:[0.1, 1], dec:1, unit:'km'})}
    ${stepper('min', 'Dauer', mins, {steps:[1, 5], unit:'min'})}
    <p class="muted small" style="margin:0;font-weight:700" id="pace-out"></p>
    <details class="more"><summary>Notiz hinzufügen</summary>${picks('note', [['','keine'],['locker','locker'],['zügig','zügig'],['Intervalle','Intervalle'],['Wettkampf','Wettkampf']], r?.note || '')}</details>`,
  {mod:'train', onSubmit: f => {
    const km = num(f.km), sec = Math.round(num(f.min) * 60);
    if (km <= 0 || sec <= 0) { toast('Bitte Distanz und Dauer einstellen.'); return false; }
    const data = {date: f.date || today(), km, sec, note: f.note || ''};
    r ? updItem('runs', r.id, data) : addItem('runs', data);
  }, onDelete: r && (() => delItem('runs', r.id)),
  after: form => { const upd = () => { const k = num(form.km.value), s = num(form.min.value) * 60; $('#pace-out').textContent = k > 0 && s > 0 ? `Pace ${pace(s, k)} min/km` : ''; }; form.addEventListener('input', upd); upd(); }});
}

/* chores */
function shChore(c) {
  const kind = c?.kind || S.sub.home, w = kind === 'waesche';
  sheet(c ? 'Bearbeiten' : (w ? 'Waschgang' : 'Putzaufgabe'), `
    ${inp('name', w ? 'Wäsche' : 'Aufgabe', c?.name || '', {ph: w ? 'z. B. Handtücher' : 'z. B. Bad putzen'})}
    ${inp('info', w ? 'Temperatur oder Programm' : 'Raum', c?.info || '', {ph: w ? 'z. B. 60 °C' : 'z. B. Bad'})}
    ${w ? fld('Art', picks('mode', [['rot','In der Rotation'],['bedarf','Bei Bedarf']], c ? (c.every > 0 ? 'rot' : 'bedarf') : 'rot')) : stepper('every', 'Rhythmus', c ? c.every : 7, {steps:[1, 7], unit:'Tage', min:1})}`,
  {mod:'home', onSubmit: f => {
    if (!f.name.trim()) { toast('Bitte einen Namen eintragen.'); return false; }
    let data = {kind, name: f.name.trim(), info: f.info.trim()};
    if (w) { const rot = laundry(); data.every = f.mode === 'bedarf' ? 0 : (rot.every || 7); if (!c && data.every) data.order = Math.max(0, ...rot.rot.map(x => x.order || 0)) + 1; }
    else data.every = Math.max(1, Math.round(num(f.every)));
    c ? updItem('chores', c.id, data) : addItem('chores', {...data, last:'', next: today(), hist: []});
  }, onDelete: c && (() => delItem('chores', c.id))});
}

/* food */
function addFoodEntry(food, g) {
  ensureToday();
  const k = g / 100;
  S.day.entries = [...S.day.entries, {name: food.name, g, kcal: Math.round(food.kcal*k), p: rnd(food.p*k, 1), c: rnd(food.c*k, 1), f: rnd(food.f*k, 1)}];
  touchDay();
  updItem('foods', food.id, {uses: (food.uses || 0) + 1});
}
function shFoodAdd() {
  const foods = [...S.foods].sort((a,b) => (b.uses||0) - (a.uses||0) || a.name.localeCompare(b.name, 'de'));
  const f0 = foods[0];
  sheet('Essen eintragen', `
    ${foods.length ? `${fld('Lebensmittel', picks('food', foods.map(f => [f.id, esc(f.name)]), f0.id))}
    ${fld('Menge', picks('mult', [['0.5','½ Portion'],['1','1 Portion'],['1.5','1½'],['2','2 Portionen']], '1', {hidden:false}))}
    ${stepper('g', 'Gramm', f0.portion || 100, {steps:[10, 50], unit:'g'})}` : '<p class="note" style="margin:0">Lege zuerst unter „Nährwerte“ Lebensmittel an.</p>'}
    <p class="muted small num" style="margin:0;font-weight:700" id="calc-out"></p>
    <details class="more"><summary>Ohne Lebensmittel, nur Kalorien</summary><div class="stack" style="gap:8px">${stepper('mk', 'kcal', 0, {steps:[10, 100]})}${stepper('mp', 'Eiweiß', 0, {steps:[1, 10], unit:'g'})}<input type="hidden" name="manual" id="f-manual" value=""><button type="button" class="btn ghost" data-act="food-manual">Nur diese Werte eintragen</button></div></details>`,
  {mod:'food', submit: foods.length ? 'Eintragen' : '', onSubmit: f => {
    const food = S.foods.find(x => x.id === f.food); if (!food) return false;
    addFoodEntry(food, num(f.g) || food.portion || 100);
  }, after: form => {
    const upd = () => { const food = S.foods.find(x => x.id === form.food?.value); if (!food) return; const g = num(form.g.value), k = g/100; $('#calc-out').textContent = `${fmt(g)} g = ${fmt(food.kcal*k)} kcal · E ${fmt(food.p*k,1)} · K ${fmt(food.c*k,1)} · F ${fmt(food.f*k,1)}`; };
    form.addEventListener('input', e => {
      if (e.target.name === 'food') { const food = S.foods.find(x => x.id === e.target.value); if (food) setField('g', rnd((food.portion || 100) * 1, 0)); setField('mult', '1'); }
      upd();
    }); upd(); }});
}
function shGoals() {
  const s = S.settings;
  sheet('Tagesziele', `${stepper('kcal','Kalorien',s.kcal,{steps:[50],unit:'kcal'})}${stepper('water','Wasser',s.water,{steps:[250],unit:'ml'})}${stepper('p','Eiweiß',s.p,{steps:[5],unit:'g'})}${stepper('c','Kohlenhydrate',s.c,{steps:[10],unit:'g'})}${stepper('f','Fett',s.f,{steps:[5],unit:'g'})}`,
  {mod:'food', onSubmit: f => { if (!needDb()) return false; save(one('settings').set(vals(f, ['kcal','p','c','f','water']))); }});
}
function shFood(x) {
  sheet(x ? 'Lebensmittel bearbeiten' : 'Lebensmittel anlegen', `
    ${inp('name','Name',x?.name || '',{ph:'z. B. Magerquark'})}
    <p class="muted small" style="margin:0">Werte pro 100 g, wie auf der Verpackung.</p>
    ${stepper('kcal','kcal',x?.kcal ?? 100,{steps:[1,10]})}${stepper('p','Eiweiß',x?.p ?? 0,{steps:[0.5,5],dec:1,unit:'g'})}${stepper('c','Kohlenhydrate',x?.c ?? 0,{steps:[0.5,5],dec:1,unit:'g'})}${stepper('f','Fett',x?.f ?? 0,{steps:[0.5,5],dec:1,unit:'g'})}${stepper('portion','Portion',x?.portion ?? 100,{steps:[10,50],unit:'g'})}`,
  {mod:'food', onSubmit: f => {
    if (!f.name.trim()) { toast('Bitte einen Namen eintragen.'); return false; }
    const data = {name: f.name.trim(), ...vals(f, ['kcal','p','c','f','portion'])};
    x ? updItem('foods', x.id, data) : addItem('foods', data);
  }, onDelete: x && (() => delItem('foods', x.id))});
}
function eatDish(date) {
  const r = dishFor(date); if (!r) return;
  if (S.dayDate !== date) { subDay(date); setTimeout(() => eatDish2(r.dish), 600); return; }
  eatDish2(r.dish);
}
function eatDish2(d) {
  if (S.day.entries.some(e => e.dish === d.id)) return toast('Schon eingetragen.');
  S.day.entries = [...S.day.entries, {name: d.name, dish: d.id, kcal: d.kcal, p: d.p, c: d.c, f: d.f}]; touchDay();
  toast(`${d.name} eingetragen.`);
}
function shDishPick(date) {
  const L = dishList(), cur = dishFor(date);
  sheet(fDateLong(date), `<div class="list">${L.map(d => `<div class="item"><button type="button" class="main" data-act="dish-set" data-v="${date}" data-id="${d.id}"><div class="t">${esc(d.name)}${d.id === cur?.dish.id ? ' <span class="pill acc">geplant</span>' : ''}</div><div class="s num">${fmt(d.kcal)} kcal · ${fmt(d.p)} g Eiweiß</div></button></div>`).join('')}</div>
    ${cur?.fixed ? '<button type="button" class="btn ghost" data-act="dish-reset" data-v="'+date+'">Zurück zur normalen Rotation</button>' : ''}
    ${date === today() ? '<button type="button" class="btn ghost" data-act="dish-eat" data-v="'+date+'">Heutiges Gericht als gegessen eintragen</button>' : ''}`, {mod:'food', submit:''});
}
function shDish(d) {
  sheet(d ? 'Gericht bearbeiten' : 'Gericht hinzufügen', `
    ${inp('name','Name',d?.name || '',{ph:'z. B. Hähnchen-Reis-Bowl'})}
    <p class="muted small" style="margin:0">Nährwerte pro Portion.</p>
    ${stepper('kcal','kcal',d?.kcal ?? 800,{steps:[10,50]})}${stepper('p','Eiweiß',d?.p ?? 50,{steps:[1,5],unit:'g'})}${stepper('c','Kohlenhydrate',d?.c ?? 80,{steps:[1,5],unit:'g'})}${stepper('f','Fett',d?.f ?? 25,{steps:[1,5],unit:'g'})}
    <label>Zutaten (eine pro Zeile)<textarea name="ingr" id="f-ingr">${esc(arr(d?.ingr).join('\n'))}</textarea></label>`,
  {mod:'food', onSubmit: f => {
    if (!f.name.trim()) { toast('Bitte einen Namen eintragen.'); return false; }
    const data = {name: f.name.trim(), ...vals(f, ['kcal','p','c','f']), ingr: f.ingr.split('\n').map(x => x.trim()).filter(Boolean)};
    if (d) updItem('dishes', d.id, data); else addItem('dishes', {...data, order: Math.max(0, ...S.dishes.map(x => x.order || 0)) + 1});
  }, onDelete: d && (() => delItem('dishes', d.id))});
}

/* Baukasten: Mahlzeit aus Lebensmitteln zusammenstellen */
const foodById = id => S.foods.find(f => f.id === id);
const partsTotals = parts => parts.reduce((t, {food, g}) => { const f = foodById(food); if (!f) return t; const k = g / 100; t.kcal += f.kcal*k; t.p += f.p*k; t.c += f.c*k; t.f += f.f*k; return t; }, {kcal:0, p:0, c:0, f:0});
const roundT = t => ({kcal: Math.round(t.kcal), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f)});
const numDe = n => String(rnd(n, 1)).replace('.', ',');
const ingrOf = parts => parts.map(({food, g}) => { const f = foodById(food); if (!f) return null; return `${f.name} ${f.unit ? `${numDe(g / (f.portion || 100))} ${f.unit}` : `${fmt(g)} g`}`; }).filter(Boolean);
const comboParts = f => S.foods.map(fd => ({food: fd.id, g: Math.round(num(f['c_' + fd.id]) * (fd.portion || 100))})).filter(p => p.g > 0);
function autoName(parts) {
  const ns = [...parts].sort((a, b) => partsTotals([b]).kcal - partsTotals([a]).kcal).map(p => foodById(p.food)?.name).filter(Boolean);
  return ns.length > 1 ? `${ns[0]} mit ${ns.slice(1, 3).join(' und ')}` : ns[0] || 'Eigene Mahlzeit';
}
const cstep = (id, v) => `<div class="cstep"><button type="button" data-act="step" data-t="c_${id}" data-d="-0.5" aria-label="weniger">−</button><output id="o-c_${id}">${fmt(v, 1)}</output><button type="button" data-act="step" data-t="c_${id}" data-d="0.5" aria-label="mehr">+</button><input type="hidden" name="c_${id}" id="f-c_${id}" value="${v}" data-dec="1" data-min="0"></div>`;
function shCombo(dish, asDish = false) {
  const foods = [...S.foods].sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name, 'de'));
  if (!foods.length) return toast('Lege zuerst unter „Nährwerte“ Lebensmittel an.');
  const cur = {}; arr(dish?.parts).forEach(p => { const f = foodById(p.food); if (f) cur[p.food] = rnd(p.g / (f.portion || 100), 1); });
  const mode = dish ? 'edit' : asDish ? 'new' : 'eat';
  sheet(dish ? 'Gericht bearbeiten' : asDish ? 'Neues Gericht' : 'Mahlzeit zusammenstellen', `
    ${inp('name', 'Name (optional)', dish?.name || '', {ph: 'wird sonst automatisch vergeben'})}
    <p class="muted small" style="margin:0">Mit + und − stellst du die Portionen ein (je ½ Portion).</p>
    <div class="card" style="padding:2px 14px"><div class="list">${foods.map(f => `<div class="item"><div class="main"><div class="t">${esc(f.name)}</div><div class="s">1 Portion = ${esc(f.plabel || fmt(f.portion || 100) + ' g')} · ${fmt(f.kcal * (f.portion || 100) / 100)} kcal</div></div>${cstep(f.id, cur[f.id] || 0)}</div>`).join('')}</div></div>
    <div class="note num" id="combo-sum" style="margin:0;font-weight:600"></div>
    ${mode === 'eat' ? '<button type="button" class="btn ghost" data-act="combo-save">Stattdessen als Gericht in die Rotation</button>' : ''}`,
  {mod: 'food', submit: mode === 'eat' ? 'Gegessen eintragen' : mode === 'new' ? 'In die Rotation' : 'Speichern', onSubmit: f => {
    const parts = comboParts(f); if (!parts.length) { toast('Wähle mindestens ein Lebensmittel.'); return false; }
    const name = f.name.trim() || autoName(parts), t = roundT(partsTotals(parts));
    if (mode === 'edit') return void updItem('dishes', dish.id, {name, parts, ingr: ingrOf(parts), ...t});
    if (mode === 'new') { addItem('dishes', {name, parts, ingr: ingrOf(parts), ...t, order: Math.max(0, ...S.dishes.map(x => x.order || 0)) + 1}); return void toast(`${name} ist jetzt in der Rotation.`); }
    ensureToday(); S.day.entries = [...S.day.entries, {name, ...t}]; touchDay(); toast(`${name} eingetragen.`);
  }, onDelete: dish && (() => delItem('dishes', dish.id)),
  after: form => { const upd = () => { const parts = comboParts(Object.fromEntries(new FormData(form))), t = partsTotals(parts); $('#combo-sum').textContent = parts.length ? `Summe: ${fmt(t.kcal)} kcal · E ${fmt(t.p)} g · K ${fmt(t.c)} g · F ${fmt(t.f)} g` : 'Noch nichts ausgewählt.'; }; form.addEventListener('input', upd); upd(); }});
}
function cookIdeas() {
  const have = new Set(S.pantry.map(i => i.name.toLowerCase()));
  return dishList().filter(d => arr(d.parts).length).map(d => {
    const names = d.parts.map(p => foodById(p.food)?.name).filter(Boolean), miss = names.filter(n => !have.has(n.toLowerCase()));
    return {d, miss, ok: names.length - miss.length};
  }).filter(x => x.ok > 0).sort((a, b) => a.miss.length - b.miss.length || b.ok - a.ok).slice(0, 6);
}

/* car */
function shTrip(t) {
  const odo = t?.startKm ?? lastOdo(), dist = t ? t.endKm - t.startKm : 10;
  sheet(t ? 'Fahrt bearbeiten' : 'Fahrt eintragen', `
    ${datePicks(t?.date || today())}
    ${odo > 0 ? stepper('startKm', 'km-Stand Start', odo, {steps:[1, 100]}) : inp('startKm', 'Aktueller Kilometerstand (einmalig)', '', {dec:1, ph:'z. B. 52.000'})}
    ${fld('Strecke', picks('distp', [['5','5 km'],['10','10 km'],['20','20 km'],['30','30 km'],['50','50 km'],['100','100 km']], String(dist), {hidden:false}))}
    ${stepper('dist', 'Strecke genau', dist, {steps:[1, 10], unit:'km'})}
    ${fld('Zweck', picks('note', PURPOSES.map(p => [p, p]), t?.note || 'Arbeit'))}
    <p class="muted small num" style="margin:0;font-weight:700" id="dist-out"></p>`,
  {mod:'car', onSubmit: f => {
    const s = num(String(f.startKm).replace(/\./g, '')), d = num(f.dist);
    if (!(s > 0) || !(d > 0)) { toast('Bitte Kilometerstand und Strecke einstellen.'); return false; }
    const data = {date: f.date || today(), startKm: s, endKm: s + d, note: f.note, from: t?.from || '', to: t?.to || ''};
    t ? updItem('trips', t.id, data) : addItem('trips', data);
  }, onDelete: t && (() => delItem('trips', t.id)),
  after: form => { const upd = () => { const s = num(String(form.startKm.value).replace(/\./g, '')), d = num(form.dist.value); $('#dist-out').textContent = s > 0 && d > 0 ? `Neuer km-Stand: ${fmt(s + d)}` : ''; }; form.addEventListener('input', upd); upd(); }});
}
function shFuel(x) {
  const last = [...S.fuel].sort((a,b) => (b.odo||0) - (a.odo||0))[0];
  const odo = x?.odo ?? lastOdo(), liters = x?.liters ?? last?.liters ?? 40, ppl = x ? (x.liters ? x.cost / x.liters : 1.75) : (last?.liters ? last.cost / last.liters : 1.75);
  sheet(x ? 'Tankstopp bearbeiten' : 'Tankstopp', `
    ${datePicks(x?.date || today())}
    ${odo > 0 ? stepper('odo', 'Kilometerstand', odo, {steps:[10, 100]}) : inp('odo', 'Kilometerstand', '', {dec:1, ph:'z. B. 52.400'})}
    ${stepper('liters', 'Liter', rnd(liters, 1), {steps:[0.5, 5], dec:1, unit:'l'})}
    ${stepper('ppl', 'Preis pro Liter', rnd(ppl, 3), {steps:[0.01, 0.1], dec:3, unit:'€'})}
    ${fld('Füllung', picks('full', [['1','Vollgetankt'],['0','Teilfüllung']], x?.full === false ? '0' : '1'))}
    <p class="muted small num" style="margin:0;font-weight:700" id="ppl-out"></p>`,
  {mod:'car', onSubmit: f => {
    const l = num(f.liters), data = {date: f.date || today(), odo: num(String(f.odo).replace(/\./g, '')), liters: l, cost: rnd(l * num(f.ppl), 2), full: f.full !== '0'};
    if (!data.odo || !data.liters) { toast('Bitte Kilometerstand und Liter einstellen.'); return false; }
    x ? updItem('fuel', x.id, data) : addItem('fuel', data);
  }, onDelete: x && (() => delItem('fuel', x.id)),
  after: form => { const upd = () => { const l = num(form.liters.value), p = num(form.ppl.value); $('#ppl-out').textContent = `Betrag: ${fmt(l * p, 2)} €`; }; form.addEventListener('input', upd); upd(); }});
}

/* ---------- Sofort-Aktionen mit Rückgängig ---------- */
function quickRun(km) {
  km = km || rotation()[nextRunIdx()];
  const sec = Math.round(km * avgPace()), id = addNow('runs', {date: today(), km, sec, note: ''}); if (!id) return;
  toast(`Lauf ${fmt(km, km % 1 ? 1 : 0)} km in ${fDur(sec)} eingetragen`, {undo: () => delItem('runs', id), edit: () => shRun(find('runs', id))});
}
function liftDefaultTitle() { const p = S.plan[WD[new Date().getDay()]]; return p?.type === 'kraft' && p.text ? p.text : liftTitles()[0] || 'Krafttraining'; }
function quickLift(title) {
  title = title || liftDefaultTitle(); const rows = liftRows(title), ex = rows.map(exMeta);
  if (!ex.length) return shLift();
  const id = addNow('lifts', {date: today(), title, ex}); if (!id) return;
  const ups = rows.filter(e => e.up === 'kg').length;
  toast(`${title.replace(/ · .*/, '')} eingetragen${ups ? `, ${ups}× mehr Gewicht` : ''}`, {undo: () => delItem('lifts', id), edit: () => shLift(find('lifts', id))});
}
function eatToday() {
  const r = dishFor(today()); if (!r) return;
  ensureToday(); const d = r.dish;
  if (S.day.entries.some(e => e.dish === d.id)) return toast('Schon eingetragen.');
  S.day.entries = [...S.day.entries, {name: d.name, dish: d.id, kcal: d.kcal, p: d.p, c: d.c, f: d.f}]; touchDay();
  toast(`${d.name} eingetragen`, {undo: () => { S.day.entries = S.day.entries.filter(e => e.dish !== d.id); touchDay(); }});
}
function choreDone(c) {
  const t = today(); if (c.last === t && c.kind !== 'waesche') return toast('Heute schon erledigt.');
  const prev = {last: c.last || '', doneAt: c.doneAt || 0, hist: arr(c.hist)};
  updItem('chores', c.id, {last: t, doneAt: Date.now(), hist: [t, ...arr(c.hist)].slice(0, 12)});
  toast(c.kind === 'waesche' ? `${c.name}: gewaschen` : c.every > 0 ? `${c.name}: erledigt, wieder in ${c.every} Tagen` : `${c.name}: erledigt`, {undo: () => updItem('chores', c.id, prev)});
}
function quickFood(f) {
  addFoodEntry(f, f.portion || 100);
  toast(`${f.name} eingetragen (${f.plabel || fmt(f.portion || 100) + ' g'})`, {undo: () => { const i = S.day.entries.map(e => e.name).lastIndexOf(f.name); if (i >= 0) { S.day.entries = S.day.entries.filter((_, k) => k !== i); touchDay(); } }});
}

/* ---------- Foto-Erkennung ---------- */
const PHOTO_ERR = {
  credit: 'Foto-Erkennung pausiert: API-Guthaben oder Monatslimit erreicht. Trag die Mahlzeit über den Baukasten ein.',
  permission: 'Der API-Schlüssel darf dieses Modell nicht nutzen.',
  missing: 'Die Foto-Erkennung ist noch nicht eingerichtet.',
  key: 'Der API-Schlüssel stimmt nicht. Bitte in GitHub prüfen.',
  rate: 'Gerade zu viele Anfragen. Versuch es in einer Minute noch einmal.',
  offline: 'Keine Verbindung. Foto-Erkennung braucht Internet.',
  refusal: 'Dieses Foto konnte nicht ausgewertet werden.',
  empty: 'Auf dem Foto wurde kein Essen erkannt.'
};
let photoRun = 0;
function pickPhoto() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('capture', 'environment');
  inp.onchange = () => { const f = inp.files?.[0]; if (f) analyzeFood(f); };
  inp.click();
}
function shrinkImage(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82).split(',')[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild')); };
    img.src = url;
  });
}
const photoTotals = items => items.reduce((t, i) => { t.kcal += i.kcal; t.p += i.p; t.c += i.c; t.f += i.f; return t; }, {kcal:0, p:0, c:0, f:0});
function photoItem(i, g = i.g) {
  const fd = i.food && foodById(i.food);
  if (fd) { const k = g / 100; return {...i, g, kcal: fd.kcal*k, p: fd.p*k, c: fd.c*k, f: fd.f*k}; }
  const k = i.g0 > 0 ? g / i.g0 : 1;
  return {...i, g, kcal: i.kcal0*k, p: i.p0*k, c: i.c0*k, f: i.f0*k};
}
async function analyzeFood(file, text = '') {
  const run = ++photoRun;
  sheet(text ? 'Wird geschätzt' : 'Foto wird ausgewertet', `<div class="thinking" style="padding:18px 0"><span class="dots"><i></i><i></i><i></i></span>${text ? `Claude schätzt „${esc(text)}“ …` : 'Claude schaut sich dein Essen an …'}</div><p class="muted small" style="margin:0">Das dauert meist ${text ? '5 bis 15' : '10 bis 30'} Sekunden.</p>`, {mod:'food', submit:''});
  let image = '';
  if (!text) { try { image = await shrinkImage(file); } catch { closeSheet(); return toast('Das Foto konnte nicht gelesen werden.'); } }
  const foods = S.foods.map(f => ({id: f.id, name: f.name, portion: f.portion || 100, plabel: f.plabel || ''}));
  const res = await (window.TW?.analyzePhoto?.(text ? {text, foods} : {image, mediaType: 'image/jpeg', foods}) ?? Promise.resolve({error: 'missing'}));
  if (run !== photoRun || !$('#sheet-root').innerHTML) return;
  closeSheet();
  if (res.error) {
    const msg = PHOTO_ERR[res.error] || (text ? 'Die Schätzung hat nicht geklappt.' : 'Die Foto-Erkennung hat nicht geklappt.');
    if (!res.detail) return toast(msg);
    return sheet(text ? 'Essen schätzen' : 'Foto-Erkennung', `<p style="margin:0">${esc(msg)}</p><div class="fld"><span class="lab">Antwort von Claude</span><p class="note num" style="margin:0;user-select:text;-webkit-user-select:text">${esc(res.detail)}</p></div><p class="muted small" style="margin:0">Du kannst den Text markieren und kopieren.</p>`, {mod:'food', submit:'OK', onSubmit: () => {}});
  }
  const r = res.result || {};
  const items = arr(r.items).filter(i => num(i.grams) > 0).map(i => {
    const food = foodById(String(i.food_id || '')) ? String(i.food_id) : '';
    return photoItem({food, name: food ? foodById(food).name : String(i.name || 'Unbekannt'), g: Math.round(num(i.grams)), g0: num(i.grams), kcal0: num(i.kcal), p0: num(i.p), c0: num(i.c), f0: num(i.f)});
  });
  if (!items.length) return toast(r.note ? String(r.note) : text ? 'Daraus konnte kein Essen erkannt werden.' : PHOTO_ERR.empty);
  ensureToday();
  const t = roundT(photoTotals(items)), pid = 'ph' + Date.now();
  const cleanItems = items.map(i => ({...i, kcal: rnd(i.kcal, 1), p: rnd(i.p, 1), c: rnd(i.c, 1), f: rnd(i.f, 1)}));
  const entry = {name: String(r.title || (text ? text : 'Mahlzeit (Foto)')), ...t, photo: !text, typed: !!text, pid, conf: String(r.confidence || ''), note: String(r.note || ''), items: cleanItems};
  S.day.entries = [...S.day.entries, entry]; touchDay();
  if (text && db) save(col('aimeals').doc(slug(text)).set({text, title: entry.name, ...t, items: cleanItems, note: entry.note, uses: 1, ts: Date.now()}));
  toast(`${text ? '✍️' : '📷'} ${entry.name}: ${fmt(t.kcal)} kcal, ${fmt(t.p)} g Eiweiß`, {undo: () => { S.day.entries = S.day.entries.filter(e => e.pid !== pid); touchDay(); }, edit: () => shPhotoEdit(pid)});
}
function reAddEstimate(m) {
  ensureToday(); const pid = 'ph' + Date.now();
  S.day.entries = [...S.day.entries, {name: m.title, kcal: m.kcal, p: m.p, c: m.c, f: m.f, typed: true, pid, note: m.note || '', items: arr(m.items)}]; touchDay();
  updItem('aimeals', m.id, {uses: (m.uses || 0) + 1, ts: Date.now()});
  toast(`✍️ ${m.title}: ${fmt(m.kcal)} kcal`, {undo: () => { S.day.entries = S.day.entries.filter(e => e.pid !== pid); touchDay(); }, edit: () => shPhotoEdit(pid)});
}
const typeBox = () => `<form class="addbar" data-form="typed"><input id="typed-in" placeholder="z. B. 2 Leberkäswecken" autocomplete="off" enterkeyhint="send" maxlength="300"><button class="btn acc" style="--accent:var(--food)" type="submit">Schätzen</button></form>`;
const recentEstimates = (n = 8) => { const m = [...S.aimeals].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, n); return m.length ? `<div class="qchips">${m.map(x => `<button type="button" class="qc" data-act="typed-again" data-id="${x.id}">${esc(x.title)}<small>${fmt(x.kcal)} kcal</small></button>`).join('')}</div>` : ''; };
function shPhotoEdit(pid) {
  const e = S.day.entries.find(x => x.pid === pid); if (!e) return;
  const items = arr(e.items);
  sheet(e.typed ? 'Eintrag anpassen' : 'Foto-Eintrag anpassen', `
    ${inp('name', 'Name', e.name)}
    ${e.note ? `<p class="note" style="margin:0">${esc(e.note)}</p>` : ''}
    ${items.map((i, k) => stepper(`pg${k}`, esc(i.name), Math.round(i.g), {steps:[10, 50], unit:'g'})).join('')}
    <div class="note num" id="photo-sum" style="margin:0;font-weight:600"></div>`,
  {mod:'food', onSubmit: f => {
    const nx = items.map((i, k) => photoItem(i, num(f[`pg${k}`]))).filter(i => i.g > 0);
    const t = roundT(photoTotals(nx));
    S.day.entries = S.day.entries.map(x => x.pid === pid ? {...x, name: f.name.trim() || x.name, ...t, items: nx.map(i => ({...i, kcal: rnd(i.kcal, 1), p: rnd(i.p, 1), c: rnd(i.c, 1), f: rnd(i.f, 1)}))} : x);
    touchDay(); toast('Foto-Eintrag angepasst');
  }, onDelete: () => { S.day.entries = S.day.entries.filter(x => x.pid !== pid); touchDay(); },
  after: form => { const upd = () => { const f = Object.fromEntries(new FormData(form)); const t = photoTotals(items.map((i, k) => photoItem(i, num(f[`pg${k}`])))); $('#photo-sum').textContent = `Summe: ${fmt(t.kcal)} kcal · E ${fmt(t.p)} g · K ${fmt(t.c)} g · F ${fmt(t.f)} g`; }; form.addEventListener('input', upd); upd(); }});
}

/* ---------- Plus-Knopf: Schnellmenü ---------- */
function shQuick() {
  const t = today(), df = dishFor(t), km = rotation()[nextRunIdx()], routes = lastOdo() ? topRoutes() : [];
  const ran = S.runs.some(r => r.date === t), lifted = S.lifts.some(l => l.date === t), ate = df && S.day.entries.some(e => e.dish === df.dish.id);
  const tile = (act, v, icon, mod, label, sub, done) => `<button type="button" class="qtile ${done ? 'is-done' : ''}" data-act="${act}" ${v != null ? `data-v="${esc(v)}"` : ''}><span class="ti" style="--m:var(--${mod})">${ICON[icon]}</span><b>${label}</b><small>${done ? 'heute erledigt' : sub}</small></button>`;
  const sug = shopSuggest(S.shop.map(i => i.name)).slice(0, 12);
  sheet('Schnell eintragen', `
    <div class="qgrid">
      ${tile('q-water', 500, 'drop', 'home', '+500 ml', `Wasser · ${fmt(S.day.water)} ml`)}
      ${tile('q-run', km, 'train', 'train', `${fmt(km)} km`, 'Lauf erledigt', ran)}
      ${tile('q-lift', null, 'train', 'train', 'Kraft', 'Plan geschafft', lifted)}
      ${df ? tile('q-eat', null, 'food', 'food', 'Gegessen', esc(df.dish.name), ate) : ''}
      ${tile('q-trip', null, 'car', 'car', 'Fahrt', 'Strecke wählen')}
      ${tile('q-fuel', null, 'fuel', 'car', 'Tanken', 'Liter und Preis')}
      ${tile('photo', null, 'food', 'food', 'Foto', 'Essen erkennen')}
      ${tile('q-weight', null, 'scale', 'train', 'Gewicht', lastWeight() ? `zuletzt ${fmt(lastWeight().kg, 1)} kg` : 'eintragen')}
      ${tile('q-shop', null, 'shop', 'shop', 'Einkauf', `${S.shop.filter(i => !i.done).length} offen`)}
    </div>
    <div class="fld"><span class="lab">Essen beschreiben</span>${typeBox()}${recentEstimates(6)}</div>
    ${routes.length ? `<div class="fld"><span class="lab">Häufige Fahrten · 1 Tipp</span><div class="qchips">${routes.map((r, i) => `<button type="button" class="qc" data-act="route-quick" data-v="${i}">${esc(r.label)}<small>${fmt(r.dist)} km</small></button>`).join('')}</div></div>` : ''}
    <div class="fld"><span class="lab">Gegessen · 1 Portion</span>${quickFoods(17)}</div>
    <div class="fld"><span class="lab">Auf die Einkaufsliste</span><div class="qchips">${sug.map(n => `<button type="button" class="qc" data-act="shop-quick" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>`, {submit: ''});
}

/* ---------- Wischgesten ---------- */
let sw = null, swallowClick = false;
document.addEventListener('touchstart', e => {
  const it = e.target.closest('.item[data-sr], .item[data-sl]'); if (!it || e.touches.length > 1) return;
  sw = {it, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, on: false};
}, {passive: true});
document.addEventListener('touchmove', e => {
  if (!sw) return;
  const dx = e.touches[0].clientX - sw.x, dy = e.touches[0].clientY - sw.y;
  if (!sw.on) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; }
    if (Math.abs(dx) < 12) return;
    sw.on = true; const it = sw.it, bg = document.createElement('div');
    bg.className = 'swipe-bg'; bg.innerHTML = `<span>${esc(it.dataset.srl || 'Erledigt')}</span><span>${esc(it.dataset.sll || 'Löschen')}</span>`;
    bg.style.top = it.offsetTop + 'px'; bg.style.height = it.offsetHeight + 'px'; it.parentElement.insertBefore(bg, it); it.classList.add('swiping'); sw.bg = bg;
  }
  let d = dx; if (d > 0 && !sw.it.dataset.sr) d = 0; if (d < 0 && !sw.it.dataset.sl) d = 0;
  sw.dx = d; sw.it.style.transform = `translateX(${d}px)`;
  sw.bg.className = 'swipe-bg ' + (d > 0 ? 'r' : 'l') + (Math.abs(d) > 80 ? ' go' : '');
}, {passive: true});
document.addEventListener('touchend', () => {
  if (!sw) return; const s0 = sw; sw = null; if (!s0.on) return;
  swallowClick = true; setTimeout(() => { swallowClick = false; }, 350);
  const act = s0.dx > 80 ? s0.it.dataset.sr : s0.dx < -80 ? s0.it.dataset.sl : null;
  s0.it.style.transition = 'transform .2s'; s0.it.style.transform = '';
  setTimeout(() => { s0.bg?.remove(); s0.it.style.transition = ''; s0.it.classList.remove('swiping'); }, 200);
  if (act) ACT[act]?.(s0.it.dataset.v, s0.it);
});

/* ---------- actions ---------- */
const find = (n, id) => S[n].find(x => x.id === id);
async function addShop(name) {
  name = name.trim(); if (!name) return;
  if (S.shop.some(i => !i.done && i.name.toLowerCase() === name.toLowerCase())) return toast(`${name} steht schon auf der Liste.`);
  await addItem('shop', {name, done:false}); bumpShop(name);
}
async function addPantry(names) {
  const have = new Set(S.pantry.map(i => i.name.toLowerCase()));
  for (const name of names.map(x => x.trim()).filter(x => x && !have.has(x.toLowerCase()))) { have.add(name.toLowerCase()); await addItem('pantry', {name}); }
}
const ACT = {
  tab: v => { S.tab = v; store.set('tab', v); if (v !== 'food') ensureToday(); render(); scrollTo(0,0); },
  sub: v => { S.sub[S.tab] = v; store.set('sub', S.sub); if (S.tab === 'food' && v !== 'tag') ensureToday(); render(); },
  go: v => ACT.tab(v),
  settings: () => shSettings(),
  backup: () => backup(),
  'push-on': async () => { const r = await window.TW?.enablePush?.(); toast(r || 'Fertig'); const el = document.getElementById('push-state'); if (el) el.textContent = window.TW?.pushState?.() || ''; },
  import: () => window.TW?.importFile?.(),
  logout: () => window.TW?.logout?.(),
  'sheet-close': (v, el, ev) => { if (ev.target === el) closeSheet(); },
  'sheet-del': (v, el) => { if (!el.classList.contains('armed')) { el.classList.add('armed'); el.textContent = 'Wirklich löschen?'; return; } sheetCtx?.onDelete?.(); closeSheet(); },
  step: (v, el) => stepField(el.dataset.t, el.dataset.d),
  pick: (v, el) => { const t = el.dataset.t; setField(t, v);
    if (t === 'kmp') setField('km', v); if (t === 'distp') setField('dist', v);
    if (t === 'mult') { const food = S.foods.find(x => x.id === $('#f-food')?.value); if (food) setField('g', Math.round((food.portion || 100) * num(v))); } },
  'shop-quick': v => addShop(v),
  'auto-toggle': async () => { if (!needDb()) return; const next = {...S.autoshop, off: !S.autoshop.off}; S.autoshop = next; render(); await save(one('autoshop').set(next)); if (!next.off) scheduleSync(); },
  'shop-toggle': (v, el) => { const i = find('shop', el.dataset.id); if (i) updItem('shop', i.id, {done: !i.done, doneAt: Date.now()}); },
  'shop-del': (v, el) => delUndo('shop', el.dataset.id),
  'shop-clear': async () => { for (const i of S.shop.filter(i => i.done)) await delItem('shop', i.id); },
  'shop-to-pantry': async () => { const done = S.shop.filter(i => i.done); await addPantry(done.map(i => i.name)); for (const i of done) await delItem('shop', i.id); toast(`${done.length} Sachen im Vorrat`); },
  'plan-edit': () => shPlan(),
  'lift-new': () => shLift(), 'lift-edit': (v, el) => shLift(find('lifts', el.dataset.id)),
  'lift-title': v => { const snap = liftSnapshot(); shLift(liftDraft.l, {title: v, date: snap.date, rows: liftRows(v)}); },
  'ex-del': v => { const snap = liftSnapshot(); snap.rows.splice(Number(v), 1); shLift(liftDraft.l, {title: liftDraft.title, date: snap.date, rows: snap.rows}); },
  'ex-add': () => { const name = $('#ex-new').value.trim(); if (!name) return; const snap = liftSnapshot(); snap.rows.push({name, sets:3, reps:10, kg:0}); shLift(liftDraft.l, {title: liftDraft.title, date: snap.date, rows: snap.rows}); },
  'run-new': () => shRun(), 'run-edit': (v, el) => shRun(find('runs', el.dataset.id)),
  'chore-new': () => shChore(), 'chore-edit': (v, el) => shChore(find('chores', el.dataset.id)),
  'chore-done': (v, el) => { const c = find('chores', el.dataset.id); if (c) choreDone(c); },
  quick: () => shQuick(),
  photo: () => { closeSheet(); pickPhoto(); },
  'photo-edit': v => shPhotoEdit(v),
  'typed-again': (v, el) => { const m = find('aimeals', el.dataset.id); if (m) { closeSheet(); reAddEstimate(m); } },
  'q-water': () => { closeSheet(); ensureToday(); S.day.water = (S.day.water || 0) + 500; touchDay(); toast('+500 ml Wasser', {undo: () => { S.day.water = Math.max(0, S.day.water - 500); touchDay(); }}); },
  'q-run': v => { closeSheet(); quickRun(num(v)); }, 'q-lift': () => { closeSheet(); quickLift(); }, 'q-eat': () => { closeSheet(); eatToday(); },
  'q-trip': () => shTrip(), 'q-fuel': () => shFuel(),
  'run-del': (v, el) => delUndo('runs', el.dataset.id, 'Lauf'), 'lift-del': (v, el) => delUndo('lifts', el.dataset.id, 'Krafteinheit'),
  'trip-del': (v, el) => delUndo('trips', el.dataset.id, 'Fahrt'), 'fuel-del': (v, el) => delUndo('fuel', el.dataset.id, 'Tankstopp'),
  'review-done': v => { needDb() && save(one('weekreview').set({last: v})); toast('Woche abgeschlossen. Auf eine gute neue Woche!'); },
  'toast-undo': () => { const f = toastCtx?.undo; hideToast(); f?.(); },
  'toast-edit': () => { const f = toastCtx?.edit; hideToast(); f?.(); },
  'wo-start': v => woStart(v || liftDefaultTitle()),
  'wo-resume': () => { S.tab = 'train'; S.sub.train = 'kraft'; store.set('tab', 'train'); store.set('sub', S.sub); render(); scrollTo(0, 0); },
  'wo-set': () => { const w = S.workout; if (!w) return; const e = w.ex[w.cur], reps = Math.round(num($('#f-w_reps')?.value)), kg = rnd(num($('#f-w_kg')?.value), 2);
    if (!(reps > 0)) return toast('Bitte Wiederholungen einstellen.');
    e.log.push({reps, kg, t: Date.now()}); w.lastSetAt = Date.now(); S.wDraft = null;
    if (e.log.length >= e.sets) { const nx = w.ex.findIndex((x, i) => i > w.cur && x.log.length < x.sets); if (nx >= 0) { toast(`${e.name} fertig. Weiter mit ${w.ex[nx].name}`); w.cur = nx; } }
    woSave(); render(); },
  'wo-undo': v => { const w = S.workout; if (!w) return; const e = w.ex[w.cur], k = Number(v), x = e.log[k]; e.log.splice(k, 1); S.wDraft = null; woSave(); render();
    toast(`Satz ${k + 1} entfernt`, {undo: () => { e.log.splice(k, 0, x); S.wDraft = null; woSave(); render(); }}); },
  'wo-go': v => { if (!S.workout) return; S.workout.cur = Number(v); S.wDraft = null; woSave(); render(); scrollTo(0, 0); },
  'wo-finish': () => woFinish(),
  'wo-cancel': (v, el) => { if (!el.classList.contains('armed')) { el.classList.add('armed'); el.textContent = 'Wirklich verwerfen?'; return; } S.workout = null; S.wDraft = null; woSave(); clearInterval(woTick); render(); toast('Training verworfen'); },
  'ex-detail': v => shExercise(v),
  'ana-ex': v => { S.anaEx = v; store.set('anaEx', v); render(); },
  'weight-new': () => shWeight(),
  'q-weight': () => shWeight(),
  'q-shop': () => { closeSheet(); ACT.tab('shop'); },
  'run-quick': v => quickRun(num(v)), 'lift-quick': v => quickLift(v), 'eat-today': () => eatToday(),
  foods: () => shFoods(),
  'food-add': () => shFoodAdd(), goals: () => shGoals(),
  'food-quick': (v, el) => { const f = find('foods', el.dataset.id); if (f) quickFood(f); },
  'food-manual': () => { const k = num($('#f-mk').value), p = num($('#f-mp').value); if (!k) return toast('Stelle zuerst die Kalorien ein.'); ensureToday(); S.day.entries = [...S.day.entries, {name:'Sonstiges', kcal:k, p, c:0, f:0}]; touchDay(); closeSheet(); },
  water: v => { ensureToday(); S.day.water = Math.max(0, (S.day.water || 0) + Number(v)); touchDay(); },
  'entry-del': v => { const i = Number(v), e = S.day.entries[i]; if (!e) return; S.day.entries = S.day.entries.filter((_, k) => k !== i); touchDay(); toast(`${e.name} entfernt`, {undo: () => { S.day.entries = [...S.day.entries.slice(0, i), e, ...S.day.entries.slice(i)]; touchDay(); }}); },
  day: v => { const d = addDays(S.dayDate, Number(v)); if (d > today()) return; subDay(d); render(); },
  week: v => { S.weekStart = addDays(S.weekStart, Number(v)); render(); },
  'dish-pick': v => shDishPick(v),
  'dish-next': v => { const L = dishList(), cur = dishFor(v); if (!cur) return; const i = L.findIndex(d => d.id === cur.dish.id); const nx = L[(i + 1) % L.length]; needDb() && save(col('meals').doc(v).set({date: v, dish: nx.id})); },
  'dish-set': (v, el) => { needDb() && save(col('meals').doc(v).set({date: v, dish: el.dataset.id})); closeSheet(); },
  'dish-reset': v => { needDb() && save(col('meals').doc(v).delete()); closeSheet(); },
  'dish-eat': v => { closeSheet(); v === today() ? eatToday() : eatDish(v); },
  'dish-new': () => shCombo(), 'dish-edit': (v, el) => { const d = find('dishes', el.dataset.id); if (d) arr(d.parts).length ? shCombo(d) : shDish(d); },
  combo: () => shCombo(), 'combo-new': () => shCombo(null, true),
  'combo-save': () => { const f = Object.fromEntries(new FormData($('#sheet-form'))), parts = comboParts(f); if (!parts.length) return toast('Wähle mindestens ein Lebensmittel.');
    const name = f.name.trim() || autoName(parts); addItem('dishes', {name, parts, ingr: ingrOf(parts), ...roundT(partsTotals(parts)), order: Math.max(0, ...S.dishes.map(x => x.order || 0)) + 1}); closeSheet(); toast(`${name} ist jetzt in der Rotation.`); },
  'cook-today': (v, el) => { const t = today(); needDb() && save(col('meals').doc(t).set({date: t, dish: el.dataset.id})); toast('Steht heute im Kochplan. Die Tage danach rotieren ab dort weiter.'); },
  'week-shop': async () => {
    const days = [...Array(7)].map((_, i) => addDays(S.weekStart, i)).filter(d => d >= today());
    const pantry = S.pantry.map(p => p.name.toLowerCase());
    const items = [...new Set(days.flatMap(d => arr(dishFor(d)?.dish.ingr)))].filter(x => !pantry.includes(splitIngr(x).name.toLowerCase()));
    const have = new Set(S.shop.filter(i => !i.done).map(i => i.name.toLowerCase()));
    let n = 0; for (const name of items) if (!have.has(name.toLowerCase())) { await addItem('shop', {name, done:false}); n++; }
    toast(n ? `${n} Zutaten für ${days.length} Tage auf der Liste` : 'Alles steht schon auf der Liste');
  },
  'pantry-quick': v => addPantry([v]),
  'pantry-del': (v, el) => delUndo('pantry', el.dataset.id),
  'pantry-clear': (v, el) => { if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Wirklich alle löschen?'; return; } S.pantry.forEach(i => delItem('pantry', i.id)); },
  ropt: (v, el) => { S.rOpt[el.dataset.t] = v; render(); },
  'recipe-go': () => suggestRecipe(),
  'recipe-stop': () => rCtl?.abort(),
  'recipe-open': (v, el) => { const r = find('recipes', el.dataset.id); if (r) { S.recipe = r; render(); setTimeout(() => document.getElementById('recipe')?.scrollIntoView({behavior:'smooth'}), 80); } },
  'recipe-del': (v, el) => { if (S.recipe?.id === el.dataset.id) S.recipe = null; delItem('recipes', el.dataset.id); },
  'recipe-save': async () => { const r = S.recipe; if (!r) return; const {id, ts, ...data} = r; if (await addItem('recipes', data)) toast('Rezept gespeichert.'); },
  'recipe-rot': async () => { const r = S.recipe; if (!r) return; if (await addItem('dishes', {name: r.title, kcal: r.kcal, p: r.p, c: r.c, f: r.f, ingr: arr(r.ingredients).map(i => `${i.item} ${i.amount}`.trim()), order: Math.max(0, ...S.dishes.map(x => x.order || 0)) + 1})) toast('Gericht ist jetzt in der Kochplan-Rotation.'); },
  'recipe-shop': async () => { const r = S.recipe; if (!r) return; const have = new Set(S.shop.filter(i => !i.done).map(i => i.name.toLowerCase())); const items = arr(r.missing).filter(x => !have.has(String(x).toLowerCase())); for (const name of items) await addItem('shop', {name, done:false}); toast(items.length ? `${items.length} Zutaten auf der Einkaufsliste` : 'Steht schon alles auf der Liste'); },
  'recipe-used': () => { const r = S.recipe; if (!r) return; const u = new Set(arr(r.uses).map(x => String(x).toLowerCase())); const hit = S.pantry.filter(i => u.has(i.name.toLowerCase())); hit.forEach(i => delItem('pantry', i.id)); toast(hit.length ? `${hit.length} Sachen aus dem Vorrat entfernt` : 'Nichts Passendes im Vorrat gefunden'); },
  'recipe-eat': () => { const r = S.recipe; if (!r) return; ensureToday(); setTimeout(() => { S.day.entries = [...S.day.entries, {name: r.title, kcal: r.kcal, p: r.p, c: r.c, f: r.f}]; touchDay(); toast('Als gegessen eingetragen (1 Portion).'); }, S.dayDirty ? 0 : 300); },
  'lm-new': () => shFood(), 'lm-edit': (v, el) => shFood(find('foods', el.dataset.id)),
  'trip-new': () => shTrip(), 'trip-edit': (v, el) => shTrip(find('trips', el.dataset.id)),
  'route-quick': v => { const r = topRoutes()[Number(v)], s = lastOdo(); if (!r || !s) return; closeSheet(); const id = addNow('trips', {date: today(), startKm: s, endKm: s + r.dist, note: r.note, from: r.from, to: r.to}); if (id) toast(`${r.label}: ${fmt(r.dist)} km eingetragen`, {undo: () => delItem('trips', id), edit: () => shTrip(find('trips', id))}); },
  'fuel-new': () => shFuel(), 'fuel-edit': (v, el) => shFuel(find('fuel', el.dataset.id))
};
document.addEventListener('click', ev => {
  if (swallowClick) { ev.preventDefault(); ev.stopPropagation(); return; }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (el.dataset.act !== 'sheet-close') ev.preventDefault();
  fn(el.dataset.v, el, ev);
});
document.addEventListener('submit', ev => {
  const tf = ev.target.closest('[data-form="typed"]');
  if (tf) { ev.preventDefault(); const el = tf.querySelector('input'), text = el.value.trim(); if (!text) return;
    const known = S.aimeals.find(m => m.text.toLowerCase() === text.toLowerCase());
    el.value = ''; el.blur();
    if (known) { closeSheet(); return reAddEstimate(known); }
    analyzeFood(null, text); return; }
  const pf = ev.target.closest('[data-form="pantry"]');
  if (pf) { ev.preventDefault(); const el = pf.querySelector('input'); const names = el.value.split(/[,;\n]/); el.value = ''; addPantry(names); return; }
  const f = ev.target.closest('[data-form="shop"]'); if (!f) return;
  ev.preventDefault();
  const el = f.querySelector('input'), name = el.value; el.value = ''; addShop(name);
});
document.addEventListener('input', e => { const id = e.target?.id; if (S.workout && S.wDraft && (id === 'f-w_reps' || id === 'f-w_kg')) S.wDraft[id === 'f-w_reps' ? 'reps' : 'kg'] = num(e.target.value); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetCtx) closeSheet(); });

boot();
})();
