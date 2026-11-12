// Übungsdatenbank. Jede Variante ist eine eigene Übung mit eigenem Leaderboard.
// type: 'load' = Gesamtlast (Stange/Maschine/Kabel), 'db' = Gewicht pro Kurzhantel/Hand,
//       'bw'   = Körpergewichtsübung, eingetragen wird das ZUSATZgewicht (Gesamtlast = KG + Zusatz)
export const GROUPS = [
  { id: 'brust', name: 'Brust' },
  { id: 'schultern', name: 'Schultern' },
  { id: 'ruecken', name: 'Rücken' },
  { id: 'arme', name: 'Arme' },
  { id: 'beine', name: 'Beine' },
  { id: 'core', name: 'Core' }
];

const E = (id, name, group, equip, type = 'load', note = '') => ({ id, name, group, equip, type, note });

export const EXERCISES = [
  // Brust
  E('bench_bb', 'Bankdrücken', 'brust', 'Langhantel'),
  E('bench_db', 'Kurzhantel-Bankdrücken', 'brust', 'Kurzhantel', 'db'),
  E('incline_bb', 'Schrägbankdrücken', 'brust', 'Langhantel'),
  E('incline_db', 'Schrägbankdrücken', 'brust', 'Kurzhantel', 'db'),
  E('incline_smith', 'Schrägbankdrücken', 'brust', 'Multipresse'),
  E('decline_bb', 'Negativ-Bankdrücken', 'brust', 'Langhantel'),
  E('chest_press', 'Brustpresse', 'brust', 'Maschine'),
  E('butterfly', 'Butterfly', 'brust', 'Maschine'),
  E('fly_db', 'Fliegende', 'brust', 'Kurzhantel', 'db'),
  E('cable_cross', 'Kabelzug Crossover', 'brust', 'Kabel', 'load', 'Gewicht pro Seite'),
  E('cable_fly_low', 'Kabelzug von unten', 'brust', 'Kabel', 'load', 'Gewicht pro Seite'),
  E('dips', 'Dips', 'brust', 'Körpergewicht', 'bw'),
  // Schultern
  E('ohp_bb', 'Schulterdrücken stehend', 'schultern', 'Langhantel'),
  E('ohp_db', 'Schulterdrücken sitzend', 'schultern', 'Kurzhantel', 'db'),
  E('shoulder_press_m', 'Schulterpresse', 'schultern', 'Maschine'),
  E('arnold_press', 'Arnold Press', 'schultern', 'Kurzhantel', 'db'),
  E('lateral_db', 'Seitheben', 'schultern', 'Kurzhantel', 'db'),
  E('lateral_cable', 'Seitheben einarmig', 'schultern', 'Kabel'),
  E('lateral_m', 'Seitheben', 'schultern', 'Maschine'),
  E('front_raise_db', 'Frontheben', 'schultern', 'Kurzhantel', 'db'),
  E('front_raise_cable', 'Frontheben', 'schultern', 'Kabel'),
  E('reverse_fly_db', 'Reverse Flys vorgebeugt', 'schultern', 'Kurzhantel', 'db'),
  E('reverse_fly_m', 'Reverse Flys', 'schultern', 'Maschine'),
  E('face_pull', 'Face Pulls', 'schultern', 'Kabel'),
  // Rücken
  E('pullup', 'Klimmzüge (Obergriff)', 'ruecken', 'Körpergewicht', 'bw'),
  E('chinup', 'Klimmzüge (Untergriff)', 'ruecken', 'Körpergewicht', 'bw'),
  E('lat_pulldown', 'Latzug breit', 'ruecken', 'Kabel'),
  E('lat_pulldown_close', 'Latzug eng', 'ruecken', 'Kabel'),
  E('seated_row', 'Rudern am Kabel', 'ruecken', 'Kabel'),
  E('row_bb', 'Langhantelrudern', 'ruecken', 'Langhantel'),
  E('row_db', 'Kurzhantelrudern einarmig', 'ruecken', 'Kurzhantel', 'db'),
  E('tbar_row', 'T-Bar Rudern', 'ruecken', 'T-Bar', 'load', 'Nur Scheibengewicht'),
  E('row_machine', 'Rudern brustgestützt', 'ruecken', 'Maschine'),
  E('deadlift', 'Kreuzheben', 'ruecken', 'Langhantel'),
  E('shrug_bb', 'Shrugs', 'ruecken', 'Langhantel'),
  E('shrug_db', 'Shrugs', 'ruecken', 'Kurzhantel', 'db'),
  // Arme
  E('curl_bb', 'Bizepscurls', 'arme', 'Langhantel'),
  E('curl_ez', 'Bizepscurls', 'arme', 'SZ-Stange'),
  E('curl_db', 'Bizepscurls', 'arme', 'Kurzhantel', 'db'),
  E('hammer_db', 'Hammer Curls', 'arme', 'Kurzhantel', 'db'),
  E('preacher_curl', 'Scottcurls', 'arme', 'SZ-Stange'),
  E('cable_curl', 'Bizepscurls', 'arme', 'Kabel'),
  E('pushdown_rope', 'Trizepsdrücken am Kabel', 'arme', 'Kabel – Seil'),
  E('pushdown_bar', 'Trizepsdrücken am Kabel', 'arme', 'Kabel – Stange'),
  E('french_press', 'French Press', 'arme', 'SZ-Stange'),
  E('overhead_ext_cable', 'Überkopf-Trizepsstrecken', 'arme', 'Kabel'),
  E('close_grip_bench', 'Enges Bankdrücken', 'arme', 'Langhantel'),
  // Beine
  E('squat_bb', 'Kniebeugen', 'beine', 'Langhantel'),
  E('front_squat', 'Frontkniebeugen', 'beine', 'Langhantel'),
  E('hack_squat', 'Hackenschmidt', 'beine', 'Maschine'),
  E('leg_press', 'Beinpresse', 'beine', 'Maschine'),
  E('leg_ext', 'Beinstrecker', 'beine', 'Maschine'),
  E('leg_curl_lying', 'Beinbeuger liegend', 'beine', 'Maschine'),
  E('leg_curl_seated', 'Beinbeuger sitzend', 'beine', 'Maschine'),
  E('rdl', 'Rumänisches Kreuzheben', 'beine', 'Langhantel'),
  E('hip_thrust', 'Hip Thrust', 'beine', 'Langhantel'),
  E('bulgarian', 'Bulgarian Split Squats', 'beine', 'Kurzhantel', 'db'),
  E('lunge_db', 'Ausfallschritte', 'beine', 'Kurzhantel', 'db'),
  E('calf_standing', 'Wadenheben stehend', 'beine', 'Maschine'),
  E('calf_seated', 'Wadenheben sitzend', 'beine', 'Maschine'),
  E('adductor', 'Adduktoren', 'beine', 'Maschine'),
  // Core
  E('cable_crunch', 'Kabel-Crunches', 'core', 'Kabel'),
  E('ab_machine', 'Bauchmaschine', 'core', 'Maschine')
];

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
export const exLabel = (e) => `${e.name} (${e.equip})`;
export const groupName = (id) => (GROUPS.find((g) => g.id === id) || {}).name || id;
export const unitHint = (e) => e.type === 'db' ? 'kg pro Kurzhantel' : e.type === 'bw' ? 'kg Zusatzgewicht' : (e.note || 'kg Gesamtlast');

