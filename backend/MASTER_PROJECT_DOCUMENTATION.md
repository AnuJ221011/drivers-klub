# 📘 Drivers Klub - Master System Documentation

## 1️⃣ Document Meta
| Attribute | Details |
| :--- | :--- |
| **Document Title** | Master Backend System Architecture & API Spec |
| **Version** | 3.3.0 |
| **Status** | **APPROVED / LIVE** |
| **Last Updated** | December 24, 2025 |
| **Owner** | Backend Engineering Team |
| **Intended Audience** | CTO, Backend Devs, DevOps, Integration Leads |

---

## 2️⃣ System Overview

### Description
Drivers Klub is a centralized **Fleet Orchestration Platform**. It aggregates supply (Drivers/Vehicles) from multiple Fleet Operators and matches them with demand from B2B Partners (Like MakeMyTrip) or Direct Bookings.

### Business Scope
*   **Supply Side**: Fleet Management, Driver Onboarding, Asset Tracking.
*   **Demand Side**: Trip Consumption, Pricing, Billing.
*   **Execution**: Driver App, GPS Tracking, Attendance.

### Architecture Flow
`Partner (MMT)/Client -> Load Balancer -> NodeJS API (Express) -> Core Services (Orchestrator) -> PostgreSQL`

---

## 3️⃣ Authentication & Authorization

### Methodology
*   **Strategy**: Mobile-First OTP (Drivers) / Admin Token (Web).
*   **Access Token**: JWT (HS256), 1 Hour Validity.
*   **Refresh Token**: Opaque, 30 Days Validity.

### Role-Based Access Control (RBAC)
| Role | Scope |
| :--- | :--- |
| `SUPER_ADMIN` | Global Access. Can manage Fleets, Users, System Configs. |
| `OPERATIONS` | Dispatching & Roster Management. Cannot delete Assets. |
| `MANAGER` | Fleet-level View. Can only see their Fleet's Drivers/Cars. |
| `DRIVER` | Limited. Can only access assigned Trip and own Profile. |

---

## 4️⃣ API Documentation (Comprehensive)

### A. Auth Module (`/auth`)
*   **POST** `/send-otp` (Public): Sends SMS.
*   **POST** `/verify-otp` (Public): Login. Returns `{ accessToken, user }`.
*   **POST** `/refresh` (Public): Get new Access Token.

### B. Trip Fulfillment (`/trips`) - **Driver**
*   **GET** `/`: List Trips (`?status=DRIVER_ASSIGNED`).
*   **POST** `/:id/start`: Mark En-Route.
*   **POST** `/:id/arrived`: Mark at Pickup.
*   **POST** `/:id/onboard`: Start Ride (OTP Optional).
*   **POST** `/:id/complete`: End Ride & Bill (`{ distance, fare }`).

### C. Admin Ops (`/admin/trips`) - **Dash**
*   **GET** `/`: Global Trip List.
*   **POST** `/assign`: Dispatch (`{ tripId, driverId }`).
*   **POST** `/reassign`: Change Driver.
*   **POST** `/unassign`: Detach/Cancel.

### D. Fleet Operations (`/fleets`, `/drivers`, `/vehicles`)
*   **POST** `/fleets`: Create Operator.
*   **POST** `/drivers`: Onboard Driver (`{ fleetId, mobile, license }`).
*   **POST** `/vehicles`: Add Asset (`{ fleetId, regNumber, fuelType }`).

### E. Partner API (`/partner/mmt`)
*   **POST** `/partnersearchendpoint`: Availability Check.
*   **POST** `/partnerblockendpoint`: Inventory Block.
*   **POST** `/partnerpaidendpoint`: Confirm Booking.

---

## 5️⃣ Core Workflows & Logic

## 5️⃣ Core Workflows & Logic

### 5.1 Advanced Trip Lifecycle & Timings
The system enforces strict time-windows for compliance.

