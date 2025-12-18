# GameCircl — Projektzusammenfassung

**Datum:** 18. Dezember 2025

## Kurzzusammenfassung (Elevator Pitch) ✅
GameCircl ist eine statische, responsive Web‑App (HTML/CSS/JS), die eine Sammlung von Party‑ und Gesellschaftsspielen präsentiert, erklärt und lokal spielerische Interaktionen ermöglicht. Inhalte (Spiele & News) werden aus lokalen JSON‑Datastores geladen; Benutzerprofile und Statistiken werden ausschließlich lokal im Browser gespeichert (Privacy‑First).

---

## Projektziele & Konzept 🎯
- **Zielgruppe:** Freundeskreise, Familien, Paare — schnell, spontan und ohne App‑Installation Spiele starten.
- **Kernidee:** Sammlung von partyfreundlichen Spielmodi mit klaren Regeln, One‑Click‑Start, Game‑Info‑Modalen, News und lokalen Statistiken.
- **Privacy‑First:** Keine serverseitige Speicherung personenbezogener Daten; lokale Speicherung in `localStorage`.

---

## Architektur & wichtigste Dateien 📁
- HTML: `index.html`, `spiele.html`, `news.html`, `ueber.html`, `impressum.html`
- CSS: `CSS/style-start.css` (Basis) + seiten­spezifische Styles (`style-spiele.css`, `style-news.css`, ...)
- JS: `JS/script-start.js`, `JS/script-spiele.js`, `JS/script-news.js`, (je Seite ggf. kleine Ergänzungen wie `script-ueber.js`)
- JSON Content: `JSON-Datastores/spiele.json`, `JSON-Datastores/news.json` (dynamisches Laden)
- Assets: `bilder/` (Favicons, manifest)

---

## Wichtige Funktionen & UX-Flows 🔧
1. **Navigation:** Persistente Sidebar mit Links, Theme‑Selector, Mini‑Profil und Mobile‑Hamburger (Swipe + Overlay).
2. **Theming:** Auto / Light / Dark, gespeicherte Wahl (`gc-theme`), reagiert auf System‑Theme (bei Auto).
3. **Spiele‑Rendering:** `spiel.json` → `script-spiele.js` rendert responsive Cards mit Gradient‑Pill, Tags, Start‑Button (navigiert) und Info‑Modal.
4. **Game Info Modal:** Detaillierte Regeln, Anleitung (`how`), Tags, dynamische Farben und Link zur Spiel‑Subseite.
5. **News:** `news.json` geladen von `script-news.js`; Filter, Suche, Sortierung und collapsible Details; Pinned‑Badge.
6. **Profil & Stats:** Lokales Profil `gc-user` + `gc-stats` mit Export/Import (JSON). Simulation/Reset im UI.
7. **Accessibility & Controls:** Modale nutzen `role="dialog"` & `aria-hidden`; ESC schließt Modale.

---

## Datenfluss & Persistenz 🔁
- Inhalte werden per `fetch` aus lokalen JSON‑Dateien geladen (keine API notwendig).
- Nutzerdaten (Name, Statistiken, Theme) bleiben lokal in `localStorage` (Schlüssel `gc-user`, `gc-stats`, `gc-theme`).
- Import/Export als JSON ermöglicht Backup/Wiederherstellung von lokalen Daten.

---

## Styling & Responsiveness 🎨
- Modernes Design: sanfte Gradients, Card‑Shadows, smooth fadeIn Animationen.
- Grid/Layouts: Responsive `card-grid` (auto‑fit/minmax auf Spiele‑Seite), Breakpoints für Mobile.
- Mobile UX: Floating‑Hamburger, Sidebar‑Swipe, Overlay.

---

## Sicherheit & Datenschutz 🔒
- Keine personenbezogenen Daten werden an Dritte übermittelt oder extern gespeichert.
- Hinweise zum Datenschutz befinden sich in `impressum.html`.
- Empfehlung: Hosting über HTTPS (z. B. GitHub Pages) für Verschlüsselung.

---

## Stärken ✅
- Datenschutzfreundliches, simples statisches Konzept.
- Leicht erweiterbar: neue Spiele/News per JSON ohne Code‑Deployment.
- Gute UX‑Grundlagen: Theming, mobile Navigation, Filter & Sort.

---

## Limitierungen & Vorschläge zur Weiterentwicklung ⚠️
- Keine Multi‑Device Sync (optional: Backend + Auth für Sync).
- Verbesserungen Accessibility: Fokusmanagement / Fokus‑Trap in Modalen.
- Tests & CI: Linting, Unit Tests für render‑Funktionen, automatische Checks.
- Content Admin: Einfache Admin‑UI zum Editieren von JSON‑Content wäre nützlich.

---

## Deployment & Betrieb 🛠️
- Einfaches Static Hosting möglich (GitHub Pages, Netlify, Vercel).
- Empfehlung: CI (Lint + Tests), optional Release‑Notes / Changelog (`CHANGELOG.md`).

---