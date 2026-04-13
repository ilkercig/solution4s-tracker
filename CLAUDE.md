# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fork of the [Traccar Web Interface](https://github.com/traccar/traccar-web) — a React-based GPS tracking and fleet management SPA — customized for **Solution4s** (Solution 4s Takip Portalı). The upstream remote is `https://github.com/traccar/traccar-web`.

## Commands

```bash
npm start              # Dev server at http://localhost:3000 (proxies /api to Traccar backend)
npm run build          # Production build → ./build/
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix ESLint violations
```

The dev server requires a running Traccar backend. The proxy target is controlled by `VITE_TRACCAR_SERVER_DOMAIN` (defaults to `xxzwadnmh.traccar.com` in `vite.config.js`). There is no automated test suite.

## Architecture

### Entry Point & Routing

`src/index.jsx` → `App.jsx` (session management, providers) → `Navigation.jsx` (React Router v7 routes)

Background controllers are mounted at the app root level:
- **SocketController.jsx** — WebSocket connection for real-time device position streaming
- **CachingController.js** — Local storage caching layer
- **UpdateController.jsx** — PWA service worker updates

### State Management (Redux Toolkit)

Store slices in `src/store/`: `devices`, `session`, `events`, `geofences`, `groups`, `drivers`, `maintenances`, `calendars`, `errors`. A custom `throttleMiddleware` is applied for performance.

Read state with `useSelector`, write with `useDispatch`. Error handling goes through the `errors` slice via `useCatch` / `useCatchCallback` custom hooks.

### API Communication

All REST calls go through `apiFetch()` in `src/common/util/url.js`. This utility handles environment-aware URL construction:
- **Dev:** `/api/*` proxied by Vite to the backend
- **Prod:** direct HTTPS to `VITE_TRACCAR_SERVER_DOMAIN`

WebSocket real-time updates are handled separately by `SocketController`.

### Feature Modules

| Directory | Purpose |
|-----------|---------|
| `src/login/` | Auth flows (login, register, reset, OpenID, token auth) |
| `src/main/` | Primary map view, device sidebar, event drawer, toolbar |
| `src/map/` | MapLibre GL integration, geofence drawing, map styles/switcher, device markers, live routes |
| `src/settings/` | CRUD pages for devices, users, groups, geofences, notifications, etc. |
| `src/reports/` | Trip, stop, event, chart, summary, and scheduled reports (Recharts + ExcelJS export) |
| `src/other/` | Position details, replay, geofences view, emulator |
| `src/common/` | Shared hooks, components, theme config, and utilities |

### Styling

Uses **MUI v7** with **tss-react** for component-scoped styles. Theme customization is in `src/common/theme/` (palette, dimensions, component overrides). Responsive layout uses MUI breakpoints; mobile and desktop views differ significantly in the main map view.

### Key Custom Hooks

- `useEffectAsync` — async version of `useEffect` with automatic error dispatch
- `useCatch` / `useCatchCallback` — wraps async handlers to dispatch errors to the store
- `useAttributePreference` — reads user/server preferences with fallback chain
- `useFeatures` — feature-flag checks based on server configuration

### Solution4s Customizations

Branch `solution4s-custom` contains S4S-specific changes on top of Traccar upstream:
- Replaced logos/branding with S4S assets
- Turkish (`tr`) translations
- Disabled certain actions for read-only users
- Custom server domain configuration
