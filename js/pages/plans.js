import { SPLITS, SPLIT, DAYS, MUSCLES, avgFreq } from '../data/splits.js';
import { state, savePlan } from '../store.js';
import { esc, icon, fmt, toast, busy, confirmDialog } from '../ui.js';
import { authErrorText } from '../firebase.js';

let cmpSel = [];
try { cmpSel = JSON.parse(localStorage.getItem('forge_cmp') || '[]').filter((id) => SPLIT[id]); } catch {}
const saveCmp = () => { try { localStorage.setItem('forge_cmp', JSON.stringify(cmpSel)); } catch {} };

export function render(root, { args }) {
  if (args[0] === 'vergleich') return compare(root);
  if (args[0] && SPLIT[args[0]]) return detail(root, SPLIT[args[0]]);
  list(root);
}

const flexTxt = (n) => ['', 'sehr starr', 'eher starr', 'mittel', 'flexibel', 'sehr flexibel'][n];
const dots = (n) => `<span class="acc" style="letter-spacing:2px">${'●'.repeat(n)}</span><span class="dim" style="letter-spacing:2px">${'●'.repeat(5 - n)}</span>`;

function list(root) {
  let fDays = 'all';
  root.innerHTML = `<div class="page-head"><div><h1>Trainingspläne</h1><p>${SPLITS.length} bewährte Trainingssplits mit Wochenplan, Frequenz und Regenerationshinweisen.</p></div>
    <a class="btn" href="#/plaene/vergleich">${icon('compare')}Splits vergleichen</a></div>
    <div class="chips" id="fd"></div><div class="grid g3 mt16" id="grid"></div>`;
  const fd = root.querySelector('#fd');
  const opts = [['all', 'Alle'], ['2', '2 Tage'], ['3', '3 Tage'], ['4', '4 Tage'], ['5', '5 Tage'], ['6', '6 Tage']];
  const draw = () => {
    fd.innerHTML = opts.map(([k, n]) => `<button class="chip${fDays === k ? ' on' : ''}" data-d="${k}">${n}</button>`).join('');
    root.querySelector('#grid').innerHTML = SPLITS.filter((s) => fDays === 'all' || String(s.days) === fDays).map((s) => `
      <a class="card hov" href="#/plaene/${s.id}">
        <div class="row between"><span class="tag">${s.days} Tage/Woche</span>${state.plan?.id === s.id ? `<span class="tag acc">${icon('check')}Dein Plan</span>` : `<span class="tag">${esc(s.level)}</span>`}</div>
        <h2 class="mt12">${esc(s.name)}</h2>
        <p class="muted small mt8">${esc(s.short)}</p>
        <div class="row mt16" style="gap:4px">${s.week.map((d, i) => `<div title="${DAYS[i]}: ${d ? esc(d[0]) : 'Pause'}" style="flex:1;height:6px;border-radius:3px;background:${d ? 'var(--acc)' : 'var(--line)'}"></div>`).join('')}</div>
        <div class="row between xs muted mt8"><span>Ø Frequenz ${fmt(avgFreq(s), 1)}× / Muskel</span><span>${esc(s.session)}</span></div>
      </a>`).join('');
  };
  fd.onclick = (e) => { const b = e.target.closest('[data-d]'); if (b) { fDays = b.dataset.d; draw(); } };
  draw();
}

