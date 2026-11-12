import { state, exportAll, deleteAllData, username, saveLook } from '../store.js';
import { THEMES, ACCENTS, BACKGROUNDS, getLook, applyLook } from '../look.js';
import { logout, changePassword, reauth, deleteUser, auth, authErrorText } from '../firebase.js';
import { esc, icon, toast, busy, fieldErr, modal } from '../ui.js';
import { goalsDialog } from './nutrition.js';


export function render(root) {
  let look = getLook();
  const g = state.goals || {};
  root.innerHTML = `
    <div class="page-head"><div><h1>Einstellungen</h1><p>Konto, Darstellung und Daten.</p></div></div>
    <div class="grid g2">
      <div class="card span2" id="look"></div>
      <div class="card"><div class="card-h"><h2>Ernährungsziele</h2><button class="btn sm" id="goals">Bearbeiten</button></div>
        <div class="row wrap" style="gap:16px"><div><div class="lab">Kalorien</div><b>${g.kcal ?? '–'} kcal</b></div><div><div class="lab">Protein</div><b>${g.p ?? '–'} g</b></div><div><div class="lab">KH</div><b>${g.c ?? '–'} g</b></div><div><div class="lab">Fett</div><b>${g.f ?? '–'} g</b></div></div></div>
      <form class="card" id="pw" novalidate><div class="card-h"><h2>${icon('lock')}Passwort ändern</h2></div>
        <div class="col">
          <div class="field"><label>Aktuelles Passwort</label><input class="input" type="password" name="old" autocomplete="current-password"></div>
          <div class="field"><label>Neues Passwort</label><input class="input" type="password" name="new1" autocomplete="new-password"></div>
          <div class="field"><label>Neues Passwort wiederholen</label><input class="input" type="password" name="new2" autocomplete="new-password"></div>
          <div><button class="btn pri" type="submit">Passwort ändern</button></div></div></form>
      <div class="card"><div class="card-h"><h2>Konto</h2></div>
        <div class="list">
          <div class="li"><div class="grow"><div style="font-weight:600">Benutzername</div><div class="small muted">${esc(username())} · kann nicht geändert werden</div></div></div>
          <div class="li"><div class="grow"><div style="font-weight:600">Daten exportieren</div><div class="small muted">Alle deine Daten als JSON-Datei</div></div><button class="btn sm" id="exp">${icon('download')}Export</button></div>
          <div class="li"><div class="grow"><div style="font-weight:600">Abmelden</div><div class="small muted">Auf diesem Gerät abmelden</div></div><button class="btn sm" id="lo">${icon('logout')}Abmelden</button></div>
          <div class="li"><div class="grow"><div style="font-weight:600" class="danger-t">Konto löschen</div><div class="small muted">Löscht Konto, Profil, Einträge und Ernährungsdaten endgültig</div></div><button class="btn sm danger" id="del">${icon('trash')}Löschen</button></div>
        </div></div>
    </div>`;

  drawLook(root.querySelector('#look'));
  root.querySelector('#goals').onclick = () => goalsDialog(() => render(root));
  root.querySelector('#lo').onclick = () => logout();
  root.querySelector('#exp').onclick = (e) => busy(e.currentTarget, async () => {
    try {
      const data = await exportAll();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `forge-export-${username()}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (err) { toast(authErrorText(err), 'err'); }
  });
  const pw = root.querySelector('#pw');
  pw.onsubmit = (e) => {
    e.preventDefault();
    let ok = fieldErr(pw.old, !pw.old.value ? 'Bitte aktuelles Passwort eingeben.' : '');
    ok = fieldErr(pw.new1, pw.new1.value.length < 8 ? 'Mindestens 8 Zeichen.' : '') && ok;
    ok = fieldErr(pw.new2, pw.new2.value !== pw.new1.value ? 'Passwörter stimmen nicht überein.' : '') && ok;
    if (!ok) return;
    busy(pw.querySelector('[type=submit]'), async () => {
      try { await changePassword(pw.old.value, pw.new1.value); pw.reset(); toast('Passwort geändert'); }
      catch (err) { fieldErr(pw.old, authErrorText(err).replace('Benutzername oder ', '')); }
    });
  };
  root.querySelector('#del').onclick = () => modal({
    title: 'Konto endgültig löschen',
    body: `<p class="muted">Alle deine Daten (Profil, Leaderboard-Einträge, Ernährung, Ziele) werden unwiderruflich gelöscht. Gib zur Bestätigung dein Passwort ein.</p><div class="field mt12"><label>Passwort</label><input class="input" type="password" id="dp" autocomplete="current-password"></div>`,
    foot: '<button class="btn ghost" data-c>Abbrechen</button><button class="btn danger" data-ok>Endgültig löschen</button>',
    onMount: (m, close) => {
      m.querySelector('[data-c]').onclick = close;
      m.querySelector('[data-ok]').onclick = (e) => {
        const dp = m.querySelector('#dp'); if (!fieldErr(dp, dp.value ? '' : 'Passwort erforderlich')) return;
        busy(e.currentTarget, async () => {
          try { await reauth(dp.value); await deleteAllData(); await deleteUser(auth.currentUser); close(); toast('Konto gelöscht'); }
          catch (err) { console.error(err); fieldErr(dp, authErrorText(err).replace('Benutzername oder ', '')); }
        });
      };
    }
  });
}

let credits = null;
function drawLook(el) {
  const look = getLook();
  el.innerHTML = `<div class="card-h"><h2>Design</h2><span class="hint">Wird in deinem Konto gespeichert – auf allen Geräten gleich.</span></div>
    <div class="lab">Grundthema</div>
    <div class="pick-grid mt8">${THEMES.map(([k, n, bg, card]) => `<button class="pick theme${look.theme === k ? ' on' : ''}" data-theme="${k}"><div class="sw"><i style="background:${bg}"></i><i style="background:${card}"></i><i style="background:var(--acc)"></i></div><span>${n}</span></button>`).join('')}</div>
    <div class="lab mt16">Akzentfarbe</div>
    <div class="row wrap mt8">${ACCENTS.map(([k, n, c]) => `<button class="acc-dot${look.accent === k ? ' on' : ''}" data-acc="${k}" title="${n}" style="background:${c}"></button>`).join('')}</div>
    <div class="lab mt16">Hintergrundbild</div>
    <div class="pick-grid mt8"><button class="pick${!look.bg ? ' on' : ''}" data-bg=""><span style="position:absolute;inset:0;display:grid;place-items:center;background:var(--bg2);color:var(--muted)">Kein Bild</span></button>
      ${BACKGROUNDS.map((b) => `<button class="pick${look.bg === b ? ' on' : ''}" data-bg="${b}"><img src="assets/bg/${b}-t.webp" alt="" loading="lazy"><span>${esc(credits?.find((c) => c.id === b)?.name || '')}</span></button>`).join('')}</div>
    ${look.bg ? `<div class="grid g2 mt16"><div class="field"><label>Abdunkeln: ${look.dim} %</label><input type="range" min="40" max="95" step="5" value="${look.dim}" id="dim"></div>
      <label class="li" style="cursor:pointer;border:0"><span class="grow">Bild weichzeichnen</span><span class="switch"><input type="checkbox" id="blur" ${look.blur ? 'checked' : ''}><span></span></span></label></div>` : ''}
    <details class="mt16"><summary class="small muted" style="cursor:pointer">Bildnachweise (Wikimedia Commons, freie Lizenzen)</summary><div class="xs muted mt8" id="cred">Lädt…</div></details>`;
  let t;
  const set = (patch, redraw = true) => {
    const l = applyLook({ ...getLook(), ...patch });
    if (redraw) drawLook(el);
    clearTimeout(t); t = setTimeout(() => saveLook(l).catch(() => {}), 400);
  };
  el.querySelectorAll('[data-theme]').forEach((b) => b.onclick = () => set({ theme: b.dataset.theme }));
  el.querySelectorAll('[data-acc]').forEach((b) => b.onclick = () => set({ accent: b.dataset.acc }));
  el.querySelectorAll('[data-bg]').forEach((b) => b.onclick = () => set({ bg: b.dataset.bg }));
  const dim = el.querySelector('#dim'); if (dim) { dim.oninput = () => { dim.previousElementSibling.textContent = `Abdunkeln: ${dim.value} %`; set({ dim: +dim.value }, false); }; }
  const blur = el.querySelector('#blur'); if (blur) blur.onchange = () => set({ blur: blur.checked }, false);
  const cred = el.querySelector('#cred');
  const showCred = () => { cred.innerHTML = credits.map((c) => `<div style="margin:4px 0"><b style="color:var(--text)">${esc(c.name)}</b> – „${esc(c.title)}“ von ${esc(c.author || 'unbekannt')}, ${esc(c.license)} · <a href="${esc(c.source)}" target="_blank" rel="noopener">Quelle</a></div>`).join(''); };
  if (credits) showCred();
  else fetch('assets/bg/credits.json').then((r) => r.json()).then((c) => { credits = c; if (el.isConnected) drawLook(el); }).catch(() => { cred.textContent = 'Konnte nicht geladen werden.'; });
}
