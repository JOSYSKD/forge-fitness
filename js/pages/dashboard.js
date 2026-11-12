import { state, ready, subscribe, username, userEntries, personalRecords, userRanks, getDay, getRange, sumDay, streak, trainingDays, setTrainedOn, STREAK_GRACE } from '../store.js';
import { EX, exLabel, unitHint, metrics } from '../data/exercises.js';
import { SPLIT, DAYS } from '../data/splits.js';
import { esc, icon, fmt, fmtKg, fmtDate, today, addDays, loading, rankBadge, toast, busy } from '../ui.js';
import { authErrorText } from '../firebase.js';

export async function render(root) {
  const h = new Date().getHours();
  const greet = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  root.innerHTML = `
    <section class="hero">
      <p class="muted small" style="position:relative;z-index:1">${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1 style="position:relative;z-index:1;margin-top:4px">${greet}, ${esc(username())} 👋</h1>
      <p class="muted mt8" style="position:relative;z-index:1" id="plan-today"></p>
      <div class="qlinks">
        <a class="btn pri" href="#/leaderboards">${icon('plus')}Leistung eintragen</a>
        <a class="btn" href="#/ernaehrung">${icon('apple')}Essen tracken</a>
        <a class="btn" href="#/plaene">${icon('book')}Trainingspläne</a>
        <a class="btn" href="#/rechner">${icon('calc')}Kalorienrechner</a>
      </div>
    </section>
    <div class="grid g4 mt16" id="stats">${loading()}</div>
    <div class="grid g3 mt16">
      <div class="card" id="nut">${loading()}</div>
      <div class="card span2" id="records">${loading()}</div>
    </div>
    <div class="grid g2 mt16">
      <div class="card" id="streak">${loading()}</div>
      <div class="card" id="ranks">${loading()}</div>
    </div>`;

  // Plan heute
  const pt = root.querySelector('#plan-today');
  if (state.plan?.custom) {
    pt.innerHTML = `Dein Plan: <a href="#/plaene/p/${esc(state.plan.id)}">${esc(state.plan.name || 'Eigener Plan')}</a>`;
    import('../store.js').then(({ getPlan }) => getPlan(state.plan.id)).then((cp) => {
      if (!cp || !pt.isConnected) return;
      const d = (new Date().getDay() + 6) % 7;
      if (cp.mode === 'week') { const w = cp.days[d]; pt.innerHTML += ` · Heute (${DAYS[d]}): <b style="color:var(--text)">${w && !w.rest ? esc(w.title) : 'Ruhetag'}</b>${w && !w.rest && w.muscles ? ' – ' + esc(w.muscles) : ''}`; }
      else pt.innerHTML += ` · ${cp.days.filter((x) => !x.rest).length}-Tage-Rotation`;
    }).catch(() => {});
  } else if (state.plan && SPLIT[state.plan.id]) {
    const s = SPLIT[state.plan.id]; const d = (new Date().getDay() + 6) % 7; const w = s.week[d];
    pt.innerHTML = `Dein Plan: <a href="#/plaene/${s.id}">${esc(s.name)}</a> · Heute (${DAYS[d]}): <b style="color:var(--text)">${w ? esc(w[0]) : 'Ruhetag'}</b>${w ? ' – ' + esc(w[1]) : ''}`;
  } else pt.innerHTML = 'Noch kein Trainingsplan gewählt – <a href="#/plaene">such dir einen Split aus</a>.';

  renderNutrition(root.querySelector('#nut'));
  await ready();
  const draw = () => { if (root.isConnected) drawTraining(root); };
  draw();
  return subscribe((w) => { if (['entries', 'publics', 'activity'].includes(w)) draw(); });
}

