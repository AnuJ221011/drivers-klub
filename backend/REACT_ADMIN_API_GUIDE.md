# 💻 React Admin Dashboard - API Handbook

## 1️⃣ Document Meta
| Attribute | Details |
| :--- | :--- |
| **Document Title** | Admin Dashboard API Integration Spec |
| **Version** | 3.3.0 |
| **Status** | **APPROVED / LIVE** |
| **Audience** | Web Frontend Team (React) |

---

## 2️⃣ System Overview & Scope
The Admin Dashboard is the **Control Tower**. Ops teams use it to:
1.  **Assets**: Onboard Drivers, Vehicles, Fleets.
2.  **Dispatch**: Create and Assign Trips.
3.  **Monitor**: Live Tracking and Assignments.
4.  **Approvals**: Attendance verification.

---

## 3️⃣ Authentication & Roles

### Auth Method
*   **Login**: Same OTP Flow as Mobile (`/send-otp` -> `/verify-otp`).
*   **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`

### RBAC Checks
*   **Middleware**: Check `user.role` after login.
*   **Access**:
    *   `SUPER_ADMIN`: Full Access.
    *   `OPERATIONS`: Can Dispatch. Cannot Create Fleets.
    *   `MANAGER`: Read-only or Fleet-scoped.

---

## 4️⃣ API Documentation (Admin Modules)

### A. Dispatching (`/admin/trips`)
*   **POST** `/assign`: `{ tripId, driverId }`
*   **POST** `/reassign`: `{ tripId, driverId }`
*   **POST** `/unassign`: `{ tripId }` (Cancel)
*   **GET** `/`: Query `page`, `limit`, `status`.

### B. Trip Creation (`/trips`)
*   **POST** `/`: Manual Booking.
    *   *Required*: `originCity` ("DELHI"), `tripDate` (Tomorrow >4AM), `vehicleSku` ("EV_SEDAN").

### C. Asset Management (`/fleets`, `/vehicles`, `/drivers`)
*   **POST** `/fleets`: Create Operator.
*   **POST** `/drivers`: Profile creation. **Note**: `userId` is required (Create User first).
*   **POST** `/vehicles`: Car onboarding.

### D. Attendance Ops (`/attendance`)
*   **GET** `/`: List pending approvals.
*   **POST** `/:id/approve`: Approve Shift.
*   **POST** `/:id/reject`: Reject Shift.

---

## 5️⃣ State Machines & Logic

### Trip Status
`CREATED` -> `DRIVER_ASSIGNED` -> `STARTED` -> `COMPLETED`
*   **Admin Power**: Can jump from `CREATED` <-> `DRIVER_ASSIGNED` freely.
*   **Cancel**: Can jump to `CANCELLED` from any state.

### Driver Status
*   `ACTIVE`: Can work.
*   `INACTIVE`: Suspended.
*   `isAvailable`: Real-time toggle (Online/Offline).

### 3.3 Monitoring & Alerts
*   **T-1h Warning**: The Dashboard highlights trips in Red if `pickupTime` is in < 1 hour and status is still `DRIVER_ASSIGNED` (Driver hasn't started).
*   **No Show Review**: `NO_SHOW` trips appear in a review queue for Ops to validate before billing.

---

## 4️⃣ Pricing Calculator (Widget)

### Fleet
*   `id`, `name`, `city`, `type` (`COMPANY`/`INDIVIDUAL`).

### Driver
*   `id`, `name`, `mobile`, `license`, `associatedFleet`.

### Vehicle
*   `id`, `plateNumber`, `model`, `fuel`.

---

## 7️⃣ Error Handling

### Global
*   **400**: Validation Error (Check Form Inputs).
*   **404**: Item deleted or wrong ID.
*   **500**: Backend Crash.

---

## 8️⃣ Third-Party (Integrations)
*   **MMT**: Trips from MMT appear in the list. Admin **MUST** assign them like regular trips.
*   **Exotel**: Used for OTPs. Not directly called by Web.

---

## 9️⃣ Environment
*   **Base URL**: `https://driversklub-backend.onrender.com`

---

## 🔟 Integration Guidelines

1.  **Pagination**: All List APIs support server-side pagination. Use `page` (1-based) & `limit`.
2.  **Date Pickers**: Send **ISO UTC** dates. Disallow past dates for "Create Trip".
3.  **Dropdowns**: Hardcode Enums (`DELHI`, `GURGAON`) in frontend constants until a Meta API is provided.
4.  **Auto-Refresh**: Poll the `GET /admin/trips` endpoint every 30s to show new MMT bookings.

---

## 1️⃣1️⃣ Example Flow: "Dispatching a Trip"
1.  **Ops User** logs in.
2.  **View**: `GET /admin/trips?status=CREATED`. Sees "Trip #123".
3.  **Select**: Clicks "Assign".
4.  **View Drivers**: `GET /drivers?status=ACTIVE&available=true`.
5.  **Select Driver**: Chooses "Raj".
6.  **Action**: `POST /admin/trips/assign` with `{ trip: 123, driver: Raj }`.
7.  **Result**: Trip disappears from "Unassigned" tab. Appears in "Assigned". Driver notified.
