# FORGE – Fitness-Plattform

Moderne Dark-Mode-Fitness-Plattform: **Übungs-Leaderboards**, **Trainingssplit-Datenbank mit Vergleich**, **Ernährungstracker** und **Kalorienrechner** – mit echten Benutzerkonten und Cloud-Speicherung.

**Live:** https://josyskd.github.io/forge-fitness/

## Funktionen
- **Konten:** Registrierung/Login mit Benutzername + Passwort (Firebase Authentication, Passwörter serverseitig gehasht), Passwort ändern, Konto löschen, Datenexport.
- **Dashboard:** Begrüßung, Plan des Tages, Statistiken, letzte Trainings, PRs, Platzierungen, Kalorien-/Makro-Übersicht, 7-Tage-Verlauf.
- **Leaderboards:** 63 Übungsvarianten (Langhantel/Kurzhantel/Kabel/Maschine getrennt), Wertung nach Gewicht, relativ zum Körpergewicht oder geschätztem 1RM; Filter Geschlecht & Gewichtsklasse; Körpergewichtsübungen mit Zusatzgewicht; Einträge bearbeiten/löschen, automatische PRs.
- **Eigene Trainingspläne:** 100 % individueller Editor (Wochenplan oder Rotation mit 1–14 Tagen, beliebige Übungen aus der Datenbank oder frei, Sätze/Wdh./Pause/Notiz, Reihenfolge), Start aus Split-Vorlage, als aktiven Plan wählen, **teilen** per Link oder direkt an Freunde (Benutzername) → „Mit mir geteilt“, Kopieren fremder Pläne, jederzeit wieder privat.
- **Trainingspläne:** 12 Splits mit Beschreibung, Eignung, Vor-/Nachteilen, Wochenplan, Beispiel-Einheiten, Frequenz je Muskelgruppe, Regeneration; Vergleich von bis zu 3 Splits; eigenen Plan wählen.
- **Ernährung:** 164 Basis-Lebensmittel + Online-Suche in Open Food Facts, eigene Lebensmittel, gespeicherte Mahlzeiten, Mahlzeiten-Kategorien, Tagesziele, Fortschrittsbalken, vergangene Tage.
- **Kalorienrechner:** Mifflin-St Jeor + PAL + Trainingsenergie, Ziel-Anpassung, Makro-Spannen, vollständiger Rechenweg; keine Defizite für unter 18-Jährige.
- **Profil:** Profilbild, Körperdaten, Erfahrung, Sichtbarkeits-Schalter, öffentliche Profilansicht.

## Technik
- Statische Single-Page-App (HTML/CSS/JavaScript-Module, kein Build) → GitHub Pages.
- Backend: Firebase (Projekt `klettlogin-3d1ed`, dasselbe wie Neon Jungle Casino) – Authentication + Realtime Database im Bereich `/fit`.
- Zugriffsschutz (entspricht RLS): `database.rules.fit.json` – private Daten nur für den Besitzer, Einträge nur im eigenen Namen, Plausibilitätsprüfung der Werte, Benutzername nicht fälschbar.

## Struktur
```
index.html          App-Einstieg
css/app.css         Design-System (Dark Mode, responsive)
js/app.js           Shell, Navigation, Router, Login/Registrierung
js/firebase.js      Firebase-Init + Auth
js/store.js         Datenzugriff, Live-Cache, Ranglisten-Logik
js/ui.js            UI-Helfer (Modals, Toasts, Icons, Formatierung)
js/data/            Übungen + Trainingssplits
js/foods-base.js    Basis-Lebensmitteldatenbank
js/pages/           Dashboard, Leaderboards, Pläne, Ernährung, Rechner, Profil, Einstellungen
```

## Regeln deployen
Die Regeln für `/fit` stehen in `database.rules.fit.json` und müssen in die Gesamtregeln des Projekts (zusammen mit den Casino-Regeln) eingefügt werden.
