# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

### Environment
- Node version is specified in `.nvmrc` (use `nvm use` or equivalent)

## Architecture Overview

### Project Structure
This is a **YouTrack Templateapp** — a widget framework that extends JetBrains YouTrack. Each widget is an independent React component that runs in an iframe within YouTrack's UI.

```
src/
├── widgets/
│   └── plot/          # Primary widget: Contributions over Time (worklog visualization)
│       ├── templateapp.tsx         # Main React component
│       ├── Plot.tsx    # D3 visualization of worklogs as a Git-style heatmap
│       ├── RadialChart.tsx # WIP radial chart visualization (mostly commented out)
│       ├── types.d.ts        # TypeScript types for YouTrack data
│       ├── helper.ts       # Utility functions
│       ├── index.tsx       # Entry point (registers widget with YouTrack)
│       ├── index.html      # Widget HTML shell
│       └── app.css         # Widget styles
└── sample/                 # Sample/demo widgets (not deployed)
    ├── lorem, cats, quotes, etc.
```

### Widget Entry Point Pattern
Each widget follows this pattern:
1. **index.html** — Minimal HTML shell that loads the React entry point
2. **index.tsx** — Mounts React app and calls `YTApp.register()` to connect to YouTrack's Host API
3. **templateapp.tsx** — Wraps the core component (Plot, RadialChart, etc.) and manages YouTrack integration
4. **Component file** (e.g., Plot.tsx) — Contains the actual visualization logic

### Key Architectural Patterns

#### YouTrack API Integration
- Widgets access YouTrack through the **Host API** (`HostAPI` type from `@types/globals`)
- Call `YTApp.register()` in a useEffect to get the host object
- Use `host.fetchYouTrack(endpoint, config)` to query workitems, custom fields, etc.
- Use `host.alert()` for error messaging

Example:
```typescript
const newHost = await YTApp.register();
const response = await host.fetchYouTrack('workItems', {
  query: { fields: "id,author(name,login),duration(minutes),date" }
});
```

#### D3 + React Integration
- D3 rendering happens in SVG refs managed via `useRef`
- State (filtered data, rendered data, perspective) is stored in React hooks
- D3 code runs in useEffect callbacks that re-render when dependencies change
- No React-D3 wrapper library (raw D3 integration)

#### Data Flow in Plot
1. Fetch worklogs from YouTrack via Host API (`useEffect` on date range)
2. Filter/transform raw data into visualization format (group by week/day)
3. Process data for rendering: rollup by date and perspective person
4. Render D3 visualization: scale/axes setup, bind data to SVG rects

### Build & Bundle Configuration

**Vite Configuration** (`vite.config.ts`):
- Multiple entry points: each widget gets its own `index.html` rollup input
- Static file copying: manifest.json, public assets, widget icons/configs
- Widget assets (SVG, JSON) bundled into dist root
- Base path is empty (widgets loaded from root in YouTrack)

**Output Structure**:
- All widgets compile to a flat `dist/` directory
- `manifest.json` describes all widgets and their extension points (e.g., `DASHBOARD_WIDGET`)
- Each widget references its `indexPath` (e.g., `plot/index.html`) in the manifest
- ZIP'ed and uploaded to YouTrack for installation

### TypeScript Setup
- **Strict mode enabled** (`tsconfig.app.json`)
- JSX configured as `react-jsx` (auto-imports React)
- ES2020 target with DOM + DOM.Iterable libs
- `skipLibCheck: true` for faster builds
- Global types in `@types/globals` (YouTrack HostAPI, YTApp)

### ESLint Configuration
- Based on JetBrains conventions (`@jetbrains/eslint-config` + React/browser variants)
- Max line length: 120 characters
- Enforces React best practices (hooks, jsx-a11y, react-refresh)
- No literal JSX strings allowed (jsxNoLiterals off for this project)

## Common Development Tasks

### Adding a New Widget
1. Create folder under `src/widgets/my-widget/`
2. Add entry point: `index.html` (minimal shell), `index.tsx` (register + mount)
3. Create component file (e.g., `MyWidget.tsx`)
4. Add widget configuration to `manifest.json` (name, icon, extension point, indexPath)
5. Add Vite input entry in `vite.config.ts` rollupOptions.input
6. Run `npm run build` to bundle

### Testing Changes
- `npm run dev` starts Vite dev server; open `http://localhost:5173/src/widgets/plot/index.html` to view locally
- To test in YouTrack: `npm run build && npm run upload` (requires .env setup)
- Linting must pass before build: `npm run lint --fix` to auto-correct

### Updating Data Queries
- Worklog queries are in Plot.tsx (line ~72)
- Query shape: fields string specifies which YouTrack API fields to fetch
- Modify the fields string to add/remove data (e.g., `issue(customFields(...))`)
- Response type should match or extend `FetchedDataPoint` (types.d.ts)

## Notes for Future Work

- **RadialChart.tsx**: Work-in-progress component (mostly commented out); if resuming, be aware the visualization logic is incomplete
- **Sample widgets**: `src/sample/` contains demo/template widgets not deployed; useful for reference but not in manifest
- **No tests**: `npm run test` echoes "no tests" — testing infrastructure not set up
- **Styling**: Uses Ring UI components (JetBrains) + custom CSS; Ring UI theme respects YouTrack's light/dark mode
- **Performance**: D3 re-renders full visualization on state changes; consider memoization if adding complex interactions