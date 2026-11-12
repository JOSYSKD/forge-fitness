// App-Shell: Auth-Gate, Navigation, Hash-Router
import { auth, onAuthStateChanged, register, login, logout, authErrorText, USERNAME_RE } from './firebase.js';
import { startSession, stopSession, state, username, me } from './store.js';
import { esc, icon, $, toast, busy, fieldErr, avatar } from './ui.js';

const NAV = [
  ['dashboard', 'Dashboard', 'home'],
  ['leaderboards', 'Leaderboards', 'trophy'],
  ['plaene', 'Trainingspläne', 'book'],
  ['ernaehrung', 'Ernährung', 'apple'],
  ['rechner', 'Kalorienrechner', 'calc'],
  ['profil', 'Profil', 'user'],
  ['einstellungen', 'Einstellungen', 'gear']
];
const PAGES = {
  dashboard: () => import('./pages/dashboard.js'),
  leaderboards: () => import('./pages/leaderboards.js'),
  plaene: () => import('./pages/plans.js'),
  ernaehrung: () => import('./pages/nutrition.js'),
  rechner: () => import('./pages/calculator.js'),
  profil: () => import('./pages/profile.js'),
  u: () => import('./pages/profile.js'),
  einstellungen: () => import('./pages/settings.js')
};

const appEl = document.getElementById('app');
let cleanup = null;
let renderId = 0;

function shell() {
  const links = NAV.map(([id, label, ic]) => `<a href="#/${id}" data-nav="${id}">${icon(ic)}<span>${label}</span></a>`).join('');
  const mob = NAV.slice(0, 4).map(([id, label, ic]) => `<a href="#/${id}" data-nav="${id}">${icon(ic)}<span>${label === 'Trainingspläne' ? 'Pläne' : label}</span></a>`).join('');
  const more = NAV.slice(4).map(([id, label, ic]) => `<a href="#/${id}" data-nav="${id}">${icon(ic)}${label}</a>`).join('')
    + `<a href="#" data-logout>${icon('logout')}Abmelden</a>`;
  appEl.innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="brand"><span class="brand-mark">F</span>FORGE</div>
      <nav class="nav">${links}</nav>
      <div class="side-foot" id="side-user"></div>
    </aside>
    <main class="main">
      <div class="mobile-top"><div class="brand" style="padding:0"><span class="brand-mark">F</span>FORGE</div><a href="#/profil" id="mob-av"></a></div>
      <div id="view"></div>
    </main>
    <nav class="bottomnav">${mob}<button data-more>${icon('more')}<span>Mehr</span></button></nav>
    <div class="more-sheet" hidden>${more}</div>
  </div>`;
  const sheet = $('.more-sheet');
  $('[data-more]').onclick = (e) => { e.stopPropagation(); sheet.hidden = !sheet.hidden; };
  document.addEventListener('click', (e) => { if (!e.target.closest('.more-sheet,[data-more]')) sheet.hidden = true; });
  appEl.querySelectorAll('[data-logout]').forEach((a) => a.onclick = async (e) => { e.preventDefault(); await logout(); });
  updateUserChip();
}
export function updateUserChip() {
  const pub = { ...me(), username: username() };
  const el = $('#side-user');
  if (el) el.innerHTML = `${avatar(pub)}<div style="min-width:0;flex:1"><div class="ellip" style="font-weight:600">${esc(pub.username)}</div><a href="#/einstellungen" class="xs muted">Einstellungen</a></div>
    <button class="btn ghost icon" title="Abmelden" id="lo">${icon('logout')}</button>`;
  const lo = $('#lo'); if (lo) lo.onclick = () => logout();
  const mav = $('#mob-av'); if (mav) mav.innerHTML = avatar(pub, 'sm');
}

async function route() {
  if (!state.uid) return;
  const [name = 'dashboard', ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const key = PAGES[name] ? name : 'dashboard';
  const navKey = key === 'u' ? (args[0] === state.uid ? 'profil' : 'leaderboards') : key;
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === navKey));
  document.querySelector('[data-more]')?.classList.toggle('on', ['rechner', 'profil', 'einstellungen'].includes(navKey));
  const sheet = $('.more-sheet'); if (sheet) sheet.hidden = true;
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const view = $('#view');
  const my = ++renderId;
  view.innerHTML = '<div class="page"><div class="loading"><span class="spinner sm"></span>Lädt…</div></div>';
  try {
    const mod = await PAGES[key]();
    if (my !== renderId) return;
    const page = document.createElement('div'); page.className = 'page';
    view.replaceChildren(page);
    cleanup = (await mod.render(page, { args, key })) || null;
    window.scrollTo(0, 0);
    document.title = `${(NAV.find((n) => n[0] === navKey) || [, 'FORGE'])[1]} · FORGE`;
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="page"><div class="empty"><b>Seite konnte nicht geladen werden</b>${esc(authErrorText(e))}</div></div>`;
  }
}

