# Access control (RBAC + scope) — Driver’s Klub Admin UI (production-ready)

This document defines **who can access which pages/paths and actions** for the new role set:
- **Super Admin**
- **Operations**
- **Fleet Manager**
- **Hub Manager**

It is written in a **scalable** style: roles are coarse; **permissions** are fine-grained; **scope** (which fleet/hub) is enforced everywhere.

---

## 1) Definitions

### 1.1 Roles (business roles)

| Role | Intent |
|---|---|
| **Super Admin** | Full system control (configuration + user admin). |
| **Operations** | Central ops user (day-to-day dispatch/admin tasks) but not full system ownership. |
| **Fleet Manager** | Operates **one fleet** (or a set of fleets) and everything inside that fleet. |
| **Hub Manager** | Operates **one hub** (or a set of hubs) and resources assigned to that hub. |

### 1.2 Scope (ABAC)

Every non-global action must be evaluated with **scope**:
- **Global scope**: system-wide (no fleet/hub restriction)
- **Fleet scope**: `{ fleetId }`
- **Hub scope**: `{ hubId }` (implicitly tied to a fleet)

Recommended claim to attach to each user session:

```json
{
  "role": "FLEET_MANAGER",
  "scope": {
    "fleetIds": ["<fleet-uuid>"],
    "hubIds": ["<hub-uuid>"]
  }
}
```

> Production recommendation: avoid “manager” without scope. Scoped roles prevent privilege escalation and keep UI + API consistent.

---

## 2) Authorization model (scalable)

### 2.1 Use permissions, not page names

Define canonical permissions as `<resource>:<action>`:

| Resource | Actions (examples) |
|---|---|
| `fleet` | `read`, `create`, `update`, `deactivate` |
| `hub` | `read`, `create`, `update`, `assignManager`, `addDriver`, `addVehicle` |
| `driver` | `read`, `create`, `update`, `setStatus`, `setAvailability` |
| `vehicle` | `read`, `create`, `update`, `setStatus`, `deactivate` |
| `assignment` | `read`, `create`, `end` |
| `attendance` | `read`, `approve`, `reject` |
| `trip_admin` | `read`, `assign`, `unassign`, `reassign` |
| `payment_admin` | `read`, `create`, `reconcile`, `payout`, `qr_generate`, `qr_view` |
| `user_admin` | `read`, `create`, `deactivate` |

### 2.2 Policy evaluation (role + scope + permission)

Authorize a request if **all** are true:
1. user is authenticated
2. user has permission (via role policy)
3. user scope includes the target resource (fleetId/hubId) — unless the permission is global

---

## 3) Role policies (recommended baseline)

### 3.1 Super Admin (global)
- **All permissions** in **global scope**
- Can operate across all fleets/hubs

### 3.2 Operations (global, but not owner)
Recommended:
- `fleet:read`
- `hub:read`, `hub:create`, `hub:update`, `hub:assignManager`, `hub:addDriver`, `hub:addVehicle`
- `driver:read`, `driver:create`, `driver:update`, `driver:setStatus`, `driver:setAvailability`
- `vehicle:read`, `vehicle:create`, `vehicle:update`, `vehicle:setStatus`, `vehicle:deactivate`
- `assignment:read`, `assignment:create`, `assignment:end`
- `attendance:read` (optionally `approve/reject` if ops approves)
- `trip_admin:*` only if ops dispatches; otherwise keep to Super Admin
- `payment_admin:read` + limited admin actions (business decision)
- `user_admin:read` (no create/deactivate unless required)

### 3.3 Fleet Manager (fleet-scoped)
- Access limited to their `fleetIds`
- Recommended:
  - `fleet:read` (own fleet)
  - `hub:*` within own fleet
  - `driver:*` within own fleet
  - `vehicle:*` within own fleet
  - `assignment:*` within own fleet
  - `attendance:read`, `attendance:approve`, `attendance:reject` (own fleet drivers)
  - `payment_admin:read` (own fleet) + optionally `reconcile`

### 3.4 Hub Manager (hub-scoped)
- Access limited to their `hubIds` (and derived fleet)
- Recommended:
  - `hub:read` (own hub)
  - `driver:read`, `driver:update`, `driver:setAvailability` (drivers in hub)
  - `vehicle:read` (vehicles in hub)
  - `assignment:read`, `assignment:create`, `assignment:end` (hub drivers/vehicles only)
  - `attendance:read`, `attendance:approve`, `attendance:reject` (hub drivers)
  - `payment_admin:qr_view` and optionally `payment_admin:reconcile` (if hub handles collections)

---

## 4) Frontend pages & path access (current UI)

Paths from `frontend/src/App.tsx`.

