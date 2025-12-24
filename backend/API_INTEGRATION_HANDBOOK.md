# 📘 Drivers Klub - API & Integration Handbook

## 1️⃣ Document Meta
| Attribute | Details |
| :--- | :--- |
| **Document Title** | Drivers Klub Backend API & Integration Spec |
| **Version** | 3.2.0 |
| **Status** | **APPROVED / LIVE** |
| **Last Updated** | December 24, 2025 |
| **Owner** | Backend Engineering Team |
| **Intended Audience** | Frontend Web Team (React), Mobile App Team (Flutter) |

---

## 2️⃣ System Overview

### Description
Drivers Klub is a mobility orchestration platform connecting Fleet Operators (Supply) with Demand Sources (MMT, Direct Bookings). The system manages the entire lifecycle of a Trip, from Booking -> Assignment -> Fulfillment -> Billing.

### User Roles
*   **SUPER_ADMIN**: Full system access. Can manage all Fleets. (Web Dashboard)
*   **OPERATIONS**: Can dispatch trips and manage drivers within assigned region. (Web Dashboard)
*   **MANAGER**: Fleet-level admin. Can only see their own assets. (Web Dashboard)
*   **DRIVER**: Field agent. Can only access assigned trips and attendance. (Mobile App)

### High-Level Flow
`Client (App/Web) -> Load Balancer -> Node.js API -> Services -> PostgreSQL`

---

## 3️⃣ Authentication & Authorization

### Methodology
We use **OTP-based Authentication** (Mobile Number). There are NO passwords.
*   **Tokens**: JWT (JSON Web Tokens).
*   **Access Token**: Validity **1 Hour**.
*   **Refresh Token**: Validity **30 Days**.

### Headers
All secured endpoints require:
`Authorization: Bearer <YOUR_ACCESS_TOKEN>`

### Role-Based Access Control (RBAC)
*   **Public APIs**: `/auth/*`, `/pricing/preview`
*   **Driver APIs**: `/attendance/*`, `/trips/*` (My Trips), `/drivers/me`
*   **Admin APIs**: `/admin/*`, `/fleets/*`, `/vehicles/*`, `/users/*`

---

## 4️⃣ API Documentation (Core Modules)

### A. Authentication Module

#### 1. Request OTP
*   **POST** `/auth/send-otp`
*   **Purpose**: Trigger SMS to user's phone.
*   **Auth**: No
*   **Body**:
    ```json
    { "phone": "9876543210" } // 10-digit number
    ```
*   **Success (200)**: `{ "message": "OTP sent" }`

#### 2. Verify OTP (Login)
*   **POST** `/auth/verify-otp`
*   **Purpose**: Exchange OTP for Auth Tokens.
*   **Auth**: No
*   **Body**:
    ```json
    { "phone": "...", "otp": "..." }
    ```
