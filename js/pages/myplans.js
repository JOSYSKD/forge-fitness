// Eigene Trainingspläne: Editor, Ansicht, Teilen (Link + an Freunde), Kopieren
import { state, listMyPlans, getPlan, savePlanDoc, setPlanShared, deletePlanDoc, sendPlanTo, inbox, removeInbox, savePlan } from '../store.js';
import { EXERCISES, EX, exLabel } from '../data/exercises.js';
import { SPLIT, SPLITS, DAYS } from '../data/splits.js';
import { esc, icon, fmt, toast, busy, fieldErr, confirmDialog, modal, loading, num } from '../ui.js';
import { authErrorText } from '../firebase.js';

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const LABELS = new Map(EXERCISES.map((e) => [exLabel(e).toLowerCase(), e.id]));
const shareUrl = (id) => `${location.origin}${location.pathname}#/plaene/p/${id}`;
const errText = (e) => e?.code === 'forge/no-user' ? 'Diesen Benutzernamen gibt es nicht.' : e?.code === 'forge/self' ? 'Du kannst den Plan nicht an dich selbst senden.' : authErrorText(e);

export function tabs(active) {
  return `<div class="seg" style="margin-bottom:16px">${[['', 'Bekannte Splits'], ['meine', 'Meine Pläne'], ['geteilt', 'Mit mir geteilt']]
    .map(([k, n]) => `<button onclick="location.hash='#/plaene${k ? '/' + k : ''}'" class="${active === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
}
const trainDays = (p) => p.days.filter((d) => !d.rest).length;
const exCount = (p) => p.days.reduce((a, d) => a + (d.rest ? 0 : d.exercises.length), 0);

/* ---------- Liste „Meine Pläne“ ---------- */
export async function renderMine(root) {
  root.innerHTML = `<div class="page-head"><div><h1>Trainingspläne</h1><p>Erstelle deinen eigenen Plan – 100 % individuell – und teile ihn mit Freunden.</p></div>
    <div class="row wrap"><button class="btn" id="tpl">${icon('book')}Aus Split-Vorlage</button><a class="btn pri" href="#/plaene/neu">${icon('plus')}Neuer Plan</a></div></div>
    ${tabs('meine')}<div id="list">${loading()}</div>`;
  root.querySelector('#tpl').onclick = templateDialog;
  try {
    const plans = await listMyPlans();
    if (!root.isConnected) return;
    root.querySelector('#list').innerHTML = plans.length ? `<div class="grid g3">${plans.map(card).join('')}</div>`
      : `<div class="empty"><b>Noch keine eigenen Pläne</b>Baue deinen Plan von Grund auf oder starte mit einer Split-Vorlage und passe alles an.<div class="row mt16" style="justify-content:center"><a class="btn pri sm" href="#/plaene/neu">${icon('plus')}Neuer Plan</a></div></div>`;
  } catch (e) { root.querySelector('#list').innerHTML = `<div class="empty"><b>Fehler</b>${esc(authErrorText(e))}</div>`; }
}
function card(p) {
  return `<a class="card hov" href="#/plaene/p/${p.id}">
    <div class="row between"><span class="tag">${trainDays(p)} Trainingstage</span>${state.plan?.id === p.id ? `<span class="tag acc">${icon('check')}Aktiv</span>` : p.shared ? `<span class="tag acc">Geteilt</span>` : '<span class="tag">Privat</span>'}</div>
    <h2 class="mt12">${esc(p.name)}</h2><p class="muted small mt8">${esc(p.desc || (p.mode === 'week' ? 'Wochenplan' : 'Rotation'))}</p>
    <div class="row mt16" style="gap:4px">${p.days.map((d) => `<div style="flex:1;height:6px;border-radius:3px;background:${d.rest ? 'var(--line)' : 'var(--acc)'}"></div>`).join('')}</div>
    <div class="xs muted mt8">${exCount(p)} Übungen · ${p.mode === 'week' ? 'Mo–So' : p.days.length + '-Tage-Rotation'}</div></a>`;
}

