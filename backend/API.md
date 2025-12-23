# 🚕 DRIVER’S KLUB BACKEND — FULL API LIST (FOR POSTMAN)

**Base URL**: `http://localhost:4000`

All protected APIs require:
- `Authorization`: `Bearer <ACCESS_TOKEN>`
- `Content-Type`: `application/json`

---

## ⚙️ Environment Configuration

Ensure the following variables are set in your `.env` file:

- `NODE_ENV`: Application environment (e.g., `development`, `production`).
- `PORT`: Port server listens on (default: `4000`).
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_ACCESS_SECRET`: Secret key for signing access tokens.
- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens.
- `OTP_EXPIRY_MINUTES`: Expiry time for OTP in minutes (default: 5).
- `OTP_MAX_ATTEMPTS`: Max OTP verification attempts (default: 3).
- `OTP_BYPASS_KEY`: (Dev Only) Key to bypass Exotel verification.
- `EXOTEL_ACCOUNT_SID`: Exotel Account SID.
- `EXOTEL_API_KEY`: Exotel API Key.
- `EXOTEL_API_TOKEN`: Exotel API Token.
- `EXOTEL_SENDER_ID`: Exotel Sender ID (e.g., DRIVKL).

---

## ⚠️ Error Formatting

All API errors return a standardized JSON response:

```json
{
  "success": false,
  "message": "Error description here",
  "stack": "..." // Only in development
}
```

**Common Status Codes:**
- `400 Bad Request`: Validation failure or missing fields.
- `401 Unauthorized`: Invalid or missing authentication token.
- `403 Forbidden`: Insufficient permissions for the requested resource.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Duplicate entry (e.g., unique phone number already exists).
- `500 Internal Server Error`: Unexpected server error.

---

## 📚 Enums & Constants

Use these exact string values in API requests and expect them in responses.

### UserRole
- `SUPER_ADMIN`: System owner with full access.
- `OPERATIONS`: Operational staff managing fleets and drivers.
- `MANAGER`: Fleet manager responsible for specific fleets.
- `DRIVER`: The end-user driving the vehicle.

### FleetType
- `INDIVIDUAL`: Individual owner-operator.
- `COMPANY`: Registered transport company.

### FleetStatus / FleetManagerStatus
- `ACTIVE`: Entity is operational.
- `INACTIVE`: Entity is currenlty disabled.

### VehicleOwnership
- `OWNED`: Owned by the fleet.
- `LEASED`: Leased from a third party.

### FuelType
- `PETROL`, `DIESEL`, `CNG`, `ELECTRIC`

### VehicleStatus
- `ACTIVE`, `INACTIVE`

### KycStatus (Driver)
- `PENDING`: Documents submitted, awaiting approval.
- `APPROVED`: KYC verified, driver can be assigned.
- `REJECTED`: Documents invalid or insufficient.

### DriverStatus
- `ACTIVE`, `INACTIVE`

### AssignmentStatus
- `ACTIVE`: Current on-going assignment.
- `ENDED`: Past assignment.

### TripStatus
- `CREATED`: Trip created and assigned.
- `STARTED`: Driver has started the trip (passenger picked up).
- `COMPLETED`: Trip successfully finished.
- `CANCELLED`: Trip was cancelled.

---

## 🔐 1️⃣ AUTHENTICATION APIs

### 🔹 Send OTP
- **Endpoint**: `POST /auth/send-otp`
- **Body**:
  ```json
  {
    "phone": "9999999999"
  }
  ```
- **Response**:
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```

### 🔹 Verify OTP (Login)
- **Endpoint**: `POST /auth/verify-otp`
- **Body**:
  ```json
  {
    "phone": "9999999999",
    "otp": "123456",
    "verifiedKey": "pass" // Optional: For Dev/Bypass
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "string",
    "refreshToken": "string"
  }
  ```

### 🔹 Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Body**:
  ```json
  {
    "refreshToken": "<refresh-token>"
  }
  ```

### 🔹 Logout
- **Endpoint**: `POST /auth/logout`
- **Purpose**: Revoke refresh token(s) so the user session cannot be refreshed anymore.
- **Auth**:
  - **Recommended**: Send `Authorization: Bearer <ACCESS_TOKEN>` (helps revoke all sessions for the user)
  - **Optional**: Provide `refreshToken` in body (helps revoke current session even if access token is expired)
- **Body** *(optional)*:
  ```json
  {
    "refreshToken": "<refresh-token>"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Logged out"
  }
  ```
- **Notes / Behavior**:
  - This endpoint is **idempotent**: calling it multiple times is safe.
  - If `refreshToken` is provided, backend deletes it from DB (best-effort).
  - If backend can identify the user (via access token or a valid refresh JWT), it revokes **all** refresh tokens for that user (logs out from all devices/sessions).
  - Client should **always clear local tokens** and redirect to `/login` even if this API fails (network down).

**cURL example**:

