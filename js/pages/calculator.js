import { state, saveGoals, saveProfile } from '../store.js';
import { esc, icon, fmt, num, toast, busy, fieldErr } from '../ui.js';
import { r, get, set } from '../firebase.js';
import { authErrorText } from '../firebase.js';

// Alltagsaktivität (ohne Sport) → PAL-Faktor
const ACT = [
  ['sitzend', 'Überwiegend sitzend', 'Büro, Schule, wenig Bewegung im Alltag', 1.3],
  ['leicht', 'Leicht aktiv', 'Sitzend mit etwas Gehen/Stehen, ~5–7k Schritte', 1.45],
  ['mittel', 'Mäßig aktiv', 'Viel Stehen/Gehen, ~8–11k Schritte', 1.6],
  ['hoch', 'Körperlich aktiv', 'Körperliche Arbeit, >12k Schritte', 1.8]
];
const GOALS = [['lose', 'Abnehmen'], ['keep', 'Gewicht halten'], ['gain', 'Zunehmen / Muskelaufbau']];
const r50 = (x) => Math.round(x / 50) * 50;
const r5 = (x) => Math.round(x / 5) * 5;

/** Reine Berechnung – nachvollziehbar, alle Zwischenschritte werden zurückgegeben */
export function calculate({ age, sex, height, weight, act, sessions, minutes, goal }) {
  const teen = age < 18;
  const sConst = sex === 'm' ? 5 : sex === 'w' ? -161 : -78;   // ohne Angabe: Mittelwert
  const bmr = 10 * weight + 6.25 * height - 5 * age + sConst;   // Mifflin-St Jeor
  const pal = ACT.find((a) => a[0] === act)[3];
  const daily = bmr * pal;
  // Krafttraining ≈ 5 MET → Netto ≈ 4 kcal pro kg und Stunde (über Grundumsatz hinaus)
  const trainWeek = sessions * 4 * weight * (minutes / 60);
  const trainDay = trainWeek / 7;
  const tdee = daily + trainDay;
  let target = tdee, adj = 0, goalNote = '';
  if (goal === 'lose') {
    if (teen) { adj = 0; goalNote = 'Für Jugendliche empfehlen wir kein gezieltes Kaloriendefizit. Halte dein Gewicht stabil, bewege dich viel und wachse in dein Gewicht hinein. Bei Fragen zum Gewicht: Kinder-/Hausarzt oder Ernährungsberatung.'; }
    else { adj = -Math.min(500, tdee * 0.15); goalNote = 'Moderates Defizit (≈15 %, max. 500 kcal) → etwa 0,3–0,5 kg pro Woche. Größere Defizite gefährden Muskeln und Leistungsfähigkeit.'; }
  } else if (goal === 'gain') {
    adj = teen ? 150 : Math.min(350, tdee * 0.1);
    goalNote = teen ? 'Kleiner Überschuss (~150 kcal) – im Wachstum steigt der Bedarf ohnehin. Fokus auf ausgewogene Ernährung und Training.' : 'Leichter Überschuss (≈10 %, max. 350 kcal) → etwa 0,25–0,5 kg pro Monat bei möglichst wenig Fettzunahme.';
  } else goalNote = 'Kalorienbedarf ≈ Verbrauch. Schwankt dein Gewicht über 2–3 Wochen, passe um ±100–200 kcal an.';
  target = Math.max(target + adj, teen ? tdee : Math.max(bmr * 1.1, sex === 'm' ? 1500 : 1200));
  // Makros
  const pLo = teen ? 1.2 : 1.6, pHi = teen ? 1.6 : 2.2;
  const pG = weight * (teen ? 1.4 : goal === 'lose' ? 2.0 : 1.8);
  const fG = Math.max(weight * 0.8, target * 0.25 / 9);
  const cG = Math.max(0, (target - pG * 4 - fG * 9) / 4);
  return {
    teen, sConst, bmr, pal, daily, trainWeek, trainDay, tdee, adj, target, goalNote,
    macros: { p: [weight * pLo, weight * pHi, pG], f: [target * 0.2 / 9, target * 0.35 / 9, fG], c: cG }
  };
}