// Gewichtsklassen (Körpergewicht zum Zeitpunkt des Eintrags)
export const WEIGHT_CLASSES = [
  { id: 'all', name: 'Alle', min: 0, max: Infinity },
  { id: 'u60', name: '< 60 kg', min: 0, max: 60 },
  { id: '60', name: '60–70', min: 60, max: 70 },
  { id: '70', name: '70–80', min: 70, max: 80 },
  { id: '80', name: '80–90', min: 80, max: 90 },
  { id: '90', name: '90–100', min: 90, max: 100 },
  { id: '100', name: '100+ kg', min: 100, max: Infinity }
];

/** Geschätztes 1RM (Epley), nur bis 12 Wdh. sinnvoll */
export const e1rm = (load, reps) => reps <= 1 ? load : load * (1 + Math.min(reps, 12) / 30);

/** Kennzahlen eines Eintrags je nach Übungstyp */
export function metrics(ex, en) {
  const bw = en.bw > 0 ? en.bw : null;
  const total = ex.type === 'bw' ? (bw ? bw + en.weight : null) : en.weight;
  return {
    abs: en.weight,                                     // eingetragenes Gewicht (bei bw: Zusatz)
    total,                                              // Gesamtlast (bei bw nur mit Körpergewicht)
    e1rm: total != null ? e1rm(total, en.reps) : (ex.type === 'bw' ? null : e1rm(en.weight, en.reps)),
    rel: bw && total != null ? total / bw : null        // relativer Kraftwert (× Körpergewicht)
  };
}