```bash
curl -X POST "http://localhost:4000/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

---

## 👥 2️⃣ USER MANAGEMENT (RBAC CORE)

### 🔹 Create User
- **Role**: `SUPER_ADMIN`
- **Endpoint**: `POST /users`
- **Body**:
  ```json
  {
    "name": "Driver User",
    "phone": "9000000001",
    "role": "DRIVER"
  }
  ```

### 🔹 Get All Users
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `GET /users`

### 🔹 Get User By ID
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `GET /users/:id`

### 🔹 Deactivate User
- **Role**: `SUPER_ADMIN`
- **Endpoint**: `PATCH /users/:id/deactivate`

---

## 🏢 3️⃣ FLEET APIs (PHASE 1)

### 🔹 Create Fleet
- **Role**: `SUPER_ADMIN`
- **Endpoint**: `POST /fleets`
- **Body**:
  ```json
  {
    "name": "Delhi Airport Fleet",
    "mobile": "9111111111",
    "email": "fleet@airport.com",
    "city": "Delhi",
    "fleetType": "COMPANY",
    "gstNumber": "07ABCDE1234F1Z5",
    "panNumber": "ABCDE1234F",
    "modeId": "CAB"
  }
  ```

### 🔹 Get All Fleets
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `GET /fleets`

### 🔹 Get Fleet By ID
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `GET /fleets/:fleetId`

### 🔹 Deactivate Fleet
- **Role**: `SUPER_ADMIN`
- **Endpoint**: `PATCH /fleets/:fleetId/deactivate`

---

## 👨‍💼 4️⃣ FLEET MANAGER (YARD MANAGER)

### 🔹 Create Fleet Manager
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `POST /fleet-managers`
- **Body**:
  ```json
  {
    "name": "Yard Manager",
    "mobile": "9222222222",
    "city": "Delhi",
    "fleetId": "<fleet-id>"
  }
  ```

### 🔹 Get Fleet Managers by Fleet
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `GET /fleet-managers/fleet/:fleetId`

### 🔹 Deactivate Fleet Manager
- **Role**: `SUPER_ADMIN`
- **Endpoint**: `PATCH /fleet-managers/:id/deactivate`

---

## 🚗 5️⃣ VEHICLE APIs (PHASE 2)

### 🔹 Create Vehicle
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `POST /vehicles`
- **Body**:
  ```json
  {
    "fleetId": "<fleet-id>",
    "vehicleNumber": "DL01AB1234",
    "vehicleName": "Swift Dzire",
    "vehicleModel": "2022",
    "vehicleColor": "White",
    "ownership": "OWNED",
    "fuelType": "CNG"
  }
  ```

### 🔹 Get Vehicles by Fleet
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `GET /vehicles/fleet/:fleetId`

### 🔹 Get Vehicle by ID
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `GET /vehicles/:vehicleId`

### 🔹 Update Vehicle Documents
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `PATCH /vehicles/:vehicleId/docs`
- **Body**:
  ```json
  {
    "insuranceImage": "https://s3/insurance.jpg",
    "insuranceExpiry": "2026-05-01"
  }
  ```

### 🔹 Deactivate Vehicle
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `PATCH /vehicles/:vehicleId/deactivate`

---

## 👨‍✈️ 6️⃣ DRIVER APIs (PHASE 4)

### 🔹 Create Driver
- **Role**: `SUPER_ADMIN`, `OPERATIONS`
- **Endpoint**: `POST /drivers`
- **Body**:
  ```json
  {
    "userId": "<driver-user-id>",
    "fleetId": "<fleet-id>",
    "firstName": "Ravi",
    "lastName": "Kumar",
    "mobile": "9000000001"
  }
  ```

### 🔹 Get Drivers by Fleet
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `GET /drivers/fleet/:fleetId`

### 🔹 Get Driver by ID
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `GET /drivers/:driverId`

---

## 🔁 7️⃣ ASSIGNMENT APIs (PHASE 3)

### 🔹 Create Assignment
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `POST /assignments`
- **Body**:
  ```json
  {
    "fleetId": "<fleet-id>",
    "driverId": "<driver-id>",
    "vehicleId": "<vehicle-id>"
  }
  ```

### 🔹 Get Assignments by Fleet
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `GET /assignments/fleet/:fleetId`

### 🔹 End Assignment
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `PATCH /assignments/:assignmentId/end`

---

## 🚕 8️⃣ TRIP APIs (PHASE 4 – CORE PRODUCT)

### 🔹 Create Trip
- **Role**: `OPERATIONS`, `MANAGER`
- **Endpoint**: `POST /trips`
- **Body**:
  ```json
  {
    "assignmentId": "<active-assignment-id>",
    "pickup": "IGI Airport T3",
    "drop": "Connaught Place"
  }
  ```

### 🔹 Start Trip
- **Role**: `DRIVER`
- **Endpoint**: `PATCH /trips/:tripId/start`

### 🔹 Complete Trip
- **Role**: `DRIVER`
- **Endpoint**: `PATCH /trips/:tripId/complete`
- **Body**:
  ```json
  {
    "fare": 650
  }
  ```

### 🔹 Get Trips by Fleet
- **Role**: `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`
- **Endpoint**: `GET /trips/fleet/:fleetId`

### 🔹 Get My Trips (Driver Self)
- **Role**: `DRIVER`
- **Endpoint**: `GET /trips/me`

---

## 🩺 9️⃣ SYSTEM

### 🔹 Health Check
- **Endpoint**: `GET /health`

---

## 🔄 End-to-End Workflow Example: Daily Operations

This guide demonstrates a typical daily workflow: creating a trip for a driver.

### 1. Prerequisites (Admin Setup)
Before a trip can start, entities must exist:
- **Fleet**: `POST /fleets` -> Returns `fleetId`.
- **User (Driver)**: `POST /users` -> Returns `userId`.
- **Driver Profile**: `POST /drivers` (link `userId` & `fleetId`) -> Returns `driverId`.
- **Vehicle**: `POST /vehicles` (link `fleetId`) -> Returns `vehicleId`.

### 2. Shift Assignment (Morning)
*Role: Manager/Operations*
- **Action**: Assign the driver to the vehicle for the day.
- **Endpoint**: `POST /assignments`
- **Body**:
  ```json
  { "fleetId": "...", "driverId": "...", "vehicleId": "..." }
  ```
- **Result**: Returns an `assignmentId` (Status: `ACTIVE`). The driver is now "online" on this vehicle.

### 3. Creating a Trip (Mid-day)
*Role: Operations*
- **Action**: A booking request comes in. Ops creates a trip.
- **Endpoint**: `POST /trips`
- **Body**:
  ```json
  { "assignmentId": "...", "pickup": "Hotel A", "drop": "Airport" }
  ```
- **Result**: Trip created with `id: trip_123`, Status: `CREATED`.

### 4. Executing the Trip
*Role: Driver (Mobile App)*
- **Step A: Start**: Driver reaches pickup.
  - `PATCH /trips/trip_123/start` -> Status: `STARTED`.
- **Step B: Complete**: Driver drops passenger.
  - `PATCH /trips/trip_123/complete` with body `{ "fare": 500 }` -> Status: `COMPLETED`.

### 5. End Shift (Night)
*Role: Manager*
- **Action**: Driver returns vehicle.
- **Endpoint**: `PATCH /assignments/{assignmentId}/end`
- **Result**: Status: `ENDED`. Vehicle and Driver are free for new assignments.

---

## ✅ Postman Testing Guide

Follow these steps to set up a powerful testing workflow in Postman.

### 1. Environment Setup
Create a new Postman Environment (e.g., "Drivers Klub Local") and add these variables:

| Variable | Initial Value | Current Value |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:4000` | `http://localhost:4000` |
| `ACCESS_TOKEN` | *(leave empty)* | *(will be set automatically)* |
| `REFRESH_TOKEN`| *(leave empty)* | *(will be set automatically)* |

