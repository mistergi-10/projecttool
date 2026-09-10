# projectraum

Grundgeruest fuer ein Portal zur Projektbegleitung. Die API verwendet vorerst ausschliesslich In-Memory-Daten; ein Neustart setzt sie zurueck.

## Fachliches Modell

Ein Projekt ist der Fuehrungsrahmen und besitzt genau einen **primaeren Projektstatus**. Diese Stati sind als Katalog konfigurierbar (`/api/project-statuses`), zum Beispiel `Geplant`, `In Bearbeitung`, `Pausiert` und `Abgeschlossen`.

Ein Projekt besitzt eine oder mehrere **Ideen**. Jede Idee hat einen **sekundaeren Ideenstatus** aus dem versionierten InnoV-Katalog (`/api/idea-stages`): `Ideate`, `Validate`, `Experiment`, `Evolve` und `Implement`. Damit bleiben operative Projektsteuerung und Innovationsfortschritt bewusst getrennt. Problemstellung, Ideen und Wissensstand bilden den Eingang des Prozesses und sind keine Ideenstati.

Der Start-Endpunkt fuer die gesamte Oberfläche ist `/api/portal`. Einzelne Kataloge und Beziehungen sind zudem ueber `/api/projects`, `/api/ideas`, `/api/project-statuses` und `/api/idea-stages` abrufbar.

## Lokal starten

```bash
npm install
npm run build
npm start
```

Fuer die reine Frontend-Entwicklung:

```bash
npm run dev
```

## Render

`render.yaml` ist enthalten. Im Render-Workspace kann das Repository als Blueprint verbunden werden. Render baut mit `npm run build` und startet mit `npm start`.# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
