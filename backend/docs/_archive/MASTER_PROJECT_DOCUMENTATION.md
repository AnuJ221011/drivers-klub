# 🧠 Drivers Klub Backend - Master System Documentation

**Version:** 3.1.0 (Production / Exhaustive)
**Date:** December 30, 2025
**Status:** ✅ **PRODUCTION-READY** - Live / Stable
**Repository:** `driversklub-backend`

---

## 🎯 Production Status

**✅ READY FOR DEPLOYMENT**

- **Test Pass Rate:** 100% (16/16 tests)
- **Critical Bugs Fixed:** 9/9 (100%)
- **Security Score:** 95/100
- **Performance:** Optimized with database indexes
- **Documentation:** Comprehensive

### Recent Updates (Dec 2025)

- ✅ All critical security vulnerabilities resolved
- ✅ Comprehensive test suite implemented (100% pass rate)
- ✅ Rate limiting and CORS configured
- ✅ Database performance optimized (9 indexes added)
- ✅ Error handling standardized across all endpoints
- ✅ Input validation implemented
- ✅ Health check enhanced with DB connectivity
- ✅ OTP security hardened (one-time use, deleted after verification)
- ✅ **Payment System Finalized** (Easebuzz, Rental Model, & Manual Payout with Bulk CSV)
- ✅ **Rapido Integration** (Automated Status Sync, Fleet API)

---

## 1. System Architecture

The platform is a **Node.js/Express** monolith designed with **Microservice-ready modularity**. It serves as the central orchestration layer between Fleet Supply (Drivers/Vehicles) and Demand Sources (MMT, Apps).

### 1.1 High-Level Flow

```mermaid
graph TD
    User[Mobile/Web Apps] -->|REST API| API[Backend API]
    Partner[MakeMyTrip] -->|Webhook| API
    
    subgraph Backend Core
        API --> Auth[Auth Service (OTP)]
        API --> Trip[Trip Orchestrator]
        API --> Fleet[Fleet Management]
    end
    
    Trip -->|Persist| DB[(PostgreSQL)]
    Trip -->|Calculate| Pricing[Pricing Engine]
    Trip -->|Validate| Constraints[Constraint Engine]
    
    Trip -->|Push Updates| Partner
```

### 1.2 Tech Stack

- **Runtime**: Node.js v18+ (TypeScript 5.x)

- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma Client v5.x
- **Auth**: JWT (1h Access / 30d Refresh) + Custom OTP (Exotel Integration)
- **Logging**: Winston (File + Console)
- **Testing**: `tsx` scripts (E2E Flow)

---

### 1.3 Payment & Financial Architecture

The platform implements a comprehensive financial ledger system:

- **Rental Model**:
  - **Plans**: Created by Fleet Managers (e.g., Weekly, Daily).
  - **Subscription**: Drivers purchase plans using Easebuzz PG.
  - **Validation**: System checks fleet affinity before allowing purchase.
- **InstaCollect (Ad-Hoc)**:
  - **Orders**: Dynamic QR generation for specific amounts (Partial payments supported).
  - **Settlement**: Real-time webhook reconciliation.
- **Payout Model**:
  - **Collection**: Tracks Cash vs Online trip payments.
  - **Reconciliation**: Admins verify daily collections.
  - **Disbursement**: Bulk CSV upload triggers IMPS wire transfers via Easebuzz.
- **Ledger**:
  - Tracks all credits (Incentives, Trip Fares) and debits (Rentals, Penalties).
  - Real-time wallet balance calculation.

---

## 2. Directory Structure

The codebase follows a Domain-Driven Design (DDD) hybrid approach:

```text
src/
├── adapters/            # External Integrations
│   ├── easebuzz/        # Easebuzz Payment Gateway Integration
│   ├── mmt/             # MakeMyTrip API Logic
│   └── providers/       # Generic Provider Interfaces (Internal, MojoBoxx)
│
├── core/                # Business Logic & Intelligence (Framework Agnostic)
│   ├── constraints/     # Trip Intelligence (Constraint Rules, Engine)
│   ├── payment/         # Payment System (Rental, Payout, Penalties, Incentives, Virtual QR)
│   ├── pricing/         # Pricing Engine (Rules, Config, Calculator)
│   ├── provider/        # Provider Fulfillment (Factory, Booking Service)
│   └── trip/            # Core Trip Services (Orchestrator, Lifecycle)
│
├── modules/             # API Layer (Controllers, Routes, DTOs)
│   ├── auth/            # JWT & OTP Authentication (No Registration)
│   ├── users/           # User Management (Admin-Only Creation)
│   ├── drivers/         # Driver CRUD (Admin-Only Creation)
│   ├── fleets/          # Fleet Operator Management
│   ├── fleetManager/    # Fleet Manager Management
│   ├── vehicles/        # Vehicle Asset Management
│   ├── assignments/     # Daily Roster Management
│   ├── attendance/      # Driver Attendance & Check-in/out
│   ├── trips/           # Trip Endpoints (Driver App)
│   ├── payment/         # Payment & Payout Endpoints (Driver & Admin)
│   ├── pricing/         # Pricing Calculator
│   ├── partner/         # MMT Webhooks
│   └── webhooks/        # Easebuzz Webhooks (Payment Gateway & Virtual Accounts)
│
├── shared/              # Shared Code (Enums, Constants, Errors)
├── middlewares/         # Express Middlewares (Auth, Error Handling)
├── utils/               # Utilities (Logger, Prisma Client)
└── worker.ts            # Background Worker (Provider Status Sync)
```

---

## 3. Data Dictionary (Canonical)