/* ---------- „Mit mir geteilt“ ---------- */
export async function renderShared(root) {
  root.innerHTML = `<div class="page-head"><div><h1>Trainingspläne</h1><p>Pläne, die Freunde dir geschickt haben.</p></div></div>${tabs('geteilt')}<div id="list">${loading()}</div>`;
  const draw = async () => {
    try {
      const inb = Object.entries(await inbox()).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
      if (!root.isConnected) return;
      root.querySelector('#list').innerHTML = inb.length ? `<div class="card"><div class="list">${inb.map(([pid, m]) => `<div class="li"><div class="grow"><a href="#/plaene/p/${pid}" style="font-weight:600;color:var(--text)">${esc(m.planName || 'Trainingsplan')}</a>
          <div class="xs muted">von ${esc(m.fromName || '?')} · ${new Date(m.at).toLocaleDateString('de-DE')}</div></div><a class="btn sm" href="#/plaene/p/${pid}">Ansehen</a><button class="btn ghost icon" data-rm="${pid}" title="Entfernen">${icon('x')}</button></div>`).join('')}</div></div>`
        : '<div class="empty"><b>Noch nichts geteilt</b>Wenn dir jemand einen Plan schickt, erscheint er hier. Geteilte Links funktionieren auch direkt.</div>';
      root.querySelectorAll('[data-rm]').forEach((b) => b.onclick = async () => { try { await removeInbox(b.dataset.rm); draw(); } catch (e) { toast(authErrorText(e), 'err'); } });
    } catch (e) { root.querySelector('#list').innerHTML = `<div class="empty"><b>Fehler</b>${esc(authErrorText(e))}</div>`; }
  };
  draw();
}

/* ---------- Vorlage aus bekanntem Split ---------- */
function parseSession(str) {
  const m = str.match(/^(.*?)\s+(\d+)×(.+)$/);
  const name = (m ? m[1] : str).trim();
  const low = name.toLowerCase();
  const ex = EXERCISES.find((e) => exLabel(e).toLowerCase() === low) || EXERCISES.find((e) => e.name.toLowerCase() === low.replace(/ kh$/, '')) || null;
  return { exId: ex ? ex.id : null, name: ex ? exLabel(ex) : name, sets: m ? +m[2] : 3, reps: m ? m[3].trim() : '8–12', pause: 90, note: '' };
}
export function fromSplit(s) {
  return {
    name: `Mein ${s.name}`, desc: s.short, mode: 'week',
    days: s.week.map((d) => d ? { title: d[0], muscles: d[1], rest: false, exercises: (s.sessions[d[0]] || s.sessions[d[0].split(' /')[0]] || []).map(parseSession) } : { title: 'Ruhetag', muscles: '', rest: true, exercises: [] })
  };
}
function templateDialog() {
  modal({
    title: 'Vorlage wählen',
    body: `<p class="muted small">Startet den Editor mit dem Wochenplan und den Übungen des Splits – danach kannst du alles ändern.</p><div class="list mt12">${SPLITS.map((s) => `<a class="li" style="color:inherit" href="#/plaene/neu/${s.id}"><div class="grow"><b>${esc(s.name)}</b><div class="xs muted">${s.days} Tage · ${esc(s.level)}</div></div>${icon('chevR')}</a>`).join('')}</div>`,
    onMount: (m, close) => m.querySelectorAll('a').forEach((a) => a.addEventListener('click', close))
  });
}

/* ---------- Editor ---------- */
const blankDay = (title = '') => ({ title, muscles: '', rest: false, exercises: [] });
const blankEx = () => ({ exId: null, name: '', sets: 3, reps: '8–12', pause: 90, note: '' });