export async function render(root) {
  const p = state.profile || {};
  let saved = {};
  try { saved = (await get(r(`users/${state.uid}/calc`))).val() || {}; } catch {}
  const v = {
    age: saved.age ?? (p.birthYear ? new Date().getFullYear() - p.birthYear : ''), sex: saved.sex ?? p.sex ?? '',
    height: saved.height ?? p.height ?? '', weight: saved.weight ?? p.bodyweight ?? '', act: saved.act || 'leicht',
    sessions: saved.sessions ?? 3, minutes: saved.minutes ?? 60, goal: saved.goal || 'keep'
  };
  root.innerHTML = `
    <div class="page-head"><div><h1>Kalorienrechner</h1><p>Schätze deinen Energie- und Makronährstoffbedarf – transparent und nachvollziehbar.</p></div></div>
    <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);align-items:start" id="lay">
      <form class="card" novalidate id="f">
        <div class="form-grid">
          <div class="field"><label>Alter (Jahre)</label><input class="input" name="age" inputmode="numeric" value="${v.age}"></div>
          <div class="field"><label>Geschlecht <span class="dim">(optional)</span></label><select class="input" name="sex"><option value="">Keine Angabe</option><option value="m" ${v.sex === 'm' ? 'selected' : ''}>Männlich</option><option value="w" ${v.sex === 'w' ? 'selected' : ''}>Weiblich</option></select></div>
          <div class="field"><label>Größe (cm)</label><input class="input" name="height" inputmode="decimal" value="${v.height}"></div>
          <div class="field"><label>Gewicht (kg)</label><input class="input" name="weight" inputmode="decimal" value="${v.weight}"></div>
          <div class="field full"><label>Aktivität im Alltag (ohne Training)</label><select class="input" name="act">${ACT.map(([k, n, d]) => `<option value="${k}" ${v.act === k ? 'selected' : ''}>${n} – ${d}</option>`).join('')}</select></div>
          <div class="field"><label>Trainingseinheiten / Woche</label><input class="input" name="sessions" inputmode="numeric" value="${v.sessions}"></div>
          <div class="field"><label>Dauer pro Einheit (min)</label><input class="input" name="minutes" inputmode="numeric" value="${v.minutes}"></div>
          <div class="field full"><label>Ziel</label><div class="seg" id="goal">${GOALS.map(([k, n]) => `<button type="button" data-g="${k}" class="${v.goal === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
          <div class="full"><button class="btn pri block" type="submit">${icon('calc')}Berechnen</button></div>
        </div>
        <p class="hint mt12">Geschlecht beeinflusst den Grundumsatz (Mifflin-St Jeor). Ohne Angabe wird der Mittelwert beider Formeln verwendet – das Ergebnis ist dann etwas ungenauer.</p>
      </form>
      <div id="res"><div class="card empty"><b>Noch kein Ergebnis</b>Fülle das Formular aus und klicke auf „Berechnen“.</div></div>
    </div>`;
  const mq = matchMedia('(max-width:900px)');
  const lay = root.querySelector('#lay'); const setLay = () => lay.style.gridTemplateColumns = mq.matches ? '1fr' : 'minmax(0,1fr) minmax(0,1.3fr)';
  setLay(); mq.addEventListener('change', setLay);
  const f = root.querySelector('#f');
  root.querySelector('#goal').onclick = (e) => { const b = e.target.closest('[data-g]'); if (!b) return; v.goal = b.dataset.g; root.querySelectorAll('[data-g]').forEach((x) => x.classList.toggle('on', x === b)); };
  f.onsubmit = (e) => { e.preventDefault(); compute(true); };
  if (v.age && v.height && v.weight) compute(false);

  function compute(store) {
    const g = (n) => num(f[n].value);
    const age = g('age'), height = g('height'), weight = g('weight'), sessions = g('sessions'), minutes = g('minutes');
    let ok = fieldErr(f.age, age == null || isNaN(age) || age < 13 || age > 99 || !Number.isInteger(age) ? (age != null && age < 13 ? 'Der Rechner ist für Personen ab 13 Jahren gedacht.' : 'Alter 13–99') : '');
    ok = fieldErr(f.height, height == null || isNaN(height) || height < 120 || height > 230 ? 'Größe 120–230 cm' : '') && ok;
    ok = fieldErr(f.weight, weight == null || isNaN(weight) || weight < 30 || weight > 250 ? 'Gewicht 30–250 kg' : '') && ok;
    ok = fieldErr(f.sessions, sessions == null || isNaN(sessions) || sessions < 0 || sessions > 14 || !Number.isInteger(sessions) ? '0–14' : '') && ok;
    ok = fieldErr(f.minutes, minutes == null || isNaN(minutes) || minutes < 0 || minutes > 240 ? '0–240' : '') && ok;
    if (!ok) return;
    const inp = { age, sex: f.sex.value, height, weight, act: f.act.value, sessions, minutes, goal: v.goal };
    const res = calculate(inp);
    if (store) set(r(`users/${state.uid}/calc`), inp).catch(() => {});
    drawResult(root.querySelector('#res'), inp, res);
  }
}

function drawResult(el, inp, x) {
  const range = (v, pct = 0.1) => `${fmt(r50(v * (1 - pct)))}–${fmt(r50(v * (1 + pct)))}`;
  const actName = ACT.find((a) => a[0] === inp.act)[1];
  el.innerHTML = `
    ${x.teen ? `<div class="note mb">${icon('lock')} <b>Hinweis für Jugendliche (unter 18):</b> Dein Körper wächst noch. Der Rechner gibt dir deshalb keine Abnehm-Defizite vor und rechnet mit großzügigen Werten. Diese Zahlen sind nur Orientierung – kein Grund, Kalorien streng zu zählen.</div>` : ''}
    <div class="grid g3 ${x.teen ? 'mt16' : ''}">
      <div class="card stat"><div class="lbl">Grundumsatz</div><div class="val num">≈ ${fmt(r50(x.bmr))}</div><div class="sub">kcal/Tag · in völliger Ruhe</div></div>
      <div class="card stat"><div class="lbl">Gesamtbedarf</div><div class="val num">≈ ${fmt(r50(x.tdee))}</div><div class="sub">kcal/Tag · inkl. Alltag & Training</div></div>
      <div class="card stat" style="border-color:rgba(var(--acc-rgb),.45)"><div class="lbl">Ziel: ${esc(GOALS.find((g) => g[0] === inp.goal)[1])}</div><div class="val num acc">≈ ${fmt(r50(x.target))}</div><div class="sub">kcal/Tag · Spanne ${range(x.target)}</div></div>
    </div>
    <div class="card mt16"><div class="card-h"><h2>Makronährstoffe (Schätzung)</h2></div>
      <div class="grid g3">
        <div><div class="lab">Protein</div><div class="result-big num" style="color:var(--p)">${fmt(r5(x.macros.p[2]))} g</div><div class="xs muted">sinnvoller Bereich ${fmt(r5(x.macros.p[0]))}–${fmt(r5(x.macros.p[1]))} g (${x.teen ? '1,2–1,6' : '1,6–2,2'} g/kg)</div></div>
        <div><div class="lab">Fett</div><div class="result-big num" style="color:var(--f)">${fmt(r5(x.macros.f[2]))} g</div><div class="xs muted">Bereich ${fmt(r5(x.macros.f[0]))}–${fmt(r5(x.macros.f[1]))} g (20–35 % der kcal)</div></div>
        <div><div class="lab">Kohlenhydrate</div><div class="result-big num" style="color:var(--c)">${fmt(r5(x.macros.c))} g</div><div class="xs muted">Rest der Kalorien – Hauptenergie fürs Training</div></div>
      </div>
      <p class="small muted mt16">${esc(x.goalNote)}</p>
      <div class="row wrap mt16"><button class="btn pri" id="apply">${icon('check')}Als Tagesziel übernehmen</button><button class="btn" id="prof">Größe & Gewicht ins Profil</button></div>
    </div>
    <div class="card mt16"><div class="card-h"><h2>Was bedeuten die Werte?</h2></div>
      <ul class="clean small">
        <li><b>Grundumsatz (BMR):</b> Energie, die dein Körper in völliger Ruhe für Organe, Atmung und Temperatur braucht.</li>
        <li><b>Gesamtbedarf (TDEE):</b> Grundumsatz × Alltagsaktivität + Energie für dein Training – das, was du im Schnitt pro Tag verbrauchst.</li>
        <li><b>Zielbedarf:</b> Gesamtbedarf angepasst an dein Ziel. Kontrolliere über 2–3 Wochen dein Gewicht und passe dann an – jeder Körper ist anders.</li>
        <li><b>Protein</b> unterstützt Muskelaufbau und -erhalt, <b>Fett</b> ist wichtig für Hormone, <b>Kohlenhydrate</b> liefern Energie fürs Training.</li>
      </ul></div>
    <div class="card mt16"><div class="card-h"><h2>So wurde gerechnet</h2></div>
      <div class="formula">Grundumsatz (Mifflin-St Jeor)
= 10 × ${fmt(inp.weight, 1)} kg + 6,25 × ${fmt(inp.height)} cm − 5 × ${inp.age} J ${x.sConst >= 0 ? '+' : '−'} ${Math.abs(x.sConst)}${inp.sex ? '' : ' (Mittelwert, kein Geschlecht)'}
= ${fmt(x.bmr)} kcal

Alltag: ${fmt(x.bmr)} × PAL ${fmt(x.pal, 2)} (${esc(actName)}) = ${fmt(x.daily)} kcal
Training: ${inp.sessions} × ${inp.minutes} min × 4 kcal/kg/h × ${fmt(inp.weight, 1)} kg = ${fmt(x.trainWeek)} kcal/Woche ≈ ${fmt(x.trainDay)} kcal/Tag
Gesamtbedarf = ${fmt(x.daily)} + ${fmt(x.trainDay)} = ${fmt(x.tdee)} kcal
Ziel: ${x.adj >= 0 ? '+' : '−'} ${fmt(Math.abs(x.adj))} kcal → ${fmt(x.target)} kcal (angezeigt gerundet auf 50)</div>
      <p class="hint mt12">Alle Werte sind Schätzungen. Formeln haben eine typische Abweichung von ±10 % – deshalb die Spannen und Rundung. Bei Erkrankungen, Schwangerschaft, Essstörungen oder als Leistungssportler: bitte fachlich beraten lassen.</p></div>`;
  el.querySelector('#apply').onclick = (e) => busy(e.currentTarget, async () => {
    try { await saveGoals({ kcal: r50(x.target), p: r5(x.macros.p[2]), c: r5(x.macros.c), f: r5(x.macros.f[2]) }); toast('Tagesziele übernommen'); }
    catch (err) { toast(authErrorText(err), 'err'); }
  });
  el.querySelector('#prof').onclick = (e) => busy(e.currentTarget, async () => {
    try { await saveProfile({ height: inp.height, bodyweight: inp.weight, ...(inp.sex ? { sex: inp.sex } : {}) }); toast('Profil aktualisiert'); }
    catch (err) { toast(authErrorText(err), 'err'); }
  });
}
