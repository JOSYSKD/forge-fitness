// Zentraler Datenzugriff + Live-Cache (Realtime Database, Pfad /fit)
import { r, get, set, update, remove, push, onValue, auth } from './firebase.js';
import { EX, metrics } from './data/exercises.js';

export const state = {
  uid: null,
  profile: null,     // privat
  goals: null,
  plan: null,        // gewählter Split
  publics: {},       // uid -> öffentliches Profil
  entries: {},       // exId -> { entryId -> entry }
  loaded: { entries: false, publics: false }
};
const subs = new Set();
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const emit = (what) => subs.forEach((fn) => { try { fn(what); } catch (e) { console.error(e); } });

let unsub = [];
export async function startSession(uid) {
  stopSession();
  state.uid = uid;
  const snap = await get(r(`users/${uid}`));
  const u = snap.val() || {};
  state.profile = u.profile || null;
  state.goals = u.goals || { kcal: 2500, p: 150, c: 280, f: 80 };
  state.plan = u.plan || null;
  unsub.push(onValue(r('entries'), (s) => { state.entries = s.val() || {}; state.loaded.entries = true; emit('entries'); }, (e) => console.error(e)));
  unsub.push(onValue(r('public'), (s) => { state.publics = s.val() || {}; state.loaded.publics = true; emit('publics'); }, (e) => console.error(e)));
}
export function stopSession() {
  unsub.forEach((u) => u()); unsub = [];
  Object.assign(state, { uid: null, profile: null, goals: null, plan: null, publics: {}, entries: {}, loaded: { entries: false, publics: false } });
}
export const ready = () => new Promise((res) => {
  if (state.loaded.entries && state.loaded.publics) return res();
  const un = subscribe(() => { if (state.loaded.entries && state.loaded.publics) { un(); res(); } });
});
export const me = () => state.publics[state.uid] || { username: state.profile?.username };
export const username = () => state.profile?.username || me().username || '';

/* ---------- Profil ---------- */
export async function saveProfile(patch) {
  const uid = state.uid;
  const profile = { ...state.profile, ...patch };
  const pv = profile.privacy || {};
  const pub = { username: profile.username, createdAt: profile.createdAt || Date.now() };
  if (profile.avatar) pub.avatar = profile.avatar;
  if (pv.weight && profile.bodyweight) pub.bodyweight = profile.bodyweight;
  if (pv.height && profile.height) pub.height = profile.height;
  if (pv.training && profile.trainingSince) pub.trainingSince = profile.trainingSince;
  if (pv.training && profile.experience) pub.experience = profile.experience;
  if (pv.sex && profile.sex) pub.sex = profile.sex;
  pub.showPrs = !!pv.prs; pub.showRanks = !!pv.ranks;
  if (profile.bio) pub.bio = profile.bio;
  await update(r(), { [`users/${uid}/profile`]: clean(profile), [`public/${uid}`]: clean(pub) });
  state.profile = profile;
  emit('profile');
}
export async function saveGoals(g) { await set(r(`users/${state.uid}/goals`), g); state.goals = g; emit('goals'); }
export async function savePlan(p) { await set(r(`users/${state.uid}/plan`), p); state.plan = p; emit('plan'); }

/* ---------- Leaderboard-Einträge ---------- */
export async function addEntry(exId, data) {
  const ref = push(r(`entries/${exId}`));
  await set(ref, clean({ ...data, uid: state.uid, createdAt: Date.now() }));
  return ref.key;
}
export async function updateEntry(exId, id, data) {
  const old = state.entries?.[exId]?.[id];
  await set(r(`entries/${exId}/${id}`), clean({ ...old, ...data, uid: state.uid, updatedAt: Date.now() }));
}
export const deleteEntry = (exId, id) => remove(r(`entries/${exId}/${id}`));

/** Alle Einträge eines Users (flach, neueste zuerst) */
export function userEntries(uid = state.uid) {
  const out = [];
  for (const [exId, m] of Object.entries(state.entries || {})) {
    if (!EX[exId]) continue;
    for (const [id, e] of Object.entries(m || {})) if (e && e.uid === uid) out.push({ ...e, id, exId });
  }
  return out.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
}

