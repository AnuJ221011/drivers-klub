# 📱 Flutter Driver App - API Integration Handbook

## 1️⃣ Document Meta
| Attribute | Details |
| :--- | :--- |
| **Document Title** | Driver App API Reference |
| **Version** | 3.4.0 (Final) |
| **Status** | **APPROVED / LIVE** |
| **Audience** | Mobile Engineering Team (Flutter) |
| **Base URL** | `https://driversklub-backend.onrender.com` |

---

## 2️⃣ Authentication

### A. Send OTP
*   **Endpoint**: `POST /auth/send-otp`
*   **Auth**: Public
*   **Request Body**:
    ```json
    {
      "phone": "9876543210"
    }
    ```
*   **Success Response (200)**:
    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "OTP sent successfully",
      "data": { "message": "OTP sent successfully" }
    }
    ```
*   **Error (404)**: "User not registered" (Driver needs to contact Admin).

### B. Verify OTP (Login)
*   **Endpoint**: `POST /auth/verify-otp`
*   **Auth**: Public
*   **Request Body**:
    ```json
    {
      "phone": "9876543210",
      "otp": "1234"
    }
    ```
*   **Success Response (200)**:
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "accessToken": "eyJh...",
        "refreshToken": "8f8e...",
        "user": {
          "id": "uuid-user",
          "name": "Raj Kumar",
          "role": "DRIVER",
          "phone": "9876543210"
        }
      }
    }
    ```
*   **Action**: Store Tokens in `FlutterSecureStorage`.

### C. Refresh Token
*   **Endpoint**: `POST /auth/refresh`
*   **Auth**: Public
*   **Request Body**: `{ "refreshToken": "..." }`
*   **Success Response (200)**: `{ "accessToken": "...", "refreshToken": "..." }`

---

## 3️⃣ Driver Profile

### Get My Profile
*   **Endpoint**: `GET /drivers/me`
*   **Auth**: Bearer Token
*   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid-driver-id",
        "userId": "uuid-user-id",
        "firstName": "Raj",
        "lastName": "Kumar",
        "mobile": "9876543210",
        "fleetId": "uuid-fleet",
        "status": "ACTIVE",
        "kycStatus": "APPROVED",
        "isAvailable": true
      }
    }
    ```
*   **Action**: Cache `id` (Driver ID) locally. It is needed for Attendance calls.

---

## 4️⃣ Attendance (Shift Management)

### A. Check In (Start Day)
*   **Endpoint**: `POST /attendance/check-in`
*   **Request Body**:
    ```json
    {
      "driverId": "uuid-driver-id", // From Profile
      "lat": 28.4595,
      "lng": 77.0266,
      "odometer": 10500,
      "selfieUrl": "https://s3.aws.com/..." // Upload Image first
    }
    ```
*   **Success Response (201)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid-attendance",
        "status": "PENDING",
        "checkInTime": "2025-12-24T06:00:00.000Z"
      }
    }
    ```

### B. Check Out (End Day)
*   **Endpoint**: `POST /attendance/check-out`
*   **Request Body**:
    ```json
    {
      "driverId": "uuid-driver-id",
      "odometer": 10650
    }
    ```
*   **Success Response (200)**: `{ "status": "CHECKED_OUT" }`

### C. Get History
*   **Endpoint**: `GET /attendance`
*   **Query**: `?driverId=uuid...&page=1&limit=20`
*   **Success Response**: `{ "data": [...], "total": 50 }`

---

## 5️⃣ Trip Management

### A. List My Trips
*   **Endpoint**: `GET /trips`
*   **Query Params**:
    *   `status=DRIVER_ASSIGNED` (For "New/Active" Tab)
    *   `status=COMPLETED` (For "History" Tab)
