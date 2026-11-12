import { state, getDay, addFood, updateFood, deleteFood, getRange, sumDay, itemMacros, saveGoals,
  customFoods, addCustomFood, deleteCustomFood, savedMeals, addSavedMeal, deleteSavedMeal, recentFoods, touchRecent } from '../store.js';
import { BASE_FOODS } from '../foods-base.js';
import { DAYS } from '../data/splits.js';
import { esc, icon, fmt, fmtDate, today, addDays, num, modal, toast, busy, fieldErr, confirmDialog, loading } from '../ui.js';
import { authErrorText } from '../firebase.js';

const MEALS = [['fruehstueck', 'Frühstück'], ['mittag', 'Mittagessen'], ['abend', 'Abendessen'], ['snacks', 'Snacks']];
let date = today();

export async function render(root, { args }) {
  if (args[0] && /^\d{4}-\d{2}-\d{2}$/.test(args[0])) date = args[0];
  root.innerHTML = `
    <div class="page-head"><div><h1>Ernährung</h1><p>Mahlzeiten tracken, Makros im Blick behalten.</p></div>
      <div class="row wrap">
        <div class="date-nav"><button class="btn icon" id="prev" aria-label="Vorheriger Tag">${icon('chevL')}</button>
        <input type="date" class="input" id="dt" style="width:auto;height:38px" max="${today()}">
        <button class="btn icon" id="next" aria-label="Nächster Tag">${icon('chevR')}</button></div>
        <button class="btn" id="goals">${icon('gear')}Ziele</button>
      </div></div>
    <div id="day">${loading()}</div>`;
  const dt = root.querySelector('#dt');
  const go = (d) => { date = d > today() ? today() : d; dt.value = date; load(); };
  root.querySelector('#prev').onclick = () => go(addDays(date, -1));
  root.querySelector('#next').onclick = () => go(addDays(date, 1));
  dt.onchange = () => dt.value && go(dt.value);
  root.querySelector('#goals').onclick = () => goalsDialog(load);
  dt.value = date;

  let day = {}; let loadId = 0;
  async function load() {
    const my = ++loadId;
    root.querySelector('#next').disabled = date >= today();
    try {
      const [d, range] = await Promise.all([getDay(date), getRange(addDays(date, -6), date)]);
      if (my !== loadId || !root.isConnected) return;
      day = d; draw(range);
    } catch (e) { console.error(e); root.querySelector('#day').innerHTML = `<div class="empty"><b>Fehler beim Laden</b>${esc(authErrorText(e))}</div>`; }
  }

  function draw(range) {
    const g = state.goals || { kcal: 2500, p: 150, c: 280, f: 80 };
    const s = sumDay(day);
    const R = 64, C = 2 * Math.PI * R, pct = Math.min(1, s.kcal / (g.kcal || 1));
    const over = s.kcal > g.kcal * 1.05;
    const macroKcal = s.p * 4 + s.c * 4 + s.f * 9 || 1;
    const bar = (lbl, v, goal, col) => `<div class="macro"><div class="top"><span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${col};margin-right:6px"></span>${lbl}</span><span class="num"><b>${fmt(v)}</b><span class="muted"> / ${fmt(goal)} g</span></span></div><div class="bar${v > goal * 1.05 ? ' over' : ''}"><i style="width:${Math.min(100, v / (goal || 1) * 100)}%;background:${col}"></i></div><div class="xs dim">${v <= goal ? `noch ${fmt(goal - v)} g` : `${fmt(v - goal)} g über Ziel`}</div></div>`;
    const days = [...Array(7)].map((_, i) => addDays(date, i - 6));
    const vals = days.map((d) => sumDay(range[d]).kcal);
    const tracked = vals.filter((v) => v > 0);
    const max = Math.max(g.kcal, ...vals, 1);
    const isToday = date === today();
    const items = Object.entries(day).map(([id, it]) => ({ id, ...it }));

    root.querySelector('#day').innerHTML = `
      <div class="grid g3">
        <div class="card"><div class="card-h"><h2>${isToday ? 'Heute' : fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2></div>
          <div class="ring" style="margin:0 auto"><svg width="160" height="160"><circle cx="80" cy="80" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/>
          <circle cx="80" cy="80" r="${R}" fill="none" stroke="${over ? 'var(--danger)' : 'var(--acc)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
          <div class="ctr"><b class="num">${fmt(s.kcal)}</b><span class="xs muted">von ${fmt(g.kcal)} kcal</span></div></div>
          <p class="small mt12" style="text-align:center">${s.kcal <= g.kcal ? `<span class="acc">${fmt(g.kcal - s.kcal)} kcal</span> <span class="muted">übrig</span>` : `<span class="danger-t">${fmt(s.kcal - g.kcal)} kcal über dem Ziel</span>`}</p>
          <div class="row mt12" style="height:8px;border-radius:99px;overflow:hidden;gap:2px">${s.kcal ? `<i style="flex:${s.p * 4};background:var(--p);height:100%"></i><i style="flex:${s.c * 4};background:var(--c);height:100%"></i><i style="flex:${s.f * 9};background:var(--f);height:100%"></i>` : '<i style="flex:1;background:var(--line);height:100%"></i>'}</div>
          <div class="row between xs muted mt8"><span>P ${fmt(s.p * 4 / macroKcal * 100)}%</span><span>KH ${fmt(s.c * 4 / macroKcal * 100)}%</span><span>F ${fmt(s.f * 9 / macroKcal * 100)}%</span></div>
        </div>
        <div class="card"><div class="card-h"><h2>Makronährstoffe</h2></div><div class="col gap16">${bar('Protein', s.p, g.p, 'var(--p)')}${bar('Kohlenhydrate', s.c, g.c, 'var(--c)')}${bar('Fett', s.f, g.f, 'var(--f)')}</div></div>
        <div class="card"><div class="card-h"><h2>${icon('chart')}7 Tage</h2><span class="small muted">Ø ${tracked.length ? fmt(tracked.reduce((a, b) => a + b, 0) / tracked.length) : '–'} kcal</span></div>
          <div class="chart-bars" style="position:relative">${vals.map((v, i) => `<div class="b${days[i] === date ? ' today' : ''}${v > g.kcal * 1.05 ? ' over' : ''}" title="${fmtDate(days[i])}: ${fmt(v)} kcal" data-go="${days[i]}" style="cursor:pointer"><div class="bw"><i style="height:${v / max * 100}%"></i></div><span>${DAYS[(new Date(days[i] + 'T12:00').getDay() + 6) % 7]}</span></div>`).join('')}
            <div style="position:absolute;left:0;right:0;pointer-events:none;bottom:calc(23px + (100% - 23px) * ${g.kcal / max});border-top:1px dashed rgba(255,255,255,.3)" title="Ziel"></div></div>
          <p class="hint mt8">Gestrichelt = Tagesziel. Klick auf einen Balken öffnet den Tag.</p></div>
      </div>
      <div class="grid g2 mt16">${MEALS.map(([mk, mn]) => {
        const its = items.filter((i) => (i.meal || 'snacks') === mk).sort((a, b) => (a.at || 0) - (b.at || 0));
        const ms = sumDay(Object.fromEntries(its.map((i) => [i.id, i])));
        return `<div class="card"><div class="meal-h"><div><h2>${mn}</h2><div class="xs muted num">${fmt(ms.kcal)} kcal · P ${fmt(ms.p)} · KH ${fmt(ms.c)} · F ${fmt(ms.f)}</div></div>
          <div class="row">${its.length ? `<button class="btn ghost icon" data-savemeal="${mk}" title="Als Mahlzeit speichern">${icon('bookmark')}</button>` : ''}<button class="btn sm pri" data-add="${mk}">${icon('plus')}Hinzufügen</button></div></div>
          <div class="mt12">${its.length ? its.map((it) => { const m = itemMacros(it); return `<div class="food-row"><div class="grow"><div class="ellip" style="font-weight:500">${esc(it.name)}</div><div class="xs muted">${fmt(it.grams)} g · P ${fmt(m.p, 1)} · KH ${fmt(m.c, 1)} · F ${fmt(m.f, 1)}</div></div><span class="k num">${fmt(m.kcal)} kcal</span>
            <button class="btn ghost icon" data-edit="${it.id}" title="Bearbeiten">${icon('edit')}</button><button class="btn ghost icon" data-del="${it.id}" title="Löschen">${icon('trash')}</button></div>`; }).join('')
            : '<div class="dim small" style="padding:6px 0">Noch nichts eingetragen.</div>'}</div></div>`;
      }).join('')}</div>`;

    const el = root.querySelector('#day');
    el.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    el.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => addDialog(b.dataset.add, load));
    el.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => editDialog(b.dataset.edit, day[b.dataset.edit], load));
    el.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
      try { await deleteFood(date, b.dataset.del); toast('Entfernt'); load(); } catch (e) { toast(authErrorText(e), 'err'); }
    });
    el.querySelectorAll('[data-savemeal]').forEach((b) => b.onclick = () => saveMealDialog(items.filter((i) => (i.meal || 'snacks') === b.dataset.savemeal), MEALS.find((m) => m[0] === b.dataset.savemeal)[1]));
  }
  load();
}

