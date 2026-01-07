# Access control (RBAC) — Driver’s Klub Admin UI

This document defines **who can see which page/path** and which **actions** are allowed per role.

Roles (source: backend Prisma enum `UserRole`):
- `SUPER_ADMIN`
- `OPERATIONS`
- `MANAGER`
- `DRIVER`

## Principles

- **Backend is the source of truth**: every API route is protected with `authenticate` + `authorizeRoles(...)`.
- **Frontend should mirror backend** for UX:
  - Hide nav items the user can’t access.
  - Guard routes so users don’t land on forbidden pages.
  - Disable/hide buttons for actions the user can’t perform.

## Route access matrix (frontend)

Routes from `frontend/src/App.tsx` (admin UI).

| Path | Page | SUPER_ADMIN | OPERATIONS | MANAGER | DRIVER |
|---|---|---:|---:|---:|---:|
| `/login` | Login | ✅ | ✅ | ✅ | ✅ |
| `/admin` | Dashboard (AdminHome) | ✅ | ❌* | ❌* | ❌* |
| `/admin/fleets` | Fleet Management | ✅ | ✅ | ❌ | ❌ |
| `/admin/fleets/:id` | Fleet Details | ✅ | ✅ | ❌ | ❌ |
| `/admin/fleets/:id/hubs/create` | Create Hub | ✅ | ✅ | ❌ | ❌ |
| `/admin/fleets/:id/hubs/:hubId` | Hub Details | ✅ | ✅ | ❌ | ❌ |
| `/admin/trips` | Trips (admin list) | ✅ | ❌* | ❌* | ❌* |
| `/admin/trips/:id` | Trip Details (admin) | ✅ | ❌* | ❌* | ❌* |
| `/admin/vehicles` | Vehicles | ✅ | ✅ | ⚠️** | ❌ |
| `/admin/drivers` | Drivers | ✅ | ✅ | ⚠️** | ❌ |
| `/admin/team-management` | Team Management | ✅ | ⚠️*** | ❌ | ❌ |
| `/admin/driver-checkins` | Driver Check-ins | ✅ | ✅ | ✅ | ❌ |
| `/admin/driver-checkins/:id` | Driver Check-in detail | ✅ | ✅ | ✅ | ❌ |
| `/admin/driver-checkouts/:driverId` | Driver checkout history | ✅ | ✅ | ✅ | ❌ |
| `/admin/payment` | Payment & Pricing (admin) | ✅ | ✅ | ⚠️**** | ❌ |

Notes:
- `*` Trips dashboard/pages currently call **`/admin/trips`**, which is **`SUPER_ADMIN` only** in backend (`backend/src/modules/trips/admin-trip.routes.ts`).
- `**` Backend allows `MANAGER` to read drivers/vehicles **by fleet/hub**, but the current UI depends on **fleet list + fleet selection**, which `MANAGER` cannot access with current backend routes. So: either hide these pages for `MANAGER`, or implement a “manager scope” (see below).
- `***` Backend allows `OPERATIONS` to list users, but only `SUPER_ADMIN` can create/deactivate users (`backend/src/modules/users/user.routes.ts`). So Operations can be “view-only” unless UI is split.
- `****` Backend allows some payment admin endpoints for `MANAGER` (reconciliation + QR view, rental plan list), but the current UI includes admin actions (create plans/penalties/incentives/payouts) that are `SUPER_ADMIN`/`OPERATIONS` only. Consider role-based tabs.

## Action-level access (recommended)

### Fleets (`/admin/fleets`, `/admin/fleets/:id`)
- **View fleets**: `SUPER_ADMIN`, `OPERATIONS`
- **Create fleet**: `SUPER_ADMIN` only
- **Deactivate fleet**: `SUPER_ADMIN` only

### Hubs (Fleet Details → Hubs)
- **List hubs / hub details / create hub**: `SUPER_ADMIN`, `OPERATIONS`

### Trips (`/admin/trips`, `/admin/trips/:id`, dashboard widgets)
- **View admin trips list**: `SUPER_ADMIN` only (current backend)
- **Assign/unassign/reassign driver** (admin): `SUPER_ADMIN` only
- If you want `OPERATIONS` to manage trips, update backend `authorizeRoles(...)` for admin trip routes, then update this doc accordingly.

### Vehicles (`/admin/vehicles`)
- **List vehicles by fleet**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Create/update/deactivate vehicles**: `SUPER_ADMIN`, `OPERATIONS`

### Drivers (`/admin/drivers`)
- **List drivers by fleet**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Create driver**: `SUPER_ADMIN`, `OPERATIONS`
- **Edit driver**:
  - details: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
  - status: `SUPER_ADMIN`, `OPERATIONS`
  - availability: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Assign vehicle to driver** (Assignments module): `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`

### Team Management (`/admin/team-management`)
- **List users**: `SUPER_ADMIN`, `OPERATIONS`
- **Create user**: `SUPER_ADMIN` only
- **Deactivate user**: `SUPER_ADMIN` only

### Driver Check-ins (`/admin/driver-checkins`)
- **History list**: any authenticated user (backend), but in admin UI show:
  - **View list/details**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
  - **Approve/Reject**: `SUPER_ADMIN`, `MANAGER`

### Payment & Pricing (`/admin/payment`)
- **Admin actions** (create plan/penalty/incentive, payout, generate QR): `SUPER_ADMIN`, `OPERATIONS`
- **Manager allowed subset** (backend supports):
  - **View rental plans** (`GET /payment/admin/rental-plans/:fleetId`): ✅
  - **View pending reconciliations** (`GET /payment/admin/reconciliations/pending`): ✅
  - **Reconcile collection** (`POST /payment/admin/collection/:id/reconcile`): ✅
  - **View vehicle QR** (`GET /payment/admin/vehicle/:id/qr`): ✅
  - **Payout + create penalty/incentive + generate QR**: ❌ (admin only)

## “Manager scope” (recommended improvement)

If you want `MANAGER` users to use the admin UI without seeing all fleets:
- Put `fleetId` (and optional `hubId`) into the JWT claims at login **or**
- Add a backend endpoint like `GET /me/scope` that returns `{ fleetId, hubId }`
- Then update the UI to:
  - Hide Fleet list for managers
  - Auto-select their `fleetId` in `FleetContext`
  - Restrict lists to their fleet/hub

## Frontend implementation checklist (recommended)

1. **Route guard**
   - Add a `RoleRoute` wrapper (like `PrivateRoute`) that checks `useAuth().role`.
2. **Sidebar filtering**
   - Filter `navItems` in `SideBar.tsx` by role.
3. **Action gating**
   - Disable/hide buttons (Create Fleet, Add Team Member, etc.) if role can’t perform the API action.

