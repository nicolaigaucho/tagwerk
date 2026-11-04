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
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>'
};
const TABS = [
  {id:'heute', label:'Heute', c:'--today'}, {id:'shop', label:'Einkauf', c:'--shop'}, {id:'train', label:'Training', c:'--train'},
  {id:'home', label:'Haushalt', c:'--home'}, {id:'food', label:'Essen', c:'--food'}, {id:'car', label:'Auto', c:'--car'}
];
const TITLES = {heute:'Heute', shop:'Einkaufsliste', train:'Training', home:'Haushalt', food:'Essen', car:'Fahrtenbuch'};
const SUBS = {
  train:[['plan','Wochenplan'],['kraft','Kraft'],['lauf','Läufe']],
  home:[['putz','Putzplan'],['waesche','Wäsche']],
  food:[['tag','Ernährung'],['koch','Kochplan'],['vorrat','Vorrat'],['lm','Nährwerte']],
  car:[['fahrten','Fahrten'],['tanken','Tanken']]
};
const DEF_SET = {kcal:2600, p:140, c:320, f:80, water:3000};
const DEF_ROT = [5, 8, 10];
const PLAN_TYPES = {kraft:'Kraft', lauf:'Lauf', ruhe:'Ruhe', sonst:'Sonstiges'};
const DEF_SHOP = ['Milch','Eier','Brot','Haferflocken','Bananen','Äpfel','Skyr','Magerquark','Hähnchenbrust','Reis','Nudeln','Tomaten','Gurke','Paprika','Käse','Joghurt','Kaffee','Toilettenpapier','Spülmittel','Müllbeutel'];
const DEF_PANTRY = ['Eier','Kartoffeln','Reis','Nudeln','Haferflocken','Zwiebeln','Knoblauch','Tomaten','Paprika','Spinat','Brokkoli','Hähnchenbrust','Hackfleisch','Thunfisch','Feta','Käse','Magerquark','Skyr','Linsen','Kidneybohnen','Mais','Kokosmilch','Tofu','Lachs'];
const PURPOSES = ['Arbeit','Einkauf','Sport','Freizeit','Besuch','Urlaub','Sonstiges'];

/* ---------- state ---------- */
const S = {
  tab: store.get('tab', 'heute'),
  sub: Object.assign({train:'plan', home:'putz', food:'tag', car:'fahrten'}, store.get('sub', {})),
  shop:[], lifts:[], runs:[], chores:[], foods:[], trips:[], fuel:[], pantry:[], recipes:[], dishes:[], meals:{},
  settings:{...DEF_SET}, plan:{}, shopstats:{counts:{}}, autoshop:{}, gotAutoshop:false,
  recipe:null, rState:'idle', rErr:'', rOpt:{meal:'Abendessen', time:'30', servings:'1', wish:''},
  day:{entries:[], water:0}, dayDate: today(), dayDirty:false,
  weekStart: mondayOf(today()),
  status:'loading', got:new Set()
};
if (!TABS.some(t => t.id === S.tab)) S.tab = 'heute';
if (!SUBS.food.some(([k]) => k === S.sub.food)) S.sub.food = 'tag';

let db = null, base = null, downloads = null, sampleFn = null, rCtl = null, unsubDay = null;
const col = n => db.doc(`${base}/${n}`).collection('items');
const one = n => db.doc(`${base}/${n}`);

/* ---------- toast ---------- */
let toastT;
function toast(msg) {
  let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role','status'); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2600);
}
const errMsg = e => e?.code === 'quota_exceeded' ? 'Speicher ist voll. Lösche alte Einträge und versuche es erneut.'
  : e?.code === 'revoked' ? 'Zugriff wurde beendet. Lade die Seite neu.'
  : 'Speichern hat nicht geklappt. Prüfe die Verbindung und versuche es erneut.';
