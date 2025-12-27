# 💻 React Admin Dashboard - API Integration Guide (Production)

**Target Audience:** Web Frontend Team  
**Base URL (Production):** `https://driversklub-backend.onrender.com`  
**Base URL (Development):** `http://localhost:5000`  
**Auth:** Requires `Authorization: Bearer <TOKEN>` with Role `SUPER_ADMIN` or `OPERATIONS`  
**Version:** 3.1.0  
**Last Updated:** December 26, 2025

---

## 📑 Table of Contents

1. [Authentication](#1-authentication)
2. [Dispatch & Trip Operations](#2-dispatch--trip-operations)
3. [Fleet & Asset Management](#3-fleet--asset-management)
4. [Operations & Assignments](#4-operations--assignments)
5. [User Management](#5-user-management)
6. [Pricing Calculator](#6-pricing-calculator)
7. [Frontend Implementation Notes](#7-frontend-implementation-notes)

---

## 1. Authentication

### 1.1 Admin Login Flow
Same as driver authentication but requires `SUPER_ADMIN` or `OPERATIONS` role.

**Endpoint:** `POST /auth/verify-otp`

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "def...",
    "user": {
      "id": "uuid",
      "role": "SUPER_ADMIN"
    }
  }
}
```

**Action:** Check `user.role`. Redirect to dashboard only if `SUPER_ADMIN` or `OPERATIONS`.

---

## 2. Dispatch & Trip Operations

### 2.1 Create New Trip
**Endpoint:** `POST /trips`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

**Request Body:**
```json
{
  "tripType": "AIRPORT",
  "originCity": "Delhi",
  "destinationCity": "Gurgaon",
  "pickupLocation": "T3 Terminal, Gate 4",
  "pickupLat": 28.5562,
  "pickupLng": 77.1000,
  "dropLocation": "Cyber Hub, Gurgaon",
  "pickupTime": "2025-12-25T10:00:00Z",
  "vehicleSku": "EV_SEDAN",
  "distanceKm": 45
}
```

> [!IMPORTANT]
> **Strict Trip Constraints:**
> - **Start Window:** Driver can only start trip **2.5 Hours** before pickup
> - **Geofence:** `pickupLat` & `pickupLng` are **MANDATORY** for the app to allow "Arrived" status (500m radius)
> - **T-1 Constraint:** `pickupTime` must be > 24 hours from now

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CREATED",
    "price": 1200,
    "tripType": "AIRPORT",
    "pickupTime": "2025-12-25T10:00:00Z"
  }
}
```

---

### 2.2 List All Trips (Grid View)
**Endpoint:** `GET /admin/trips`  
**Role:** `SUPER_ADMIN`

**Query Params:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (optional): Filter by status (e.g., `CREATED`, `DRIVER_ASSIGNED`, `STARTED`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "uuid",
        "tripType": "AIRPORT",
        "pickupLocation": "T3 Terminal",
        "dropLocation": "Cyber Hub",
        "pickupTime": "2025-12-25T10:00:00Z",
        "status": "CREATED",
        "price": 1200,
        "driver": null
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

---

### 2.3 Assign Driver (Dispatch)
**Endpoint:** `POST /admin/trips/assign`  
**Role:** `SUPER_ADMIN`  
**Description:** The core action of the dashboard. Logic: "Select Trip → Select Driver → Assign"

**Request Body:**
```json
{
  "tripId": "uuid-trip-id",
  "driverId": "uuid-driver-id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Driver assigned successfully"
}
```

**Side Effects:**
1. Updates Trip Status → `DRIVER_ASSIGNED`
2. Creates `TripAssignment` record (transactional)
3. Pushes Notification to Driver App
4. If MMT Trip, pushes Webhook to MMT (`/driver-assigned`)

---

### 2.4 Unassign Driver
**Endpoint:** `POST /admin/trips/unassign`  
**Role:** `SUPER_ADMIN`  
**Description:** Force cancel/detach driver from trip

**Request Body:**
```json
{
  "tripId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Driver unassigned successfully"
}
```

**Side Effects:**
- Status: `DRIVER_ASSIGNED` → `CREATED`
- If MMT Trip, triggers `/detach-trip` webhook

---

### 2.5 Reassign Driver
**Endpoint:** `POST /admin/trips/reassign`  
**Role:** `SUPER_ADMIN`  
**Description:** Change assigned driver (e.g., when driver cancels or car breaks down)

**Request Body:**
```json
{
  "tripId": "uuid",
  "driverId": "uuid-new-driver"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Driver reassigned successfully"
}
```

**Side Effects:**
- If MMT Trip, triggers `/reassign-chauffeur` webhook

---

## 3. Fleet & Asset Management

### 3.1 Fleets (Operators)

#### Create Fleet
**Endpoint:** `POST /fleets`  
**Role:** `SUPER_ADMIN`

**Request Body:**
```json
{
  "name": "Delhi Cabs Pvt Ltd",
  "mobile": "9999988888",
  "city": "DELHI",
  "fleetType": "COMPANY",
  "panNumber": "ABCDE1234F"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Delhi Cabs Pvt Ltd",
    "city": "DELHI"
  }
}
```

#### List Fleets
**Endpoint:** `GET /fleets`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Delhi Cabs Pvt Ltd",
      "city": "DELHI",
      "fleetType": "COMPANY",
      "status": "ACTIVE"
    }
  ]
}
```

#### Get Fleet Details
**Endpoint:** `GET /fleets/:id`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

#### Deactivate Fleet
**Endpoint:** `PATCH /fleets/:id/deactivate`  
**Role:** `SUPER_ADMIN`

---

### 3.2 Vehicles (Cars)

#### Add Vehicle
**Endpoint:** `POST /vehicles`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

**Request Body:**
```json
{
  "fleetId": "uuid-fleet-id",
  "vehicleNumber": "DL10CA1234",
  "vehicleName": "Tata Tigor EV",
  "fuelType": "ELECTRIC",
  "ownership": "OWNED"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "vehicleNumber": "DL10CA1234",
    "vehicleName": "Tata Tigor EV"
  }
}
```

#### List Vehicles by Fleet
**Endpoint:** `GET /vehicles/fleet/:fleetId`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vehicleNumber": "DL10CA1234",
      "vehicleName": "Tata Tigor EV",
      "fuelType": "ELECTRIC",
      "status": "ACTIVE"
    }
  ]
}
```

#### Update Vehicle Documents
**Endpoint:** `PATCH /vehicles/:id/docs`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

**Request Body:**
```json
{
  "rcUrl": "https://s3.aws.com/rc.pdf",
  "insuranceUrl": "https://s3.aws.com/insurance.pdf"
}
```

#### Deactivate Vehicle
**Endpoint:** `PATCH /vehicles/:id/deactivate`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

---

### 3.3 Drivers (Profiles)

#### Onboard Driver
**Endpoint:** `POST /drivers`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

**Request Body:**
```json
{
  "fleetId": "uuid-fleet-id",
  "firstName": "Raj",
  "lastName": "Kumar",
  "mobile": "9812345678",
  "licenseNumber": "DL-12345-67890",
  "email": "raj@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Raj",
    "lastName": "Kumar",
    "mobile": "9812345678"
  }
}
```

#### List Drivers by Fleet
**Endpoint:** `GET /drivers/fleet/:fleetId`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "Raj",
      "lastName": "Kumar",
      "mobile": "9812345678",
      "status": "ACTIVE",
      "kycStatus": "APPROVED"
    }
  ]
}
```

#### Get Driver Details
**Endpoint:** `GET /drivers/:id`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`