1.  **Driver Assignment**: Done by Admin/Ops.
2.  **Start Trip Window**:
    *   **Allowed**: 2.5 Hours before `pickupTime`.
    *   **Notifications**: System Crons triggers push notifs at `T-2h`, `T-1.5h`, `T-1h`, `T-30m`.
    *   **Escalation**: If Status is still `DRIVER_ASSIGNED` at `T-1h`, Admin Dashboard shows **High Priority Alert**.
3.  **Arrival**:
    *   **Validation**: Driver must be within Geofence (default 500m) AND within 30 mins of pickup time.
    *   **Action**: Triggers "Driver Arrived" SMS to Customer.
4.  **Waiting Time**:
    *   **Logic**: Starts at `pickupTime + 20min`.
    *   **Billing**: Calculated by Pricing Engine upon completion.
5.  **No Show**:
    *   **Condition**: `pickupTime + 30min`.
    *   **Status**: `NO_SHOW`.
    *   **Billing**: Base Fare / Cancellation Fee applies.

### 5.2 Pricing Logic
*   **Formula**: `Fare = MAX(MinBillableKM, ActualKM) * RatePerKM + WaitingCharges`.
*   **Config**: `WAITING_CHARGE_PER_MIN` (e.g. ₹2/min).

### 5.3 MMT Sync (Outbound)
We push the following 6 Status Events via Webhook:
*   `/driver-assigned`: Immediate.
*   `/start`: When driver starts (T-2.5h window).
*   `/arrived`: When driver reaches location.
*   `/pickup`: When customer boards.
*   `/alight`: When trip completes.
*   `/no-show`: **New**. If driver marks `Not Boarded`.

---

## 6️⃣ Data Models (Dictionary)

### Ride (The Trip)
*   `id`: UUID
*   `status`: `CREATED` -> `DRIVER_ASSIGNED` -> `STARTED` -> `COMPLETED`
*   `tripType`: `AIRPORT`, `RENTAL`, `INTER_CITY`
*   `originCity`: **Enum**: `DELHI`, `GURGAON`, `NOIDA` (Case Sensitive).

### Driver
*   `id`: UUID
*   `userId`: UUID (Link to Auth).
*   `fleetId`: UUID (Owning Fleet).
*   `status`: `ACTIVE`, `INACTIVE`.

---

## 7️⃣ Error Handling Standard

### Global Format
```json
{
  "success": false,
  "statusCode": 4xx,
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "Driver with ID xyz not found"
}
```

### Codes
*   `400`: Validation Fail (Bad City/Date).
*   `401`: Token Expired.
*   `422`: Logic Fail (Trip already started).

---

## 8️⃣ Third-Party Integrations

### MakeMyTrip (MMT)
*   Two-way Sync.
*   **Inbound**: We implement their Spec.
*   **Outbound**: We push 6 Events (Assign, Start, Arrive, Pickup, Drop, Cancel).
*   **Failure**: We log webhook failures but do not block operations.

---

## 9️⃣ Environment & Deployment

*   **Prod URL**: `https://driversklub-backend.onrender.com`
*   **Node Ver**: 18.x
*   **DB**: PostgreSQL 15 (Supabase/RDS).
*   **Env Vars**: `DATABASE_URL`, `JWT_SECRET`, `EXOTEL_API_KEY`, `MMT_WEBHOOK_URL`.

---

## 🔟 Integration Guidelines

*   **Idempotency**: All `POST` requests should be treated as non-idempotent unless specified.
*   **Date Time**: **ALWAYS UTC** (`Z` suffix). Frontend converts to Local.
*   **Pagination**: Defaults: `page=1`, `limit=10`.

---

## 1️⃣1️⃣ Example Flows

### Trip Creation (Manual)
1.  Admin submits `POST /trips` (Delhi -> Gurgaon).
2.  Backend validates City + Time (Tomorrow).
3.  Backend prices trip.
4.  Returns `201 Created` with Ride Object.

### MMT Booking Flow
1.  MMT calls `/search` -> We return `200 Available`.
2.  MMT calls `/block` -> We create `BLOCKED` trip.
3.  MMT calls `/paid` -> We flip status to `CREATED`.
4.  Admin sees trip on Dash -> Assigns Driver.
5.  Backend pushes `/driver-assigned` to MMT.