export async function renderEditor(root, id, templateId) {
  let plan;
  if (id) {
    root.innerHTML = loading();
    try { plan = await getPlan(id); } catch (e) { plan = null; }
    if (!plan || plan.owner !== state.uid) { root.innerHTML = '<div class="empty"><b>Plan nicht gefunden</b>Du kannst nur deine eigenen Pläne bearbeiten.</div>'; return; }
  } else if (templateId && SPLIT[templateId]) plan = fromSplit(SPLIT[templateId]);
  else plan = { name: '', desc: '', mode: 'week', days: WEEKDAYS.map((_, i) => i === 2 || i >= 5 ? { ...blankDay('Ruhetag'), rest: true } : blankDay(`Training ${i + 1}`)) };
  plan = JSON.parse(JSON.stringify(plan));
  let dirty = false;

  root.innerHTML = `
    <a href="#/plaene/meine" class="small muted row" style="gap:4px;margin-bottom:12px">${icon('chevL')}Meine Pläne</a>
    <div class="page-head"><div><h1>${id ? 'Plan bearbeiten' : 'Neuer Trainingsplan'}</h1><p>Alles frei wählbar: Tage, Namen, Übungen, Sätze, Wiederholungen, Pausen, Notizen.</p></div>
      <button class="btn pri" id="save">${icon('check')}Speichern</button></div>
    <div class="card"><div class="form-grid">
      <div class="field"><label>Name des Plans</label><input class="input" id="pname" maxlength="60" value="${esc(plan.name)}" placeholder="z. B. Mein Sommer-Push-Pull"></div>
      <div class="field"><label>Aufbau</label><div class="seg" id="mode"><button type="button" data-m="week" class="${plan.mode === 'week' ? 'on' : ''}">Wochenplan (Mo–So)</button><button type="button" data-m="rot" class="${plan.mode !== 'week' ? 'on' : ''}">Rotation (Tag 1, 2, 3 …)</button></div></div>
      <div class="field full"><label>Beschreibung / Ziel <span class="dim">(optional)</span></label><input class="input" id="pdesc" maxlength="160" value="${esc(plan.desc || '')}" placeholder="z. B. Fokus Oberkörper, 4× pro Woche, Ziel Muskelaufbau"></div>
    </div></div>
    <div id="days" class="col gap16 mt16"></div>
    <datalist id="exlist">${EXERCISES.map((e) => `<option value="${esc(exLabel(e))}">`).join('')}</datalist>
    <div class="row mt16" id="addday-wrap"></div>`;

  const daysEl = root.querySelector('#days');
  const drawDays = () => {
    const week = plan.mode === 'week';
    daysEl.innerHTML = plan.days.map((d, di) => `
      <div class="card" data-day="${di}">
        <div class="row wrap between">
          <div class="row wrap" style="flex:1;min-width:240px">
            <span class="tag acc">${week ? WEEKDAYS[di] : 'Tag ' + (di + 1)}</span>
            <input class="input" data-f="title" value="${esc(d.title)}" maxlength="40" placeholder="${d.rest ? 'Ruhetag' : 'Name, z. B. Push'}" style="flex:1;min-width:140px;max-width:260px">
            ${d.rest ? '' : `<input class="input" data-f="muscles" value="${esc(d.muscles || '')}" maxlength="60" placeholder="Muskelgruppen, z. B. Brust, Schultern" style="flex:2;min-width:160px">`}
          </div>
          <div class="row">
            <label class="row small muted" style="cursor:pointer;gap:6px">Ruhetag<span class="switch"><input type="checkbox" data-f="rest" ${d.rest ? 'checked' : ''}><span></span></span></label>
            ${week ? '' : `<button class="btn ghost icon" data-dup title="Tag duplizieren">${icon('plus')}</button><button class="btn ghost icon" data-delday title="Tag entfernen" ${plan.days.length <= 1 ? 'disabled' : ''}>${icon('trash')}</button>`}
          </div>
        </div>
        ${d.rest ? '' : `<div class="mt12">${d.exercises.length ? `<div class="xs dim" style="margin-bottom:6px">Übung · Sätze × Wiederholungen · Pause (Sek.) · Notiz</div><div class="ex-rows">${d.exercises.map((x, xi) => `
          <div class="ex-row" data-ex="${xi}">
            <span class="dim small num" style="width:18px">${xi + 1}</span>
            <input class="input ex-name" list="exlist" data-x="name" value="${esc(x.name)}" placeholder="Übung suchen oder frei eingeben" maxlength="60">
            <input class="input ex-s" data-x="sets" inputmode="numeric" value="${x.sets ?? ''}" title="Sätze" placeholder="Sätze">
            <span class="dim">×</span>
            <input class="input ex-r" data-x="reps" value="${esc(x.reps ?? '')}" title="Wiederholungen" placeholder="Wdh." maxlength="15">
            <input class="input ex-p" data-x="pause" inputmode="numeric" value="${x.pause ?? ''}" title="Pause in Sekunden" placeholder="Pause s">
            <input class="input ex-n" data-x="note" value="${esc(x.note || '')}" placeholder="Notiz (z. B. RIR 2, Tempo 3-1-1)" maxlength="80">
            <div class="row" style="gap:0"><button class="btn ghost icon" data-up title="Nach oben" ${xi === 0 ? 'disabled' : ''}>↑</button><button class="btn ghost icon" data-down title="Nach unten" ${xi === d.exercises.length - 1 ? 'disabled' : ''}>↓</button><button class="btn ghost icon" data-delex title="Entfernen">${icon('trash')}</button></div>
          </div>`).join('')}</div>` : '<div class="dim small">Noch keine Übungen an diesem Tag.</div>'}
          <button class="btn sm mt12" data-addex>${icon('plus')}Übung hinzufügen</button></div>`}
      </div>`).join('');
    root.querySelector('#addday-wrap').innerHTML = week ? '' : `<button class="btn" id="addday" ${plan.days.length >= 14 ? 'disabled' : ''}>${icon('plus')}Trainingstag hinzufügen</button>`;
    const ad = root.querySelector('#addday'); if (ad) ad.onclick = () => { plan.days.push(blankDay(`Tag ${plan.days.length + 1}`)); dirty = true; drawDays(); };
  };
  drawDays();

  // Eingaben direkt in den Zustand schreiben (ohne Neuzeichnen → Fokus bleibt)
  daysEl.addEventListener('input', (e) => {
    const dEl = e.target.closest('[data-day]'); if (!dEl) return; const d = plan.days[+dEl.dataset.day]; dirty = true;
    if (e.target.dataset.f && e.target.dataset.f !== 'rest') d[e.target.dataset.f] = e.target.value;
    const xEl = e.target.closest('[data-ex]');
    if (xEl && e.target.dataset.x) {
      const x = d.exercises[+xEl.dataset.ex]; const k = e.target.dataset.x;
      if (k === 'name') { x.name = e.target.value; x.exId = LABELS.get(e.target.value.trim().toLowerCase()) || null; }
      else x[k] = e.target.value;
    }
  });
  daysEl.addEventListener('change', (e) => {
    if (e.target.dataset.f !== 'rest') return;
    const d = plan.days[+e.target.closest('[data-day]').dataset.day];
    d.rest = e.target.checked; if (d.rest && !d.title) d.title = 'Ruhetag'; if (!d.rest && d.title === 'Ruhetag') d.title = '';
    dirty = true; drawDays();
  });
  daysEl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const di = +b.closest('[data-day]').dataset.day; const d = plan.days[di];
    const xi = b.closest('[data-ex]') ? +b.closest('[data-ex]').dataset.ex : -1;
    if (b.hasAttribute('data-addex')) { d.exercises.push(blankEx()); drawDays(); daysEl.querySelector(`[data-day="${di}"] [data-ex="${d.exercises.length - 1}"] .ex-name`)?.focus(); }
    else if (b.hasAttribute('data-delex')) d.exercises.splice(xi, 1);
    else if (b.hasAttribute('data-up')) [d.exercises[xi - 1], d.exercises[xi]] = [d.exercises[xi], d.exercises[xi - 1]];
    else if (b.hasAttribute('data-down')) [d.exercises[xi + 1], d.exercises[xi]] = [d.exercises[xi], d.exercises[xi + 1]];
    else if (b.hasAttribute('data-delday')) plan.days.splice(di, 1);
    else if (b.hasAttribute('data-dup')) { if (plan.days.length < 14) plan.days.splice(di + 1, 0, JSON.parse(JSON.stringify(d))); }
    else return;
    dirty = true; if (!b.hasAttribute('data-addex')) drawDays();
  });
  root.querySelector('#mode').onclick = (e) => {
    const b = e.target.closest('[data-m]'); if (!b || b.dataset.m === plan.mode) return;
    plan.mode = b.dataset.m; dirty = true;
    root.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b));
    if (plan.mode === 'week') {
      const train = plan.days.filter((d) => !d.rest);
      plan.days = WEEKDAYS.map((_, i) => train[i] || { ...blankDay('Ruhetag'), rest: true });
      if (train.length > 7) toast('Wochenplan hat nur 7 Tage – überzählige Tage wurden entfernt.', 'err');
    } else {
      plan.days = plan.days.filter((d) => !d.rest); if (!plan.days.length) plan.days = [blankDay('Tag 1')];
    }
    drawDays();
  };
  root.querySelector('#pname').oninput = (e) => { plan.name = e.target.value; dirty = true; };
  root.querySelector('#pdesc').oninput = (e) => { plan.desc = e.target.value; dirty = true; };

  root.querySelector('#save').onclick = (e) => {
    const pn = root.querySelector('#pname');
    if (!fieldErr(pn, plan.name.trim().length < 2 ? 'Bitte gib deinem Plan einen Namen.' : '')) { pn.focus(); return; }
    if (!plan.days.some((d) => !d.rest)) return toast('Mindestens ein Trainingstag ist nötig.', 'err');
    // Übungen prüfen
    let bad = null;
    plan.days.forEach((d, di) => d.rest || d.exercises.forEach((x, xi) => {
      const sets = num(x.sets), pause = num(x.pause);
      const el = (k) => daysEl.querySelector(`[data-day="${di}"] [data-ex="${xi}"] [data-x="${k}"]`);
      const errs = [[el('name'), !String(x.name).trim() ? 'Name fehlt' : ''], [el('sets'), sets != null && (isNaN(sets) || sets < 1 || sets > 20 || !Number.isInteger(sets)) ? '1–20' : ''], [el('pause'), pause != null && (isNaN(pause) || pause < 0 || pause > 900) ? '0–900' : '']];
      for (const [i, m] of errs) if (i) { i.classList.toggle('bad', !!m); if (m && !bad) bad = i; }
    }));
    if (bad) { bad.focus(); return toast('Bitte markierte Felder korrigieren.', 'err'); }
    const data = {
      name: plan.name.trim(), desc: (plan.desc || '').trim() || null, mode: plan.mode, shared: !!plan.shared, createdAt: plan.createdAt, copiedFrom: plan.copiedFrom || null,
      days: plan.days.map((d) => ({ title: d.title.trim() || (d.rest ? 'Ruhetag' : 'Training'), muscles: d.rest ? null : (d.muscles || '').trim() || null, rest: !!d.rest,
        exercises: d.rest ? [] : d.exercises.map((x) => ({ exId: x.exId || null, name: String(x.name).trim(), sets: num(x.sets) ?? null, reps: String(x.reps ?? '').trim() || null, pause: num(x.pause) ?? null, note: (x.note || '').trim() || null })) }))
    };
    busy(e.currentTarget, async () => {
      try { const key = await savePlanDoc(id, data); dirty = false; toast('Plan gespeichert'); location.hash = `#/plaene/p/${key}`; }
      catch (err) { console.error(err); toast(authErrorText(err), 'err'); }
    });
  };
  const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', warn);
  return () => window.removeEventListener('beforeunload', warn);
}