*   **Success Response (200)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "uuid-trip",
          "pickupLocation": "Terminal 3",
          "dropLocation": "Cyber Hub",
          "pickupTime": "2025-12-25T10:00:00.000Z",
          "status": "DRIVER_ASSIGNED",
          "vehicleSku": "EV_SEDAN",
          "customerName": "John Doe",
          "customerPhone": "9998887777"
        }
      ]
    }
    ```

### B. Trip Actions (State Machine)

#### 1. Start Trip (En-Route)
*   **Endpoint**: `POST /trips/:id/start`
*   **Body**: `{ "lat": 28.5, "lng": 77.1 }`
*   **Success**: `{ "status": "STARTED", "startedAt": "..." }`

#### 2. Arrived (At Pickup)
*   **Endpoint**: `POST /trips/:id/arrived`
*   **Body**: `{ "lat": 28.5, "lng": 77.1 }`
*   **Effect**: Sends SMS to customer.

#### 3. Onboard (Start Ride)
*   **Endpoint**: `POST /trips/:id/onboard`
*   **Body**: `{ "otp": "1234" }` (Optional)
*   **Effect**: Meter/Billing starts implicitly.

#### 4. Complete (Drop)
*   **Endpoint**: `POST /trips/:id/complete`
*   **Body**:
    ```json
    {
      "distance": 15.2, // KM
      "fare": 500       // INR
    }
    ```
*   **Success Response**:
    ```json
    {
      "success": true,
      "data": {
        "status": "COMPLETED",
        "price": 500,
        "completedAt": "2025-12-25T11:30:00.000Z"
      }
### B. Trip Lifecycle State Machine (Strict Industrial Logic)

The app must strictly enforce these time-based and location-based rules before calling APIs.

| State | Action | API Endpoint | Validation / Logic |
| :--- | :--- | :--- | :--- |
| `DRIVER_ASSIGNED` | **"Start Trip"** | `POST /trips/:id/start` | • **Time Window**: Button enables **2.5 Hours** before `pickupTime`.<br>• **Notifications**: Sent 2h before, then every 30m.<br>• **Warning**: If not started by 1h before, Admin is alerted. |
| `STARTED` | **"Arrived"** | `POST /trips/:id/arrived` | • **Geofence**: Must be within **500m** (Configurable) of Pickup.<br>• **Time**: Valid from **30 mins** before Pickup.<br>• **Effect**: Customer notified via MMT. |
| `ARRIVED` | **"Start Ride"** | `POST /trips/:id/onboard` | • **Condition**: Customer is in car.<br>• **Wait Time**: If >20 mins past pickup, UI starts "Waiting Time" timer. |
| `ARRIVED` | **"No Show"** | `POST /trips/:id/no-show` | • **Condition**: >30 mins past pickup AND Customer unreachable.<br>• **Status**: Sets trip to `NO_SHOW`. |
| `ONBOARDED` | **"Complete"** | `POST /trips/:id/complete` | • **Payment**: Check if "Cash Collected" or "Prepaid".<br>• **Input**: Final Odometer / Distance. |

### 5.1 ⏳ Waiting Time Logic
*   **Trigger**: If Customer does not board within **20 Minutes** of `pickupTime`.
*   **Action**: App should display "Waiting Time Started".
*   ** Billing**: The extra time is added to the backend billing calculation at `Complete`.

### 5.2 🚫 No-Show Logic
*   **Trigger**: **30 Minutes** past `pickupTime`.
*   **Action**: Enable "Mark No Show" button.
*   **API**: `POST /trips/:id/no-show` (Status: `NO_SHOW`).

---

## 6️⃣ Error Handling

| HTTP Code | Error Message | Meaning | UI Action |
| :--- | :--- | :--- | :--- |
| `400` | `Driver already checked in` | Duplicate session | Resume existing session. |
| `401` | `Unauthorized` | Token invalid | Refresh Token or Logout. |
| `404` | `Trip not found` | Invalid ID | Refresh List. |
| `422` | `Trip already started` | State Mismatch | Sync Status from Backend. |

---

## 7️⃣ Implementation Guidelines

1.  **Polling**: Poll `GET /trips?status=DRIVER_ASSIGNED` every **30 Seconds** to check for new assignments.
2.  **Location**: Always fetch current GPS coordinates before calling any `/trips/:id/*` endpoint.
3.  **Selfie**: Use `image_picker` library -> Upload to AWS S3/Cloudinary -> Send URL to `/attendance/check-in`.
