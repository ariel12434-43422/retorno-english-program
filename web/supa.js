/* Retorno — connects the app to its own Supabase project.
   It gives the app the same small "db" and "user" interface it uses inside Claude,
   shows the sign-in screen, and handles phone notifications. */
(function () {
  const CFG = window.RETORNO_CONFIG || {};
  const ready = CFG.supabaseUrl && CFG.supabaseAnonKey && !/YOUR_/.test(CFG.supabaseUrl);
  const lang = (() => { try { return JSON.parse(localStorage.getItem('retorno-hub-prefs') || '{}').lang || 'he'; } catch (e) { return 'he'; } })();
  const T = (he, en) => (lang === 'he' ? he : en);
  const app = () => document.getElementById('app');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

  function card(inner) {
    app().innerHTML = `<main class="content solo"><div class="login"><section class="card">
      <span class="logo-tile"><img src="icons/logo.png" alt="${T('רטורנו', 'Retorno')}"></span>${inner}</section></div></main>`;
  }
  if (!ready) {
    card(`<h1>${T('המערכת עוד לא חוברה למאגר הנתונים', 'The app is not connected to its database yet')}</h1>
      <p class="hint">${T('יש להשלים את שלב ההגדרה לפי המדריך (README) במאגר ב־GitHub.', 'Finish the setup steps in the README of the GitHub repository.')}</p>`);
    return;
  }

  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  let session = null, isAdmin = false, staffId = null, member = false;

  /* ---------- sign-in ---------- */
  function loginForm(mode, msg) {
    const isUp = mode === 'up', isReset = mode === 'reset', isNew = mode === 'newpw';
    card(`<h1>${isNew ? T('בחירת סיסמה חדשה', 'Choose a new password') : isUp ? T('הרשמה', 'Sign up') : isReset ? T('איפוס סיסמה', 'Reset password') : T('כניסה למערכת', 'Sign in')}</h1>
      <p class="hint">${T('תוכנית דוברי אנגלית · רטורנו', 'English-speaking program · Retorno')}</p>
      <form class="form" id="authForm" novalidate>
        ${isNew ? '' : `<div class="f"><label for="au_e">${T('מייל', 'Email')}</label><input id="au_e" type="email" dir="ltr" autocomplete="username" required></div>`}
        ${isReset ? '' : `<div class="f"><label for="au_p">${T('סיסמה', 'Password')}</label><input id="au_p" type="password" dir="ltr" autocomplete="${isUp || isNew ? 'new-password' : 'current-password'}" required></div>`}
        ${isUp || isNew ? `<p class="hint">${T('לפחות 8 תווים.', 'At least 8 characters.')}</p>` : ''}
        <p class="err" id="au_err" role="alert">${esc(msg || '')}</p>
        <button class="btn primary" type="submit">${isNew ? T('שמירה', 'Save') : isUp ? T('הרשמה', 'Sign up') : isReset ? T('שליחת קישור איפוס', 'Send reset link') : T('כניסה', 'Sign in')}</button>
        ${isNew ? '' : `<div class="toolbar">${mode !== 'in' ? `<button type="button" class="btn sm ghost" data-m="in">${T('יש לי חשבון – כניסה', 'I have an account – sign in')}</button>` : ''}${mode !== 'up' ? `<button type="button" class="btn sm ghost" data-m="up">${T('חשבון חדש – הרשמה', 'New account – sign up')}</button>` : ''}${mode !== 'reset' ? `<button type="button" class="btn sm ghost" data-m="reset">${T('שכחתי סיסמה', 'Forgot password')}</button>` : ''}</div>`}
      </form>`);
    app().querySelectorAll('[data-m]').forEach(b => b.onclick = () => loginForm(b.dataset.m));
    document.getElementById('authForm').onsubmit = async e => {
      e.preventDefault();
      const err = document.getElementById('au_err'); err.textContent = '';
      const email = (document.getElementById('au_e')?.value || '').trim().toLowerCase();
      const pw = document.getElementById('au_p')?.value || '';
      if (!isNew && !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = T('המייל לא תקין.', 'That email is not valid.'); return; }
      if ((isUp || isNew) && pw.length < 8) { err.textContent = T('הסיסמה צריכה להכיל לפחות 8 תווים.', 'The password needs at least 8 characters.'); return; }
      const btn = e.submitter; if (btn) btn.disabled = true;
      try {
        if (isNew) { const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error; location.hash = ''; location.reload(); return; }
        if (isReset) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); if (error) throw error; loginForm('in', T('נשלח אליך מייל עם קישור לאיפוס הסיסמה.', 'We emailed you a link to reset the password.')); return; }
        if (isUp) {
          const { data, error } = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: location.origin + location.pathname } }); if (error) throw error;
          if (!data.session) { loginForm('in', T('נשלח אליך מייל לאישור החשבון. אחרי האישור אפשר להיכנס.', 'We sent you an email to confirm the account. After confirming, sign in.')); return; }
        } else { const { error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error; }
      } catch (ex) {
        const m = String(ex.message || ex);
        err.textContent = /Invalid login/i.test(m) ? T('המייל או הסיסמה שגויים.', 'Wrong email or password.') : /confirm/i.test(m) ? T('צריך קודם לאשר את המייל (בדקו את תיבת הדואר).', 'Confirm your email first (check your inbox).') : /registered/i.test(m) ? T('כבר קיים חשבון עם המייל הזה. נסו להיכנס.', 'An account with this email already exists. Try signing in.') : m;
      } finally { if (btn) btn.disabled = false; }
    };
  }

  let resolveLogin; const loggedIn = new Promise(r => (resolveLogin = r));
  sb.auth.onAuthStateChange((ev, s) => {
    if (ev === 'PASSWORD_RECOVERY') { loginForm('newpw'); return; }
    if (s && !session) { session = s; resolveLogin(s); }
    if (!s && session && ev === 'SIGNED_OUT') location.reload();
  });
  sb.auth.getSession().then(({ data }) => { if (data.session) { session = data.session; resolveLogin(data.session); } else if (!/type=recovery/.test(location.hash)) loginForm('in'); });

  async function whoAmI() {
    const r1 = await sb.rpc('bootstrap_admin'); isAdmin = !!r1.data;
    const r2 = await sb.rpc('is_member'); member = !!r2.data;
    const r3 = await sb.rpc('my_staff_id'); staffId = r3.data || null;
  }

  /* ---------- documents, with the same interface the app uses inside Claude ---------- */
  const errOf = e => ({ code: e && (e.code === '42501' || e.code === 'P0002' || /row-level/i.test(e.message || '')) ? 'invalid_argument' : 'unavailable', message: e && e.message });
  const colOf = p => p.split('/').slice(0, -1).join('/');
  const listeners = {}; // collection -> {map, fns}
  let channel = null;
  async function loadCollection(col) {
    const map = new Map(); let from = 0;
    for (;;) {
      const { data, error } = await sb.from('docs').select('path, body').eq('collection', col).order('path').range(from, from + 999);
      if (error) throw error;
      data.forEach(r => map.set(r.path, r.body));
      if (data.length < 1000) break; from += 1000;
    }
    return map;
  }
  function emit(col) {
    const L = listeners[col]; if (!L) return;
    const docs = [...L.map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([p, b]) => ({ id: p.split('/').pop(), exists: true, data: () => b, metadata: {} }));
    const snap = { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: () => [] };
    L.fns.forEach(f => { try { f(snap); } catch (e) { console.error(e); } });
  }
  function ensureChannel() {
    if (channel) return;
    channel = sb.channel('docs-live').on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, pl => {
      const row = pl.new && pl.new.path ? pl.new : pl.old; if (!row || !row.path) return;
      const col = row.collection || colOf(row.path); const L = listeners[col]; if (!L) return;
      if (pl.eventType === 'DELETE') L.map.delete(row.path); else L.map.set(row.path, pl.new.body);
      emit(col);
    }).subscribe(st => { if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') setTimeout(refreshAll, 3000); });
  }
  async function refreshAll() { for (const col of Object.keys(listeners)) { try { listeners[col].map = await loadCollection(col); emit(col); } catch (e) {} } }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAll(); });
  function local(path, body) { const L = listeners[colOf(path)]; if (!L) return; if (body === undefined) L.map.delete(path); else L.map.set(path, body); emit(colOf(path)); }

  const db = {
    collection(col) {
      return {
        onSnapshot(next, onErr) {
          const L = listeners[col] || (listeners[col] = { map: new Map(), fns: [] }); L.fns.push(next); ensureChannel();
          loadCollection(col).then(m => { L.map = m; emit(col); }).catch(e => onErr && onErr(errOf(e)));
          return () => { L.fns = L.fns.filter(f => f !== next); };
        },
        doc: id => db.doc(col + '/' + id),
      };
    },
    doc(path) {
      return {
        path, id: path.split('/').pop(),
        async get() { const { data, error } = await sb.from('docs').select('body').eq('path', path).maybeSingle(); if (error) throw errOf(error); return { exists: !!data, data: () => data && data.body, metadata: {} }; },
        async set(body) { const { error } = await sb.from('docs').upsert({ path, collection: colOf(path), body }); if (error) throw errOf(error); local(path, body); },
        async update(patch) { const { error } = await sb.rpc('docs_update', { p: path, patch }); if (error) throw errOf(error); },
        async delete() { const { error } = await sb.from('docs').delete().eq('path', path); if (error) throw errOf(error); local(path, undefined); },
      };
    },
  };
  const user = {
    id: async () => session && session.user.id,
    canEdit: async () => isAdmin, isOwner: async () => isAdmin, can: async () => member,
    profiles: async ids => Object.fromEntries([].concat(ids).map(i => [i, { id: i, name: '', avatarUrl: '', color: '#888', isMe: session && i === session.user.id }])),
    me: async () => ({ id: session.user.id, name: '', email: session.user.email, isOwner: isAdmin, canEdit: isAdmin }),
  };
  const downloads = { save: async ({ filename, data }) => { const blob = data instanceof Blob ? data : new Blob([data]); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return { status: 'saved' }; } };

  // the app asks for capabilities through window.claude.use(); answer once signed in
  window.claude = {
    use: async name => {
      await loggedIn;
      if (!whoAmI.done) { whoAmI.done = whoAmI(); } await whoAmI.done;
      return name === 'db' ? db : name === 'user' ? user : name === 'downloads' ? downloads : null;
    },
  };

  /* ---------- what the app reads about this account ---------- */
  window.RETORNO_SUPA = {
    get email() { return session && session.user.email; },
    get member() { return member; }, get admin() { return isAdmin; }, get staffId() { return staffId; },
    signOut: () => sb.auth.signOut(),
    async setMember(email, sid, asManager) {
      email = String(email || '').trim().toLowerCase(); if (!email) return;
      const r = await sb.from('app_members').upsert({ email, staff_id: sid }); if (r.error) throw r.error;
      if (asManager) { const r2 = await sb.from('app_admins').upsert({ email }); if (r2.error) throw r2.error; }
      else await sb.from('app_admins').delete().eq('email', email).neq('email', (session.user.email || '').toLowerCase());
    },
    async removeMember(email) { email = String(email || '').trim().toLowerCase(); if (!email || email === (session.user.email || '').toLowerCase()) return; await sb.from('app_members').delete().eq('email', email); await sb.from('app_admins').delete().eq('email', email); },
    async importDocs(map, onProgress) {
      const rows = Object.entries(map).filter(([p]) => !p.startsWith('links/') && p !== 'mgr/data/secure/cred').map(([path, body]) => ({ path, collection: colOf(path), body }));
      for (let i = 0; i < rows.length; i += 100) { const { error } = await sb.from('docs').upsert(rows.slice(i, i + 100)); if (error) throw error; onProgress && onProgress(Math.min(i + 100, rows.length), rows.length); }
      return rows.length;
    },
  };

  /* ---------- phone notifications ---------- */
  const b64 = s => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
  const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!CFG.vapidPublicKey;
  let swReg = null;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(r => (swReg = r)).catch(() => {});
  window.RETORNO_PUSH = pushOk ? {
    state: () => (Notification.permission === 'granted' && localStorage.getItem('retorno-push') === '1' ? 'on' : 'off'),
    async enable() {
      try {
        const perm = await Notification.requestPermission(); if (perm !== 'granted') return false;
        const reg = swReg || (await navigator.serviceWorker.ready);
        const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(CFG.vapidPublicKey) }));
        const j = sub.toJSON();
        const { error } = await sb.from('push_subs').upsert({ endpoint: j.endpoint, user_id: session.user.id, email: (session.user.email || '').toLowerCase(), sub: j });
        if (error) return false;
        localStorage.setItem('retorno-push', '1'); return true;
      } catch (e) { console.warn(e); return false; }
    },
  } : null;
  window.RETORNO_NOTIFY = p => { if (session) sb.functions.invoke('notify', { body: p }).catch(() => {}); };
})();