async function save(p) { try { await p; return true; } catch (e) { toast(errMsg(e)); return false; } }
function needDb() { if (!db) { toast('Nicht angemeldet.'); return false; } return true; }
const addItem = (n, data) => needDb() && save(col(n).doc().set({...data, ts: Date.now()}));
const updItem = (n, id, data) => needDb() && save(col(n).doc(id).update(data));
const delItem = (n, id) => needDb() && save(col(n).doc(id).delete());
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
  ['shop','lifts','runs','chores','foods','trips','fuel','pantry','recipes','dishes'].forEach(n =>
    col(n).onSnapshot(s => { S[n] = s.docs.map(x => ({id:x.id, ...x.data()})); got(n); }, onErr));
  col('meals').where('date', '>=', addDays(today(), -60)).onSnapshot(s => {
    const m = {}; s.docs.forEach(x => m[x.id] = x.data()); S.meals = m; got('meals'); }, onErr);
  one('settings').onSnapshot(s => { S.settings = {...DEF_SET, ...(s.exists ? s.data() : {})}; got('settings'); }, onErr);
  one('plan').onSnapshot(s => { S.plan = s.exists ? {...s.data()} : {}; got('plan'); }, onErr);
  one('autoshop').onSnapshot(s => { S.autoshop = s.exists ? {...s.data()} : {}; S.gotAutoshop = true; scheduleSync(); render(); }, onErr);
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
  const names = [...new Set([...Object.keys(c).sort((a,b) => c[b] - c[a]), ...DEF_SHOP])];
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
      const {name, amt} = splitIngr(x); if (!name || pantry.some(pn => name.toLowerCase().startsWith(pn))) return;
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
    ${statusNote()}${sub}${views[S.tab]()}`;
  if (keep) { const el = document.getElementById(keep.id); if (el) { el.value = keep.v; el.focus(); try { el.setSelectionRange(keep.s, keep.s); } catch {} } }
}
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
  return f.length ? `<div class="qchips">${f.map(x => `<button class="qc" data-act="food-quick" data-id="${x.id}">${esc(x.name)}<small>${fmt(x.portion || 100)} g</small></button>`).join('')}</div>` : '';
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
    ? `<div class="item" style="padding-top:0"><div class="main"><div class="t" style="font-size:18px">${esc(planTitle(wd, p, rp))}</div><div class="s">${p.type === 'lauf' ? 'Rotation '+rotation().join(' · ')+' km' : PLAN_TYPES[p.type] || ''}</div></div>${trained ? '<span class="pill solid">erledigt</span>' : (p.type === 'ruhe' ? '<span class="pill">Ruhetag</span>' : `<button class="btn sm acc" style="--accent:var(--train)" data-act="${p.type === 'lauf' ? 'run-new' : 'lift-new'}">Eintragen</button>`)}</div>`
    : `<p class="muted small" style="margin:0">Für heute ist nichts geplant.</p>`;
  const homeBody = due.length
    ? `<div class="list">${due.slice(0,6).map(c => `<div class="item"><div class="main"><div class="t">${esc(c.name)}</div><div class="s">${c.kind === 'waesche' ? 'Wäsche' : 'Putzen'}${c.info ? ' · '+esc(c.info) : ''}</div></div>${duePill(dueIn(c))}<button class="check" data-act="chore-done" data-id="${c.id}" aria-label="${esc(c.name)} erledigt">${ICON.check}</button></div>`).join('')}</div>`
    : `<p class="muted small" style="margin:0">Heute ist nichts fällig.</p>`;
  const foodBody = `<div class="stack" style="gap:12px">
      ${df ? `<div class="item" style="padding:0;border:0"><div class="main"><div class="s">Gericht des Tages</div><div class="t" style="font-size:17px">${esc(df.dish.name)}</div><div class="s">${fmt(df.dish.kcal)} kcal · ${fmt(df.dish.p)} g Eiweiß</div></div>${eatenDish ? '<span class="pill solid" style="--accent:var(--food)">gegessen</span>' : `<button class="btn sm acc" style="--accent:var(--food)" data-act="dish-eat" data-v="${t}">Gegessen</button>`}</div>` : ''}
      <div class="rings">${ring('kcal', tot.kcal, st.kcal, '--food')}${ring('ml Wasser', S.day.water, st.water, '--home')}</div>
      ${meter('Eiweiß', tot.p, st.p, 'g')}
      ${waterBtns()}
    </div>`;
  const shopBody = open.length
    ? `<div class="list">${open.slice(0,4).map(i => `<div class="item"><button class="check" data-act="shop-toggle" data-id="${i.id}" aria-label="${esc(i.name)} abhaken">${ICON.check}</button><div class="main"><div class="t">${esc(i.name)}</div></div></div>`).join('')}</div>${open.length > 4 ? `<p class="muted small" style="margin:8px 0 0">und ${open.length-4} weitere</p>` : ''}`
    : `<p class="muted small" style="margin:0">Die Einkaufsliste ist leer.</p>`;
  return `<div class="stack">
    ${card('train', 'Training · ' + WDN[wd], trainBody, 'train')}
    ${card('home', `Haushalt · ${due.length} fällig`, homeBody, 'home')}
    ${card('food', 'Essen', foodBody, 'food')}
    ${card('shop', `Einkauf · ${open.length} offen`, shopBody, 'shop')}
    ${card('car', 'Auto · ' + new Date().toLocaleDateString('de-DE',{month:'long'}), `<div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><div class="k">Gefahren</div><div class="v">${fmt(kmMonth)} <small>km</small></div></div><div class="stat"><div class="k">Tankkosten</div><div class="v">${fmt(costMonth,2)} <small>€</small></div></div></div><div class="row-actions" style="margin-top:10px"><button class="btn sm ghost" data-act="trip-new">Fahrt eintragen</button><button class="btn sm ghost" data-act="fuel-new">Tanken</button></div>`, 'car')}
  </div>`;
}

/* --- Einkauf --- */
function vShop() {
  const open = S.shop.filter(i => !i.done).sort((a,b) => (a.ts||0) - (b.ts||0));
  const done = S.shop.filter(i => i.done).sort((a,b) => (b.doneAt||0) - (a.doneAt||0));
  const sug = shopSuggest(S.shop.map(i => i.name)).slice(0, 16);
  const row = i => `<div class="item ${i.done ? 'done':''}"><button class="check ${i.done ? 'on':''}" data-act="shop-toggle" data-id="${i.id}" aria-label="${esc(i.name)} ${i.done ? 'wieder offen' : 'abhaken'}">${ICON.check}</button><button class="main" data-act="shop-toggle" data-id="${i.id}"><div class="t">${esc(i.name)}</div>${i.auto ? `<div class="s">Kochplan · für ${arr(i.days).map(d => esc(parseISO(d).toLocaleDateString('de-DE', {weekday:'short'}))).join(' und ')}</div>` : ''}</button><button class="x" data-act="shop-del" data-id="${i.id}" aria-label="${esc(i.name)} löschen">×</button></div>`;
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
  if (s === 'plan') {
    const twd = WD[new Date().getDay()], rp = runPlan();
    return `<div class="stack">
      <section class="card week"><div class="list">${ORDER.map(k => { const p = S.plan[k] || {}, r = rp[k]; return `<div class="item ${k === twd ? 'today':''}"><span class="daylabel">${k}</span><div class="main"><div class="t">${esc(planTitle(k, p, rp))}</div><div class="s">${WDN[k]}</div></div>${r?.done ? '<span class="pill solid">gelaufen</span>' : p.type ? `<span class="pill ${p.type !== 'ruhe' ? 'acc':''}">${PLAN_TYPES[p.type]}</span>` : ''}</div>`; }).join('')}</div></section>
      <p class="muted small" style="margin:0">Lauf-Rotation: ${rotation().map(k => fmt(k)+' km').join(' → ')}. Die nächste Distanz richtet sich nach deinem letzten Lauf.</p>
      <div class="row-actions"><button class="btn acc" style="flex:1" data-act="lift-new">Kraft eintragen</button><button class="btn acc" style="flex:1" data-act="run-new">Lauf eintragen</button></div>
      <button class="btn ghost wide" data-act="plan-edit">Wochenplan bearbeiten</button>
    </div>`;
  }
  if (s === 'kraft') {
    const lifts = [...S.lifts].sort(byDateDesc), best = {};
    [...S.lifts].sort((a,b) => (a.date||'').localeCompare(b.date||'')).forEach(l => arr(l.ex).forEach(e => {
      const k = (e.name || '').trim().toLowerCase(); if (!k) return;
      const b = best[k] || (best[k] = {name:e.name, max:0, last:0, date:''}); b.max = Math.max(b.max, e.kg || 0); b.last = e.kg || 0; b.date = l.date;
    }));
    const bl = Object.values(best).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10);
    const weekN = S.lifts.filter(l => mondayOf(l.date) === mondayOf(today())).length;
    return `<div class="stack">
      <button class="btn wide acc" data-act="lift-new">Krafteinheit eintragen</button>
      <div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><div class="k">Diese Woche</div><div class="v">${weekN} <small>von 3</small></div></div><div class="stat"><div class="k">Gesamt</div><div class="v">${lifts.length} <small>Einheiten</small></div></div></div>
      ${lifts.length ? `
      <section class="card"><div class="card-h"><h2>Übungen · zuletzt / bestes Gewicht</h2></div><div class="list">${bl.map(b => `<div class="item"><div class="main"><div class="t">${esc(b.name)}</div><div class="s">${fDate(b.date)}</div></div><div class="r num">${fmt(b.last,1)} <span class="muted">/ ${fmt(b.max,1)} kg</span></div></div>`).join('')}</div></section>
      <section class="card"><div class="card-h"><h2>Verlauf</h2></div><div class="list">${lifts.map(l => `<div class="item"><button class="main" data-act="lift-edit" data-id="${l.id}"><div class="t">${esc(l.title || 'Krafttraining')}</div><div class="s">${fDate(l.date)} · ${arr(l.ex).length} Übungen · ${fmt(sum(arr(l.ex), e => (e.sets||0)*(e.reps||0)*(e.kg||0)))} kg Volumen</div></button><span class="muted">›</span></div>`).join('')}</div></section>`
      : empty('Noch keine Einheit', 'Deine Übungen für Oberkörper A, B und C sind vorbereitet. Du stellst nur noch Gewicht und Wiederholungen per Plus und Minus ein.')}
    </div>`;
  }
  const runs = [...S.runs].sort(byDateDesc), t = today(), wk = mondayOf(t);
  const wKm = sum(runs.filter(r => mondayOf(r.date) === wk), r => r.km);
  const mRuns = runs.filter(r => inMonth(r.date)), mKm = sum(mRuns, r => r.km);
  const yKm = sum(runs.filter(r => (r.date||'').slice(0,4) === t.slice(0,4)), r => r.km);
  const mPace = mKm > 0 ? pace(sum(mRuns, r => r.sec), mKm) : '0:00';
  const weeks = []; for (let i = 7; i >= 0; i--) { const ws = addDays(wk, -7*i); weeks.push({ws, km: sum(runs.filter(r => mondayOf(r.date) === ws), r => r.km)}); }
  return `<div class="stack">
    <button class="btn wide acc" data-act="run-new">Lauf eintragen · nächster: ${fmt(rotation()[nextRunIdx()])} km</button>
    <div class="stats">
      <div class="stat"><div class="k">Diese Woche</div><div class="v">${fmt(wKm,1)} <small>km</small></div></div>
      <div class="stat"><div class="k">Dieser Monat</div><div class="v">${fmt(mKm,1)} <small>km</small></div></div>
      <div class="stat"><div class="k">Dieses Jahr</div><div class="v">${fmt(yKm,0)} <small>km</small></div></div>
      <div class="stat"><div class="k">Ø Pace Monat</div><div class="v">${mPace} <small>/km</small></div></div>
    </div>
    <section class="card"><div class="card-h"><h2>Kilometer pro Woche</h2></div>${weekChart(weeks)}</section>
    ${runs.length ? `<section class="card"><div class="card-h"><h2>Alle Läufe</h2></div><div class="list">${runs.map(r => `<div class="item"><button class="main" data-act="run-edit" data-id="${r.id}"><div class="t num">${fmt(r.km,1)} km · ${fDur(r.sec)}</div><div class="s">${fDate(r.date)}${r.note ? ' · '+esc(r.note) : ''}</div></button><div class="r num small">${pace(r.sec, r.km)}<span class="muted"> /km</span></div></div>`).join('')}</div></section>`
    : empty('Noch kein Lauf', 'Tippe auf „Lauf eintragen“. Distanz und Zeit stellst du per Buttons ein, die Pace rechnet die App.')}
  </div>`;
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
    ${list.length ? `<section class="card"><div class="list">${list.map(c => { const d = dueIn(c); return `<div class="item"><button class="main" data-act="chore-edit" data-id="${c.id}"><div class="t">${esc(c.name)}</div><div class="s">${c.info ? esc(c.info)+' · ' : ''}alle ${c.every} Tage · ${c.last ? 'zuletzt '+fDate(c.last) : 'erstmals '+fDate(c.next || today())}</div></button>${duePill(d)}<button class="check ${d > 0 ? 'on' : ''}" data-act="chore-done" data-id="${c.id}" aria-label="${esc(c.name)} heute erledigt">${ICON.check}</button></div>`; }).join('')}</div></section>`
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
      ${df ? `<section class="card"><div class="item" style="padding:0;border:0"><div class="main"><div class="s">Gericht des Tages</div><div class="t" style="font-size:17px">${esc(df.dish.name)}</div><div class="s">${fmt(df.dish.kcal)} kcal · E ${fmt(df.dish.p)} · K ${fmt(df.dish.c)} · F ${fmt(df.dish.f)}</div></div>${eatenDish ? '<span class="pill solid">gegessen</span>' : `<button class="btn sm acc" data-act="dish-eat" data-v="${S.dayDate}">Gegessen</button>`}</div></section>` : ''}
      <section class="card"><div class="card-h"><h2>Schnell eintragen · 1 Portion</h2><button class="link" data-act="food-add">Menge wählen</button></div>${quickFoods(14) || '<p class="muted small" style="margin:0">Lege unter „Nährwerte“ Lebensmittel an.</p>'}</section>
      <section class="card stack" style="gap:11px"><div class="card-h" style="margin:0"><h2>Wasser</h2><span class="muted small num">${fmt(S.day.water)} / ${fmt(st.water)} ml</span></div>${waterBtns()}</section>
      ${S.day.entries.length ? `<section class="card"><div class="card-h"><h2>Gegessen</h2></div><div class="list">${S.day.entries.map((e,i) => `<div class="item"><div class="main"><div class="t">${esc(e.name)}${e.g ? ` <span class="muted num small">${fmt(e.g)} g</span>` : ''}</div><div class="s num">${fmt(e.kcal)} kcal · E ${fmt(e.p)} · K ${fmt(e.c)} · F ${fmt(e.f)}</div></div><button class="x" data-act="entry-del" data-v="${i}" aria-label="${esc(e.name)} entfernen">×</button></div>`).join('')}</div></section>` : ''}
    </div>`;
  }
  if (s === 'koch') return vMeals();
  if (s === 'vorrat') return vPantry();
  const foods = [...S.foods].sort((a,b) => a.name.localeCompare(b.name, 'de'));
  return `<div class="stack">
    <button class="btn wide acc" data-act="lm-new">Lebensmittel anlegen</button>
    ${foods.length ? `<section class="card"><div class="card-h"><h2>Werte pro 100 g</h2></div><div class="list">${foods.map(f => `<div class="item"><button class="main" data-act="lm-edit" data-id="${f.id}"><div class="t">${esc(f.name)}</div><div class="s num">${fmt(f.kcal)} kcal · E ${fmt(f.p,1)} · K ${fmt(f.c,1)} · F ${fmt(f.f,1)}${f.portion ? ` · Portion ${fmt(f.portion)} g` : ''}</div></button><span class="muted">›</span></div>`).join('')}</div></section>`
    : empty('Deine Lebensmittel', 'Lege an, was du oft isst. Danach trägst du es mit einem Tipp ein.')}
  </div>`;
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
    <section class="card"><div class="card-h"><h2>Gerichte in der Rotation · ${L.length}</h2><button class="link" data-act="dish-new">Hinzufügen</button></div><div class="list">${L.map((d, i) => `<div class="item"><span class="num-badge">${i+1}</span><button class="main" data-act="dish-edit" data-id="${d.id}"><div class="t">${esc(d.name)}</div><div class="s num">${fmt(d.kcal)} kcal · E ${fmt(d.p)} · K ${fmt(d.c)} · F ${fmt(d.f)}</div></button><span class="muted">›</span></div>`).join('')}</div></section>
  </div>`;
}

/* --- Vorrat & Rezept --- */
function vPantry() {
  const items = [...S.pantry].sort((a,b) => a.name.localeCompare(b.name, 'de')), o = S.rOpt;
  const have = new Set(items.map(i => i.name.toLowerCase()));
  const sug = [...new Set([...DEF_PANTRY, ...Object.keys(S.shopstats.counts || {})])].filter(n => !have.has(n.toLowerCase())).slice(0, 18);
  const pk = (key, opts) => `<div class="picks">${opts.map(([v,l]) => `<button class="pk" data-act="ropt" data-t="${key}" data-v="${v}" aria-pressed="${String(o[key]) === v}">${l}</button>`).join('')}</div>`;
  return `<div class="stack">
    <section class="card"><div class="card-h"><h2>Was ist noch da?</h2></div><div class="qchips">${sug.map(n => `<button class="qc" data-act="pantry-quick" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <details class="more" style="margin-top:12px"><summary>Etwas anderes eintippen</summary><form class="addbar" data-form="pantry"><input id="pantry-in" placeholder="z. B. Halloumi" autocomplete="off" enterkeyhint="done"><button class="btn acc" type="submit">Hinzufügen</button></form></details></section>
    ${items.length ? `<section class="card"><div class="card-h"><h2>Zuhause vorrätig · ${items.length}</h2><button class="link" data-act="pantry-clear">Alle löschen</button></div><div class="chips">${items.map(i => `<span class="chip"><span>${esc(i.name)}</span><button class="x" data-act="pantry-del" data-id="${i.id}" aria-label="${esc(i.name)} entfernen">×</button></span>`).join('')}</div></section>` : ''}
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
      ${trips.length ? `<section class="card"><div class="list">${trips.map(t => `<div class="item"><button class="main" data-act="trip-edit" data-id="${t.id}"><div class="t">${esc(t.note || [t.from, t.to].filter(Boolean).join(' → ') || 'Fahrt')}</div><div class="s">${fDate(t.date)} · <span class="num">${fmt(t.startKm)} bis ${fmt(t.endKm)}</span></div></button><div class="r num">${fmt(t.endKm - t.startKm)} <span class="muted small">km</span></div></div>`).join('')}</div></section>`
      : empty('Noch keine Fahrt', 'Strecke und Zweck stellst du per Buttons ein. Häufige Fahrten erscheinen danach oben als 1-Tipp-Buttons.')}</div>`;
  }
  const fuel = [...S.fuel].sort((a,b) => (b.odo||0) - (a.odo||0));
  return `<div class="stack"><button class="btn wide acc" data-act="fuel-new">Tankstopp eintragen</button>${stats}
    ${fuel.length ? `<section class="card"><div class="list">${fuel.map(f => `<div class="item"><button class="main" data-act="fuel-edit" data-id="${f.id}"><div class="t num">${fmt(f.liters,2)} l · ${fmt(f.cost,2)} €</div><div class="s">${fDate(f.date)} · ${fmt(f.odo)} km · ${f.liters ? fmt(f.cost/f.liters,3) : '0'} €/l${f.full === false ? ' · Teilfüllung' : ''}</div></button><div class="r num small">${cons[f.id] ? fmt(cons[f.id],1)+'<span class="muted"> l/100</span>' : ''}</div></div>`).join('')}</div></section>`
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
    <div class="fld"><span class="lab">Daten</span>
      <button type="button" class="btn ghost" data-act="import">Daten importieren (JSON)</button>
      ${downloads ? '<button type="button" class="btn ghost" data-act="backup">Backup herunterladen (JSON)</button>' : ''}</div>
    <button type="button" class="btn danger" data-act="logout">Abmelden</button>`, {submit:'Fertig', onSubmit: () => {}});
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
function liftRows(title) {
  const last = [...S.lifts].sort(byDateDesc).find(l => l.title === title);
  if (last) return arr(last.ex).map(e => ({...e}));
  return arr(S.plan.templates?.[title]).map(e => ({...e}));
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
    ${rows.length ? `<p class="muted small" style="margin:0">Vorbelegt mit deiner letzten Einheit. Nur anpassen, was sich geändert hat.</p>` : ''}
    <div class="stack" style="gap:8px">${rows.map((e, i) => `<div class="exc"><div class="hd"><span>${esc(e.name)}</span><button type="button" class="x" data-act="ex-del" data-v="${i}" aria-label="${esc(e.name)} entfernen">×</button></div>
      <div class="mini">${miniStep(`ex${i}_sets`, 'Sätze', e.sets ?? 3, 1)}${miniStep(`ex${i}_reps`, 'Wdh.', e.reps ?? 10, 1)}${miniStep(`ex${i}_kg`, 'kg', e.kg ?? 0, 2.5, 1)}</div></div>`).join('')}</div>
    <details class="more"><summary>Übung hinzufügen</summary><div class="addbar"><input id="ex-new" placeholder="z. B. Butterfly" autocomplete="off"><button type="button" class="btn acc" data-act="ex-add">Hinzufügen</button></div></details>`,
  {mod:'train', onSubmit: (f) => {
    const ex = liftDraft.rows.map((e, i) => ({name: e.name, sets: num(f[`ex${i}_sets`]), reps: num(f[`ex${i}_reps`]), kg: num(f[`ex${i}_kg`])})).filter(e => e.name);
    if (!ex.length) { toast('Füge mindestens eine Übung hinzu.'); return false; }
    const data = {date: f.date || today(), title: f.title, ex};
    l ? updItem('lifts', l.id, data) : addItem('lifts', data);
  }, onDelete: l && (() => delItem('lifts', l.id))});
}
function liftSnapshot() {
  const f = Object.fromEntries(new FormData($('#sheet-form')));
  return {date: f.date, rows: liftDraft.rows.map((e, i) => ({name: e.name, sets: num(f[`ex${i}_sets`]), reps: num(f[`ex${i}_reps`]), kg: num(f[`ex${i}_kg`])}))};
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
  'shop-del': (v, el) => delItem('shop', el.dataset.id),
  'shop-clear': async () => { for (const i of S.shop.filter(i => i.done)) await delItem('shop', i.id); },
  'shop-to-pantry': async () => { const done = S.shop.filter(i => i.done); await addPantry(done.map(i => i.name)); for (const i of done) await delItem('shop', i.id); toast(`${done.length} Sachen im Vorrat`); },
  'plan-edit': () => shPlan(),
  'lift-new': () => shLift(), 'lift-edit': (v, el) => shLift(find('lifts', el.dataset.id)),
  'lift-title': v => { const snap = liftSnapshot(); shLift(liftDraft.l, {title: v, date: snap.date, rows: liftRows(v)}); },
  'ex-del': v => { const snap = liftSnapshot(); snap.rows.splice(Number(v), 1); shLift(liftDraft.l, {title: liftDraft.title, date: snap.date, rows: snap.rows}); },
  'ex-add': () => { const name = $('#ex-new').value.trim(); if (!name) return; const snap = liftSnapshot(); snap.rows.push({name, sets:3, reps:10, kg:0}); shLift(liftDraft.l, {title: liftDraft.title, date: snap.date, rows: snap.rows}); },
  'run-new': () => shRun(), 'run-edit': (v, el) => shRun(find('runs', el.dataset.id)),
  'chore-new': () => shChore(), 'chore-edit': (v, el) => shChore(find('chores', el.dataset.id)),
  'chore-done': (v, el) => { const c = find('chores', el.dataset.id); if (!c) return; const t = today(); if (c.last === t && c.kind !== 'waesche') return toast('Heute schon erledigt.');
    updItem('chores', c.id, {last: t, doneAt: Date.now(), hist: [t, ...arr(c.hist)].slice(0, 12)});
    toast(c.kind === 'waesche' ? `${c.name}: gewaschen. Rotation angepasst.` : c.every > 0 ? `${c.name}: erledigt. Nächstes Mal in ${c.every} Tagen.` : `${c.name}: erledigt.`); },
  'food-add': () => shFoodAdd(), goals: () => shGoals(),
  'food-quick': (v, el) => { const f = find('foods', el.dataset.id); if (!f) return; addFoodEntry(f, f.portion || 100); toast(`${f.name} eingetragen (${fmt(f.portion || 100)} g)`); },
  'food-manual': () => { const k = num($('#f-mk').value), p = num($('#f-mp').value); if (!k) return toast('Stelle zuerst die Kalorien ein.'); ensureToday(); S.day.entries = [...S.day.entries, {name:'Sonstiges', kcal:k, p, c:0, f:0}]; touchDay(); closeSheet(); },
  water: v => { ensureToday(); S.day.water = Math.max(0, (S.day.water || 0) + Number(v)); touchDay(); },
  'entry-del': v => { S.day.entries = S.day.entries.filter((_, i) => i !== Number(v)); touchDay(); },
  day: v => { const d = addDays(S.dayDate, Number(v)); if (d > today()) return; subDay(d); render(); },
  week: v => { S.weekStart = addDays(S.weekStart, Number(v)); render(); },
  'dish-pick': v => shDishPick(v),
  'dish-next': v => { const L = dishList(), cur = dishFor(v); if (!cur) return; const i = L.findIndex(d => d.id === cur.dish.id); const nx = L[(i + 1) % L.length]; needDb() && save(col('meals').doc(v).set({date: v, dish: nx.id})); },
  'dish-set': (v, el) => { needDb() && save(col('meals').doc(v).set({date: v, dish: el.dataset.id})); closeSheet(); },
  'dish-reset': v => { needDb() && save(col('meals').doc(v).delete()); closeSheet(); },
  'dish-eat': v => { closeSheet(); eatDish(v); },
  'dish-new': () => shDish(), 'dish-edit': (v, el) => shDish(find('dishes', el.dataset.id)),
  'week-shop': async () => {
    const days = [...Array(7)].map((_, i) => addDays(S.weekStart, i)).filter(d => d >= today());
    const pantry = S.pantry.map(p => p.name.toLowerCase());
    const items = [...new Set(days.flatMap(d => arr(dishFor(d)?.dish.ingr)))].filter(x => !pantry.some(p => x.toLowerCase().startsWith(p)));
    const have = new Set(S.shop.filter(i => !i.done).map(i => i.name.toLowerCase()));
    let n = 0; for (const name of items) if (!have.has(name.toLowerCase())) { await addItem('shop', {name, done:false}); n++; }
    toast(n ? `${n} Zutaten für ${days.length} Tage auf der Liste` : 'Alles steht schon auf der Liste');
  },
  'pantry-quick': v => addPantry([v]),
  'pantry-del': (v, el) => delItem('pantry', el.dataset.id),
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
  'route-quick': v => { const r = topRoutes()[Number(v)], s = lastOdo(); if (!r || !s) return; addItem('trips', {date: today(), startKm: s, endKm: s + r.dist, note: r.note, from: r.from, to: r.to}); toast(`${r.label}: ${fmt(r.dist)} km eingetragen`); },
  'fuel-new': () => shFuel(), 'fuel-edit': (v, el) => shFuel(find('fuel', el.dataset.id))
};
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (el.dataset.act !== 'sheet-close') ev.preventDefault();
  fn(el.dataset.v, el, ev);
});
document.addEventListener('submit', ev => {
  const pf = ev.target.closest('[data-form="pantry"]');
  if (pf) { ev.preventDefault(); const el = pf.querySelector('input'); const names = el.value.split(/[,;\n]/); el.value = ''; addPantry(names); return; }
  const f = ev.target.closest('[data-form="shop"]'); if (!f) return;
  ev.preventDefault();
  const el = f.querySelector('input'), name = el.value; el.value = ''; addShop(name);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetCtx) closeSheet(); });

boot();
})();
