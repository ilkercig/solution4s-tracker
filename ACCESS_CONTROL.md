# Access Control in Solution4s Tracker

## Overview

Access control is enforced at two levels:
- **Backend:** The Traccar API rejects unauthorized requests.
- **Frontend:** UI elements are hidden or disabled based on user rights. There are no route-level guards — any authenticated user can navigate to any URL.

---

## How User Rights Are Fetched

On app load, `App.jsx` calls `GET /api/session`. On success, two objects are stored in Redux (`src/store/session.js`):

- `state.session.user` — the logged-in user (populated from `/api/session`)
- `state.session.server` — server-wide settings (populated from `/api/server` via `ServerProvider`)

If the session call fails (unauthenticated), the user is redirected to `/login`.

---

## User Object Fields That Drive Access Control

| Field | Type | Effect |
|---|---|---|
| `administrator` | boolean | Full admin — bypasses all restrictions |
| `userLimit` | number | Non-zero → user is a "manager" |
| `readonly` | boolean | View-only mode |
| `deviceReadonly` | boolean | Cannot add/edit/delete devices |
| `limitCommands` | boolean | Only pre-saved commands allowed |
| `disableReports` | boolean | Reports section hidden |
| `fixedEmail` | boolean | Cannot change own email |
| `temporary` | boolean | Cannot share devices |
| `disabled` | boolean | Account disabled |
| `attributes` | object | `ui.*` feature flags (see Feature Flags section) |

The `server` object has parallel fields (`server.readonly`, `server.deviceReadonly`, etc.) that apply server-wide to all non-admin users.

---

## Permission Hooks

All permission logic is centralized in `src/common/util/permissions.js`.

### `useAdministrator()`
```js
user.administrator === true
```
Returns `true` for full admins. Admins bypass every restriction hook.

### `useManager()`
```js
admin || user.userLimit !== 0
```
Returns `true` for admins and users with a non-zero `userLimit`. Managers can:
- View and manage the Users list
- Login as other users
- Set `readonly`, `deviceReadonly`, `limitCommands`, `disableReports`, `fixedEmail` on other users
- Set expiration dates, enable/disable users

### `useDeviceReadonly()`
```js
!admin && (server.deviceReadonly || user.deviceReadonly || server.readonly || user.readonly)
```
Returns `true` when the user cannot add, edit, or delete devices.

### `useRestriction(key)`
```js
!admin && (server[key] || user[key])
```
General-purpose hook. Pass any restriction key:
- `'readonly'`
- `'limitCommands'`
- `'disableReports'`
- `'fixedEmail'`

Both the server-level and user-level flags are checked — either being `true` activates the restriction. Admins always return `false`.

---

## Role Hierarchy

| Role | Condition | Capabilities |
|---|---|---|
| **Admin** | `user.administrator === true` | Everything — bypasses all restrictions |
| **Manager** | `user.userLimit !== 0` (or admin) | Manage users, set permissions, login-as, see all devices |
| **Normal user** | Default | Full read/write on own devices, geofences, etc. |
| **Device-readonly** | `deviceReadonly` flag (server or user) | View devices only — no add/edit/delete |
| **Readonly** | `readonly` flag (server or user) | View-only — settings hidden, no commands, no scheduling |
| **limitCommands** | `limitCommands` flag (server or user) | Only pre-saved commands, no custom command types |
| **disableReports** | `disableReports` flag (server or user) | Reports nav hidden entirely |
| **temporary** | `user.temporary === true` | Cannot share devices |

---

## Feature Flags (`ui.*` Attributes)

`src/common/util/useFeatures.js` reads `ui.*` keys from `server.attributes` and `user.attributes` to toggle entire feature areas. If `server.forceSettings` is `true`, server values take priority over user values.

| Feature flag | Attribute key |
|---|---|
| `disableSavedCommands` | `ui.disableSavedCommands` |
| `disableAttributes` | `ui.disableAttributes` |
| `disableVehicleFeatures` | `ui.disableVehicleFeatures` |
| `disableDrivers` | `ui.disableDrivers` |
| `disableMaintenance` | `ui.disableMaintenance` |
| `disableGroups` | `ui.disableGroups` |
| `disableEvents` | `ui.disableEvents` |
| `disableComputedAttributes` | `ui.disableComputedAttributes` |
| `disableCalendars` | `ui.disableCalendars` |

Admins always get `false` for all feature flags (nothing disabled).

---

## UI Gating — Where Restrictions Are Applied

### Navigation

| Component | File | Restriction |
|---|---|---|
| SettingsMenu | `src/settings/components/SettingsMenu.jsx` | Entire settings sidebar hidden if `readonly`; Users section shown only to `manager`/`admin` |
| ReportsMenu | `src/reports/components/ReportsMenu.jsx` | Scheduled reports hidden if `readonly`; Statistics/Audit shown to `admin` only |
| BottomMenu | `src/common/components/BottomMenu.jsx` | Reports button hidden if `disableReports`; Account collapses to Logout-only if `readonly` |

### Device Actions

| Component | File | Restriction |
|---|---|---|
| MainToolbar | `src/main/MainToolbar.jsx` | "Add Device" button disabled if `deviceReadonly` |
| StatusCard | `src/common/components/StatusCard.jsx` | Send Command disabled if `readonly`; Edit/Delete disabled if `deviceReadonly`; Share hidden if `temporary` |
| DevicesPage | `src/settings/DevicesPage.jsx` | Users column and "Show All Devices" toggle require `manager`; actions use `deviceReadonly` |

### Settings Pages

| Component | File | Restriction |
|---|---|---|
| CollectionFab | `src/settings/components/CollectionFab.jsx` | Add (+) FAB hidden if `readonly` |
| CollectionActions | `src/settings/components/CollectionActions.jsx` | Edit/Delete row actions hidden when `readonly` prop is passed |
| CommandsPage | `src/settings/CommandsPage.jsx` | Action column and add button hidden if `limitCommands` |
| BaseCommandView | `src/settings/components/BaseCommandView.jsx` | Custom command types hidden if `limitCommands` |
| UserPage | `src/settings/UserPage.jsx` | `administrator`, `deviceLimit`, `userLimit` fields require `admin`; other permission fields require `manager` |

---

## Usage Example

```jsx
import { useAdministrator, useManager, useDeviceReadonly, useRestriction } from '../common/util/permissions';

const MyComponent = () => {
  const admin = useAdministrator();
  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();
  const readonly = useRestriction('readonly');
  const limitCommands = useRestriction('limitCommands');

  return (
    <>
      {!readonly && <AddButton />}
      {admin && <AdminPanel />}
      {manager && <UsersList />}
      <EditButton disabled={deviceReadonly} />
      {!limitCommands && <CustomCommandForm />}
    </>
  );
};
```

---

## Reading User Rights Directly from Redux

```js
import { useSelector } from 'react-redux';

const user = useSelector((state) => state.session.user);
const server = useSelector((state) => state.session.server);

// e.g. check a specific flag
const isReadonly = !user.administrator && (server.readonly || user.readonly);
```