Legend:
- ✅ = allowed (with proper scope where applicable)
- ❌ = not allowed
- ⚠️ = allowed **only if the page supports scoped mode** (see “Manager scope UX”)

| Path | Page | Super Admin | Operations | Fleet Manager | Hub Manager |
|---|---|---:|---:|---:|---:|
| `/login` | Login | ✅ | ✅ | ✅ | ✅ |
| `/admin` | Dashboard (AdminHome) | ✅ | ⚠️* | ⚠️* | ⚠️* |
| `/admin/fleets` | Fleet list | ✅ | ✅ | ⚠️** | ❌ |
| `/admin/fleets/:id` | Fleet details | ✅ | ✅ | ✅ (own fleet) | ❌ |
| `/admin/fleets/:id/hubs/create` | Create hub | ✅ | ✅ | ✅ (own fleet) | ❌ |
| `/admin/fleets/:id/hubs/:hubId` | Hub details | ✅ | ✅ | ✅ (own fleet) | ✅ (own hub) |
| `/admin/trips` | Trips (admin list) | ✅ | ⚠️*** | ⚠️*** | ❌ |
| `/admin/trips/:id` | Trip details | ✅ | ⚠️*** | ⚠️*** | ❌ |
| `/admin/vehicles` | Vehicles | ✅ | ✅ | ⚠️** | ⚠️** |
| `/admin/drivers` | Drivers | ✅ | ✅ | ⚠️** | ⚠️** |
| `/admin/team-management` | User admin | ✅ | ⚠️**** | ❌ | ❌ |
| `/admin/driver-checkins` | Driver check-ins | ✅ | ✅ | ✅ (scoped) | ✅ (scoped) |
| `/admin/driver-checkins/:id` | Check-in detail | ✅ | ✅ | ✅ (scoped) | ✅ (scoped) |
| `/admin/driver-checkouts/:driverId` | Driver checkout history | ✅ | ✅ | ✅ (scoped) | ✅ (scoped) |
| `/admin/payment` | Payment & pricing | ✅ | ✅ | ⚠️***** | ⚠️***** |

Notes:
- `*` Current dashboard uses admin trips endpoints (`/admin/trips`) which in your backend are **SUPER_ADMIN-only** today. Either keep dashboard SA-only, or broaden backend permissions.
- `**` Current UI depends on “Fleet select bar” + “list fleets” to choose `fleetId`. For Fleet/Hub managers, you need **scoped UX** (auto-select their fleet/hub) instead of fleet browsing.
- `***` Trips UI calls `/admin/trips` which is SA-only in backend today; to enable others, update backend and then enforce scope.
- `****` Backend currently allows Operations to list users, but user create/deactivate is SA-only.
- `*****` Payment page contains a mix of endpoints; in production split into **tabs** gated by permissions (reconcile vs payout vs create plan/penalty/incentive).

---

## 5) Backend alignment (what you should do next)

Right now your backend roles are `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`, `DRIVER`.

To support the new roles cleanly, choose one of these production approaches:

### Option A (recommended): Keep backend roles simple + add manager type + scope
- Keep backend role as one of: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- Add `managerType`: `FLEET_MANAGER` or `HUB_MANAGER`
- Add scope claims: `fleetIds[]`, `hubIds[]`
- Enforce:
  - `authorizeRoles(...)` (existing)
  - `authorizeScope(...)` (new middleware: checks fleetId/hubId route params/body)

### Option B: Add roles to enum (explicit roles)
- Add `FLEET_MANAGER` and `HUB_MANAGER` to Prisma enum and rewire authorization.
- Still keep scope checks; roles alone are not enough.

---

## 6) Manager scope UX (required for Fleet/Hub managers)

To make Fleet/Hub Managers usable in the UI:
- Add a backend endpoint: `GET /me/scope` → returns `{ fleetIds, hubIds, defaultFleetId?, defaultHubId? }`
- In frontend:
  - Auto-set `FleetContext.activeFleetId = defaultFleetId` for Fleet/Hub managers
  - Hide `/admin/fleets` browsing for Hub Managers (and optionally Fleet Managers)
  - Filter lists server-side by scope; client-side filtering is not security

---

## 7) Implementation checklist (production)

### Frontend
- **Route guards**: `RequireAuth` + `RequirePermission(permission)`
- **Sidebar filtering**: build nav from permissions instead of hardcoding roles
- **Action gating**: hide/disable buttons based on permissions (create/deactivate/etc.)
- **Fail-safe**: if API returns 403, show “No access” and log event

### Backend
- Keep `authorizeRoles` as a coarse gate
- Add scope checks:
  - `authorizeFleetScope(req.params.fleetId || req.body.fleetId)`
  - `authorizeHubScope(req.params.hubId || req.body.hubId)`
- Add audit logs for sensitive actions (user deactivation, payouts, assignments)

