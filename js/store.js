/* Tagwerk: Datenspeicher auf Supabase, Anmeldung, Push und Import.
   Stellt dieselbe Schnittstelle bereit, die die App in claude.ai genutzt hat (window.claude.use), damit app.js unverändert läuft. */
(() => {
  const CFG = window.TAGWERK_CONFIG || {};
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {auth: {persistSession: true, autoRefreshToken: true}});
  const CACHE_KEY = 'tw.cache.v1', OUTBOX_KEY = 'tw.outbox.v1';
  const ls = {get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }};

  let uid = null, email = '', prefix = '';
  const mem = new Map(Object.entries(ls.get(CACHE_KEY, {})));
  const listeners = new Set();
  let outbox = ls.get(OUTBOX_KEY, []);
  let resolveReady; window.TW_READY = new Promise(r => resolveReady = r);

  /* ---------- paths ---------- */
  const rel = p => p.startsWith(prefix) ? p.slice(prefix.length) : p;
  const parentOf = p => p.split('/').slice(0, -1).join('/');
  const lastSeg = p => p.split('/').pop();

  /* ---------- in-memory store ---------- */
  let cacheT;
  function persistCache() { clearTimeout(cacheT); cacheT = setTimeout(() => ls.set(CACHE_KEY, Object.fromEntries(mem)), 300); }
  function notify() { for (const l of listeners) { try { l.fire(); } catch (e) { console.error(e); } } persistCache(); }
  const clone = v => JSON.parse(JSON.stringify(v));
  function merge(a, b) {
    const out = {...a};
    for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], v) : v;
    return out;
  }
  const docSnap = (p, d) => ({id: lastSeg(p), exists: d !== undefined, data: () => d === undefined ? undefined : clone(d), metadata: {fromCache: false, hasPendingWrites: false}});

  /* ---------- server sync ---------- */
  async function pushOp(op) {
    if (op.t === 'set') { const {error} = await sb.from('docs').upsert({user_id: uid, path: op.p, data: op.d, updated_at: new Date().toISOString()}); if (error) throw error; }
    else { const {error} = await sb.from('docs').delete().eq('user_id', uid).eq('path', op.p); if (error) throw error; }
  }
  let flushing = false;
  async function flush() {
    if (flushing || !uid) return; flushing = true;
    try { while (outbox.length) { await pushOp(outbox[0]); outbox.shift(); ls.set(OUTBOX_KEY, outbox); } }
    catch (e) { console.warn('Sync später', e); }
    finally { flushing = false; }
  }
  function queue(op) { outbox = outbox.filter(o => o.p !== op.p); outbox.push(op); ls.set(OUTBOX_KEY, outbox); flush(); }
  window.addEventListener('online', flush);

  async function loadAll() {
    const rows = []; let from = 0;
    for (;;) {
      const {data, error} = await sb.from('docs').select('path,data').range(from, from + 999);
      if (error) throw error; rows.push(...data); if (data.length < 1000) break; from += 1000;
    }
    const pending = new Set(outbox.map(o => o.p));
    for (const k of [...mem.keys()]) if (!pending.has(k)) mem.delete(k);
    for (const r of rows) if (!pending.has(r.path)) mem.set(r.path, r.data);
    notify();
  }
  function subscribeRealtime() {
    sb.channel('docs-' + uid).on('postgres_changes', {event: '*', schema: 'public', table: 'docs', filter: `user_id=eq.${uid}`}, ev => {
      if (ev.eventType === 'DELETE') { if (ev.old?.path) mem.delete(ev.old.path); }
      else if (ev.new?.path) mem.set(ev.new.path, ev.new.data);
      notify();
    }).subscribe();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { flush(); loadAll().catch(() => {}); } });
  }

  /* ---------- db facade (same shape as the claude.ai db capability) ---------- */
  function docRef(full) {
    const p = rel(full);
    return {
      id: lastSeg(p), path: full,
      async get() { return docSnap(p, mem.get(p)); },
      async set(data) { const d = clone(data); mem.set(p, d); notify(); queue({t: 'set', p, d}); },
      async update(data) { const cur = mem.get(p); if (cur === undefined) throw {code: 'invalid_argument', message: 'Dokument fehlt'}; const d = merge(cur, clone(data)); mem.set(p, d); notify(); queue({t: 'set', p, d}); },
      async delete() { mem.delete(p); notify(); queue({t: 'del', p}); },
      onSnapshot(next) { let last; const l = {fire() { const d = mem.get(p); const key = JSON.stringify(d); if (key === last) return; last = key; next(docSnap(p, d)); }}; listeners.add(l); setTimeout(() => l.fire(), 0); return () => listeners.delete(l); },
      collection(sub) { return colRef(full + '/' + sub); }
    };
  }
  const OPS = {'==': (a, b) => a === b, '!=': (a, b) => a !== b, '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, 'in': (a, b) => b.includes(a), 'not-in': (a, b) => !b.includes(a), 'array-contains': (a, b) => Array.isArray(a) && a.includes(b)};
  function colRef(full, q = {filters: [], order: null, lim: 0}) {
    const p = rel(full);
    const run = () => {
      let docs = [...mem.entries()].filter(([k]) => parentOf(k) === p).filter(([, d]) => q.filters.every(([f, op, v]) => OPS[op]?.(d?.[f], v)));
      if (q.order) { const [f, dir] = q.order; docs.sort((a, b) => (a[1][f] > b[1][f] ? 1 : a[1][f] < b[1][f] ? -1 : 0) * (dir === 'desc' ? -1 : 1)); } else docs.sort((a, b) => a[0].localeCompare(b[0]));
      if (q.lim) docs = docs.slice(0, q.lim);
      const snaps = docs.map(([k, d]) => docSnap(k, d));
      return {docs: snaps, size: snaps.length, empty: !snaps.length, docChanges: () => [], metadata: {fromCache: false, hasPendingWrites: false}};
    };
    return {
      path: full,
      where: (f, op, v) => colRef(full, {...q, filters: [...q.filters, [f, op, v]]}),
      orderBy: (f, dir = 'asc') => colRef(full, {...q, order: [f, dir]}),
      limit: n => colRef(full, {...q, lim: n}),
      async get() { return run(); },
      onSnapshot(next) { let last; const l = {fire() { const s = run(); const key = JSON.stringify(s.docs.map(d => [d.id, d.data()])); if (key === last) return; last = key; next(s); }}; listeners.add(l); setTimeout(() => l.fire(), 0); return () => listeners.delete(l); },
      doc: id => docRef(full + '/' + (id || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 20) : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)))),
      async add(data) { const r = this.doc(); await r.set(data); return r; }
    };
  }
  const db = {doc: docRef, collection: colRef};
  const user = {id: async () => uid, isOwner: async () => true, canEdit: async () => true, can: async () => true, me: async () => ({id: uid, name: '', email, isOwner: true, canEdit: true})};
  const downloads = {async save({filename, data}) {
    const file = new File([data], filename, {type: 'application/json'});
    if (navigator.canShare?.({files: [file]})) { await navigator.share({files: [file], title: filename}); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  }};
  window.claude = {use: async name => ({db, user, downloads}[name] || null)};

  /* ---------- push ---------- */
  const b64ToBytes = s => { const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  const standalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  function pushState() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return standalone() ? 'Dieses Gerät unterstützt keine Mitteilungen.' : 'Lege Tagwerk zuerst auf den Home-Bildschirm und öffne es von dort.';
    if (Notification.permission === 'granted') return 'Aktiv. Jeden Morgen gegen 10 Uhr kommt dein Überblick.';
    if (Notification.permission === 'denied') return 'Blockiert. Erlaube Mitteilungen in den iPhone-Einstellungen unter Tagwerk.';
    return 'Noch nicht aktiviert.';
  }
  async function enablePush() {
    if (!standalone()) return 'Bitte zuerst über Teilen › Zum Home-Bildschirm installieren und von dort öffnen.';
    if (!CFG.vapidPublicKey) return 'Mitteilungen sind noch nicht eingerichtet.';
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'Mitteilungen wurden nicht erlaubt.';
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: b64ToBytes(CFG.vapidPublicKey)});
    const json = sub.toJSON(), id = btoa(json.endpoint).replace(/[^A-Za-z0-9]/g, '').slice(-40);
    await docRef(`${prefix}pushsubs/items/${id}`).set({...json, ua: navigator.userAgent, ts: Date.now()});
    return 'Mitteilungen sind aktiv.';
  }

  /* ---------- import ---------- */
  function importFile() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = async () => {
      try {
        const data = JSON.parse(await inp.files[0].text());
        const docs = Array.isArray(data.docs) ? data.docs : [];
        if (!docs.length) throw new Error('leer');
        const replace = Array.isArray(data.replace) ? data.replace.filter(x => typeof x === 'string' && x.endsWith('/')) : [];
        for (const pre of replace) {
          for (const k of [...mem.keys()]) if (k.startsWith(pre)) mem.delete(k);
          const {error} = await sb.from('docs').delete().eq('user_id', uid).like('path', pre + '%'); if (error) throw error;
        }
        for (const d of docs) if (d.merge && typeof d.path === 'string' && d.data) d.data = merge(mem.get(d.path) || {}, d.data);
        for (const d of docs) if (typeof d.path === 'string' && d.data && typeof d.data === 'object') mem.set(d.path, d.data);
        notify();
        for (let i = 0; i < docs.length; i += 200) {
          const rows = docs.slice(i, i + 200).map(d => ({user_id: uid, path: d.path, data: d.data, updated_at: new Date().toISOString()}));
          const {error} = await sb.from('docs').upsert(rows); if (error) throw error;
        }
        alertBox(`${docs.length} Einträge importiert.`);
      } catch (e) { alertBox('Import fehlgeschlagen. Ist das die richtige Datei?'); }
    };
    inp.click();
  }
  function alertBox(msg) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 3500); }

  window.TW = {email: () => email, pushState, enablePush, importFile, logout: async () => { await sb.auth.signOut(); ls.set(CACHE_KEY, {}); ls.set(OUTBOX_KEY, []); location.reload(); }};

  /* ---------- auth screen ---------- */
  const authEl = document.getElementById('auth');
  function showAuth(msg = '') {
    authEl.hidden = false;
    authEl.querySelector('#auth-msg').textContent = msg;
  }
  async function start(session) {
    uid = session.user.id; email = session.user.email || ''; prefix = `data/users/${uid}/`;
    authEl.hidden = true;
    try { await loadAll(); } catch (e) { console.warn('offline, nutze Cache', e); }
    subscribeRealtime(); flush();
    resolveReady();
  }
  authEl.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, mode = e.submitter?.value || 'login', em = f.email.value.trim(), pw = f.password.value;
    if (!em || pw.length < 6) return showAuth('Bitte E-Mail und ein Passwort mit mindestens 6 Zeichen eingeben.');
    showAuth(mode === 'login' ? 'Melde an …' : 'Erstelle Konto …');
    const res = mode === 'login' ? await sb.auth.signInWithPassword({email: em, password: pw}) : await sb.auth.signUp({email: em, password: pw, options: {emailRedirectTo: location.origin + location.pathname}});
    if (res.error) return showAuth(res.error.message.includes('Invalid login') ? 'E-Mail oder Passwort stimmt nicht.' : res.error.message.includes('not confirmed') ? 'Bitte bestätige zuerst die E-Mail von Supabase, dann hier anmelden.' : 'Das hat nicht geklappt: ' + res.error.message);
    if (!res.data.session) return showAuth('Fast fertig: Bestätige die E-Mail von Supabase und melde dich dann hier an.');
    start(res.data.session);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', {updateViaCache: 'none'}).then(r => r.update()).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded || !navigator.serviceWorker.controller) return; reloaded = true; location.reload(); });
  }

  sb.auth.getSession().then(({data}) => {
    if (data.session) start(data.session);
    else if (!navigator.onLine && mem.size) { uid = ls.get('tw.uid', null); if (uid) { prefix = `data/users/${uid}/`; resolveReady(); return; } showAuth(); }
    else showAuth();
  });
  sb.auth.onAuthStateChange((_e, s) => { if (s?.user) ls.set('tw.uid', s.user.id); });
})();