---

## 4. Operations & Assignments

### 4.1 Approve Attendance
**Endpoint:** `POST /attendance/:id/approve`  
**Roles:** `SUPER_ADMIN`, `MANAGER`  
**Description:** Admins review selfies and odometer readings before approving the shift

**Request Body:**
```json
{
  "remarks": "Approved by Ops"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Attendance approved"
}
```

**Action:** Validates Driver's selfie time/location. Rejection is also possible via `/attendance/:id/reject`.

---

### 4.2 Daily Vehicle Assignment (Roster)
**Endpoint:** `POST /assignments`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`  
**Description:** Link a driver to a car for the day

**Request Body:**
```json
{
  "driverId": "uuid-driver",
  "vehicleId": "uuid-vehicle",
  "fleetId": "uuid-fleet"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "driverId": "uuid",
    "vehicleId": "uuid",
    "startDate": "2025-12-25T00:00:00Z"
  }
}
```

**Goal:** Driver cannot receive trips without this active link.

---

### 4.3 Get Assignments by Fleet
**Endpoint:** `GET /assignments/fleet/:fleetId`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "driver": {
        "firstName": "Raj",
        "lastName": "Kumar"
      },
      "vehicle": {
        "vehicleNumber": "DL10CA1234"
      },
      "startDate": "2025-12-25T00:00:00Z",
      "status": "ACTIVE"
    }
  ]
}
```