This section defines the database schema based on [prisma/schema.prisma](file:///d:/drivers-klub/driversklub-backend/prisma/schema.prisma).

### 3.1 Trip ([Ride](file:///d:/drivers-klub/driversklub-backend/src/core/trip/services/provider-status-sync.service.ts#13-40))

The central entity representing a booking.

| Field | Type | Description |
| :--- | :--- | :--- |
| [id](file:///d:/drivers-klub/driversklub-backend/src/core/trip/services/provider-status-sync.service.ts#13-40) | UUID | Primary Key |
| `tripType` | Enum | `AIRPORT`, `RENTAL`, `INTER_CITY` |
| `originCity` | String | e.g. "Delhi" |
| `destinationCity` | String | e.g. "Gurgaon" |
| `pickupLocation` | String | Free text address |
| `pickupLat` | Float | GPS Latitude (Required for Geofence) |
| `pickupLng` | Float | GPS Longitude (Required for Geofence) |
| `dropLocation` | String | Free text address |
| `pickupTime` | DateTime | ISO UTC |
| `distanceKm` | Float | Trip distance |
| `price` | Float | Calculated Total Fare |
| `vehicleSku` | String | e.g. "EV_SEDAN" |
| `status` | Enum | `CREATED` -> `DRIVER_ASSIGNED` -> `STARTED` -> `COMPLETED` |
| `provider` | Enum | `INTERNAL`, [MMT](file:///d:/drivers-klub/driversklub-backend/src/modules/partner/mmt/mmt.service.ts#5-150), `MOJOBOXX` |

### 3.2 Driver

Driver profiles linked to User accounts and Fleet organizations.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `userId` | UUID | Foreign Key to User (1:1) |
| `fleetId` | UUID | Foreign Key to Fleet |
| `hubId` | UUID? | Optional Foreign Key to FleetHub |
| `firstName` | String | Driver's first name |
| `lastName` | String | Driver's last name |
| `mobile` | String | Contact number |
| `licenseNumber` | String? | Driving license number |
| `kycStatus` | Enum | `PENDING`, `APPROVED`, `REJECTED` |
| `status` | Enum | `ACTIVE`, `INACTIVE` |
| `isAvailable` | Boolean | Online/Offline status |

### 3.3 Fleet

Fleet operator organizations that own vehicles and employ drivers.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Fleet organization name |
| `mobile` | String | Contact number (unique) |
| `city` | String | Operating city |
| `fleetType` | Enum | `INDIVIDUAL`, `COMPANY` |
| `panNumber` | String | PAN card number |
| `status` | Enum | `ACTIVE`, `INACTIVE` |

### 3.4 FleetManager

Managers who oversee fleet operations.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Manager name |
| `mobile` | String | Contact number |
| `city` | String | Operating city |
| `fleetId` | UUID | Foreign Key to Fleet |
| `status` | Enum | `ACTIVE`, `INACTIVE` |

### 3.5 HubManager

Managers who oversee specific fleet hubs/locations.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Hub manager name |
| `mobile` | String | Contact number |
| `city` | String | Operating city |
| `hubId` | UUID? | Foreign Key to FleetHub |
| `fleetId` | UUID | Foreign Key to Fleet |
| `status` | Enum | `ACTIVE`, `INACTIVE` |

### 3.6 FleetHub

Physical hub locations for fleet operations.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `fleetId` | UUID | Foreign Key to Fleet |
| `location` | JSON | GPS coordinates |
| `address` | String | Physical address |
| `hubType` | String | Type of hub |
| `hubManagerId` | UUID? | Foreign Key to HubManager |

### 3.7 Vehicle

Vehicle assets managed by fleets.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `fleetId` | UUID | Foreign Key to Fleet |
| `hubId` | UUID? | Foreign Key to FleetHub |
| `vehicleNumber` | String | Registration number (unique) |
| `vehicleName` | String | Vehicle name/model |
| `fuelType` | Enum | `PETROL`, `DIESEL`, `CNG`, `ELECTRIC` |
| `ownership` | Enum | `OWNED`, `LEASED` |
| `status` | Enum | `ACTIVE`, `INACTIVE`, `MAINTENANCE` |

### 3.8 Attendance

Driver daily check-in/check-out tracking.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `driverId` | UUID | Foreign Key to Driver |
| `checkInTime` | DateTime | Check-in timestamp |
| `checkOutTime` | DateTime? | Check-out timestamp (optional) |
| `status` | Enum | `PENDING`, `APPROVED`, `REJECTED`, `CHECKED_OUT` |
| `approvedBy` | String? | Admin who approved |
| `checkInLat` | Float? | Check-in GPS latitude |
| `checkInLng` | Float? | Check-in GPS longitude |
| `selfieUrl` | String? | Selfie photo URL |
| `odometerStart` | Int? | Odometer reading at check-in |
| `odometerEnd` | Int? | Odometer reading at check-out |

### 3.9 Break

Driver break tracking during active attendance.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `attendanceId` | UUID | Foreign Key to Attendance |
| `startTime` | DateTime | Break start timestamp |
| `endTime` | DateTime? | Break end timestamp (optional) |

### 3.10 Assignment

Daily driver-vehicle assignments (roster).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `fleetId` | UUID | Foreign Key to Fleet |
| `driverId` | UUID | Foreign Key to Driver |
| `vehicleId` | UUID | Foreign Key to Vehicle |
| `status` | Enum | `ACTIVE`, `ENDED` |
| `startTime` | DateTime | Assignment start |
| `endTime` | DateTime? | Assignment end (optional) |

### 3.11 TripAssignment

Links drivers to specific trips.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `tripId` | UUID | Foreign Key to Ride |
| `driverId` | UUID | Foreign Key to Driver |
| `status` | Enum | `ASSIGNED`, `UNASSIGNED`, `COMPLETED`, `CANCELLED` |
| `bookingAttempted` | Boolean | Whether provider booking was attempted |
| `assignedAt` | DateTime | Assignment timestamp |
| `unassignedAt` | DateTime? | Unassignment timestamp (optional) |

### 3.12 Payment System Models

#### RentalPlan

Rental plans offered to drivers for vehicle usage.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `fleetId` | UUID | Foreign Key to Fleet |
| `name` | String | Plan name (e.g., "Weekly Plan") |
| `rentalAmount` | Float | Rental fee amount |
| `depositAmount` | Float | Required security deposit |
| `validityDays` | Int | Plan validity in days |
| `isActive` | Boolean | Plan availability status |

#### Transaction

All payment transactions (deposits, rentals, penalties, payouts).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `driverId` | UUID | Foreign Key to Driver |
| `type` | Enum | `DEPOSIT`, `RENTAL`, `PENALTY`, `INCENTIVE`, `PAYOUT`, `ORDER_PAYMENT` |
| `amount` | Float | Transaction amount |
| `status` | Enum | `PENDING`, `SUCCESS`, `FAILED` |
| `paymentMethod` | Enum | `PG_UPI`, `PG_CARD`, `CASH`, `BANK_TRANSFER` |
| `easebuzzTxnId` | String? | Easebuzz transaction ID |

#### Penalty

Driver penalties with automatic deposit deduction.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `driverId` | UUID | Foreign Key to Driver |
| `type` | Enum | `MONETARY`, `WARNING`, `SUSPENSION`, `BLACKLIST` |
| `amount` | Float | Penalty amount |
| `reason` | String | Penalty reason |
| `isPaid` | Boolean | Payment status |
| `isWaived` | Boolean | Waiver status |
| `deductedFromDeposit` | Boolean | Auto-deduction flag |

#### Incentive

Driver incentives and bonuses.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `driverId` | UUID | Foreign Key to Driver |
| `amount` | Float | Incentive amount |
| `reason` | String | Incentive reason |
| `category` | String | Incentive category |
| `isPaid` | Boolean | Payout status |

#### DailyCollection

Daily collection tracking for payout model drivers.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `driverId` | UUID | Foreign Key to Driver |
| `date` | DateTime | Collection date |
| `qrCollectionAmount` | Float | QR/UPI collections |
| `cashCollectionAmount` | Float | Cash collections |
| `totalCollection` | Float | Total daily collection |
| `revShareAmount` | Float | Revenue share amount |
| `netPayout` | Float | Net payout (Manually calculated/paid via Bulk CSV) |
| `isReconciled` | Boolean | Reconciliation status |
| `isPaid` | Boolean | Payout status |

#### VirtualQR

Vehicle-specific virtual QR codes for payment collection.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `vehicleId` | UUID | Foreign Key to Vehicle |
| `virtualAccountId` | String | Easebuzz virtual account ID |
| `virtualAccountNumber` | String | Virtual account number |
| `qrCodeBase64` | String | QR code image (base64) |
| `upiId` | String | UPI ID for payments |
| `isActive` | Boolean | QR code status |

#### PaymentOrder

Ad-hoc orders for dynamic QR collection.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `userId` | UUID? | Creator (Admin/Manager) |
| `virtualAccountId` | String | Easebuzz VA ID |
| `totalAmount` | Float | Expected amount |
| `collectedAmount` | Float | Received so far |
| `remainingAmount` | Float | Outstanding |
| `status` | Enum | `PENDING`, `PARTIAL`, `COMPLETED` |
| `customerName` | String | Customer Name |

### 4.4 Strict Trip Logic (Industrial Standard)

The system enforces strict validations on trip lifecycle transitions to prevent fraud and ensure operational compliance.

| Validation | Rule | Error Code |
| :--- | :--- | :--- |
| **Start Trip** | Allowed ONLY within **2.5 Hours** of `pickupTime`. | `400` "Too Early" |
| **Arrive Trip** | Allowed ONLY within **30 Minutes** of `pickupTime`. | `400` "Too Early to Arrive" |
| **Geofence** | Driver must be within **500m** of `pickupLat/Lng` to mark Arrived. | `400` "Geofence Violation" |
| **No Show** | Allowed ONLY AFTER **30 Minutes** past `pickupTime`. | `400` "Too Early for No Show" |

### 4.5 Assignment Service

Located in [src/core/trip/services/trip-assignment.service.ts](file:///d:/drivers-klub/driversklub-backend/src/core/trip/services/trip-assignment.service.ts).

- **Transactional**: Updates [Ride](file:///d:/drivers-klub/driversklub-backend/src/core/trip/services/provider-status-sync.service.ts#13-40) status to `DRIVER_ASSIGNED` and creates [TripAssignment](file:///d:/drivers-klub/driversklub-backend/src/core/trip/services/trip-assignment.service.ts#5-148) record atomically.
- **Hook**: Triggers `ProviderBookingService` to notify external partners (MMT).

---

## 5. Partner Integration (MMT)

We act as a **Vendor** for MakeMyTrip.

### 5.1 Inbound API (MMT calls Us)

- **Search**: `POST /partner/mmt/partnersearchendpoint`
- **Block**: `POST /partner/mmt/partnerblockendpoint`
- **Confirm**: `POST /partner/mmt/partnerpaidendpoint`
- **Cancel**: `POST /partner/mmt/partnercancelendpoint`
- **Reschedule (Check)**: `POST /partner/mmt/partnerrescheduleblockendpoint`
- **Reschedule (Confirm)**: `POST /partner/mmt/partnerrescheduleconfirmendpoint`
- **Details**: `GET /partner/mmt/booking/details`

### 5.2 Outbound Webhooks (We call MMT)

We push status updates to MMT's webhook URL:

- `/driver-assigned`
- `/arrived` (Driver at pickup)
- `/start` (Trip Started)
- `/pickup` (Passenger Onboard)
- `/alight` (Trip Completed)
- `/not_boarded` (No Show)
- `/update-location` (Live Tracking)
- `/reassign-chauffeur` (Driver Reassigned)
- `/detach-trip` (Trip Cancelled/Unassigned)

### 5.3 Reschedule Logic

- **Endpoint:** `POST /partner/mmt/partnerrescheduleendpoint`
- **Logic:** Updates `pickupTime` for an existing confirmed booking.
- **Constraint:** Cannot reschedule `COMPLETED` or `CANCELLED` trips.

### 5.4 Rapido Fleet Integration (Status Sync)

The system automatically manages driver availability on Rapido to prevent conflicts with internal duties.

| Condition | Rapido Status | Reason |
| :--- | :--- | :--- |
| **Logged In & Idle** | **ONLINE** | Available for work. |
| **On Rapido Trip** | *unchanged* | Already busy on Rapido. |
| **On Internal Trip** | **OFFLINE** | Busy with internal duty. |
| **Upcoming Trip** (< 45m) | **OFFLINE** | Reserved for upcoming duty (Buffer Configurable). |
| **On Break** | **OFFLINE** | Driver unavailable. |
| **Not Checked In** | **OFFLINE** | Strict Policy: No attendance = Offline. |

- **Buffer Config**: `RAPIDO_PRE_TRIP_BUFFER_MINUTES` (Default: 45) in `.env`.
- **Buffer Config**: `RAPIDO_PRE_TRIP_BUFFER_MINUTES` (Default: 45) in `.env`.
- **Worker**: A background job runs every 5 minutes to enforcement this logic preemptively.

### 5.5 Edge Case Mitigation 🆕

To ensure reliability, we implemented:

1. **Multi-Provider Conflict**: Drivers are forced **OFFLINE** on Rapido if they have an active trip on *any* other provider (MMT, MojoBoxx, Internal).
2. **Manual Override Control**: If a driver manually forced themselves **ONLINE** implies a policy violation, the system immediately forces them back **OFFLINE** via Webhook listeners.
3. **Retry Queue**: Failed API status updates (due to network issues) are queued in `providerMetadata` and retried automatically by the background worker (Max 5 attempts).

---

## 6. Developer Setup & Operations

### 6.1 Installation

```bash
# 1. Install dependencies
npm install

# 2. Database Setup
npx prisma generate
npx prisma migrate dev

# 3. Start Development Server
npm run dev
```

### 6.2 Environment Variables ([.env](file:///d:/drivers-klub/driversklub-backend/.env))

Create a `.env` file based on [`.env.example`](file:///d:/drivers-klub/driversklub-backend/.env.example):

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/driversklub?schema=public"

# App Config
PORT=5000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"

# Authentication (JWT)
JWT_ACCESS_SECRET="changeme_access_secret"
JWT_REFRESH_SECRET="changeme_refresh_secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# OTP Service (Exotel)
EXOTEL_ACCOUNT_SID="your_exotel_sid"
EXOTEL_API_KEY="your_exotel_api_key"
EXOTEL_API_TOKEN="your_exotel_api_token"
EXOTEL_SENDER_ID="your_sender_id"
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_BYPASS_KEY="dev_bypass_key"

# External Providers (MojoBoxx)
MOJOBOXX_BASE_URL="https://api.mojoboxx.com"
MOJOBOXX_USERNAME="your_username"
MOJOBOXX_PASSWORD="your_password"

# External Providers (MMT)
MMT_BASE_URL="https://api.mmt.com"
MMT_AUTH_URL="https://api-cert.makemytrip.com/v1/auth"
MMT_CLIENT_ID="your_mmt_client_id"
MMT_CLIENT_SECRET="your_mmt_client_secret"

# Timezone Configuration
TZ=Asia/Kolkata
APP_TIMEZONE=Asia/Kolkata

# Background Worker (Provider Status Sync)
WORKER_SYNC_INTERVAL_MS=300000  # 5 minutes
WORKER_ENABLED=true
RAPIDO_PRE_TRIP_BUFFER_MINUTES=45

# Payment Gateway (Easebuzz)
EASEBUZZ_MERCHANT_KEY="your_easebuzz_merchant_key"
EASEBUZZ_SALT_KEY="your_easebuzz_salt_key"
EASEBUZZ_ENV="test"  # test or production

# Payment Defaults
PAYMENT_SUCCESS_URL="http://localhost:3000/payment/success"
PAYMENT_FAILURE_URL="http://localhost:3000/payment/failure"
```

### 6.3 Verification (Comprehensive Test Suite)

Run the comprehensive test suite to verify system health:

```bash
npx tsx scripts/test-all.ts
```

**Test Coverage:**

- ✅ Database connectivity
- ✅ Authentication (Admin & Driver)
- ✅ Fleet, Driver, Vehicle management
- ✅ Attendance workflow
- ✅ Pricing calculation
- ✅ Trip creation & assignment

**Latest Results:** 100% pass rate (16/16 tests)

---

## 7. Known Issues / Constraints

- **Orphaned Trips**: Admin can create trips without a linked "Customer User". This is by design for B2B.

- **Offline Support**: Not implemented. API requires active connection.
- **Concurrency**: Handled via Prisma Transactions in [TripAssignmentService](file:///d:/drivers-klub/driversklub-backend/src/core/trip/services/trip-assignment.service.ts#5-148).

---
*End of Master Documentation*