function detail(root, s) {
  const isMine = state.plan?.id === s.id;
  const sec = (n, t, body) => `<div class="card"><div class="card-h"><h2><span class="tag acc">${n}</span>${t}</h2></div>${body}</div>`;
  root.innerHTML = `
    <a href="#/plaene" class="small muted row" style="gap:4px;margin-bottom:12px">${icon('chevL')}Alle Trainingspläne</a>
    <section class="hero">
      <div class="row wrap" style="position:relative;z-index:1"><span class="tag">${s.days} Tage/Woche</span><span class="tag">${esc(s.level)}</span><span class="tag">${esc(s.session)} pro Einheit</span></div>
      <h1 class="mt12" style="position:relative;z-index:1">${esc(s.name)}</h1>
      <p class="muted mt8" style="position:relative;z-index:1;max-width:680px">${esc(s.short)}</p>
      <div class="qlinks"><button class="btn ${isMine ? '' : 'pri'}" id="pick">${icon(isMine ? 'check' : 'bookmark')}${isMine ? 'Dein aktueller Plan' : 'Als meinen Plan wählen'}</button>
        <button class="btn" id="cmp">${icon('compare')}${cmpSel.includes(s.id) ? 'Im Vergleich' : 'Zum Vergleich hinzufügen'}</button></div>
    </section>
    <div class="grid g2 mt16">
      ${sec(1, 'Beschreibung', `<p>${esc(s.desc)}</p>`)}
      ${sec(2, 'Für wen geeignet?', `<p>${esc(s.suitable)}</p>`)}
      ${sec(3, 'Vorteile', `<ul class="clean">${s.pros.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`)}
      ${sec(4, 'Nachteile', `<ul class="clean">${s.cons.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`)}
    </div>
    <div class="grid g4 mt16">
      <div class="card stat"><div class="lbl">5 · Trainingstage</div><div class="val">${s.days}<span class="muted" style="font-size:15px;font-weight:500"> / Woche</span></div></div>
      <div class="card stat"><div class="lbl">Ø Frequenz</div><div class="val">${fmt(avgFreq(s), 1)}×</div><div class="sub">pro Muskel & Woche</div></div>
      <div class="card stat"><div class="lbl">Dauer</div><div class="val" style="font-size:22px">${esc(s.session)}</div><div class="sub">pro Einheit</div></div>
      <div class="card stat"><div class="lbl">Flexibilität</div><div class="val" style="font-size:18px">${dots(s.flex)}</div><div class="sub">${flexTxt(s.flex)}</div></div>
    </div>
    <div class="card mt16"><div class="card-h"><h2><span class="tag acc">6 · 7</span>Muskelgruppen pro Tag & Beispiel-Wochenplan</h2></div>
      <div class="week">${s.week.map((d, i) => `<div class="day${d ? '' : ' rest'}"><div class="d">${DAYS[i]}</div><div class="t">${d ? esc(d[0]) : 'Pause'}</div><div class="m">${d ? esc(d[1]) : 'Regeneration'}</div></div>`).join('')}</div>
      <div class="grid g3 mt16">${Object.entries(s.sessions).map(([n, ex]) => `<div class="card flat" style="background:var(--card2)"><h3>${esc(n)}</h3><ul class="clean mt8 small muted">${ex.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
      <p class="hint mt12">Satz × Wiederholungen sind Richtwerte. Übungen können durch gleichwertige Varianten ersetzt werden.</p>
    </div>
    <div class="grid g2 mt16">
      ${sec(8, 'Trainingsfrequenz je Muskelgruppe', MUSCLES.map((m) => `<div class="freq-row"><span class="muted">${m}</span><div class="bar"><i style="width:${s.freq[m] / 3 * 100}%"></i></div><span class="num" style="text-align:right;font-weight:600">${s.freq[m]}×</span></div>`).join('') + '<p class="hint mt8">Direkte Einheiten pro Woche. Für Muskelaufbau gelten ca. 2× pro Woche und 10–20 harte Sätze pro Muskel als guter Richtwert.</p>')}
      ${sec(9, 'Regeneration & wichtige Hinweise', `<p>${esc(s.recovery)}</p><ul class="clean mt12">${s.notes.map((n) => `<li>${esc(n)}</li>`).join('')}<li>Schlaf (7–9 h), ausreichend Protein und Kalorien sind für jeden Split entscheidend.</li><li>Bei Schmerzen (nicht Muskelkater) Übung anpassen oder pausieren.</li></ul>`)}
    </div>`;
  root.querySelector('#pick').onclick = (e) => busy(e.currentTarget, async () => {
    try {
      if (isMine) { if (await confirmDialog('Diesen Plan abwählen?', 'Abwählen')) { await savePlan(null); toast('Plan abgewählt'); detail(root, s); } return; }
      await savePlan({ id: s.id, since: Date.now() }); toast(`${s.name} ist jetzt dein Plan`); detail(root, s);
    } catch (err) { toast(authErrorText(err), 'err'); }
  });
  root.querySelector('#cmp').onclick = () => {
    if (!cmpSel.includes(s.id)) { cmpSel = [...cmpSel, s.id].slice(-3); saveCmp(); }
    location.hash = '#/plaene/vergleich';
  };
}

function compare(root) {
  if (cmpSel.length < 2) { cmpSel = [...new Set([...cmpSel, 'ppl', 'upper-lower', 'fullbody'])].slice(0, 3); saveCmp(); }
  const draw = () => {
    const sel = cmpSel.map((id) => SPLIT[id]);
    const row = (label, fn) => `<tr><td>${label}</td>${sel.map((s) => `<td>${fn(s)}</td>`).join('')}</tr>`;
    root.innerHTML = `
      <a href="#/plaene" class="small muted row" style="gap:4px;margin-bottom:12px">${icon('chevL')}Alle Trainingspläne</a>
      <div class="page-head"><div><h1>Splits vergleichen</h1><p>Wähle 2–3 Trainingssplits und vergleiche sie direkt.</p></div></div>
      <div class="grid g3">${[0, 1, 2].map((i) => `<div class="field"><label>Split ${i + 1}${i === 2 ? ' (optional)' : ''}</label><select class="input" data-i="${i}">${i === 2 ? '<option value="">– keiner –</option>' : ''}${SPLITS.map((s) => `<option value="${s.id}" ${cmpSel[i] === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>`).join('')}</div>
      <div class="card mt16 scroll-x"><table class="table cmp"><thead><tr><th></th>${sel.map((s) => `<th style="color:var(--text);font-size:14px;text-transform:none;letter-spacing:0"><a href="#/plaene/${s.id}" style="color:inherit">${esc(s.name)}</a></th>`).join('')}</tr></thead><tbody>
        ${row('Tage / Woche', (s) => `<b>${s.days}</b>`)}
        ${row('Niveau', (s) => esc(s.level))}
        ${row('Dauer / Einheit', (s) => esc(s.session))}
        ${row('Ø Frequenz', (s) => `<b>${fmt(avgFreq(s), 1)}×</b> pro Muskel`)}
        ${row('Volumen', (s) => esc(s.volume))}
        ${row('Flexibilität', (s) => dots(s.flex))}
        ${MUSCLES.map((m) => row(m, (s) => `${s.freq[m]}×`)).join('')}
        ${row('Wochenplan', (s) => s.week.map((d, i) => `<div class="xs"><span class="dim">${DAYS[i]}</span> ${d ? esc(d[0]) : '<span class="dim">Pause</span>'}</div>`).join(''))}
        ${row('Vorteile', (s) => `<ul class="clean small">${s.pros.slice(0, 3).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`)}
        ${row('Nachteile', (s) => `<ul class="clean small">${s.cons.slice(0, 3).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`)}
        ${row('Geeignet für', (s) => `<span class="small">${esc(s.suitable)}</span>`)}
      </tbody></table></div>`;
    root.querySelectorAll('select[data-i]').forEach((el) => el.onchange = () => {
      const next = [...cmpSel]; next[+el.dataset.i] = el.value; cmpSel = next.filter(Boolean); cmpSel = [...new Set(cmpSel)];
      if (cmpSel.length < 2) cmpSel.push(SPLITS.find((s) => !cmpSel.includes(s.id)).id);
      saveCmp(); draw();
    });
  };
  draw();
}
