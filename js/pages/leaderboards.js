import { state, ready, subscribe, ranking, userEntries, addEntry, updateEntry, deleteEntry, personalRecords } from '../store.js';
import { EXERCISES, EX, GROUPS, WEIGHT_CLASSES, exLabel, unitHint, metrics } from '../data/exercises.js';
import { esc, icon, fmt, fmtKg, fmtDate, today, num, modal, toast, busy, fieldErr, confirmDialog, avatar, rankBadge, loading } from '../ui.js';
import { authErrorText } from '../firebase.js';

const ui = { group: 'all', q: '', metric: 'abs', sex: 'all', wc: 'all' };
try { Object.assign(ui, JSON.parse(localStorage.getItem('forge_lb') || '{}'), { q: '' }); } catch {}
const saveUi = () => { try { localStorage.setItem('forge_lb', JSON.stringify(ui)); } catch {} };

export async function render(root, { args }) {
  let exId = EX[args[0]] ? args[0] : (ui.last && EX[ui.last] ? ui.last : 'bench_bb');
  ui.last = exId; saveUi();
  root.innerHTML = `
    <div class="page-head"><div><h1>Leaderboards</h1><p>${EXERCISES.length} Übungen · jede Variante mit eigener Rangliste. Nur echte Einträge der Community.</p></div>
      <button class="btn pri" id="add">${icon('plus')}Leistung eintragen</button></div>
    <div class="lb-layout">
      <aside class="card ex-side" style="padding:0">
        <div style="padding:12px 12px 0"><input class="input" id="q" placeholder="Übung suchen…"></div>
        <div class="chips" style="padding:10px 12px 0" id="groups"></div>
        <div class="ex-list" id="exlist"></div>
      </aside>
      <section style="min-width:0">
        <div class="ex-mobile-select card" style="margin-bottom:12px;padding:12px">
          <select class="input" id="exsel">${GROUPS.map((g) => `<optgroup label="${g.name}">${EXERCISES.filter((e) => e.group === g.id).map((e) => `<option value="${e.id}">${esc(exLabel(e))}</option>`).join('')}</optgroup>`).join('')}</select>
        </div>
        <div id="board">${loading()}</div>
      </section>
    </div>`;

  const exlist = root.querySelector('#exlist');
  const counts = () => { const c = {}; for (const [id, m] of Object.entries(state.entries || {})) c[id] = new Set(Object.values(m || {}).map((e) => e.uid)).size; return c; };
  const drawList = () => {
    const c = counts(); const q = ui.q.toLowerCase();
    exlist.innerHTML = GROUPS.filter((g) => ui.group === 'all' || ui.group === g.id).map((g) => {
      const items = EXERCISES.filter((e) => e.group === g.id && (!q || exLabel(e).toLowerCase().includes(q)));
      if (!items.length) return '';
      return `<div class="ex-group">${g.name}</div>` + items.map((e) => `<div class="ex-item${e.id === exId ? ' on' : ''}" data-ex="${e.id}"><span class="ellip">${esc(e.name)} <span class="dim xs">${esc(e.equip)}</span></span>${c[e.id] ? `<span class="xs dim">${c[e.id]}</span>` : ''}</div>`).join('');
    }).join('') || '<div class="empty" style="margin:8px">Keine Übung gefunden.</div>';
  };
  root.querySelector('#groups').innerHTML = [['all', 'Alle'], ...GROUPS.map((g) => [g.id, g.name])].map(([id, n]) => `<button class="chip${ui.group === id ? ' on' : ''}" data-g="${id}">${n}</button>`).join('');
  root.querySelector('#groups').onclick = (e) => { const b = e.target.closest('[data-g]'); if (!b) return; ui.group = b.dataset.g; saveUi(); root.querySelectorAll('[data-g]').forEach((x) => x.classList.toggle('on', x === b)); drawList(); };
  root.querySelector('#q').oninput = (e) => { ui.q = e.target.value; drawList(); };
  exlist.onclick = (e) => { const it = e.target.closest('[data-ex]'); if (it) location.hash = `#/leaderboards/${it.dataset.ex}`; };
  const sel = root.querySelector('#exsel'); sel.value = exId; sel.onchange = () => { location.hash = `#/leaderboards/${sel.value}`; };
  root.querySelector('#add').onclick = () => entryDialog(exId);

  drawList();
  setTimeout(() => { const on = exlist.querySelector('.on'); if (on) exlist.scrollTop = on.offsetTop - exlist.clientHeight / 2; }, 0);
  await ready();
  const draw = () => { if (!root.isConnected) return; drawList(); drawBoard(root.querySelector('#board'), exId); };
  draw();
  return subscribe((w) => { if (w === 'entries' || w === 'publics' || w === 'profile') draw(); });
}

