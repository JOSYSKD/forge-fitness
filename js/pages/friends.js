// Freunde: Nutzer suchen, Anfragen senden/annehmen, Freundesliste mit Streaks
import { state, ready, subscribe, streak, personalRecords, sendFriendRequest, cancelFriendRequest, acceptFriend, declineFriend, removeFriend, friendStatus } from '../store.js';
import { esc, icon, fmt, toast, busy, avatar, confirmDialog, loading } from '../ui.js';
import { authErrorText } from '../firebase.js';

export const profileTabs = (active) => `<div class="seg" style="margin-bottom:16px">${[['', 'Mein Profil'], ['freunde', 'Freunde']]
  .map(([k, n]) => `<button onclick="location.hash='#/profil${k ? '/' + k : ''}'" class="${active === k ? 'on' : ''}">${n}${k === 'freunde' && Object.keys(state.requests || {}).length ? ` <span class="tag acc" style="margin-left:4px">${Object.keys(state.requests).length}</span>` : ''}</button>`).join('')}</div>`;

export const flame = (uid) => { const s = streak(uid); return `<span class="flame${s.current ? '' : ' off'}" title="Trainings-Streak (Rekord ${s.best})">${icon('flame')}${s.current}</span>`; };

/** Button je nach Freundschaftsstatus */
export function friendButton(uid, small = true) {
  const st = friendStatus(uid); const c = small ? 'btn sm' : 'btn';
  if (st === 'me') return '';
  if (st === 'friend') return `<button class="${c}" data-fr="remove" data-uid="${uid}">${icon('check')}Freund</button>`;
  if (st === 'incoming') return `<button class="${c} pri" data-fr="accept" data-uid="${uid}">Annehmen</button>`;
  if (st === 'sent') return `<button class="${c} ghost" data-fr="cancel" data-uid="${uid}">Angefragt</button>`;
  return `<button class="${c} pri" data-fr="add" data-uid="${uid}">${icon('plus')}Hinzufügen</button>`;
}
export function bindFriendButtons(root) {
  root.querySelectorAll('[data-fr]').forEach((b) => b.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const uid = b.dataset.uid; const name = state.publics[uid]?.username || 'diese Person';
    busy(b, async () => {
      try {
        const a = b.dataset.fr;
        if (a === 'add') { await sendFriendRequest(uid); toast(friendStatus(uid) === 'friend' ? `Ihr seid jetzt Freunde` : `Anfrage an ${name} gesendet`); }
        else if (a === 'cancel') { await cancelFriendRequest(uid); toast('Anfrage zurückgezogen'); }
        else if (a === 'accept') { await acceptFriend(uid); toast(`Du und ${name} seid jetzt Freunde 🤝`); }
        else if (a === 'decline') { await declineFriend(uid); }
        else if (a === 'remove') { if (await confirmDialog(`${name} aus deiner Freundesliste entfernen?`, 'Entfernen')) { await removeFriend(uid); toast('Freund entfernt'); } }
      } catch (err) { console.error(err); toast(authErrorText(err), 'err'); }
    });
  });
}

