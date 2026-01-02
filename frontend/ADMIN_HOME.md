# AdminHome (Admin Dashboard) — Feature Doc

## Overview
`AdminHome` is the landing page for the admin panel at the `/admin` route. It replaces the previous empty “Welcome to admin” view with an operational dashboard: KPI cards, actionable trip queues, and quick actions.

## Route
- **URL**: `/admin` (index route)
- **Component**: `src/pages/AdminHome.tsx`
- **Wiring**: `src/App.tsx` (`<Route index element={<AdminHome />}>`)

## Data sources
The dashboard currently loads data from the admin trips list endpoint:
- **API**: `GET /admin/trips?page=1&limit=200`
- **Client function**: `getAdminTripsPage()` in `src/api/trip.api.ts`

> Note: The dashboard is intentionally read-only for most items; it deep-links to trip details for actions.

## UI building blocks (standard components)
`AdminHome` reuses the same components used across the admin UI:
- `src/components/ui/Button.tsx`
- `src/components/ui/Table.tsx`
- `src/components/layout/Modal.tsx`
- `src/components/trip/AddTrip.tsx` (Create Trip form shown in a modal)

## Sections
### Quick actions
- **Refresh**: re-fetches trips and recomputes KPIs/queues
- **+ Create Trip**: opens modal with `AddTrip` form
- Shortcuts: Trips / Drivers / Vehicles (navigates to existing pages)

### KPI cards
Computed from the fetched trip list:
- **Trips Today**: trips whose `pickupTime` (fallback `tripDate`) is on the current local calendar day
- **Active Trips Now**: trips with status in `CREATED | CONFIRMED | DRIVER_ASSIGNED | STARTED`
- **Unassigned Trips**: trips that are not finished and have no active assignment (see definitions below)
- **Revenue Today**: sum of `price` for trips considered “completed today”

### Queues
- **Unassigned Trips**: top N trips that can be dispatched
- **Upcoming Pickups (next 6 hours)**: trips with pickup time within the next 6 hours

## Definitions (important)
### Upcoming trip
A trip is **upcoming** if its `pickupTime` (fallback `tripDate`) is:
- valid datetime
- in the future
- within the next **6 hours**

### Unassigned trip
A trip is **unassigned** if:
- its status is **not** in `COMPLETED | CANCELLED | NO_SHOW`
- and it has **no active** `tripAssignments` with:
  - `status === "ASSIGNED"` (case-insensitive)
  - and `endTime` is missing or `null`

> A trip can be both **Upcoming** and **Unassigned** (example: a pickup scheduled in 2 hours with no assigned driver yet).

## Known limitations / assumptions
- **Trip fetch window**: dashboard currently fetches only the latest **200** trips for speed; KPIs are computed from that set (not guaranteed to match the global DB totals).
- **Dates**: “today” uses local time via `toLocaleString()` / local calendar-day comparison.
- **Revenue Today**: uses `price` and “completed today” heuristic (`completedAt` fallback `updatedAt`), and only over the fetched set.

## How to extend
Common next additions:
- “Delayed / At-risk” queue (pickup time passed and status not `STARTED/COMPLETED`)
- Status breakdown chart/cards (Created/Assigned/Started/Completed)
- Fleet-filtered dashboard (if you add an admin endpoint like `GET /admin/trips?fleetId=...`)
- Pagination or server-side aggregates (best for accurate KPIs)

