// Trainingssplit-Wissensdatenbank
// week: 7 Einträge Mo–So, [Titel, Muskelgruppen] oder null = Pause
// freq: Trainingseinheiten pro Woche je Muskelgruppe (direktes Training)
export const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const MUSCLES = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Quadrizeps', 'Beinbeuger/Po', 'Waden', 'Bauch'];

const f = (b, r, s, bi, t, q, h, w, a) => ({ Brust: b, Rücken: r, Schultern: s, Bizeps: bi, Trizeps: t, Quadrizeps: q, 'Beinbeuger/Po': h, Waden: w, Bauch: a });

export const SPLITS = [
  {
    id: 'ganzkoerper-2', name: 'Ganzkörper 2×', short: 'Zwei Ganzkörpereinheiten pro Woche – der effizienteste Einstieg.',
    days: 2, level: 'Anfänger', session: '60–75 min', flex: 5, volume: 'mittel',
    desc: 'Jede Einheit trainiert alle großen Muskelgruppen mit je einer Grundübung und wenigen Ergänzungen. Zwei Termine pro Woche mit mindestens zwei Tagen Abstand reichen, um jeden Muskel 2× pro Woche zu reizen.',
    suitable: 'Einsteiger, Wiedereinsteiger und alle mit wenig Zeit (Schule, Job, Familie) oder als Ergänzung zu einer anderen Sportart.',
    pros: ['Sehr zeitsparend – nur 2 Termine', 'Jeder Muskel 2× pro Woche', 'Viel Erholung zwischen den Einheiten', 'Verpasste Tage leicht nachholbar'],
    cons: ['Begrenztes Gesamtvolumen pro Woche', 'Einheiten können lang werden', 'Für Fortgeschrittene mit hohem Volumenbedarf zu wenig'],
    week: [['Ganzkörper A', 'Beine, Brust, Rücken, Schultern'], null, null, ['Ganzkörper B', 'Beine, Rücken, Brust, Arme'], null, null, null],
    freq: f(2, 2, 2, 1, 1, 2, 2, 1, 1),
    sessions: {
      'Ganzkörper A': ['Kniebeugen 3×6–10', 'Bankdrücken 3×6–10', 'Latzug 3×8–12', 'Schulterdrücken KH 2×8–12', 'Beinbeuger 2×10–15', 'Plank 2×45 s'],
      'Ganzkörper B': ['Rumänisches Kreuzheben 3×6–10', 'Rudern am Kabel 3×8–12', 'Schrägbankdrücken KH 3×8–12', 'Beinpresse 2×10–15', 'Bizepscurls 2×10–15', 'Trizepsdrücken 2×10–15']
    },
    recovery: 'Mindestens 48–72 h zwischen den Einheiten (z. B. Mo/Do oder Di/Fr). Durch die lange Pause regenerieren auch schwere Grundübungen vollständig.',
    notes: ['Auf saubere Technik und progressive Steigerung (Gewicht oder Wiederholungen) konzentrieren.', 'Ideal, um nach 3–6 Monaten auf 3 Ganzkörpertage oder Upper/Lower zu wechseln.']
  },
  {
    id: 'fullbody', name: 'Full Body 3×', short: 'Drei Ganzkörpereinheiten (A/B/C) – Klassiker für Anfänger und Kraftaufbau.',
    days: 3, level: 'Anfänger', session: '60–75 min', flex: 4, volume: 'mittel',
    desc: 'Drei Ganzkörpereinheiten pro Woche, meist im Wechsel A/B/C. Jede Muskelgruppe wird 3× pro Woche mit moderatem Volumen trainiert – die hohe Frequenz ist besonders für das Erlernen der Grundübungen ideal.',
    suitable: 'Anfänger und leicht Fortgeschrittene, Kraftsportler und alle, die 3 feste Tage pro Woche haben.',
    pros: ['Hohe Trainingsfrequenz (3× pro Muskel)', 'Schneller Technikfortschritt bei Grundübungen', 'Ein verpasster Tag ist kein Problem', 'Gut erforscht und bewährt'],
    cons: ['Wenig Platz für Isolationsübungen', 'Beine an jedem Trainingstag können anstrengend sein', 'Bei sehr hohem Volumen wird die Regeneration knapp'],
    week: [['Ganzkörper A', 'Ganzer Körper'], null, ['Ganzkörper B', 'Ganzer Körper'], null, ['Ganzkörper C', 'Ganzer Körper'], null, null],
    freq: f(3, 3, 3, 2, 2, 3, 3, 2, 2),
    sessions: {
      'Ganzkörper A': ['Kniebeugen 3×5–8', 'Bankdrücken 3×5–8', 'Langhantelrudern 3×8–10', 'Seitheben 2×12–15'],
      'Ganzkörper B': ['Kreuzheben 3×4–6', 'Schulterdrücken 3×6–10', 'Klimmzüge 3×max', 'Bizepscurls 2×10–12'],
      'Ganzkörper C': ['Beinpresse 3×8–12', 'Schrägbankdrücken KH 3×8–12', 'Latzug 3×8–12', 'Trizepsdrücken 2×10–15']
    },
    recovery: '48 h zwischen den Einheiten (Mo/Mi/Fr). Schwere Kniebeugen und Kreuzheben nicht an aufeinanderfolgenden Tagen.',
    notes: ['Pro Einheit 1 schwere Grundübung pro Bewegungsmuster genügt.', 'Volumen pro Einheit moderat halten – die Frequenz macht das Wochenvolumen.']
  },
  {
    id: 'upper-lower', name: 'Upper Lower', short: 'Oberkörper/Unterkörper im Wechsel, 4 Tage – der vielleicht ausgewogenste Split.',
    days: 4, level: 'Fortgeschritten', session: '60–75 min', flex: 4, volume: 'mittel–hoch',
    desc: 'Der Körper wird in Ober- und Unterkörper aufgeteilt, beide werden 2× pro Woche trainiert. Häufig mit einem schwereren (Kraft) und einem leichteren (Hypertrophie) Tag pro Hälfte.',
    suitable: 'Leicht Fortgeschrittene bis Fortgeschrittene, die 4 Tage trainieren können und Kraft und Muskelaufbau kombinieren wollen.',
    pros: ['Jeder Muskel 2× pro Woche', 'Gute Balance aus Volumen und Erholung', 'Einfach zu planen', 'Gut für Kraft und Hypertrophie'],
    cons: ['Oberkörpertage werden lang (viele Muskelgruppen)', '4 feste Tage nötig', 'Arme bekommen eher wenig Direktvolumen'],
    week: [['Upper', 'Brust, Rücken, Schultern, Arme'], ['Lower', 'Quadrizeps, Beinbeuger, Po, Waden'], null, ['Upper', 'Brust, Rücken, Schultern, Arme'], ['Lower', 'Quadrizeps, Beinbeuger, Po, Waden'], null, null],
    freq: f(2, 2, 2, 2, 2, 2, 2, 2, 2),
    sessions: {
      'Upper': ['Bankdrücken 3×6–8', 'Langhantelrudern 3×6–10', 'Schulterdrücken KH 3×8–10', 'Latzug 3×8–12', 'Bizepscurls 2×10–12', 'Trizepsdrücken 2×10–12'],
      'Lower': ['Kniebeugen 3×5–8', 'Rumänisches Kreuzheben 3×6–10', 'Beinpresse 2×10–12', 'Beinbeuger 3×10–12', 'Wadenheben 3×10–15']
    },
    recovery: 'Nie zweimal dieselbe Hälfte hintereinander. Typisch Mo/Di – Pause – Do/Fr. Mindestens 48 h bis zur nächsten gleichen Einheit.',
    notes: ['Tag 1 schwer (wenige Wiederholungen), Tag 2 moderat (mehr Wiederholungen) bewährt sich.', 'Lässt sich als 3-Tage-Rotation (U/L/U, nächste Woche L/U/L) fahren.']
  },
  {
    id: 'torso-limbs', name: 'Torso / Extremitäten', short: 'Rumpfmuskeln vs. Arme & Beine – Alternative zu Upper/Lower.',
    days: 4, level: 'Fortgeschritten', session: '55–70 min', flex: 3, volume: 'mittel–hoch',
    desc: 'Torso-Tage trainieren Brust, Rücken und Schultern, Extremitäten-Tage Beine und Arme. Die Arme bekommen dadurch einen eigenen Schwerpunkt, der Oberkörpertag wird kürzer.',
    suitable: 'Fortgeschrittene, die mehr Armvolumen möchten oder bei Upper/Lower zu lange Oberkörpertage haben.',
    pros: ['Arme werden frisch und gezielt trainiert', 'Kürzere Torso-Einheiten als bei Upper', 'Jede Muskelgruppe 2× pro Woche'],
    cons: ['Beine + Arme an einem Tag ist ungewohnt', 'Arme werden an Torso-Tagen indirekt vorbelastet', 'Weniger verbreitet, weniger Vorlagen'],
    week: [['Torso', 'Brust, Rücken, Schultern'], ['Extremitäten', 'Beine, Bizeps, Trizeps'], null, ['Torso', 'Brust, Rücken, Schultern'], ['Extremitäten', 'Beine, Bizeps, Trizeps'], null, null],
    freq: f(2, 2, 2, 2, 2, 2, 2, 2, 2),
    sessions: {
      'Torso': ['Bankdrücken 3×6–8', 'Klimmzüge 3×6–10', 'Schulterdrücken 3×8–10', 'Rudern am Kabel 3×8–12', 'Seitheben 3×12–15'],
      'Extremitäten': ['Kniebeugen 3×6–8', 'Beinbeuger 3×10–12', 'Beinpresse 2×10–12', 'SZ-Curls 3×8–12', 'French Press 3×8–12', 'Wadenheben 3×10–15']
    },
    recovery: 'Wie Upper/Lower: Torso und Extremitäten abwechseln, 48 h zwischen gleichen Einheiten.',
    notes: ['Am Extremitäten-Tag zuerst Beine (große Muskeln), dann Arme.', 'Bauch an beiden Tagen kurz am Ende möglich.']
  },
  {
    id: 'push-pull', name: 'Push Pull', short: 'Drücken vs. Ziehen inkl. Beine – 4 Tage, einfach und effektiv.',
    days: 4, level: 'Anfänger–Fortgeschritten', session: '60–75 min', flex: 4, volume: 'mittel',
    desc: 'Push-Tage enthalten alle Druckbewegungen (Brust, Schultern, Trizeps, Quadrizeps), Pull-Tage alle Zugbewegungen (Rücken, Bizeps, hintere Kette). Die Beine werden auf beide Tage verteilt.',
    suitable: 'Alle, die 4 Tage trainieren und einen einfachen, logischen Split mit 2× Frequenz suchen.',
    pros: ['Logische Aufteilung nach Bewegungsmustern', 'Sehr wenig Überschneidung zwischen den Tagen', 'Jede Muskelgruppe 2× pro Woche'],
    cons: ['Beine werden auf zwei Tage gestreckt – Tage werden lang', 'Kniebeuge (Push) und Kreuzheben (Pull) belasten beide den unteren Rücken'],
    week: [['Push', 'Brust, Schultern, Trizeps, Quadrizeps'], ['Pull', 'Rücken, Bizeps, Beinbeuger, Po'], null, ['Push', 'Brust, Schultern, Trizeps, Quadrizeps'], ['Pull', 'Rücken, Bizeps, Beinbeuger, Po'], null, null],
    freq: f(2, 2, 2, 2, 2, 2, 2, 1, 1),
    sessions: {
      'Push': ['Kniebeugen 3×6–8', 'Bankdrücken 3×6–8', 'Schulterdrücken KH 3×8–10', 'Beinstrecker 2×12–15', 'Trizepsdrücken 3×10–12'],
      'Pull': ['Rumänisches Kreuzheben 3×6–8', 'Klimmzüge 3×6–10', 'Rudern am Kabel 3×8–12', 'Beinbeuger 2×10–12', 'Hammer Curls 3×10–12']
    },
    recovery: 'Push und Pull abwechseln; nach jedem Doppel einen Ruhetag.',
    notes: ['Bauch und Waden je 1–2× pro Woche ergänzen.']
  },
  {
    id: 'ppl', name: 'Push Pull Legs (PPL)', short: 'Der beliebteste Split: Drücken, Ziehen, Beine – 3 oder 6 Tage.',
    days: 6, level: 'Fortgeschritten', session: '60–75 min', flex: 3, volume: 'hoch',
    desc: 'Push trainiert Brust, Schultern und Trizeps, Pull trainiert Rücken und Bizeps, Legs die gesamte Beinmuskulatur. Mit 6 Tagen wird jede Gruppe 2× pro Woche trainiert, mit 3 Tagen 1×.',
    suitable: 'Fortgeschrittene mit viel Zeit und guter Regeneration. Die 3-Tage-Variante eignet sich auch für Einsteiger, ist aber weniger frequent.',
    pros: ['Klare Struktur, leicht zu merken', 'Viel Volumen pro Muskelgruppe möglich', 'Wenig Überschneidung zwischen den Tagen', 'Flexibel skalierbar (3–6 Tage)'],
    cons: ['6 Tage sind zeitintensiv und regenerativ fordernd', 'Bei 3 Tagen nur 1× Frequenz', 'Verpasste Tage verschieben den ganzen Zyklus'],
    week: [['Push', 'Brust, Schultern, Trizeps'], ['Pull', 'Rücken, Bizeps'], ['Legs', 'Beine'], null, ['Push', 'Brust, Schultern, Trizeps'], ['Pull', 'Rücken, Bizeps'], ['Legs / Pause', 'Beine oder Pause']],
    freq: f(2, 2, 2, 2, 2, 2, 2, 2, 1),
    sessions: {
      'Push': ['Bankdrücken 3×6–8', 'Schulterdrücken 3×8–10', 'Schrägbankdrücken KH 3×8–12', 'Seitheben 3×12–15', 'Trizepsdrücken 3×10–12', 'Überkopf-Trizeps 2×10–15'],
      'Pull': ['Klimmzüge 3×6–10', 'Langhantelrudern 3×6–10', 'Latzug eng 3×10–12', 'Face Pulls 3×12–15', 'Bizepscurls 3×8–12', 'Hammer Curls 2×10–12'],
      'Legs': ['Kniebeugen 3×5–8', 'Rumänisches Kreuzheben 3×6–10', 'Beinpresse 3×10–12', 'Beinbeuger 3×10–12', 'Wadenheben 4×10–15']
    },
    recovery: 'Jede Muskelgruppe hat 72–96 h bis zur nächsten Einheit. Mindestens 1 kompletter Ruhetag pro Woche; bei schlechter Regeneration auf 4–5 Tage (rollierend) reduzieren.',
    notes: ['Rollierend fahren (P/P/L/Pause) statt fest an Wochentagen.', 'Schulter vorne wird beim Drücken mittrainiert – Fokus auf Seitheben und hintere Schulter.']
  },
  {
    id: 'ppl-3', name: 'PPL 3 Tage', short: 'Push, Pull, Legs einmal pro Woche – kompakt mit viel Volumen pro Einheit.',
    days: 3, level: 'Anfänger–Fortgeschritten', session: '70–90 min', flex: 3, volume: 'hoch pro Einheit',
    desc: 'Die 3-Tage-Version von PPL: Jeder Muskel wird einmal pro Woche mit hohem Volumen trainiert. Gut planbar, aber mit niedriger Frequenz.',
    suitable: 'Alle mit genau 3 Trainingstagen, die eine klare Struktur wollen – oder als Einstieg in PPL.',
    pros: ['Nur 3 Tage', 'Viel Erholung pro Muskelgruppe', 'Einfache Struktur'],
    cons: ['Nur 1× Frequenz pro Woche', 'Für maximalen Muskelaufbau weniger optimal als 2×', 'Lange Einheiten'],
    week: [['Push', 'Brust, Schultern, Trizeps'], null, ['Pull', 'Rücken, Bizeps'], null, ['Legs', 'Beine, Bauch'], null, null],
    freq: f(1, 1, 1, 1, 1, 1, 1, 1, 1),
    sessions: {
      'Push': ['Bankdrücken 4×6–8', 'Schulterdrücken 3×8–10', 'Schrägbankdrücken KH 3×8–12', 'Butterfly 2×12–15', 'Seitheben 3×12–15', 'Trizepsdrücken 3×10–12'],
      'Pull': ['Klimmzüge 4×6–10', 'Langhantelrudern 3×8–10', 'Latzug 3×10–12', 'Reverse Flys 3×12–15', 'Bizepscurls 3×8–12'],
      'Legs': ['Kniebeugen 4×6–8', 'Rumänisches Kreuzheben 3×8–10', 'Beinpresse 3×10–12', 'Beinbeuger 3×10–12', 'Wadenheben 4×12–15', 'Kabel-Crunches 3×12–15']
    },
    recovery: '7 Tage zwischen gleichen Einheiten – Regeneration ist praktisch nie ein Problem.',
    notes: ['Wer mehr will, kann auf PPL 6× oder Upper/Lower wechseln.']
  },
  {
    id: 'split-3', name: '3er Split', short: 'Brust/Trizeps – Rücken/Bizeps – Beine/Schultern.',
    days: 3, level: 'Anfänger–Fortgeschritten', session: '60–80 min', flex: 3, volume: 'hoch pro Einheit',
    desc: 'Der klassische deutsche 3er Split kombiniert je eine große Muskelgruppe mit einer kleinen, die bei deren Übungen bereits mitarbeitet. Kann 1× (3 Tage) oder rollierend ~1,5× pro Woche trainiert werden.',
    suitable: 'Leicht Fortgeschrittene, die mehr Volumen pro Muskel wollen als im Ganzkörpertraining.',
    pros: ['Synergistische Kombinationen (Brust + Trizeps, Rücken + Bizeps)', 'Viel Fokus pro Muskelgruppe', 'Rollierend gut skalierbar'],
    cons: ['Fest an 3 Tagen nur 1× Frequenz', 'Schultern nach Beinen oft ermüdet', 'Kleine Muskeln teilweise vorermüdet'],
    week: [['Brust / Trizeps', 'Brust, Trizeps'], null, ['Rücken / Bizeps', 'Rücken, Bizeps, hintere Schulter'], null, ['Beine / Schultern', 'Beine, Schultern, Bauch'], null, null],
    freq: f(1, 1, 1, 1, 1, 1, 1, 1, 1),
    sessions: {
      'Brust / Trizeps': ['Bankdrücken 4×6–8', 'Schrägbankdrücken KH 3×8–10', 'Butterfly 3×12–15', 'French Press 3×8–12', 'Trizepsdrücken 3×10–12'],
      'Rücken / Bizeps': ['Klimmzüge 4×6–10', 'Langhantelrudern 3×8–10', 'Latzug eng 3×10–12', 'Bizepscurls 3×8–12', 'Hammer Curls 3×10–12'],
      'Beine / Schultern': ['Kniebeugen 4×6–8', 'Beinpresse 3×10–12', 'Beinbeuger 3×10–12', 'Schulterdrücken KH 3×8–10', 'Seitheben 4×12–15']
    },
    recovery: 'Fest: 1 Tag Pause zwischen den Einheiten. Rollierend (3 an, 1 aus): jede Gruppe ca. alle 4 Tage.',
    notes: ['Rollierend (A-B-C-Pause) erhöht die Frequenz auf ~1,7× pro Woche.']
  },
  {
    id: 'split-4', name: '4er Split', short: 'Vier Einheiten, jede Muskelgruppe einmal mit hohem Fokus.',
    days: 4, level: 'Fortgeschritten', session: '60–75 min', flex: 3, volume: 'hoch pro Einheit',
    desc: 'Der Körper wird auf vier Tage verteilt, z. B. Brust/Bizeps – Rücken/Trizeps – Schultern/Bauch – Beine. Jeder Muskel erhält einmal pro Woche hohes Volumen.',
    suitable: 'Fortgeschrittene mit 4 Tagen, die viel Abwechslung und Fokus pro Einheit mögen.',
    pros: ['Sehr fokussierte Einheiten', 'Lange Erholung pro Muskelgruppe', 'Gut für viele Übungsvarianten'],
    cons: ['Nur 1× Frequenz pro Woche', 'Verpasster Tag = Muskelgruppe fällt eine Woche aus'],
    week: [['Brust / Bizeps', 'Brust, Bizeps'], ['Rücken / Trizeps', 'Rücken, Trizeps'], null, ['Schultern / Bauch', 'Schultern, Bauch'], ['Beine', 'Quadrizeps, Beinbeuger, Po, Waden'], null, null],
    freq: f(1, 1, 1, 1, 1, 1, 1, 1, 1),
    sessions: {
      'Brust / Bizeps': ['Bankdrücken 4×6–8', 'Schrägbankdrücken KH 3×8–10', 'Kabelzug Crossover 3×12–15', 'Bizepscurls 3×8–12', 'Preacher Curls 2×10–12'],
      'Rücken / Trizeps': ['Kreuzheben 3×4–6', 'Klimmzüge 3×6–10', 'Rudern am Kabel 3×8–12', 'Enges Bankdrücken 3×6–10', 'Trizepsdrücken 3×10–12'],
      'Schultern / Bauch': ['Schulterdrücken 4×6–10', 'Seitheben 4×12–15', 'Reverse Flys 3×12–15', 'Shrugs 3×10–12', 'Kabel-Crunches 3×12–15'],
      'Beine': ['Kniebeugen 4×6–8', 'Rumänisches Kreuzheben 3×8–10', 'Beinpresse 3×10–12', 'Beinbeuger 3×10–12', 'Wadenheben 4×12–15']
    },
    recovery: 'Kreuzheben (Rücken) und Beintag mit mind. 48 h Abstand. Schultern nicht direkt nach Brust.',
    notes: ['Volumen pro Muskel und Woche ähnlich wie bei 2× Frequenz halten (10–20 harte Sätze).']
  },
  {
    id: 'bro-split', name: 'Bro Split', short: 'Ein Muskel pro Tag, 5 Tage – der Bodybuilding-Klassiker.',
    days: 5, level: 'Fortgeschritten', session: '45–70 min', flex: 2, volume: 'sehr hoch pro Einheit',
    desc: 'Jeder Tag gehört einer Muskelgruppe: Brust, Rücken, Schultern, Arme, Beine. Sehr viel Volumen pro Einheit, dafür nur einmal pro Woche pro Muskel.',
    suitable: 'Fortgeschrittene Bodybuilder mit 5 freien Tagen, die hohes Volumen pro Einheit vertragen und mögen.',
    pros: ['Maximaler Fokus und „Pump“ pro Muskelgruppe', 'Kurze, intensive Einheiten', 'Viel Erholung pro Muskel'],
    cons: ['Nur 1× Frequenz – Studien sehen 2× meist leicht vorne', 'Viel Volumen in einer Einheit ist teils „Junk Volume“', '5 feste Tage nötig'],
    week: [['Brust', 'Brust'], ['Rücken', 'Rücken'], ['Schultern', 'Schultern, Nacken'], ['Arme', 'Bizeps, Trizeps'], ['Beine', 'Beine, Waden'], null, null],
    freq: f(1, 1, 1, 1, 1, 1, 1, 1, 1),
    sessions: {
      'Brust': ['Bankdrücken 4×6–8', 'Schrägbankdrücken KH 3×8–10', 'Brustpresse 3×10–12', 'Butterfly 3×12–15', 'Dips 2×max'],
      'Rücken': ['Kreuzheben 3×4–6', 'Klimmzüge 3×6–10', 'Langhantelrudern 3×8–10', 'Latzug 3×10–12', 'Rudern am Kabel 3×10–12'],
      'Schultern': ['Schulterdrücken 4×6–10', 'Arnold Press 3×8–12', 'Seitheben 4×12–15', 'Reverse Flys 3×12–15', 'Shrugs 3×10–12'],
      'Arme': ['SZ-Curls 3×8–12', 'Enges Bankdrücken 3×6–10', 'Hammer Curls 3×10–12', 'French Press 3×8–12', 'Kabel-Curls 2×12–15', 'Trizepsdrücken 2×12–15'],
      'Beine': ['Kniebeugen 4×6–8', 'Beinpresse 3×10–12', 'Rumänisches Kreuzheben 3×8–10', 'Beinstrecker 3×12–15', 'Beinbeuger 3×10–12', 'Wadenheben 4×12–15']
    },
    recovery: 'Arme nicht direkt nach Brust/Rücken (vorermüdet). Beine am Ende der Woche, danach 2 Ruhetage.',
    notes: ['Kann aufgewertet werden, indem kleine Gruppen (Schultern, Arme) an anderen Tagen zusätzlich leicht trainiert werden.']
  },
  {
    id: 'arnold', name: 'Arnold Split', short: 'Brust/Rücken – Schultern/Arme – Beine, 2× pro Woche (6 Tage).',
    days: 6, level: 'Erfahren', session: '75–100 min', flex: 2, volume: 'sehr hoch',
    desc: 'Arnold Schwarzeneggers Split: Antagonisten Brust und Rücken zusammen, dann Schultern und Arme, dann Beine – jeweils zweimal pro Woche. Sehr hohes Volumen und hohe Frequenz.',
    suitable: 'Erfahrene Athleten mit sehr guter Regeneration, viel Zeit, gutem Schlaf und Ernährung.',
    pros: ['Hohe Frequenz UND hohes Volumen', 'Antagonisten-Supersätze (Brust/Rücken) sparen Zeit', 'Schultern und Arme bekommen viel Aufmerksamkeit'],
    cons: ['Sehr zeitintensiv (6 Tage, lange Einheiten)', 'Hohes Übertrainings-/Verletzungsrisiko für Einsteiger', 'Schultern werden am Brust-Tag stark vorbelastet'],
    week: [['Brust / Rücken', 'Brust, Rücken'], ['Schultern / Arme', 'Schultern, Bizeps, Trizeps'], ['Beine', 'Beine, Waden'], ['Brust / Rücken', 'Brust, Rücken'], ['Schultern / Arme', 'Schultern, Bizeps, Trizeps'], ['Beine', 'Beine, Waden'], null],
    freq: f(2, 2, 2, 2, 2, 2, 2, 2, 2),
    sessions: {
      'Brust / Rücken': ['Bankdrücken + Klimmzüge (Supersatz) 4×6–10', 'Schrägbankdrücken + Langhantelrudern 3×8–10', 'Fliegende + Latzug 3×10–12'],
      'Schultern / Arme': ['Schulterdrücken 4×6–10', 'Seitheben 4×12–15', 'SZ-Curls + French Press 3×8–12', 'Hammer Curls + Trizepsdrücken 3×10–12'],
      'Beine': ['Kniebeugen 4×6–8', 'Beinpresse 3×10–12', 'Rumänisches Kreuzheben 3×8–10', 'Beinbeuger 3×10–12', 'Wadenheben 4×12–15']
    },
    recovery: 'Nur 1 Ruhetag pro Woche – Schlaf (8 h+), ausreichend Kalorien und Deloads alle 4–8 Wochen sind Pflicht.',
    notes: ['Für die meisten ist das Original-Volumen zu viel – mit weniger Sätzen starten.', 'Nicht für Anfänger empfohlen.']
  },
  {
    id: 'ppl-ul', name: 'PPL + Upper/Lower', short: 'Hybrid aus PPL und Upper/Lower – 5 Tage, jeder Muskel ~2×.',
    days: 5, level: 'Fortgeschritten', session: '60–75 min', flex: 3, volume: 'hoch',
    desc: 'Drei Tage Push/Pull/Legs, gefolgt von Upper und Lower. So entsteht mit 5 Tagen eine Frequenz von 2× pro Woche für alle Muskelgruppen.',
    suitable: 'Fortgeschrittene mit 5 Tagen, denen PPL 6× zu viel und Upper/Lower zu wenig ist.',
    pros: ['2× Frequenz mit nur 5 Tagen', 'Abwechslungsreich', 'Gute Balance aus Volumen und Erholung'],
    cons: ['Etwas komplexer zu planen', 'Lower nach Legs braucht ausreichend Abstand'],
    week: [['Push', 'Brust, Schultern, Trizeps'], ['Pull', 'Rücken, Bizeps'], ['Legs', 'Beine'], null, ['Upper', 'Oberkörper'], ['Lower', 'Unterkörper'], null],
    freq: f(2, 2, 2, 2, 2, 2, 2, 2, 1),
    sessions: {
      'Push': ['Bankdrücken 3×6–8', 'Schulterdrücken 3×8–10', 'Seitheben 3×12–15', 'Trizepsdrücken 3×10–12'],
      'Pull': ['Klimmzüge 3×6–10', 'Langhantelrudern 3×8–10', 'Face Pulls 3×12–15', 'Bizepscurls 3×8–12'],
      'Legs': ['Kniebeugen 3×5–8', 'Rumänisches Kreuzheben 3×8–10', 'Beinstrecker 3×12–15', 'Wadenheben 3×12–15'],
      'Upper': ['Schrägbankdrücken KH 3×8–10', 'Latzug 3×8–12', 'Arnold Press 2×10–12', 'Hammer Curls 2×10–12', 'French Press 2×10–12'],
      'Lower': ['Beinpresse 3×8–12', 'Hip Thrust 3×8–12', 'Beinbeuger 3×10–12', 'Wadenheben sitzend 3×12–15']
    },
    recovery: 'Ruhetag zwischen Legs und Upper, damit der Lower-Tag mit ausreichend Abstand zum Legs-Tag liegt.',
    notes: ['Am Upper/Lower-Tag andere Übungsvarianten als bei PPL wählen.']
  }
];

export const SPLIT = Object.fromEntries(SPLITS.map((s) => [s.id, s]));
export const avgFreq = (s) => { const v = Object.values(s.freq); return v.reduce((a, b) => a + b, 0) / v.length; };
