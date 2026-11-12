import { state, ready, subscribe, saveProfile, personalRecords, userRanks } from '../store.js';
import { EX, exLabel } from '../data/exercises.js';
import { esc, icon, fmt, fmtKg, fmtDate, num, toast, busy, fieldErr, avatar, rankBadge, loading } from '../ui.js';
import { authErrorText } from '../firebase.js';
import { updateUserChip } from '../app.js';
import * as F from './friends.js';
import { streak } from '../store.js';

const EXP = [['', 'Keine Angabe'], ['einsteiger', 'Einsteiger (< 1 Jahr)'], ['fortgeschritten', 'Fortgeschritten (1–3 Jahre)'], ['erfahren', 'Erfahren (3–5 Jahre)'], ['profi', 'Sehr erfahren (5+ Jahre)']];
const expName = (k) => (EXP.find((e) => e[0] === k) || [, ''])[1];

export async function render(root, { args, key }) {
  if (key === 'profil' && args[0] === 'freunde') return F.render(root);
  const uid = key === 'u' ? args[0] : state.uid;
  const own = uid === state.uid;
  root.innerHTML = loading();
  await ready();
  const draw = () => { if (root.isConnected) (own ? ownView : publicView)(root, uid); };
  draw();
  return subscribe((w) => { if (['entries', 'publics', 'friends', 'activity'].includes(w)) draw(); });
}

function sinceText(iso) {
  if (!iso) return '';
  const m = (new Date().getFullYear() - +iso.slice(0, 4)) * 12 + (new Date().getMonth() - (+iso.slice(5, 7) - 1));
  return m < 12 ? `seit ${Math.max(0, m)} Monaten` : `seit ${fmt(m / 12, m % 12 ? 1 : 0)} Jahren`;
}

function prsHtml(uid) {
  const prs = Object.values(personalRecords(uid)).sort((a, b) => EX[a.exId].group.localeCompare(EX[b.exId].group));
  return prs.length ? `<div class="scroll-x"><table class="table"><thead><tr><th>Übung</th><th class="r">Bestleistung</th><th class="r hide-sm">Datum</th></tr></thead><tbody>${prs.map((e) => `<tr><td><a href="#/leaderboards/${e.exId}" style="color:inherit">${esc(exLabel(EX[e.exId]))}</a></td><td class="r num" style="font-weight:700">${EX[e.exId].type === 'bw' ? '+' : ''}${fmtKg(e.weight)} <span class="muted" style="font-weight:400">× ${e.reps}</span></td><td class="r hide-sm muted small">${fmtDate(e.date)}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">Noch keine Bestleistungen.</div>';
}
function ranksHtml(uid) {
  const rk = userRanks(uid);
  return rk.length ? `<div class="list">${rk.slice(0, 12).map((x) => `<a class="li" style="color:inherit" href="#/leaderboards/${x.exId}">${rankBadge(x.rank)}<div class="grow ellip">${esc(exLabel(EX[x.exId]))}</div><span class="muted small">von ${x.of}</span></a>`).join('')}</div>`
    : '<div class="empty">Noch keine Platzierungen.</div>';
}

function publicView(root, uid) {
  const pub = state.publics[uid];
  if (!pub) { root.innerHTML = '<div class="empty"><b>Profil nicht gefunden</b>Dieses Konto existiert nicht (mehr).</div>'; return; }
  const facts = [
    pub.bodyweight && ['Körpergewicht', fmtKg(pub.bodyweight)],
    pub.height && ['Größe', `${fmt(pub.height)} cm`],
    pub.experience && ['Erfahrung', expName(pub.experience)],
    pub.trainingSince && ['Training', `${sinceText(pub.trainingSince)}`]
  ].filter(Boolean);
  root.innerHTML = `
    <a href="javascript:history.back()" class="small muted row" style="gap:4px;margin-bottom:12px">${icon('chevL')}Zurück</a>
    <section class="hero"><div class="row gap16" style="position:relative;z-index:1">${avatar(pub, 'lg')}<div><h1>${esc(pub.username)}</h1>
      <div class="row wrap mt8">${F.flame(uid)}<span class="muted small">Streak · Rekord ${streak(uid).best}</span>${F.friendButton(uid)}</div>
      <p class="muted mt8">Mitglied seit ${pub.createdAt ? new Date(pub.createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : '–'}</p>
      ${pub.bio ? `<p class="mt8">${esc(pub.bio)}</p>` : ''}</div></div></section>
    ${facts.length ? `<div class="grid g4 mt16">${facts.map(([l, v]) => `<div class="card stat"><div class="lbl">${l}</div><div class="val" style="font-size:20px">${esc(v)}</div></div>`).join('')}</div>` : ''}
    <div class="grid g2 mt16">
      <div class="card"><div class="card-h"><h2>${icon('star')}Bestleistungen</h2></div>${pub.showPrs ? prsHtml(uid) : `<div class="empty">${icon('lock')} Privat</div>`}</div>
      <div class="card"><div class="card-h"><h2>${icon('trophy')}Platzierungen</h2></div>${pub.showRanks ? ranksHtml(uid) : `<div class="empty">${icon('lock')} Privat</div>`}</div>
    </div>`;
  F.bindFriendButtons(root);
}