function drawTraining(root) {
  const mine = userEntries();
  const prs = personalRecords();
  const ranks = userRanks();
  const st = streak();
  const days = new Set(trainingDays());
  const days30 = [...days].filter((d) => d >= addDays(today(), -29) && d <= today()).length;
  const vol = mine.reduce((a, e) => a + (EX[e.exId].type === 'bw' ? 0 : e.weight * (e.reps || 1) * (e.sets || 1)), 0);
  const top = ranks.filter((r) => r.rank <= 3).length;
  root.querySelector('#stats').innerHTML = [
    ['Trainings-Streak', `<span class="flame${st.current ? '' : ' off'}" style="font-size:inherit">${icon('flame')}${fmt(st.current)}</span>`, `Rekord: ${fmt(st.best)} Trainings`],
    ['Trainingstage (30 T.)', fmt(days30), `${fmt(st.total)} insgesamt`],
    ['Bewegtes Volumen', vol >= 10000 ? fmt(vol / 1000, 1) + ' t' : fmt(vol) + ' kg', 'Gewicht × Wdh. × Sätze'],
    ['Podiumsplätze', fmt(top), ranks.length ? `in ${ranks.length} Leaderboards` : 'noch keine Wertung']
  ].map(([l, v, s]) => `<div class="card stat"><div class="lbl">${l}</div><div class="val num">${v}</div><div class="sub">${s}</div></div>`).join('');

  // Personal Records
  const rankOf = Object.fromEntries(ranks.map((r) => [r.exId, r]));
  const prList = Object.values(prs).sort((a, b) => (metrics(EX[b.exId], b).e1rm || b.weight) - (metrics(EX[a.exId], a).e1rm || a.weight));
  root.querySelector('#records').innerHTML = `<div class="card-h"><h2>${icon('star')}Personal Records</h2><a class="small" href="#/profil">Alle ${prList.length ? '(' + prList.length + ')' : ''}</a></div>` +
    (prList.length ? `<div class="scroll-x"><table class="table"><thead><tr><th>Übung</th><th class="r">Bestleistung</th><th class="r hide-sm">1RM ≈</th><th class="r">Rang</th><th class="r hide-sm">Datum</th></tr></thead><tbody>${prList.slice(0, 7).map((e) => {
      const ex = EX[e.exId]; const m = metrics(ex, e); const rk = rankOf[e.exId];
      return `<tr><td><a href="#/leaderboards/${e.exId}" style="color:var(--text);font-weight:600">${esc(ex.name)}</a><div class="xs muted">${esc(ex.equip)}</div></td>
        <td class="r num" style="font-weight:700">${ex.type === 'bw' ? '+' : ''}${fmtKg(e.weight)} <span class="muted" style="font-weight:400">× ${e.reps}</span></td>
        <td class="r hide-sm muted num">${m.e1rm ? fmtKg(Math.round(m.e1rm * 2) / 2) : '–'}</td>
        <td class="r">${rk ? `<span class="tag${rk.rank <= 3 ? ' acc' : ''}">#${rk.rank}/${rk.of}</span>` : '–'}</td>
        <td class="r hide-sm muted small">${fmtDate(e.date)}</td></tr>`;
    }).join('')}</tbody></table></div>`
      : `<div class="empty"><b>Noch keine Personal Records</b>Trage deine Bestleistungen in den Leaderboards ein – PRs werden automatisch erkannt.<div class="mt12"><a class="btn pri sm" href="#/leaderboards">${icon('plus')}Leistung eintragen</a></div></div>`);

  // Streak
  const t = today();
  const flag = !!state.activity?.[state.uid]?.[t];
  const grid = [...Array(14)].map((_, i) => addDays(t, i - 13));
  const status = st.trainedToday ? 'Heute erledigt – stark! 💪'
    : st.alive ? (st.daysLeft <= 1 ? 'Trainiere heute, sonst reißt deine Streak!' : `Noch ${st.daysLeft} Tage bis zum nächsten Training`)
    : st.best ? 'Streak gerissen – heute neu starten!' : 'Starte deine erste Streak mit einem Training.';
  root.querySelector('#streak').innerHTML = `<div class="card-h"><h2>${icon('flame')}Trainings-Streak</h2><a class="small" href="#/profil/freunde">Freunde</a></div>
    <div class="row gap16" style="align-items:flex-end"><div class="streak-num ${st.current ? 'acc' : 'dim'}">${st.current}</div><div class="small muted" style="padding-bottom:4px">Training${st.current === 1 ? '' : 's'} in Folge<br>Rekord: <b style="color:var(--text)">${st.best}</b></div></div>
    <p class="small mt12 ${st.alive && !st.trainedToday && st.daysLeft <= 1 ? 'danger-t' : 'muted'}">${status}</p>
    <div class="streak-days mt12">${grid.map((d) => `<i class="${days.has(d) ? 'on' : ''}${d === t ? ' today' : ''}" title="${fmtDate(d)}${days.has(d) ? ' – trainiert' : ''}"></i>`).join('')}</div>
    <div class="row between xs dim mt8"><span>vor 14 Tagen</span><span>heute</span></div>
    <button class="btn ${st.trainedToday ? '' : 'pri'} block mt16" id="trained" ${st.trainedToday && !flag ? 'disabled' : ''}>${icon('check')}${st.trainedToday ? (flag ? 'Heute trainiert ✓ (rückgängig)' : 'Heute trainiert ✓') : 'Heute trainiert'}</button>
    <p class="hint mt8">Zwischen zwei Trainings dürfen bis zu ${STREAK_GRACE} Ruhetage liegen. Eingetragene Leistungen zählen automatisch.</p>`;
  root.querySelector('#trained').onclick = (e) => busy(e.currentTarget, async () => {
    try { await setTrainedOn(t, !st.trainedToday); if (!st.trainedToday) toast(`🔥 Streak: ${streak().current || st.current + 1}`); }
    catch (err) { toast(authErrorText(err), 'err'); }
  });

  root.querySelector('#ranks').innerHTML = `<div class="card-h"><h2>${icon('trophy')}Deine Platzierungen</h2></div>` +
    (ranks.length ? `<div class="list">${ranks.slice(0, 6).map((r) => `<a class="li" style="color:inherit" href="#/leaderboards/${r.exId}">${rankBadge(r.rank)}<div class="grow ellip">${esc(exLabel(EX[r.exId]))}</div><span class="muted small">von ${r.of}</span></a>`).join('')}</div>`
      : '<div class="empty">Sobald du Leistungen einträgst, siehst du hier deinen Rang.</div>');
}

