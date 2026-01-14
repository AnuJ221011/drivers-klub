## Access control overview (Admin panel)

This project uses **role + scope** based access control.

- **Role**: `SUPER_ADMIN | FLEET_ADMIN | MANAGER | OPERATIONS`
- **Scope** (from JWT claims):
  - **fleetId**: single fleet this admin belongs to (null for `SUPER_ADMIN`)
  - **hubIds**: list of hubs this operations user manages (empty for non-operations)

The backend **must** enforce access control. The frontend additionally hides/redirects UI for better UX.

---

## Source of truth: JWT claims

### Claims
- **role**
- **fleetId** (nullable)
- **hubIds** (array)

### Where it is implemented
- **JWT payload type**: `backend/packages/common/src/types/auth.types.ts`
- **JWT issuance**: `backend/apps/auth-service/src/modules/auth/token.service.ts`
- **Attach to req.user**: `backend/packages/common/src/middlewares/authenticate.ts` and `backend/packages/common/src/types/express.d.ts`

---

## Role rules (high-level)

### SUPER_ADMIN
- Can access **all fleets**, **all hubs**, **all vehicles**, **all drivers**, **all payment/pricing**.
- Can use **Fleet Select Bar** in UI.

### FLEET_ADMIN / MANAGER
- Scope: **one fleet** (`fleetId` must be set).
- Can access **all hubs/vehicles/drivers/managers** within their fleet.
- Cannot access other fleets.
- Can **add fleet**.

### OPERATIONS
- Scope: **one fleet** (`fleetId`) and **one or more hubs** (`hubIds[]` must be non-empty).
- Can access **only hubs/vehicles/drivers** for their hubs.
- Cannot access **managers** tab.
- Cannot access **Rental Plans / Pending Reconciliations / Pending Payouts** in Payment & Pricing.
- Cannot add fleet.

---

## Admin UI behavior (frontend)

### Fleets
- **Route**:
  - `SUPER_ADMIN`: can use `/admin/fleets` (fleet list)
  - `FLEET_ADMIN / MANAGER / OPERATIONS`: redirected to `/admin/fleets/:fleetId`
- **Managers tab**:
  - hidden for `OPERATIONS`

**Frontend files**
- Fleet list redirect + “Add Fleet” button gating: `frontend/src/pages/Fleet.tsx`
- Fleet details tab gating + wrong-fleet redirect: `frontend/src/pages/FleetDetails.tsx`
- Fleet tabs accepts a restricted tab list: `frontend/src/components/fleet/Details/FleetTabs.tsx`
- Sidebar “Fleets” link resolves to scoped fleet for non-super: `frontend/src/components/layout/SideBar.tsx`

### Vehicles / Drivers / Team / Payment & Pricing
- Fleet selector (`FleetSelectBar`) is **SUPER_ADMIN only**.
- For non-super roles, `effectiveFleetId` is forced from JWT `fleetId`.

**Frontend files**
- Fleet selector gating: `frontend/src/components/fleet/FleetSelectBar.tsx`
- FleetContext computes `effectiveFleetId` using role + JWT scope: `frontend/src/context/FleetContext.tsx`

### Payment & Pricing tabs
- `SUPER_ADMIN`: all tabs
- `FLEET_ADMIN / MANAGER`: all tabs **scoped to fleet**
- `OPERATIONS`: only **Penalties**, **Incentives**, **Vehicle QR** (scoped to hubs)

**Frontend file**
- Tab list is filtered by role: `frontend/src/pages/PaymentPricing.tsx`

---

## Backend enforcement (API)

Backend enforces both:
- **Role permissions** (via `authorizeRoles`)
- **Scope permissions** (fleetId/hubIds checks + query filtering)

### Fleet APIs (vehicle-service)
- `GET /fleets`
  - `SUPER_ADMIN`: returns all
  - others: returns only their `fleetId`
- `GET /fleets/:id`
  - non-super: only if `:id === req.user.fleetId`
- `GET /fleets/:id/hubs`
  - non-super: only if `:id === req.user.fleetId`
  - `OPERATIONS`: returns only hubs in `req.user.hubIds`

**Backend files**
- `backend/apps/vehicle-service/src/modules/fleet/fleet.routes.ts`
- `backend/apps/vehicle-service/src/modules/fleet/fleet.controller.ts`

### Vehicle APIs (vehicle-service)
- `GET /vehicles/fleet/:fleetId`
  - non-super: only if `:fleetId === req.user.fleetId`
  - `OPERATIONS`: additionally filters by `hubId IN req.user.hubIds`
- `GET /vehicles/:id` and update endpoints:
  - non-super: vehicle must belong to scoped fleet
  - `OPERATIONS`: vehicle hub must be in scoped hubs

**Backend files**
- `backend/apps/vehicle-service/src/modules/vehicles/vehicle.routes.ts`
- `backend/apps/vehicle-service/src/modules/vehicles/vehicle.service.ts`

### Driver APIs (driver-service)
- `GET /drivers/fleet/:fleetId`
  - non-super: only if `:fleetId === req.user.fleetId`
  - `OPERATIONS`: additionally filters by `hubId IN req.user.hubIds`
- `GET /drivers/:id`, updates:
  - non-super: must belong to scoped fleet (and hub for operations)
- Driver preferences:
  - pending requests are filtered by fleet (and hubs for operations)

**Backend files**
- `backend/apps/driver-service/src/modules/drivers/driver.routes.ts`
- `backend/apps/driver-service/src/modules/drivers/driver.service.ts`
- `backend/apps/driver-service/src/modules/drivers/driver.repository.ts`

### Attendance / Driver Check-ins (driver-service)
- `GET /attendance/history`
  - `SUPER_ADMIN`: full history (optionally filtered by driverId query param)
  - others: filtered by driver’s fleet, and by hub for operations
- `GET /attendance/:id`
  - non-super: only if attendance.driver matches scoped fleet/hubs

**Backend files**
- `backend/apps/driver-service/src/modules/attendance/attendance.routes.ts`
- `backend/apps/driver-service/src/modules/attendance/attendance.controller.ts`

### Payment & Pricing (trip-service)
- **Operations is blocked** (route-level) from:
  - Rental Plans
  - Pending Reconciliations
  - Pending Payouts
  - Collection reconcile/payout
  - Bulk payout upload
- `FLEET_ADMIN / MANAGER`:
  - rental plans enforced to `req.user.fleetId`
  - pending reconciliation/payouts filtered by `req.user.fleetId`
- `OPERATIONS`:
  - penalties/incentives/vehicle-qr actions validate target driver/vehicle is within scoped fleet/hubs

**Backend files**
- `backend/apps/trip-service/src/modules/payment/payment.routes.ts`
- `backend/apps/trip-service/src/modules/payment/payment.controller.ts`
- `backend/apps/trip-service/src/core/payment/payout.service.ts`

---

## Notes / operational guidance

- **Frontend is not security**: UI hiding and redirects improve UX, but backend scoping is the enforcement.
- **When debugging scope**: decode the JWT and verify `role`, `fleetId`, `hubIds`.
- **Common “no data” cause for OPERATIONS**: `hubIds` empty → hub-scoped queries return empty arrays.