### 2. Collection Setup
1. Create a new Collection named **"Drivers Klub Backend"**.
2. Go to the **Authorization** tab of the *Collection*:
   - **Type**: Bearer Token
   - **Token**: `{{ACCESS_TOKEN}}`
   *This automatically applies the token to every request in the collection.*

### 3. Automating Authentication (The "Magic" Step)
You don't want to copy-paste tokens manually.
1. Create the **Verify OTP** request (`POST {{BASE_URL}}/auth/verify-otp`).
2. Go to the **Tests** tab of this request.
3. Paste this code:

```javascript
var jsonData = pm.response.json();
if (jsonData.accessToken) {
    pm.environment.set("ACCESS_TOKEN", jsonData.accessToken);
    pm.environment.set("REFRESH_TOKEN", jsonData.refreshToken);
    console.log("Tokens updated automatically!");
}
```
**Now, whenever you run Login, your environment is automatically updated with the fresh token!**

### 4. Folder Structure
Organize requests to match the module structure:
- 📂 **01 Auth** (Send OTP, Verify OTP, Refresh, Logout)
- 📂 **02 Users**
- 📂 **03 Fleets**
- 📂 **04 Fleet Managers**
- 📂 **05 Vehicles**
- 📂 **06 Drivers**
- 📂 **07 Assignments**
- 📂 **08 Trips**

---

## 🚪 Logout Flow (End-to-End)

### Backend (Session Revocation)
1. Client calls `POST /auth/logout` with:
   - `Authorization: Bearer <ACCESS_TOKEN>` (recommended)
   - body `{ "refreshToken": "<REFRESH_TOKEN>" }` (recommended)
2. Backend deletes refresh token(s) from `RefreshToken` table.
3. Any future attempt to refresh using a revoked token returns `401 Invalid refresh token`.

### Frontend (UI + Local Session)
1. User clicks initials in header → dropdown opens → clicks **Logout**.
2. UI shows a confirmation prompt: **"Are you sure you want to logout?"**
3. On confirm:
   - call `POST /auth/logout`
   - clear tokens from localStorage
   - redirect to `/login`

