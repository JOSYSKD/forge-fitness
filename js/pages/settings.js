import { state, exportAll, deleteAllData, username } from '../store.js';
import { logout, changePassword, reauth, deleteUser, auth, authErrorText } from '../firebase.js';
import { esc, icon, toast, busy, fieldErr, modal } from '../ui.js';
import { goalsDialog } from './nutrition.js';

const ACCENTS = [['green', 'Grün', '#34d399'], ['violet', 'Violett', '#a78bfa'], ['blue', 'Blau', '#60a5fa'], ['orange', 'Orange', '#fb923c']];

export function render(root) {
  const cur = document.documentElement.dataset.accent || 'green';
  const g = state.goals || {};
  root.innerHTML = `
    <div class="page-head"><div><h1>Einstellungen</h1><p>Konto, Darstellung und Daten.</p></div></div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><h2>Darstellung</h2></div>
        <div class="lab">Akzentfarbe</div>
        <div class="row wrap mt8" id="acc">${ACCENTS.map(([k, n, c]) => `<button class="chip${cur === k ? ' on' : ''}" data-a="${k}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin-right:6px"></span>${n}</button>`).join('')}</div>
        <p class="hint mt8">Wird auf diesem Gerät gespeichert.</p></div>
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

  root.querySelector('#acc').onclick = (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const k = b.dataset.a;
    if (k === 'green') delete document.documentElement.dataset.accent; else document.documentElement.dataset.accent = k;
    try { localStorage.setItem('forge_accent', k === 'green' ? '' : k); } catch {}
    root.querySelectorAll('[data-a]').forEach((x) => x.classList.toggle('on', x === b));
  };
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