const per100 = (f) => `${fmt(f.kcal)} kcal · P ${fmt(f.p, 1)} · KH ${fmt(f.c, 1)} · F ${fmt(f.f, 1)} <span class="dim">/100 g</span>`;
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function searchOFF(q, signal) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=25&fields=code,product_name,product_name_de,brands,nutriments`;
  let j;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { const res = await fetch(url, { signal }); if (!res.ok) throw new Error('OFF ' + res.status); j = await res.json(); break; }
    catch (e) { if (signal.aborted || attempt === 1) throw e; await new Promise((r) => setTimeout(r, 900)); }
  }
  return (j.products || []).map((p) => {
    const n = p.nutriments || {}; const name = (p.product_name_de || p.product_name || '').trim();
    const kcal = n['energy-kcal_100g'] ?? (n.energy_100g != null ? n.energy_100g / 4.184 : null);
    return { id: 'off_' + p.code, name, brand: (p.brands || '').split(',')[0].trim(), kcal: kcal != null ? +(+kcal).toFixed(1) : null, p: +(n.proteins_100g ?? 0), c: +(n.carbohydrates_100g ?? 0), f: +(n.fat_100g ?? 0), src: 'off' };
  }).filter((f) => f.name && f.kcal != null && isFinite(f.kcal) && f.kcal <= 950);
}

function addDialog(meal, reload) {
  let tab = 'search'; let selected = null; let custom = {}, meals = {}, recent = {}; let ctrl = null; let offRes = []; let offState = '';
  modal({
    title: `Hinzufügen · ${MEALS.find((m) => m[0] === meal)[1]}`, wide: true,
    body: `<div class="seg" id="tabs"><button data-t="search" class="on">Suchen</button><button data-t="own">Eigene Lebensmittel</button><button data-t="meals">Gespeicherte Mahlzeiten</button></div><div id="tb" class="mt16"></div>`,
    onMount: async (m, close) => {
      const tb = m.querySelector('#tb');
      m.querySelector('#tabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; m.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); selected = null; drawTab(); };
      tb.innerHTML = loading();
      try { [custom, meals, recent] = await Promise.all([customFoods(), savedMeals(), recentFoods()]); } catch (e) { console.error(e); }
      drawTab();

      function drawTab() {
        if (tab === 'search') {
          tb.innerHTML = `<div class="row"><input class="input" id="sq" placeholder="z. B. Haferflocken, Skyr, Banane, Marke…" autocomplete="off"></div>
            <div class="search-res" id="sr"></div><div id="amount"></div>`;
          const sq = tb.querySelector('#sq'); let t;
          sq.oninput = () => { clearTimeout(t); drawResults(sq.value); t = setTimeout(() => online(sq.value), 450); };
          sq.focus(); drawResults('');
        } else if (tab === 'own') drawOwn();
        else drawMeals();
      }
      function localMatches(q) {
        const nq = norm(q.trim());
        const own = Object.entries(custom).map(([id, f]) => ({ ...f, id: 'c_' + id, src: 'own' }));
        const rec = Object.values(recent).sort((a, b) => (b.last || 0) - (a.last || 0)).map((f) => ({ ...f, id: 'r_' + f.name, src: 'recent' }));
        if (!nq) return rec.slice(0, 12).concat(own.slice(0, 8));
        const words = nq.split(/\s+/);
        const match = (f) => words.every((w) => norm(`${f.name} ${f.brand || ''}`).includes(w));
        const seen = new Set(); const out = [];
        for (const f of [...own.filter(match), ...rec.filter(match), ...BASE_FOODS.filter(match).map((f) => ({ ...f, src: 'base' }))]) {
          const k = norm(f.name + (f.brand || '')); if (seen.has(k)) continue; seen.add(k); out.push(f);
        }
        return out.slice(0, 30);
      }
      function drawResults(q) {
        const sr = tb.querySelector('#sr'); if (!sr) return;
        const loc = localMatches(q);
        const lbl = { own: 'Eigenes', recent: 'Zuletzt', base: 'Datenbank', off: 'Open Food Facts' };
        const all = [...loc, ...offRes.filter((o) => !loc.some((l) => norm(l.name) === norm(o.name) && norm(l.brand || '') === norm(o.brand || '')))];
        sr.innerHTML = (all.length ? all.map((f, i) => `<div class="sr${selected && selected.id === f.id ? ' on' : ''}" data-i="${i}"><div class="grow" style="flex:1;min-width:0"><div class="ellip" style="font-weight:500">${esc(f.name)}${f.brand ? ` <span class="muted">· ${esc(f.brand)}</span>` : ''}</div><div class="xs muted">${per100(f)}</div></div><span class="tag">${lbl[f.src] || ''}</span></div>`).join('')
          : `<div class="dim small" style="padding:14px">${q.trim() ? 'Keine lokalen Treffer.' : 'Tippe, um die Lebensmitteldatenbank zu durchsuchen.'}</div>`)
          + (offState ? `<div class="xs muted" style="padding:10px 12px">${offState}</div>` : '');
        sr.onclick = (e) => { const r = e.target.closest('[data-i]'); if (!r) return; selected = all[+r.dataset.i]; sr.querySelectorAll('.sr').forEach((x) => x.classList.toggle('on', x === r)); drawAmount(); };
      }
      async function online(q) {
        if (ctrl) ctrl.abort();
        offRes = [];
        if (q.trim().length < 3) { offState = ''; drawResults(q); return; }
        ctrl = new AbortController(); const my = ctrl;
        offState = '<span class="spinner sm" style="display:inline-block;vertical-align:middle"></span> Suche in Open Food Facts…'; drawResults(q);
        const to = setTimeout(() => my.abort(), 12000);
        try { offRes = await searchOFF(q.trim(), my.signal); offState = offRes.length ? `${offRes.length} Produkte aus Open Food Facts (Herstellerangaben)` : 'Keine Produkte in Open Food Facts gefunden.'; }
        catch (e) { if (my !== ctrl) return; offState = 'Online-Datenbank gerade nicht erreichbar – lokale Ergebnisse werden angezeigt.'; }
        finally { clearTimeout(to); }
        if (my === ctrl && tb.querySelector('#sq')?.value === q) drawResults(q);
      }
      function drawAmount() {
        const a = tb.querySelector('#amount'); if (!a || !selected) return;
        const f = selected; const def = f.grams || (f.unit ? f.unit.g : 100);
        a.innerHTML = `<div class="card flat mt12" style="background:var(--card2)"><div style="font-weight:600">${esc(f.name)}</div><div class="xs muted">${per100(f)}</div>
          <div class="row wrap mt12" style="align-items:flex-end"><div class="field" style="width:130px"><label>Menge (g/ml)</label><input class="input" id="g" inputmode="decimal" value="${def}"></div>
          <div class="chips">${[50, 100, 150, 200, 250].map((x) => `<button class="chip" data-q="${x}">${x} g</button>`).join('')}${f.unit ? `<button class="chip" data-q="${f.unit.g}">1 ${esc(f.unit.label)} (${f.unit.g} g)</button>` : ''}</div></div>
          <div class="row between mt12"><span class="num" id="pv"></span><button class="btn pri" id="addb">${icon('plus')}Hinzufügen</button></div></div>`;
        const g = a.querySelector('#g'); const pv = a.querySelector('#pv');
        const upd = () => { const v = num(g.value); const mm = itemMacros({ ...f, grams: v > 0 ? v : 0 }); pv.innerHTML = `<b>${fmt(mm.kcal)} kcal</b> <span class="muted small">· P ${fmt(mm.p, 1)} · KH ${fmt(mm.c, 1)} · F ${fmt(mm.f, 1)}</span>`; };
        g.oninput = upd; upd();
        a.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { g.value = b.dataset.q; upd(); });
        const submit = () => {
          const v = num(g.value);
          if (!fieldErr(g, v == null || isNaN(v) || v <= 0 || v > 5000 ? '1–5000 g' : '')) return;
          busy(a.querySelector('#addb'), async () => {
            try {
              const item = { name: f.name, brand: f.brand || null, grams: Math.round(v * 10) / 10, kcal: f.kcal, p: f.p, c: f.c, f: f.f, meal, src: f.src, unit: f.unit || null };
              await addFood(date, item); touchRecent(item).catch(() => {});
              toast(`${f.name} hinzugefügt`); close(); reload();
            } catch (e) { toast(authErrorText(e), 'err'); }
          });
        };
        a.querySelector('#addb').onclick = submit;
        g.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
        g.focus(); g.select();
      }
      function drawOwn() {
        const list = Object.entries(custom);
        tb.innerHTML = `<form class="form-grid" id="cf" novalidate>
            <div class="field full"><label>Name</label><input class="input" name="fname" maxlength="60" placeholder="z. B. Omas Bolognese"></div>
            <div class="field"><label>kcal / 100 g</label><input class="input" name="kcal" inputmode="decimal"></div>
            <div class="field"><label>Protein / 100 g</label><input class="input" name="p" inputmode="decimal"></div>
            <div class="field"><label>Kohlenhydrate / 100 g</label><input class="input" name="c" inputmode="decimal"></div>
            <div class="field"><label>Fett / 100 g</label><input class="input" name="f" inputmode="decimal"></div>
            <div class="full"><button class="btn pri" type="submit">${icon('plus')}Lebensmittel speichern</button></div></form>
          <div class="sep"></div><h3>Deine Lebensmittel</h3>
          <div class="list mt8">${list.length ? list.map(([id, f]) => `<div class="li"><div class="grow"><div style="font-weight:500">${esc(f.name)}</div><div class="xs muted">${per100(f)}</div></div><button class="btn sm" data-use="${id}">Auswählen</button><button class="btn ghost icon" data-delc="${id}">${icon('trash')}</button></div>`).join('') : '<div class="dim small">Noch keine eigenen Lebensmittel.</div>'}</div>
          <div id="amount"></div>`;
        const cf = tb.querySelector('#cf');
        cf.onsubmit = async (e) => {
          e.preventDefault();
          const vals = {}; let ok = fieldErr(cf.fname, cf.fname.value.trim().length < 2 ? 'Bitte Namen angeben.' : '');
          for (const [k, max] of [['kcal', 950], ['p', 100], ['c', 100], ['f', 100]]) { const v = num(cf[k].value); vals[k] = v; ok = fieldErr(cf[k], v == null || isNaN(v) || v < 0 || v > max ? `0–${max}` : '') && ok; }
          if (ok && vals.p + vals.c + vals.f > 100) { ok = fieldErr(cf.f, 'Summe der Makros > 100 g'); }
          if (!ok) return;
          await busy(cf.querySelector('[type=submit]'), async () => {
            try { const id = await addCustomFood({ name: cf.fname.value.trim(), ...vals }); custom[id] = { name: cf.fname.value.trim(), ...vals }; toast('Gespeichert'); drawOwn(); selected = { ...custom[id], id: 'c_' + id, src: 'own' }; drawAmount(); }
            catch (err) { toast(authErrorText(err), 'err'); }
          });
        };
        tb.querySelectorAll('[data-use]').forEach((b) => b.onclick = () => { selected = { ...custom[b.dataset.use], id: 'c_' + b.dataset.use, src: 'own' }; drawAmount(); });
        tb.querySelectorAll('[data-delc]').forEach((b) => b.onclick = async () => { try { await deleteCustomFood(b.dataset.delc); delete custom[b.dataset.delc]; drawOwn(); } catch (err) { toast(authErrorText(err), 'err'); } });
      }
      function drawMeals() {
        const list = Object.entries(meals);
        tb.innerHTML = list.length ? `<div class="list">${list.map(([id, ml]) => { const s = sumDay(Object.fromEntries((ml.items || []).map((x, i) => [i, x])));
          return `<div class="li"><div class="grow"><div style="font-weight:600">${esc(ml.name)}</div><div class="xs muted">${(ml.items || []).length} Lebensmittel · ${fmt(s.kcal)} kcal · P ${fmt(s.p)} · KH ${fmt(s.c)} · F ${fmt(s.f)}</div></div>
          <button class="btn sm pri" data-usem="${id}">Hinzufügen</button><button class="btn ghost icon" data-delm="${id}">${icon('trash')}</button></div>`; }).join('')}</div>`
          : '<div class="empty"><b>Keine gespeicherten Mahlzeiten</b>Trage Lebensmittel ein und speichere sie mit dem Lesezeichen-Symbol an einer Mahlzeit.</div>';
        tb.querySelectorAll('[data-usem]').forEach((b) => b.onclick = () => busy(b, async () => {
          try { for (const it of meals[b.dataset.usem].items || []) await addFood(date, { ...it, meal }); toast(`${meals[b.dataset.usem].name} hinzugefügt`); close(); reload(); }
          catch (err) { toast(authErrorText(err), 'err'); }
        }));
        tb.querySelectorAll('[data-delm]').forEach((b) => b.onclick = async () => { if (!(await confirmDialog('Gespeicherte Mahlzeit löschen?'))) return; try { await deleteSavedMeal(b.dataset.delm); delete meals[b.dataset.delm]; drawMeals(); } catch (err) { toast(authErrorText(err), 'err'); } });
      }
    }
  });
}

function editDialog(id, it, reload) {
  modal({
    title: 'Eintrag bearbeiten',
    body: `<div style="font-weight:600">${esc(it.name)}</div><div class="xs muted">${per100(it)}</div>
      <div class="form-grid mt16"><div class="field"><label>Menge (g/ml)</label><input class="input" id="g" inputmode="decimal" value="${it.grams}"></div>
      <div class="field"><label>Mahlzeit</label><select class="input" id="ml">${MEALS.map(([k, n]) => `<option value="${k}" ${k === it.meal ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>`,
    foot: '<button class="btn ghost" data-c>Abbrechen</button><button class="btn pri" data-s>Speichern</button>',
    onMount: (m, close) => {
      m.querySelector('[data-c]').onclick = close;
      m.querySelector('[data-s]').onclick = (e) => {
        const g = m.querySelector('#g'); const v = num(g.value);
        if (!fieldErr(g, v == null || isNaN(v) || v <= 0 || v > 5000 ? '1–5000 g' : '')) return;
        busy(e.currentTarget, async () => {
          try { await updateFood(date, id, { ...it, grams: Math.round(v * 10) / 10, meal: m.querySelector('#ml').value }); toast('Gespeichert'); close(); reload(); }
          catch (err) { toast(authErrorText(err), 'err'); }
        });
      };
    }
  });
}