/* ---------- Login / Registrierung ---------- */
function authView(mode = 'login') {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const reg = mode === 'register';
  appEl.innerHTML = `
  <div class="auth">
    <div class="auth-art">
      <div class="brand"><span class="brand-mark">F</span>FORGE</div>
      <div>
        <h1>Trainiere smarter.<br><span class="acc">Miss dich mit anderen.</span></h1>
        <p class="muted mt12" style="max-width:420px">Deine Fitness-Plattform für Leaderboards, Trainingspläne, Ernährung und Kalorienbedarf – synchron auf allen Geräten.</p>
      </div>
      <div class="auth-feats">
        <div>${icon('trophy')}<span><b>${'60+'} Übungs-Leaderboards</b>Absolut, relativ zum Körpergewicht oder als 1RM.</span></div>
        <div>${icon('book')}<span><b>12 Trainingssplits</b>Detailseiten, Wochenpläne und Vergleich.</span></div>
        <div>${icon('apple')}<span><b>Ernährungstracker</b>Lebensmitteldatenbank, Makros, Verlauf.</span></div>
      </div>
    </div>
    <div class="auth-form">
      <form class="auth-box col gap16" novalidate>
        <div><h1>${reg ? 'Konto erstellen' : 'Willkommen zurück'}</h1>
        <p class="muted mt8">${reg ? 'Registriere dich mit Benutzername und Passwort.' : 'Melde dich mit deinem Benutzernamen an.'}</p></div>
        <div class="field"><label for="u">Benutzername</label><input class="input" id="u" autocomplete="username" maxlength="20" autocapitalize="none" spellcheck="false"></div>
        <div class="field"><label for="p">Passwort</label><input class="input" id="p" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
        ${reg ? '<div class="field"><label for="p2">Passwort wiederholen</label><input class="input" id="p2" type="password" autocomplete="new-password"></div>' : ''}
        <div class="err" id="form-err"></div>
        <button class="btn pri block" type="submit">${reg ? 'Registrieren' : 'Anmelden'}</button>
        <p class="muted small" style="text-align:center">${reg ? 'Schon ein Konto?' : 'Neu hier?'} <a href="#" id="sw">${reg ? 'Anmelden' : 'Konto erstellen'}</a></p>
        ${reg ? '<p class="hint" style="text-align:center">Passwörter werden über Firebase Authentication sicher gehasht gespeichert. Es gibt keine E-Mail-Wiederherstellung – merke dir dein Passwort gut.</p>' : ''}
      </form>
    </div>
  </div>`;
  appEl.hidden = false;
  $('#sw').onclick = (e) => { e.preventDefault(); authView(reg ? 'login' : 'register'); };
  const form = $('form', appEl);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const u = $('#u'), p = $('#p'), p2 = $('#p2'), ferr = $('#form-err');
    ferr.textContent = '';
    let ok = fieldErr(u, !u.value.trim() ? 'Bitte Benutzernamen eingeben.' : (reg && !USERNAME_RE.test(u.value.trim())) ? '3–20 Zeichen: Buchstaben, Zahlen, _ . -' : '');
    ok = fieldErr(p, !p.value ? 'Bitte Passwort eingeben.' : (reg && p.value.length < 8) ? 'Mindestens 8 Zeichen.' : '') && ok;
    if (reg) ok = fieldErr(p2, p2.value !== p.value ? 'Passwörter stimmen nicht überein.' : '') && ok;
    if (!ok) return;
    await busy(form.querySelector('[type=submit]'), async () => {
      try {
        if (reg) { await register(u.value.trim(), p.value); toast('Konto erstellt – willkommen!'); }
        else await login(u.value.trim(), p.value);
      } catch (err) { console.error(err); ferr.textContent = authErrorText(err); }
    });
  };
}

/* ---------- Start ---------- */
let routeBound = false;
onAuthStateChanged(auth, async (user) => {
  document.getElementById('boot').hidden = true;
  if (!user) { stopSession(); authView(); return; }
  try {
    appEl.hidden = false;
    appEl.innerHTML = '<div class="boot"><div class="spinner"></div></div>';
    await startSession(user.uid);
    if (!state.profile) {
      // Profil fehlt (z. B. Registrierung abgebrochen) → minimal anlegen
      const { saveProfile } = await import('./store.js');
      const name = user.email.split('@')[0];
      await saveProfile({ username: name, createdAt: Date.now(), privacy: { training: true, prs: true, ranks: true } });
    }
    shell();
    if (!routeBound) { window.addEventListener('hashchange', route); routeBound = true; }
    if (!location.hash || location.hash === '#/') location.hash = '#/dashboard'; else route();
  } catch (e) {
    console.error(e);
    appEl.innerHTML = `<div class="auth-form" style="min-height:100vh"><div class="auth-box empty"><b>Daten konnten nicht geladen werden</b>${esc(authErrorText(e))}<div class="mt16"><button class="btn" id="lo2">Abmelden</button></div></div></div>`;
    $('#lo2').onclick = () => logout();
  }
});