async function renderNutrition(el) {
  try {
    const t = today();
    const [day, range] = await Promise.all([getDay(t), getRange(addDays(t, -6), t)]);
    const s = sumDay(day); const g = state.goals || {};
    const pct = Math.min(1, s.kcal / (g.kcal || 1));
    const R = 54, C = 2 * Math.PI * R;
    const rest = (g.kcal || 0) - s.kcal;
    const bar = (lbl, v, goal, col) => `<div class="macro"><div class="top"><span>${lbl}</span><span class="num muted">${fmt(v)} / ${fmt(goal)} g</span></div><div class="bar${v > goal * 1.05 ? ' over' : ''}"><i style="width:${Math.min(100, v / (goal || 1) * 100)}%;background:${col}"></i></div></div>`;
    const days = [...Array(7)].map((_, i) => addDays(t, i - 6));
    const vals = days.map((d) => sumDay(range[d]).kcal);
    const max = Math.max(g.kcal || 0, ...vals, 1);
    if (!el.isConnected) return;
    el.innerHTML = `<div class="card-h"><h2>${icon('flame')}Heute</h2><a class="small" href="#/ernaehrung">Tracker</a></div>
      <div class="row gap16" style="align-items:center">
        <div class="ring"><svg width="130" height="130"><circle cx="65" cy="65" r="${R}" fill="none" stroke="var(--line)" stroke-width="10"/>
          <circle cx="65" cy="65" r="${R}" fill="none" stroke="${s.kcal > g.kcal * 1.05 ? 'var(--danger)' : 'var(--acc)'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
          <div class="ctr"><b class="num">${fmt(s.kcal)}</b><span class="xs muted">von ${fmt(g.kcal)} kcal</span></div></div>
        <div class="col grow" style="flex:1;min-width:0">${bar('Protein', s.p, g.p, 'var(--p)')}${bar('Kohlenhydrate', s.c, g.c, 'var(--c)')}${bar('Fett', s.f, g.f, 'var(--f)')}</div>
      </div>
      <p class="small mt12 ${rest < 0 ? 'danger-t' : 'muted'}">${rest >= 0 ? `Noch ${fmt(rest)} kcal übrig` : `${fmt(-rest)} kcal über dem Ziel`}</p>
      <div class="chart-bars mt12" style="height:70px">${vals.map((v, i) => `<div class="b${i === 6 ? ' today' : ''}${v > (g.kcal || 0) * 1.05 ? ' over' : ''}" title="${fmt(v)} kcal"><div class="bw"><i style="height:${v / max * 100}%"></i></div><span>${DAYS[(new Date(days[i] + 'T12:00').getDay() + 6) % 7]}</span></div>`).join('')}</div>`;
  } catch (e) { console.error(e); el.innerHTML = '<div class="empty">Ernährungsdaten konnten nicht geladen werden.</div>'; }
}