function saveMealDialog(items, mealName) {
  modal({
    title: 'Als Mahlzeit speichern',
    body: `<p class="muted small">${items.length} Lebensmittel werden als wiederverwendbare Mahlzeit gespeichert.</p><div class="field mt12"><label>Name</label><input class="input" id="n" maxlength="50" value="Mein ${esc(mealName)}"></div>`,
    foot: '<button class="btn ghost" data-c>Abbrechen</button><button class="btn pri" data-s>Speichern</button>',
    onMount: (m, close) => {
      m.querySelector('[data-c]').onclick = close;
      m.querySelector('[data-s]').onclick = (e) => {
        const n = m.querySelector('#n'); if (!fieldErr(n, n.value.trim().length < 2 ? 'Bitte Namen angeben.' : '')) return;
        busy(e.currentTarget, async () => {
          try { await addSavedMeal({ name: n.value.trim(), items: items.map(({ name, brand, grams, kcal, p, c, f, src }) => ({ name, brand: brand || null, grams, kcal, p, c, f, src: src || null })) }); toast('Mahlzeit gespeichert'); close(); }
          catch (err) { toast(authErrorText(err), 'err'); }
        });
      };
    }
  });
}

export function goalsDialog(onSaved) {
  const g = state.goals || {};
  modal({
    title: 'Tagesziele',
    body: `<div class="form-grid">
      <div class="field full"><label>Kalorien (kcal)</label><input class="input" name="kcal" inputmode="numeric" value="${g.kcal ?? ''}"></div>
      <div class="field"><label>Protein (g)</label><input class="input" name="p" inputmode="numeric" value="${g.p ?? ''}"></div>
      <div class="field"><label>Kohlenhydrate (g)</label><input class="input" name="c" inputmode="numeric" value="${g.c ?? ''}"></div>
      <div class="field"><label>Fett (g)</label><input class="input" name="f" inputmode="numeric" value="${g.f ?? ''}"></div>
      <p class="hint full" id="chk"></p>
      <p class="hint full">Tipp: Der <a href="#/rechner">Kalorienrechner</a> kann seine Schätzung direkt als Ziel übernehmen.</p></div>`,
    foot: '<button class="btn ghost" data-c>Abbrechen</button><button class="btn pri" data-s>Speichern</button>',
    onMount: (m, close) => {
      const q = (n) => m.querySelector(`[name=${n}]`);
      const chk = () => { const k = (num(q('p').value) || 0) * 4 + (num(q('c').value) || 0) * 4 + (num(q('f').value) || 0) * 9; m.querySelector('#chk').textContent = `Makros ergeben ≈ ${fmt(k)} kcal.`; };
      ['p', 'c', 'f'].forEach((n) => q(n).oninput = chk); chk();
      m.querySelector('[data-c]').onclick = close;
      m.querySelector('[data-s]').onclick = (e) => {
        const v = {}; let ok = true;
        for (const [k, min, max] of [['kcal', 800, 8000], ['p', 0, 500], ['c', 0, 1000], ['f', 0, 400]]) { const x = num(q(k).value); v[k] = Math.round(x); ok = fieldErr(q(k), x == null || isNaN(x) || x < min || x > max ? `${min}–${max}` : '') && ok; }
        if (!ok) return;
        busy(e.currentTarget, async () => { try { await saveGoals(v); toast('Ziele gespeichert'); close(); onSaved && onSaved(); } catch (err) { toast(authErrorText(err), 'err'); } });
      };
    }
  });
}
