# API Endpoints Master List (Complete Inventory)

**Generated Date**: Dec 23, 2024
**Scope**: All Implemented (✅) and Planned (🚧) Endpoints.
**Total Endpoints**: 60+

---

## 🔐 1. Authentication
*Core security for Admin, Drivers, and Users.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/auth/send-otp` | Trigger OTP SMS to phone number. |
| ✅ | `POST` | `/auth/verify-otp` | Login via OTP to receive Access/Refresh tokens. |
| ✅ | `POST` | `/auth/refresh` | Refresh an expired Access Token. |
| 🚧 | `POST` | `/auth/resend-otp` | Re-trigger last OTP (Throttle: 60s). |
| 🚧 | `GET` | `/auth/me` | Get current authenticated user session details. |

---

## 👤 2. User Management
*Managing Admin, Ops, and Customer profiles.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/users` | Create specific user role (Admin/Ops/Manager). |
| ✅ | `GET` | `/users` | List all users (Admin only, paginated). |
| ✅ | `GET` | `/users/:id` | Get detailed profile of a specific user. |
| ✅ | `PATCH` | `/users/:id/deactivate` | Soft-delete/Ban a user from the platform. |
| 🚧 | `PATCH` | `/users/:id/status` | Detailed status toggle (Active/Suspended/Review). |

---

## 🏎️ 3. Driver Management
*Onboarding and managing fleet drivers.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/drivers` | Onboard new driver (links to User + Fleet). |
| ✅ | `GET` | `/drivers/fleet/:fleetId` | List drivers belonging to a specific fleet. |
| ✅ | `GET` | `/drivers/:id` | Get full driver profile (KYC, Stats). |
| 🚧 | `PATCH` | `/drivers/:id` | Update driver profile (Name, License). |
| 🚧 | `PATCH` | `/drivers/:id/availability` | Toggle Online/Offline status. |
| 🚧 | `GET` | `/drivers/:id/history` | View Trip History for Driver App. |

---

## 🏢 4. Fleets
*Asset management for Fleet Owners.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/fleets` | Register a new Fleet Organization. |
| ✅ | `GET` | `/fleets` | List all registered Fleets. |
| ✅ | `GET` | `/fleets/:id` | Get Fleet Details (GST, Mode). |
| ✅ | `PATCH` | `/fleets/:id/deactivate` | Deactivate Fleet (blocks new bookings). |
| 🚧 | `POST` | `/fleets/:id/managers` | Add Manager to Fleet. |
| 🚧 | `GET` | `/fleets/:id/analytics` | Fleet performance stats (Revenue, Utilization). |

---

## 👔 5. Fleet Managers
*Sub-accounts for fleet operations.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/fleet-managers` | Create a specialized Fleet Manager account. |
| ✅ | `GET` | `/fleet-managers/fleet/:fleetId` | List managers for a fleet. |
| ✅ | `PATCH` | `/fleet-managers/:id/deactivate` | Revoke access for a manager. |

---

## 🚕 6. Vehicles
*Managing the physical assets.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/vehicles` | Add Vehicle (Requires RC/Insurance uploads). |
| ✅ | `GET` | `/vehicles/fleet/:fleetId` | List inventory for a specific fleet. |
| ✅ | `GET` | `/vehicles/:id` | Get Vehicle Details (Model, Fuel, Docs). |
| ✅ | `PATCH` | `/vehicles/:id/docs` | Update vehicle documents (RC/Permit renewal). |
| ✅ | `PATCH` | `/vehicles/:id/deactivate` | Deactivate Vehicle (Out of Service). |
| 🚧 | `PATCH` | `/vehicles/:id` | Update general details. |
| 🚧 | `PATCH` | `/vehicles/:id/status` | Ops status (Maintenance/Active). |
| 🚧 | `GET` | `/vehicles/:id/service-history` | View maintenance logs. |

---

## 🛣️ 7. Trips & Booking
*Core ride booking and execution flow.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/trips` | **Book a Ride**. Handles Constraints & Pricing. |
| ✅ | `GET` | `/trips/:id` | Get Trip details (Status, Driver, Fare). |
| ✅ | `POST` | `/trips/:id/assign` | **Dispatch**: Assign a specific Driver to a Trip. |
| ✅ | `POST` | `/trips/:id/start` | **Driver App**: Mark trip as 'In Progress'. |
| ✅ | `POST` | `/trips/:id/complete` | **Driver App**: Mark trip as 'Completed'. |
| ✅ | `GET` | `/trips/:id/tracking` | Get live/last known location of the ride. |
| 🚧 | `POST` | `/trips/:id/cancel` | Customer/Admin Cancel trip. |
| 🚧 | `POST` | `/trips/:id/rate` | Submit Trip Rating. |
| 🚧 | `GET` | `/trips/history` | Customer Trip History. |
| 🚧 | `GET` | `/trips/upcoming` | Customer Upcoming Trips. |

---

## 📡 8. Admin Dispatch
*Back-office override capabilities.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/admin/trips/assign` | Manual Dispatch (Admin Override). |
| ✅ | `POST` | `/admin/trips/unassign` | Remove Driver (Reset to 'Created'). |
| ✅ | `POST` | `/admin/trips/reassign` | Change Driver mid-journey or pre-trip. |
| 🚧 | `POST` | `/admin/trips/force-complete` | Ops override to close stuck trips. |
| 🚧 | `GET` | `/admin/trips/dashboard` | Aggregated Dispatcher View/Stats. |

---

## 💰 9. Pricing Engine
*Dynamic fare calculation.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/pricing/preview` | **Fare Estimate**: Get price before booking. |
| 🚧 | `POST` | `/pricing/dynamic/config` | Update Multipliers (Surge/Night/Traffic). |

---

## 📋 10. Assignments (Roster)
*Daily driver-vehicle pairing.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| ✅ | `POST` | `/assignments` | Create a Daily Shift (Driver-Vehicle pair). |
| ✅ | `GET` | `/assignments/fleet/:fleetId` | View daily roster for a fleet. |
| ✅ | `PATCH` | `/assignments/:id/end` | End a shift (Unassign vehicle). |
| 🚧 | `GET` | `/assignments/active` | Listen for currently active shifts. |
| 🚧 | `PATCH` | `/assignments/:id/vehicle` | Swap Vehicle mid-shift. |

---

## 🛠️ 11. Operations (Roadmap)
*System health and emergency tools.*

| Status | Method | Endpoint | Use Case |
| :---: | :--- | :--- | :--- |
| 🚧 | `GET` | `/ops/trips/stuck` | Find stalled trips (no updates > 1hr). |
| 🚧 | `POST` | `/ops/trips/:id/override` | Break-glass override for state machine. |
| 🚧 | `POST` | `/ops/sos/trigger` | Trigger Emergency Alert. |
| 🚧 | `GET` | `/ops/audit-logs` | View System Audits. |
| 🚧 | `GET` | `/ops/health` | Deep System Health (DB/Cache/Provider Latency). |