*   **Success (200)**:
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJ...",
        "refreshToken": "def...",
        "user": { "id": "uuid", "role": "DRIVER" }
      }
    }
    ```
*   **Error (400)**: "Invalid OTP".

---

### B. Trip Module (Driver Side)

#### 1. Get Assigned Trips
*   **GET** `/trips`
*   **Purpose**: Fetch active work queue.
*   **Auth**: Yes (Driver)
*   **Query**: `?status=DRIVER_ASSIGNED`
*   **Success**: Returns Array of `Ride` objects.

#### 2. Start Trip
*   **POST** `/trips/:id/start`
*   **Purpose**: Mark driver as en-route to pickup.
*   **Auth**: Yes (Driver)
*   **Body**: `{ "lat": 28.5, "lng": 77.1 }`
*   **Validation**: Trip must be `DRIVER_ASSIGNED`.

#### 3. Arrived at Pickup
*   **POST** `/trips/:id/arrived`
*   **Purpose**: Notify customer driver is at location.
*   **Auth**: Yes (Driver)
*   **Body**: `{ "lat": 28.5, "lng": 77.1 }`

#### 4. Onboard (Start Ride)
*   **POST** `/trips/:id/onboard`
*   **Purpose**: Customer actively boarded.
*   **Auth**: Yes (Driver)
*   **Body**: `{ "otp": "1234" }` (Optional)

#### 5. Complete Trip
*   **POST** `/trips/:id/complete`
*   **Purpose**: End trip and generate bill.
*   **Auth**: Yes (Driver)
*   **Body**:
    ```json
    {
      "distance": 15.5, // Required (Float)
      "fare": 450.00    // Required (Float)
    }
    ```

---

### C. Admin Dispatch Module

#### 1. Create Trip
*   **POST** `/trips`
*   **Auth**: Yes (Admin/Ops)
*   **Body**:
    ```json
    {
      "tripType": "AIRPORT",        // Enum: AIRPORT, RENTAL, INTER_CITY
      "originCity": "DELHI",        // Enum: DELHI, GURGAON, NOIDA
      "tripDate": "2025-12-25T10:00:00Z",
      "vehicleSku": "EV_SEDAN",
      "distanceKm": 45
    }
    ```

#### 2. Assign Driver
*   **POST** `/admin/trips/assign`
*   **Auth**: Yes (Admin/Ops)
*   **Body**: `{ "tripId": "uuid", "driverId": "uuid" }`
*   **Failure**: 400 if driver is busy.

---

## 5️⃣ Core Workflows & State Machines

### Trip Lifecycle (State Machine)
| Previous State | Action | Next State | Triggered By |
| :--- | :--- | :--- | :--- |
| `null` | Create | `CREATED` | Admin / MMT |
| `CREATED` | Assign | `DRIVER_ASSIGNED` | Admin |
| `DRIVER_ASSIGNED` | Start | `STARTED` | Driver |
| `STARTED` | Complete | `COMPLETED` | Driver |

### Auto-Transitions
*   **No Show**: Admin can trigger manually.
*   **Cancelled**: Admin can trigger manually.

---

## 6️⃣ Data Models (Frontend-Relevant)

### Ride (Trip)
*   `id`: UUID
*   `status`: Enum (`CREATED`, `DRIVER_ASSIGNED`, `STARTED`, `COMPLETED`, `CANCELLED`)
*   `price`: Double (Final Fare)
*   `pickupTime`: ISO Date (UTC)
*   `vehicleSku`: String ("EV_SEDAN", "SUV")
*   `originCity`: String ("DELHI", "GURGAON"...)

### Driver
*   `id`: UUID
*   `name`: String
*   `mobile`: String
*   `status`: String (`ACTIVE`, `INACTIVE`)
*   `isAvailable`: Boolean

---

## 7️⃣ Error Handling Standard

Global Error Response:
```json
{
  "success": false,
  "statusCode": 4xx,
  "errorCode": "ERROR_CODE_STRING",
  "message": "Human readable message"
}
```

### Common Error Codes
*   `RESOURCE_NOT_FOUND`: Invalid ID.
*   `INVALID_STATE`: Action not allowed in current status (e.g. Completing a completed trip).
*   `UNAUTHORIZED`: Bad Token.
*   `FORBIDDEN`: Role mismatch.

---

## 8️⃣ Third-Party Integrations

### MakeMyTrip (MMT)
*   **Impact**: Trips created by MMT cannot be edited fully by Admin.
*   **Status**: Updates flow Back to MMT via Webhooks.
*   **Latency**: Ensure UI shows "Syncing..." if webhook status is pending (optional).

---

## 9️⃣ Environment & Base URLs

*   **Production**: `https://driversklub-backend.onrender.com`
*   **Staging**: (Not currently active, use Prod with specific Test Accounts)
*   **Feature Flags**: None currently.

---

## 🔟 Frontend Integration Guidelines

1.  **Idempotency**: Retry `GET` requests freely. Be careful retrying `POST` (Payment/Creation) on network failure. Use unique idempotency keys if updated in v2.
2.  **Date Display**: Backend sends UTC (`Z`). Frontend **MUST** convert to User's Local Time (IST) before display.
3.  **Pagination**:
    *   List APIs accept `page` (1-index) and `limit` (default 10).
    *   Returns `{ total: 100, page: 1, limit: 10, data: [...] }`.

---

## 1️⃣1️⃣ Example API Flows

### Scenario: Driver Completes a Trip
1.  **Driver** opens App -> `GET /trips?status=DRIVER_ASSIGNED` -> Gets Trip A.
2.  **Driver** slides "Start" -> `POST /trips/A/start` (`200 OK`). State -> `STARTED`.
3.  **Driver** reaches dest -> `POST /trips/A/complete` with `{ distance: 30, fare: 500 }`.
4.  **Backend** updates DB -> Triggers MMT Webhook -> Returns Final Bill.
5.  **App** shows "Ride Ended. Fare: ₹500".

### Scenario: Admin Assigns a Trip
1.  **Admin** views Dashboard -> `GET /admin/trips?status=CREATED`.
2.  **Admin** selects Trip B.
3.  **Admin** views available drivers -> `GET /drivers/fleet/:id`.
4.  **Admin** clicks Assign -> `POST /admin/trips/assign` (`{ tripId: B, driverId: D }`).
5.  **Backend** locks Driver D -> Updates Trip B to `DRIVER_ASSIGNED` -> Pushes Notification.