---

### 4.4 End Assignment
**Endpoint:** `PATCH /assignments/:id/end`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`

---

## 5. User Management

### 5.1 Create User
**Endpoint:** `POST /users`  
**Role:** `SUPER_ADMIN`

**Request Body:**
```json
{
  "phone": "9876543210",
  "role": "DRIVER",
  "name": "Raj Kumar"
}
```

**Roles:** `SUPER_ADMIN`, `OPERATIONS`, `MANAGER`, `DRIVER`

---

### 5.2 List All Users
**Endpoint:** `GET /users`  
**Roles:** `SUPER_ADMIN`, `OPERATIONS`

---

### 5.3 Deactivate User
**Endpoint:** `PATCH /users/:id/deactivate`  
**Role:** `SUPER_ADMIN`

---

## 6. Pricing Calculator

### 6.1 Preview Pricing
**Endpoint:** `POST /pricing/preview`  
**Auth Required:** No  
**Description:** "Get Estimate" button on Create Trip form

**Request Body:**
```json
{
  "distanceKm": 45,
  "tripType": "AIRPORT"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "baseFare": 800,
    "distanceCharge": 400,
    "totalFare": 1200,
    "breakdown": {
      "minBillableKm": 40,
      "ratePerKm": 20
    }
  }
}
```

**Use Case:** Show fare before booking to set customer expectations.

---

## 7. Frontend Implementation Notes

### 7.1 CORS
- **Current:** Configured to allow all origins (`*`)
- **Production:** Whitelist specific domains

### 7.2 Date Handling
- Use `date-fns` or `moment` to parse UTC ISO strings from API
- **Always display in User's Local Time**
- Store in UTC, display in local

```javascript
import { format, parseISO } from 'date-fns';

const displayTime = format(parseISO(trip.pickupTime), 'PPpp');
// Output: "Dec 25, 2025, 10:00 AM"
```

### 7.3 State Management
**Recommendations:**
- Cache `Fleets` and `Drivers` lists (TanStack Query recommended) as they change infrequently
- Poll `Trips` list (every 30s) or use a "Refresh" button for operations
- Handle `401 Unauthorized` by redirecting to Login
- Implement optimistic updates for better UX

**Example with TanStack Query:**
```javascript
const { data: trips } = useQuery({
  queryKey: ['trips', { status, page }],
  queryFn: () => fetchTrips({ status, page }),
  refetchInterval: 30000, // 30 seconds
});
```

### 7.4 Error Handling
```javascript
try {
  await assignDriver(tripId, driverId);
  toast.success('Driver assigned successfully');
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
    router.push('/login');
  } else {
    toast.error(error.response?.data?.message || 'Failed to assign driver');
  }
}
```

### 7.5 Role-Based UI
```javascript
const canCreateTrip = ['SUPER_ADMIN', 'OPERATIONS'].includes(user.role);
const canApproveAttendance = ['SUPER_ADMIN', 'MANAGER'].includes(user.role);

{canCreateTrip && <Button onClick={openCreateTripModal}>Create Trip</Button>}
```

### 7.6 Pagination Component
```javascript
<Pagination
  currentPage={page}
  totalPages={Math.ceil(total / limit)}
  onPageChange={setPage}
/>
```

### 7.7 Status Badge Component
```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'CREATED': return 'gray';
    case 'DRIVER_ASSIGNED': return 'blue';
    case 'STARTED': return 'yellow';
    case 'COMPLETED': return 'green';
    case 'CANCELLED': return 'red';
    default: return 'gray';
  }
};

<Badge color={getStatusColor(trip.status)}>{trip.status}</Badge>
```

### 7.8 Real-time Updates (Optional)
Consider implementing WebSocket connection for real-time trip status updates:
```javascript
const socket = io('wss://driversklub-backend.onrender.com');

socket.on('trip:updated', (trip) => {
  queryClient.setQueryData(['trip', trip.id], trip);
});
```

---

## 📝 Checklist for Production

- [ ] Implement token refresh logic
- [ ] Add role-based access control to UI
- [ ] Implement pagination for all list views
- [ ] Add loading states for all API calls
- [ ] Add error handling with user-friendly messages
- [ ] Implement date/time formatting (UTC → Local)
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement search/filter functionality
- [ ] Add export to CSV functionality
- [ ] Test all edge cases (empty states, errors, etc.)

---

**End of React Admin API Guide**