function valueText(ex, it, metric) {
  if (metric === 'rel') return `${fmt(it.value, 2)}× KG`;
  if (metric === 'e1rm') return fmtKg(Math.round(it.value * 2) / 2);
  return (ex.type === 'bw' ? '+' : '') + fmtKg(it.weight);
}

function drawBoard(el, exId) {
  const ex = EX[exId];
  const wc = WEIGHT_CLASSES.find((w) => w.id === ui.wc) || WEIGHT_CLASSES[0];
  const metric = ui.metric;
  const list = ranking(exId, metric, { sex: ui.sex, wc });
  const myIdx = list.findIndex((x) => x.uid === state.uid);
  const mine = userEntries().filter((e) => e.exId === exId);
  const pr = personalRecords()[exId];
  const sub = (it) => {
    const p = []; p.push(`${it.reps} Wdh.`);
    if (metric !== 'abs') p.push((ex.type === 'bw' ? '+' : '') + fmtKg(it.weight));
    if (it.bw) p.push(`KG ${fmtKg(it.bw)}`);
    return p.join(' · ');
  };
  const pod = list.slice(0, 3);
  const podHtml = pod.length >= 3 ? `<div class="podium">${[1, 0, 2].map((i) => { const it = pod[i]; const pub = state.publics[it.uid];
    return `<a class="pod p${i + 1}" href="#/u/${it.uid}" style="color:inherit">${rankBadge(i + 1)}<div class="mt8">${avatar(pub, i === 0 ? '' : 'sm')}</div><div class="ellip" style="font-weight:600">${esc(pub.username)}</div><div class="w num">${valueText(ex, it, metric)}</div><div class="xs muted">${sub(it)}</div></a>`; }).join('')}</div>` : '';

  el.innerHTML = `
    <div class="card">
      <div class="card-h" style="align-items:flex-start;flex-wrap:wrap">
        <div><h2>${esc(ex.name)}</h2><div class="row wrap mt8"><span class="tag">${esc(ex.equip)}</span><span class="tag">${esc(unitHint(ex))}</span>${ex.type === 'bw' ? '<span class="tag acc">Körpergewicht + Zusatz</span>' : ''}</div></div>
        ${myIdx >= 0 ? `<div style="text-align:right"><div class="xs muted">Dein Rang</div><div style="font-size:26px;font-weight:800" class="acc">#${myIdx + 1}<span class="muted" style="font-size:14px;font-weight:500"> / ${list.length}</span></div></div>` : ''}
      </div>
      <div class="row wrap" style="gap:8px">
        <div class="seg" id="metric">${[['abs', ex.type === 'bw' ? 'Zusatzgewicht' : 'Gewicht'], ['rel', 'Relativ (×KG)'], ['e1rm', '1RM geschätzt']].map(([k, n]) => `<button data-m="${k}" class="${metric === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="seg" id="sex">${[['all', 'Alle'], ['m', 'Männlich'], ['w', 'Weiblich']].map(([k, n]) => `<button data-s="${k}" class="${ui.sex === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <select class="input" id="wc" style="width:auto;height:34px">${WEIGHT_CLASSES.map((w) => `<option value="${w.id}" ${w.id === ui.wc ? 'selected' : ''}>${w.id === 'all' ? 'Alle Gewichtsklassen' : 'KG ' + w.name}</option>`).join('')}</select>
      </div>
      <p class="hint mt8">${metric === 'rel' ? 'Relativ = ' + (ex.type === 'bw' ? '(Körpergewicht + Zusatz)' : 'Gewicht') + ' ÷ Körpergewicht. Nur Einträge mit Körpergewicht werden gewertet.' : metric === 'e1rm' ? 'Geschätztes 1-Wiederholungs-Maximum nach Epley (Gewicht × (1 + Wdh./30), max. 12 Wdh. gewertet). Nur ein Richtwert.' + (ex.type === 'bw' ? ' Bei Körpergewichtsübungen nur mit Körpergewicht.' : '') : 'Gewertet wird pro Person der beste Eintrag – bei gleichem Gewicht zählen mehr Wiederholungen.'}${ui.wc !== 'all' ? ' Gewichtsklasse = Körpergewicht im Eintrag.' : ''}${ui.sex !== 'all' ? ' Geschlechterfilter zeigt nur Personen, die ihr Geschlecht im Profil freigegeben haben.' : ''}</p>
      <div class="mt16">${podHtml}
      ${list.length ? `<div class="scroll-x"><table class="table"><thead><tr><th style="width:44px">#</th><th>Athlet</th><th class="r">${metric === 'rel' ? 'Relativ' : metric === 'e1rm' ? '1RM' : 'Gewicht'}</th><th class="r hide-sm">Details</th><th class="r hide-sm">Datum</th></tr></thead><tbody>
        ${list.map((it, i) => { const pub = state.publics[it.uid] || {};
          return `<tr class="${it.uid === state.uid ? 'me' : ''}"><td>${rankBadge(i + 1)}</td><td><a href="#/u/${it.uid}" class="row" style="color:inherit">${avatar(pub, 'sm')}<span class="ellip" style="font-weight:600">${esc(pub.username)}</span></a></td>
          <td class="r num" style="font-weight:700">${valueText(ex, it, metric)}<div class="xs muted" style="font-weight:400">${it.reps} Wdh.</div></td><td class="r hide-sm muted small">${sub(it)}</td><td class="r hide-sm muted small">${fmtDate(it.date)}</td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="empty"><b>Noch keine Einträge${ui.sex !== 'all' || ui.wc !== 'all' || metric !== 'abs' ? ' für diesen Filter' : ''}</b>Sei die erste Person in diesem Leaderboard.</div>`}
      </div>
    </div>
    <div class="card mt16">
      <div class="card-h"><h2>Deine Einträge</h2>${pr ? `<span class="tag acc">PR: ${ex.type === 'bw' ? '+' : ''}${fmtKg(pr.weight)} × ${pr.reps}</span>` : ''}</div>
      ${mine.length ? `<div class="list">${mine.map((e) => `<div class="li"><div class="grow"><div style="font-weight:600" class="num">${ex.type === 'bw' ? '+' : ''}${fmtKg(e.weight)} × ${e.reps} Wdh.${e.sets ? ` · ${e.sets} Sätze` : ''} ${pr && pr.id === e.id ? '<span class="tag acc">PR</span>' : ''}</div>
        <div class="xs muted">${fmtDate(e.date)}${e.bw ? ` · KG ${fmtKg(e.bw)}` : ''}${metrics(ex, e).e1rm ? ` · 1RM ≈ ${fmt(metrics(ex, e).e1rm, 1)} kg` : ''}${e.note ? ' · ' + esc(e.note) : ''}</div></div>
        <button class="btn ghost icon" data-edit="${e.id}" title="Bearbeiten">${icon('edit')}</button><button class="btn ghost icon" data-del="${e.id}" title="Löschen">${icon('trash')}</button></div>`).join('')}</div>`
        : '<div class="empty">Du hast für diese Übung noch nichts eingetragen.</div>'}
    </div>`;

  el.querySelector('#metric').onclick = (e) => { const b = e.target.closest('[data-m]'); if (b) { ui.metric = b.dataset.m; saveUi(); drawBoard(el, exId); } };
  el.querySelector('#sex').onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { ui.sex = b.dataset.s; saveUi(); drawBoard(el, exId); } };
  el.querySelector('#wc').onchange = (e) => { ui.wc = e.target.value; saveUi(); drawBoard(el, exId); };
  el.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => entryDialog(exId, mine.find((x) => x.id === b.dataset.edit)));
  el.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    if (!(await confirmDialog('Diesen Eintrag endgültig löschen?'))) return;
    try { await deleteEntry(exId, b.dataset.del); toast('Eintrag gelöscht'); } catch (err) { toast(authErrorText(err), 'err'); }
  });
}