function ownView(root, uid) {
  const p = state.profile || {}; const pv = p.privacy || {};
  const pub = { username: p.username, avatar: p.avatar };
  root.innerHTML = `
    <div class="page-head"><div><h1>Profil</h1><p>So sehen andere Mitglieder dich – du entscheidest, was öffentlich ist.</p></div>
      <div class="row"><a class="btn" href="#/u/${uid}">Öffentliche Ansicht</a></div></div>
    ${F.profileTabs('')}
    <section class="hero"><div class="row gap16 wrap" style="position:relative;z-index:1">
      <label style="cursor:pointer;position:relative" title="Profilbild ändern">${avatar(pub, 'lg')}<input type="file" accept="image/*" id="avf" hidden>
        <span style="position:absolute;right:-2px;bottom:-2px;width:28px;height:28px;border-radius:50%;background:var(--acc);color:var(--acc-ink);display:grid;place-items:center">${icon('edit')}</span></label>
      <div style="flex:1;min-width:0"><h1>${esc(p.username)}</h1><p class="muted mt8">${[p.experience && expName(p.experience), p.trainingSince && 'Training ' + sinceText(p.trainingSince), p.bodyweight && fmtKg(p.bodyweight), p.height && fmt(p.height) + ' cm'].filter(Boolean).map(esc).join(' · ') || 'Ergänze dein Profil, um mehr zu zeigen.'}</p>
      <div class="row wrap mt8">${F.flame(uid)}<span class="muted small">Trainings-Streak · Rekord ${streak(uid).best} · ${Object.keys(state.friends || {}).length} Freunde</span></div>
      ${p.avatar ? '<button class="btn ghost sm mt8" id="avdel">Profilbild entfernen</button>' : ''}</div></div></section>
    <div class="grid g2 mt16">
      <form class="card" id="pf" novalidate><div class="card-h"><h2>Persönliche Daten</h2></div>
        <div class="form-grid">
          <div class="field"><label>Körpergewicht (kg)</label><input class="input" name="bodyweight" inputmode="decimal" value="${p.bodyweight ?? ''}"></div>
          <div class="field"><label>Größe (cm)</label><input class="input" name="height" inputmode="decimal" value="${p.height ?? ''}"></div>
          <div class="field"><label>Geschlecht</label><select class="input" name="sex"><option value="">Keine Angabe</option><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Männlich</option><option value="w" ${p.sex === 'w' ? 'selected' : ''}>Weiblich</option></select></div>
          <div class="field"><label>Geburtsjahr</label><input class="input" name="birthYear" inputmode="numeric" value="${p.birthYear ?? ''}" placeholder="privat"></div>
          <div class="field"><label>Trainingsbeginn</label><input class="input" type="month" name="trainingSince" value="${p.trainingSince ?? ''}" max="${new Date().toISOString().slice(0, 7)}"></div>
          <div class="field"><label>Erfahrung</label><select class="input" name="experience">${EXP.map(([k, n]) => `<option value="${k}" ${p.experience === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field full"><label>Kurzbeschreibung</label><input class="input" name="bio" maxlength="120" value="${esc(p.bio || '')}" placeholder="z. B. Powerlifting · Ziel: 200 kg Kreuzheben"></div>
          <div class="full"><button class="btn pri" type="submit">Speichern</button></div>
        </div></form>
      <div class="card"><div class="card-h"><h2>${icon('lock')}Sichtbarkeit</h2></div>
        <p class="muted small">Benutzername und Profilbild sind für Mitglieder immer sichtbar. Geburtsjahr bleibt immer privat.</p>
        <div class="list mt8">${[
          ['weight', 'Körpergewicht anzeigen'], ['height', 'Größe anzeigen'], ['training', 'Trainingsbeginn & Erfahrung anzeigen'],
          ['sex', 'Geschlecht für Leaderboard-Filter freigeben'], ['prs', 'Bestleistungen im Profil anzeigen'], ['ranks', 'Platzierungen im Profil anzeigen']
        ].map(([k, n]) => `<label class="li" style="cursor:pointer"><span class="grow">${n}</span><span class="switch"><input type="checkbox" data-pv="${k}" ${pv[k] ? 'checked' : ''}><span></span></span></label>`).join('')}</div>
        <p class="hint mt8">Leaderboard-Einträge (Benutzername, Gewicht, Wdh., ggf. Körpergewicht im Eintrag) sind für angemeldete Mitglieder sichtbar – das ist der Sinn der Ranglisten.</p></div>
    </div>
    <div class="grid g2 mt16">
      <div class="card"><div class="card-h"><h2>${icon('star')}Persönliche Bestleistungen</h2></div>${prsHtml(uid)}</div>
      <div class="card"><div class="card-h"><h2>${icon('trophy')}Leaderboard-Platzierungen</h2></div>${ranksHtml(uid)}</div>
    </div>`;

  const pf = root.querySelector('#pf');
  pf.onsubmit = (e) => {
    e.preventDefault();
    const bw = num(pf.bodyweight.value), h = num(pf.height.value), by = num(pf.birthYear.value); const y = new Date().getFullYear();
    let ok = fieldErr(pf.bodyweight, bw != null && (isNaN(bw) || bw < 30 || bw > 250) ? '30–250 kg' : '');
    ok = fieldErr(pf.height, h != null && (isNaN(h) || h < 120 || h > 230) ? '120–230 cm' : '') && ok;
    ok = fieldErr(pf.birthYear, by != null && (isNaN(by) || by < y - 100 || by > y - 10) ? `${y - 100}–${y - 10}` : '') && ok;
    if (!ok) return;
    busy(pf.querySelector('[type=submit]'), async () => {
      try {
        await saveProfile({ bodyweight: bw, height: h, birthYear: by, sex: pf.sex.value || null, trainingSince: pf.trainingSince.value || null, experience: pf.experience.value || null, bio: pf.bio.value.trim() || null });
        toast('Profil gespeichert'); ownView(root, uid);
      } catch (err) { toast(authErrorText(err), 'err'); }
    });
  };
  root.querySelectorAll('[data-pv]').forEach((cb) => cb.onchange = async () => {
    const privacy = { ...(state.profile.privacy || {}), [cb.dataset.pv]: cb.checked };
    try { await saveProfile({ privacy }); toast('Sichtbarkeit aktualisiert'); } catch (err) { cb.checked = !cb.checked; toast(authErrorText(err), 'err'); }
  });
  root.querySelector('#avf').onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Bitte eine Bilddatei wählen.', 'err');
    try { const data = await resizeImage(file, 192); await saveProfile({ avatar: data }); toast('Profilbild aktualisiert'); updateUserChip(); ownView(root, uid); }
    catch (err) { console.error(err); toast('Bild konnte nicht gespeichert werden.', 'err'); }
  };
  const del = root.querySelector('#avdel');
  if (del) del.onclick = async () => { try { await saveProfile({ avatar: null }); updateUserChip(); ownView(root, uid); } catch (err) { toast(authErrorText(err), 'err'); } };
}

/** Bild quadratisch zuschneiden + verkleinern → JPEG-DataURL (klein genug für die Datenbank) */
function resizeImage(file, size) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height); const c = document.createElement('canvas'); c.width = c.height = size;
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Bild ungültig')); };
    img.src = url;
  });
}