/* ---------- Ansicht eines eigenen/geteilten Plans ---------- */
export async function renderPlan(root, id) {
  root.innerHTML = loading();
  let p = null;
  try { p = await getPlan(id); } catch (e) { p = null; }
  if (!root.isConnected) return;
  if (!p) { root.innerHTML = `<div class="empty"><b>Plan nicht verfügbar</b>Der Plan existiert nicht mehr oder wurde vom Ersteller auf privat gestellt.<div class="mt12"><a class="btn sm" href="#/plaene/geteilt">Zurück</a></div></div>`; return; }
  const own = p.owner === state.uid; const active = state.plan?.id === id;
  const week = p.mode === 'week';
  const todayIdx = (new Date().getDay() + 6) % 7;
  root.innerHTML = `
    <a href="#/plaene/${own ? 'meine' : 'geteilt'}" class="small muted row" style="gap:4px;margin-bottom:12px">${icon('chevL')}${own ? 'Meine Pläne' : 'Mit mir geteilt'}</a>
    <section class="hero">
      <div class="row wrap" style="position:relative;z-index:1"><span class="tag">${trainDays(p)} Trainingstage</span><span class="tag">${week ? 'Wochenplan' : p.days.length + '-Tage-Rotation'}</span><span class="tag">${exCount(p)} Übungen</span>${own ? (p.shared ? '<span class="tag acc">Geteilt</span>' : '<span class="tag">Privat</span>') : `<span class="tag acc">von ${esc(p.ownerName || '?')}</span>`}</div>
      <h1 class="mt12" style="position:relative;z-index:1">${esc(p.name)}</h1>
      ${p.desc ? `<p class="muted mt8" style="position:relative;z-index:1;max-width:680px">${esc(p.desc)}</p>` : ''}
      <div class="qlinks">
        <button class="btn ${active ? '' : 'pri'}" id="act">${icon(active ? 'check' : 'bookmark')}${active ? 'Aktiver Plan' : 'Als meinen Plan wählen'}</button>
        ${own ? `<a class="btn" href="#/plaene/edit/${id}">${icon('edit')}Bearbeiten</a><button class="btn" id="share">${icon('compare')}Teilen</button><button class="btn danger" id="del">${icon('trash')}Löschen</button>`
              : `<button class="btn" id="copy">${icon('plus')}In meine Pläne kopieren</button>`}
      </div>
    </section>
    <div class="card mt16"><div class="card-h"><h2>${icon('calendar')}Übersicht</h2></div>
      <div class="week" style="grid-template-columns:repeat(${Math.min(7, p.days.length)},minmax(0,1fr))">${p.days.map((d, i) => `<div class="day${d.rest ? ' rest' : ''}" ${week && i === todayIdx ? 'style="border-color:rgba(var(--acc-rgb),.6)"' : ''}><div class="d">${week ? DAYS[i] : 'Tag ' + (i + 1)}${week && i === todayIdx ? ' · heute' : ''}</div><div class="t">${esc(d.title)}</div><div class="m">${d.rest ? 'Regeneration' : esc(d.muscles || d.exercises.length + ' Übungen')}</div></div>`).join('')}</div></div>
    <div class="grid g2 mt16">${p.days.map((d, i) => d.rest ? '' : `<div class="card"><div class="card-h"><h2><span class="tag acc">${week ? WEEKDAYS[i] : 'Tag ' + (i + 1)}</span>${esc(d.title)}</h2></div>
      ${d.muscles ? `<p class="small muted" style="margin-top:-6px;margin-bottom:10px">${esc(d.muscles)}</p>` : ''}
      ${d.exercises.length ? `<div class="scroll-x"><table class="table"><thead><tr><th>Übung</th><th class="r">Sätze × Wdh.</th><th class="r hide-sm">Pause</th></tr></thead><tbody>${d.exercises.map((x) => `<tr><td>${x.exId && EX[x.exId] ? `<a href="#/leaderboards/${x.exId}" style="color:var(--text);font-weight:500">${esc(x.name)}</a>` : `<span style="font-weight:500">${esc(x.name)}</span>`}${x.note ? `<div class="xs muted">${esc(x.note)}</div>` : ''}</td><td class="r num">${x.sets ?? '–'} × ${esc(x.reps || '–')}</td><td class="r hide-sm muted small">${x.pause != null ? fmtPause(x.pause) : '–'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="dim small">Keine Übungen eingetragen.</div>'}</div>`).join('')}</div>`;

  root.querySelector('#act').onclick = (e) => busy(e.currentTarget, async () => {
    try {
      if (active) { if (!(await confirmDialog('Diesen Plan als aktiven Plan abwählen?', 'Abwählen'))) return; await savePlan(null); toast('Plan abgewählt'); }
      else { await savePlan({ id, custom: true, name: p.name, since: Date.now() }); toast(`„${p.name}“ ist jetzt dein Plan`); }
      renderPlan(root, id);
    } catch (err) { toast(authErrorText(err), 'err'); }
  });
  if (own) {
    root.querySelector('#share').onclick = () => shareDialog(p, () => renderPlan(root, id));
    root.querySelector('#del').onclick = async () => {
      if (!(await confirmDialog(`„${p.name}“ endgültig löschen? Geteilte Links funktionieren danach nicht mehr.`))) return;
      try { await deletePlanDoc(id); toast('Plan gelöscht'); location.hash = '#/plaene/meine'; } catch (err) { toast(authErrorText(err), 'err'); }
    };
  } else {
    root.querySelector('#copy').onclick = (e) => busy(e.currentTarget, async () => {
      try {
        const { id: _i, owner, ownerName, shared, createdAt, updatedAt, ...rest } = p;
        const key = await savePlanDoc(null, { ...rest, name: `${p.name} (Kopie)`, shared: false, copiedFrom: `${ownerName || ''}`.slice(0, 20) || null });
        toast('In deine Pläne kopiert – jetzt frei anpassbar'); location.hash = `#/plaene/edit/${key}`;
      } catch (err) { toast(authErrorText(err), 'err'); }
    });
  }
}
const fmtPause = (s) => s >= 60 ? `${fmt(s / 60, s % 60 ? 1 : 0)} min` : `${s} s`;

function shareDialog(p, onChange) {
  const url = shareUrl(p.id);
  modal({
    title: 'Plan teilen',
    body: `
      <label class="li" style="cursor:pointer;padding-top:0"><span class="grow"><b>Per Link teilbar</b><div class="xs muted">Jedes angemeldete Mitglied mit dem Link kann den Plan ansehen und kopieren.</div></span><span class="switch"><input type="checkbox" id="sh" ${p.shared ? 'checked' : ''}><span></span></span></label>
      <div class="field mt12"><label>Link</label><div class="row"><input class="input" id="url" readonly value="${esc(url)}"><button class="btn" id="cp">Kopieren</button></div></div>
      ${navigator.share ? '<button class="btn block mt8" id="ns">Über Apps teilen…</button>' : ''}
      <div class="sep"></div>
      <div class="field"><label>An Freund senden (Benutzername)</label><div class="row"><input class="input" id="fr" placeholder="Benutzername" autocapitalize="none" spellcheck="false" maxlength="20"><button class="btn pri" id="send">Senden</button></div>
      <div class="hint">Der Plan erscheint bei deinem Freund unter „Mit mir geteilt“. Senden schaltet das Teilen automatisch ein.</div></div>`,
    onMount: (m) => {
      const sh = m.querySelector('#sh');
      sh.onchange = async () => { try { await setPlanShared(p.id, sh.checked); p.shared = sh.checked; toast(sh.checked ? 'Teilen aktiviert' : 'Plan ist jetzt privat'); onChange(); } catch (e) { sh.checked = !sh.checked; toast(authErrorText(e), 'err'); } };
      const ensureShared = async () => { if (!p.shared) { await setPlanShared(p.id, true); p.shared = true; sh.checked = true; onChange(); } };
      m.querySelector('#cp').onclick = async () => {
        try { await ensureShared(); await navigator.clipboard.writeText(url); toast('Link kopiert'); }
        catch { m.querySelector('#url').select(); document.execCommand('copy'); toast('Link kopiert'); }
      };
      const ns = m.querySelector('#ns'); if (ns) ns.onclick = async () => { try { await ensureShared(); await navigator.share({ title: p.name, text: `Mein Trainingsplan „${p.name}“ auf FORGE`, url }); } catch {} };
      const fr = m.querySelector('#fr');
      const send = (e) => {
        if (!fieldErr(fr, fr.value.trim() ? '' : 'Benutzername eingeben')) return;
        busy(m.querySelector('#send'), async () => {
          try { const n = await sendPlanTo(fr.value, p); p.shared = true; sh.checked = true; fr.value = ''; fieldErr(fr, ''); toast(`An ${n} gesendet`); onChange(); }
          catch (err) { fieldErr(fr, errText(err)); }
        });
      };
      m.querySelector('#send').onclick = send;
      fr.onkeydown = (e) => { if (e.key === 'Enter') send(); };
    }
  });
}