/** Bestwert pro Nutzer für eine Übung unter einer Metrik; Filter: sex, wc */
export function ranking(exId, metric = 'abs', filt = {}) {
  const ex = EX[exId]; if (!ex) return [];
  const best = new Map();
  for (const [id, e] of Object.entries(state.entries?.[exId] || {})) {
    if (!e || typeof e.weight !== 'number') continue;
    const pub = state.publics[e.uid]; if (!pub) continue; // gelöschte Konten ausblenden
    if (filt.sex && filt.sex !== 'all' && pub.sex !== filt.sex) continue;
    if (filt.wc && (filt.wc.min > 0 || filt.wc.max < Infinity)) {
      if (!(e.bw > 0) || e.bw < filt.wc.min || e.bw >= filt.wc.max) continue;
    }
    const m = metrics(ex, e);
    const v = m[metric]; if (v == null || !isFinite(v)) continue;
    const cur = best.get(e.uid);
    if (!cur || v > cur.value || (v === cur.value && (e.reps || 1) > (cur.reps || 1))) best.set(e.uid, { ...e, id, value: v, m });
  }
  return [...best.values()].sort((a, b) => b.value - a.value || (b.reps || 0) - (a.reps || 0) || (a.createdAt || 0) - (b.createdAt || 0));
}

/** Persönliche Rekorde (bestes Gewicht je Übung) */
export function personalRecords(uid = state.uid) {
  const prs = {};
  for (const e of userEntries(uid)) {
    const cur = prs[e.exId];
    if (!cur || e.weight > cur.weight || (e.weight === cur.weight && e.reps > cur.reps)) prs[e.exId] = e;
  }
  return prs;
}

/** Plätze des Users in allen Leaderboards (absolute Wertung) */
export function userRanks(uid = state.uid) {
  const out = [];
  for (const exId of Object.keys(state.entries || {})) {
    if (!EX[exId]) continue;
    const list = ranking(exId, 'abs');
    const i = list.findIndex((x) => x.uid === uid);
    if (i >= 0) out.push({ exId, rank: i + 1, of: list.length, entry: list[i] });
  }
  return out.sort((a, b) => a.rank - b.rank || b.of - a.of);
}

/* ---------- Ernährung ---------- */
export const foodRef = (date) => r(`users/${state.uid}/food/${date}`);
export async function getDay(date) { return (await get(foodRef(date))).val() || {}; }
export async function addFood(date, item) { const ref = push(foodRef(date)); await set(ref, clean({ ...item, at: Date.now() })); return ref.key; }
export const updateFood = (date, id, item) => set(r(`users/${state.uid}/food/${date}/${id}`), clean(item));
export const deleteFood = (date, id) => remove(r(`users/${state.uid}/food/${date}/${id}`));
export async function getRange(from, to) {
  const s = await get(r(`users/${state.uid}/food`));
  const all = s.val() || {}; const out = {};
  for (const [d, v] of Object.entries(all)) if (d >= from && d <= to) out[d] = v;
  return out;
}
export async function customFoods() { return (await get(r(`users/${state.uid}/customFoods`))).val() || {}; }
export async function addCustomFood(f) { const ref = push(r(`users/${state.uid}/customFoods`)); await set(ref, clean(f)); return ref.key; }
export const deleteCustomFood = (id) => remove(r(`users/${state.uid}/customFoods/${id}`));
export async function savedMeals() { return (await get(r(`users/${state.uid}/meals`))).val() || {}; }
export async function addSavedMeal(m) { const ref = push(r(`users/${state.uid}/meals`)); await set(ref, clean(m)); return ref.key; }
export const deleteSavedMeal = (id) => remove(r(`users/${state.uid}/meals/${id}`));
export async function recentFoods() { return (await get(r(`users/${state.uid}/recent`))).val() || {}; }
export async function touchRecent(item) {
  const key = String(item.name).toLowerCase().replace(/[.#$\[\]\/]/g, '_').slice(0, 80);
  await set(r(`users/${state.uid}/recent/${key}`), clean({ name: item.name, brand: item.brand, kcal: item.kcal, p: item.p, c: item.c, f: item.f, unit: item.unit, last: Date.now(), grams: item.grams }));
}

/** Makros eines Eintrags (Werte pro 100 g × Menge) */
export const itemMacros = (it) => { const k = (it.grams || 0) / 100; return { kcal: (it.kcal || 0) * k, p: (it.p || 0) * k, c: (it.c || 0) * k, f: (it.f || 0) * k }; };
export function sumDay(day) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const it of Object.values(day || {})) { const m = itemMacros(it); t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f; }
  return t;
}