export function entryDialog(exId, entry = null) {
  const ex = EX[exId]; const p = state.profile || {};
  const bwDefault = entry ? (entry.bw ?? '') : (p.bodyweight ?? '');
  modal({
    title: entry ? 'Eintrag bearbeiten' : 'Leistung eintragen',
    body: `<form class="form-grid" novalidate>
      <div class="field full"><label>Übung / Variante</label>
        <select class="input" name="ex" ${entry ? 'disabled' : ''}>${GROUPS.map((g) => `<optgroup label="${g.name}">${EXERCISES.filter((e) => e.group === g.id).map((e) => `<option value="${e.id}" ${e.id === exId ? 'selected' : ''}>${esc(exLabel(e))}</option>`).join('')}</optgroup>`).join('')}</select>
        <div class="hint" id="uh">${esc(unitHint(ex))}</div></div>
      <div class="field"><label id="wl">${ex.type === 'bw' ? 'Zusatzgewicht (kg)' : 'Gewicht (kg)'}</label><input class="input" name="weight" inputmode="decimal" value="${entry ? entry.weight : ''}" placeholder="${ex.type === 'bw' ? '0 = ohne Zusatz' : 'z. B. 80'}"></div>
      <div class="field"><label>Wiederholungen</label><input class="input" name="reps" inputmode="numeric" value="${entry ? entry.reps : 1}"></div>
      <div class="field"><label>Sätze (optional)</label><input class="input" name="sets" inputmode="numeric" value="${entry?.sets ?? ''}"></div>
      <div class="field"><label>Datum</label><input class="input" type="date" name="date" max="${today()}" value="${entry ? entry.date : today()}"></div>
      <div class="field full"><label>Körpergewicht (kg) <span class="dim">${ex.type === 'bw' ? '– empfohlen für Gesamtlast & relative Wertung' : '– optional, für relative Wertung & Gewichtsklassen'}</span></label><input class="input" name="bw" inputmode="decimal" value="${bwDefault}" placeholder="z. B. 75"></div>
      <div class="field full"><label>Notiz (optional)</label><input class="input" name="note" maxlength="80" value="${esc(entry?.note || '')}"></div>
      <p class="hint full">Einträge sind für angemeldete Mitglieder in der Rangliste sichtbar (Benutzername, Gewicht, Wdh., Körpergewicht falls angegeben). Bitte nur echte Leistungen mit sauberer Technik eintragen.</p>
    </form>`,
    foot: `<button class="btn ghost" data-c>Abbrechen</button><button class="btn pri" data-s>${entry ? 'Speichern' : 'Eintragen'}</button>`,
    onMount: (m, close) => {
      const f = m.querySelector('form');
      f.ex.onchange = () => { const e = EX[f.ex.value]; m.querySelector('#uh').textContent = unitHint(e); m.querySelector('#wl').textContent = e.type === 'bw' ? 'Zusatzgewicht (kg)' : 'Gewicht (kg)'; };
      m.querySelector('[data-c]').onclick = close;
      const submit = async () => {
        const id = f.ex.value; const e = EX[id];
        const w = num(f.weight.value), reps = num(f.reps.value), sets = num(f.sets.value), bw = num(f.bw.value);
        let ok = fieldErr(f.weight, w == null ? 'Bitte Gewicht angeben.' : (isNaN(w) || w < 0 || w > 500) ? 'Gewicht zwischen 0 und 500 kg.' : (e.type !== 'bw' && w === 0) ? 'Gewicht muss größer als 0 sein.' : '');
        ok = fieldErr(f.reps, (reps == null || isNaN(reps) || !Number.isInteger(reps) || reps < 1 || reps > 100) ? '1–100 ganze Wiederholungen.' : '') && ok;
        ok = fieldErr(f.sets, sets != null && (isNaN(sets) || !Number.isInteger(sets) || sets < 1 || sets > 20) ? '1–20 Sätze.' : '') && ok;
        ok = fieldErr(f.bw, bw != null && (isNaN(bw) || bw < 30 || bw > 250) ? 'Körpergewicht 30–250 kg.' : '') && ok;
        ok = fieldErr(f.date, !f.date.value || f.date.value > today() ? 'Gültiges Datum (nicht in der Zukunft).' : '') && ok;
        if (!ok) return;
        const data = { weight: Math.round(w * 100) / 100, reps, date: f.date.value, sets: sets ?? null, bw: bw != null ? Math.round(bw * 10) / 10 : null, note: f.note.value.trim() || null };
        await busy(m.querySelector('[data-s]'), async () => {
          try {
            const before = personalRecords()[id];
            if (entry) await updateEntry(id, entry.id, data); else await addEntry(id, data);
            close();
            const isPr = !entry && (!before || data.weight > before.weight || (data.weight === before.weight && reps > before.reps));
            toast(isPr ? '🏆 Neuer persönlicher Rekord!' : entry ? 'Eintrag aktualisiert' : 'Eintrag gespeichert');
            if (!entry && id !== exId) location.hash = `#/leaderboards/${id}`;
          } catch (err) { console.error(err); toast(authErrorText(err), 'err'); }
        });
      };
      m.querySelector('[data-s]').onclick = submit;
      f.onsubmit = (ev) => { ev.preventDefault(); submit(); };
      f.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); submit(); } });
    }
  });
}