let q = '';
export async function render(root) {
  root.innerHTML = loading();
  await ready();
  const draw = () => {
    if (!root.isConnected) return;
    const reqs = Object.entries(state.requests || {}).filter(([uid]) => state.publics[uid]).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
    const friends = Object.keys(state.friends || {}).filter((uid) => state.publics[uid])
      .map((uid) => ({ uid, pub: state.publics[uid], s: streak(uid) })).sort((a, b) => b.s.current - a.s.current || b.s.best - a.s.best);
    const me = { uid: state.uid, pub: state.publics[state.uid] || { username: state.profile?.username }, s: streak(state.uid) };
    const board = [...friends, me].sort((a, b) => b.s.current - a.s.current || b.s.best - a.s.best);
    root.innerHTML = `
      <div class="page-head"><div><h1>Freunde</h1><p>Finde andere Mitglieder, füge sie hinzu und motiviert euch mit euren Streaks.</p></div></div>
      ${profileTabs('freunde')}
      <div class="grid g2" style="align-items:start">
        <div class="col gap16">
          <div class="card"><div class="card-h"><h2>${icon('search')}Mitglieder suchen</h2></div>
            <input class="input" id="fq" placeholder="Benutzername eingeben…" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(q)}">
            <div class="list mt8" id="fres"></div></div>
          ${reqs.length ? `<div class="card"><div class="card-h"><h2>Freundschaftsanfragen <span class="tag acc">${reqs.length}</span></h2></div><div class="list">${reqs.map(([uid, r]) => `
            <div class="li">${avatar(state.publics[uid])}<a class="grow" href="#/u/${uid}" style="color:var(--text);font-weight:600">${esc(state.publics[uid].username)}<div class="xs muted" style="font-weight:400">${new Date(r.at || Date.now()).toLocaleDateString('de-DE')}</div></a>
            <button class="btn sm pri" data-fr="accept" data-uid="${uid}">Annehmen</button><button class="btn sm ghost" data-fr="decline" data-uid="${uid}">Ablehnen</button></div>`).join('')}</div></div>` : ''}
          <div class="card"><div class="card-h"><h2>${icon('user')}Deine Freunde <span class="muted small" style="font-weight:500">(${friends.length})</span></h2></div>
            ${friends.length ? `<div class="list">${friends.map(({ uid, pub, s }) => `
              <a class="li" href="#/u/${uid}" style="color:inherit">${avatar(pub)}<div class="grow"><div style="font-weight:600" class="ellip">${esc(pub.username)}</div><div class="xs muted">${Object.keys(personalRecords(uid)).length} PRs · Rekord-Streak ${s.best}</div></div>${flame(uid)}</a>`).join('')}</div>`
              : '<div class="empty">Noch keine Freunde. Suche oben nach Benutzernamen und schick eine Anfrage.</div>'}
          </div>
        </div>
        <div class="card"><div class="card-h"><h2>${icon('flame')}Streak-Rangliste</h2></div>
          ${friends.length ? `<div class="list">${board.map((x, i) => `<a class="li" href="#/u/${x.uid}" style="color:inherit${x.uid === state.uid ? ';background:rgba(var(--acc-rgb),.06);border-radius:8px;padding-left:6px;padding-right:6px' : ''}"><span class="rank${i < 3 ? ' r' + (i + 1) : ''}">${i + 1}</span>${avatar(x.pub, 'sm')}<span class="grow ellip" style="font-weight:600">${esc(x.pub.username)}${x.uid === state.uid ? ' <span class="muted xs">(du)</span>' : ''}</span>${flame(x.uid)}</a>`).join('')}</div>`
            : '<div class="empty">Sobald du Freunde hast, vergleicht ihr hier eure Trainings-Streaks.</div>'}
          <p class="hint mt12">Streak = Trainings in Folge (max. 2 Ruhetage dazwischen). Zählt über „Heute trainiert“ im Dashboard und eingetragene Leistungen.</p>
        </div>
      </div>`;
    const fq = root.querySelector('#fq'); const fres = root.querySelector('#fres');
    const search = () => {
      q = fq.value; const t = q.trim().toLowerCase();
      if (t.length < 2) { fres.innerHTML = `<div class="dim small" style="padding:8px 0">${t ? 'Mindestens 2 Zeichen eingeben.' : 'Tippe einen Benutzernamen.'}</div>`; return; }
      const hits = Object.entries(state.publics).filter(([uid, p]) => uid !== state.uid && p.username && p.username.toLowerCase().includes(t))
        .sort((a, b) => (a[1].username.toLowerCase().startsWith(t) ? 0 : 1) - (b[1].username.toLowerCase().startsWith(t) ? 0 : 1) || a[1].username.localeCompare(b[1].username)).slice(0, 12);
      fres.innerHTML = hits.length ? hits.map(([uid, p]) => `<div class="li">${avatar(p, 'sm')}<a class="grow ellip" href="#/u/${uid}" style="color:var(--text);font-weight:600">${esc(p.username)}</a>${flame(uid)}${friendButton(uid)}</div>`).join('')
        : '<div class="dim small" style="padding:8px 0">Keine Mitglieder gefunden.</div>';
      bindFriendButtons(fres);
    };
    fq.oninput = search; search();
    bindFriendButtons(root);
  };
  draw();
  const un = subscribe((w) => { if (['friends', 'publics', 'activity', 'entries'].includes(w)) { const f = document.activeElement?.id === 'fq'; const pos = f ? document.activeElement.selectionStart : null; draw(); if (f) { const el = root.querySelector('#fq'); el?.focus(); el?.setSelectionRange(pos, pos); } } });
  return un;
}