/* ---------- Eigene Trainingspläne + Teilen ---------- */
export async function listMyPlans() {
  const ids = Object.keys((await get(r(`users/${state.uid}/myPlans`))).val() || {});
  const plans = await Promise.all(ids.map((id) => getPlan(id).catch(() => null)));
  return plans.filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
export async function getPlan(id) {
  const v = (await get(r(`plans/${id}`))).val();
  return v ? normPlan({ ...v, id }) : null;
}
export function normPlan(p) {
  p.days = (Array.isArray(p.days) ? p.days : Object.values(p.days || {})).map((d) => ({
    ...d, exercises: Array.isArray(d.exercises) ? d.exercises : Object.values(d.exercises || {})
  }));
  return p;
}
export async function savePlanDoc(id, data) {
  const key = id || push(r('plans')).key;
  const now = Date.now();
  const doc = clean({ ...data, owner: state.uid, ownerName: username(), updatedAt: now, createdAt: data.createdAt || now });
  delete doc.id;
  await update(r(), { [`plans/${key}`]: doc, [`users/${state.uid}/myPlans/${key}`]: true });
  return key;
}
export async function setPlanShared(id, shared) { await update(r(`plans/${id}`), { shared: !!shared, updatedAt: Date.now() }); }
export async function deletePlanDoc(id) {
  const upd = { [`plans/${id}`]: null, [`users/${state.uid}/myPlans/${id}`]: null };
  if (state.plan?.id === id) upd[`users/${state.uid}/plan`] = null;
  await update(r(), upd);
  if (state.plan?.id === id) { state.plan = null; emit('plan'); }
}
/** Plan an Freund (Benutzername) senden → landet in dessen „Mit mir geteilt“ */
export async function sendPlanTo(name, plan) {
  const uid = (await get(r(`usernames/${name.trim().toLowerCase()}`))).val();
  if (!uid) throw Object.assign(new Error('Benutzer nicht gefunden'), { code: 'forge/no-user' });
  if (uid === state.uid) throw Object.assign(new Error('self'), { code: 'forge/self' });
  if (!plan.shared) await setPlanShared(plan.id, true);
  await set(r(`inbox/${uid}/${plan.id}`), { from: state.uid, fromName: username(), planName: plan.name, at: Date.now() });
  return state.publics[uid]?.username || name;
}
export async function inbox() { return (await get(r(`inbox/${state.uid}`))).val() || {}; }
export const removeInbox = (pid) => remove(r(`inbox/${state.uid}/${pid}`));

/* ---------- Konto ---------- */
export async function exportAll() {
  const s = await get(r(`users/${state.uid}`));
  return { exportedAt: new Date().toISOString(), username: username(), private: s.val(), entries: userEntries(), plans: await listMyPlans() };
}
export async function deleteAllData() {
  const uid = state.uid; const upd = {};
  for (const id of Object.keys((await get(r(`users/${uid}/myPlans`))).val() || {})) upd[`plans/${id}`] = null;
  for (const e of userEntries(uid)) upd[`entries/${e.exId}/${e.id}`] = null;
  upd[`users/${uid}`] = null; upd[`public/${uid}`] = null;
  if (state.profile?.username) upd[`usernames/${state.profile.username.toLowerCase()}`] = null;
  await update(r(), upd);
}

/** undefined/NaN entfernen (Firebase akzeptiert kein undefined) */
function clean(o) {
  if (Array.isArray(o)) return o.map(clean);
  if (o && typeof o === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(o)) { if (v === undefined || (typeof v === 'number' && !isFinite(v))) continue; out[k] = clean(v); }
    return out;
  }
  return o;
}
export { auth };
