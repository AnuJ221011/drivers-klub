# 📘 Driver's Klub Backend - Production Documentation

**Version:** 1.0.0
**Date:** December 2024
**Authors:** Driver's Klub Engineering Team

---

# 📑 Table of Contents

1.  [Executive Summary](#1-executive-summary)
2.  [System Architecture](#2-system-architecture)
3.  [Technology Stack](#3-technology-stack)
4.  [Directory Structure & Codebase Navigation](#4-directory-structure--codebase-navigation)
5.  [Database Schema & Data Models](#5-database-schema--data-models)
6.  [Core Business Flows](#6-core-business-flows)
7.  [API Reference (Postman Style)](#7-api-reference-postman-style)
8.  [Setup, Testing & Operations](#8-setup-testing--operations)

---

# 1. Executive Summary

The **Driver's Klub Backend** is a mission-critical logistics platform designed to manage the end-to-end lifecycle of inter-city and intra-city electric cab services. It acts as the central nervous system connecting:

*   **Fleets**: Companies or individuals owning vehicles.
*   **Drivers**: The workforce operating the vehicles.
*   **Customers**: End-users booking rides via mobile apps.
*   **Aggregators**: External demand sources like MakeMyTrip (MMT) and MojoBoxx.

The system is engineered for **high availability**, **strict consistency** (acid-compliant), and **real-time orchestration** between internal fleets and external fulfillment providers.

Key Capabilities:
*   **Hybrid Fulfillment**: Automatically routes bookings to internal drivers or external providers (MojoBoxx) based on availability.
*   **Compliance-First**: Enforces strict constraints (T-1 Booking, KYC validation, Vehicle Fitness).
*   **Dynamic Pricing**: Rule-based pricing engine supporting multipliers for Airport/Rental/Outstation trips.
*   **Granular RBAC**: Role-Based Access Control for Super Admins, Ops, Managers, and Drivers.

---

# 2. System Architecture

The application follows a **Modular Monolithic Architecture** with a clear separation of concerns, designed to be broken into microservices if scaling demands.

### High-Level Components

```mermaid
graph TD
    Client[Mobile App / Web Dashboard] --> LB[Load Balancer]
    LB --> API[Express.js API Gateway]
    
    subgraph "Core Domain Layer"
        API --> Auth[Auth Module]
        API --> Trip[Trip Engine]
        API --> Ops[Ops Module]
    end
    
    subgraph "Orchestration Layer"
        Trip --> Alloc[Allocation Service]
        Alloc --> Inte[Internal Fleet]
        Alloc --> Ext[External Provider Adapter]
    end
    
    subgraph "Data Persistence"
        Trip --> DB[(PostgreSQL)]
        Auth --> DB
    end
    
    subgraph "External Integrations"
        Ext --> Mojo[MojoBoxx API]
        Ext --> MMT[MakeMyTrip API]
        Auth --> Exotel[Exotel SMS]
    end
```

### Data Flow Pattern
1.  **Request Entry**: All requests hit `src/app.ts` and are routed via `src/modules/*`.
2.  **Validation**: Joi/Zod schemas validate inputs at the controller level.
3.  **Service Layer**: Business logic resides in `*.service.ts` files inside modules or `src/core`.
4.  **Orchestration**: Complex flows (like Booking) use `TripOrchestrator` to coordinate between Database, Pricing Engine, and External Adapters.
5.  **Persistence**: `Prisma Client` performs ACID transactions against PostgreSQL.

---

# 3. Technology Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | v18+ | Event-driven Javascript Runtime |
| **Language** | TypeScript | v5.x | Static Typing & Interface Contracts |
| **Framework** | Express.js | v4.x | HTTP Server & Routing |
| **Database** | PostgreSQL | v14+ | Relational Data Store |
| **ORM** | Prisma | v5.x | Type-safe Database Access |
| **Validation** | Joi | v17+ | Schema Validation |
| **Auth** | JWT | -- | Stateless Authentication |
| **Logging** | Morgan/Winston | -- | Observability |
| **Testing** | TSX / Dredd | -- | Integration & Contract Testing |

---

# 4. Directory Structure & Codebase Navigation

The project follows a **Domain-Driven Design (DDD)** inspired folder structure.

```text
d:\drivers-klub\driversklub-backend\
├── prisma\                     # 🗄️ Database
│   └── schema.prisma           # The Single Source of Truth for Data Models
├── scripts\                    # 🛠️ Utility Scripts
│   └── test-api-flow.ts        # Comprehensive Integration Test Suite
├── src\                        # 📦 Application Source Code
│   ├── adapters\               # 🔌 External System Connectors
│   │   └── providers\          # Ride Fulfillment Providers
│   │       ├── internal\       # Logic for Internal Fleet (Drivers/Cars)
│   │       ├── mojoboxx\       # Integration with MojoBoxx API
│   │       └── mmt\            # Integration with MakeMyTrip API
│   ├── config\                 # ⚙️ Configuration (Env vars, Constants)
│   ├── core\                   # 🧠 Core Business Logic (The "Brain")
│   │   ├── constraints\        # Validation Rules (e.g., T-1 booking)
│   │   ├── pricing\            # Dynamic Pricing Engine
│   │   └── trip\               
│   │       ├── orchestrator\   # TripOrchestrator (Provider Selection)
│   │       ├── contracts\      # Interfaces (ExternalRideProvider, Booking)
│   │       └── services\       # Shared Domain Services
│   ├── middlewares\            # 🛡️ HTTP Middleware
│   │   ├── auth.middleware.ts  # JWT Verification & Role Checks
│   │   └── error.middleware.ts # Global Error Handling
│   ├── modules\                # 🧱 Feature Modules (REST Resources)
│   │   ├── auth\               # Login / OTP / Token mgmt
│   │   ├── drivers\            # Driver Profiling & KYC
│   │   ├── fleets\             # Fleet Owner Management
│   │   ├── trips\              # Trip Lifecycle Endpoints
│   │   ├── users\              # Admin/Staff Management
│   │   └── vehicles\           # Vehicle Inventory
│   ├── shared\                 # ♻️ Shared Utilities (Enums, Constants)
│   ├── utils\                  # 🔧 Helper Functions
│   │   └── prisma.ts           # Singleton DB connection
│   ├── app.ts                  # 🚦 Express App Setup (Routes/Middlewares)
│   └── server.ts               # 🚀 Entry Point (Port Listening)
├── .env                        # 🔐 Environment Variables
├── openapi.yaml                # 📜 Master API Specification
├── package.json                # 📦 Dependencies
└── tsconfig.json               # 📐 TypeScript Config
```

---

# 5. Database Schema & Data Models

The database is designed in **Third Normal Form (3NF)** to ensure data integrity.

### Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| Driver : "has profile"
    User ||--o{ RefreshToken : "has"
    
    Fleet ||--o{ Vehicle : "owns"
    Fleet ||--o{ Driver : "manages"
    Fleet ||--o{ FleetManager : "employs"
    
    Driver ||--o{ Assignment : "assigned to"
    Vehicle ||--o{ Assignment : "assigned to"
    
    Assignment ||--o{ Trip : "fulfills"
    
    Trip ||--o| RideProviderMapping : "has external meta"
    Trip }|--|{ TripAssignment : "audit logs"

    User {
        uuid id
        string phone
        enum role
    }
    Fleet {
        uuid id
        string name
        string gstNumber
    }
    Driver {
        uuid id
        string license
        boolean isAvailable
    }
    Vehicle {
        uuid id
        string number
        enum status
    }
    Trip {
        uuid id
        string origin
        string destination
        datetime pickupTime
        float price
        enum status
    }
```

### Core Models

#### 1. `User` & `Auth`
The central identity entity.
*   **User**: Stores login creds (phone) and Role (`SUPER_ADMIN`, `DRIVER`, etc.).
*   **Otp**: Ephemeral storage for SMS OTP codes.
*   **RefreshToken**: Long-lived tokens for session persistence.

#### 2. `Fleet` Hierarchy
Represents the supply side.
*   **Fleet**: The parent organization (e.g., "Sharma Travels").
*   **FleetManager**: Staff managing the fleet.
*   **Vehicle**: Asset ownership (`Electric`, `Sedan`, etc.).
*   **Driver**: The service provider. Linked to a primary Fleet.

#### 3. `Operations`
*   **Assignment**: Represents a persistent link between a `Driver` and a `Vehicle` for a shift. A driver *cannot* take a trip unless they have an Active Assignment.

#### 4. `Trip` / `Ride`
The core transactional entity.
*   **Ride (Trip)**: The booking request from a customer.
*   **RideProviderMapping**: Links the internal `Ride` ID to an external system's ID (e.g., MojoBoxx Booking ID) for tracking and sync.
*   **TripAssignment**: An audit log of which driver attempted or completed the trip.

---

# 6. Core Business Flows

Understanding the sequence of operations is vital for debugging and extending the system.

### 6.1 Authentication Flow (OTP)

The system uses a passwordless, OTP-first authentication mechanism.

```mermaid
sequenceDiagram
    participant User
    participant API as API Gateway
    participant Auth as Auth Service
    participant Exotel as SMS Provider
    participant DB as Database

    User->>API: POST /auth/send-otp {phone: "+91..."}
    API->>Auth: Request OTP Generation
    Auth->>DB: Create OTP Record (expires 10m)
    Auth->>Exotel: Send SMS via API
    Exotel-->>User: Delivers "123456"
    API-->>User: 200 OK (OTP Sent)

    User->>API: POST /auth/verify-otp {phone, otp: "123456"}
    API->>Auth: Validate OTP
    Auth->>DB: Fetch & Disable OTP
    Auth->>DB: Find/Create User
    Auth->>API: Generate JWT (Access + Refresh)
    API-->>User: 200 OK {accessToken, user}
```

### 6.2 Trip Creation & Orchestration

This is the most complex flow, involving the `TripOrchestrator`.

```mermaid
sequenceDiagram
    participant Client
    participant Controller as TripController
    participant Orch as TripOrchestrator
    participant Alloc as AllocationService
    participant Prov as ProviderAdapter
    participant DB

    Client->>Controller: POST /trips {origin, date, car...}
    Controller->>Orch: createTrip(payload)
    
    rect rgb(240, 240, 240)
        Note right of Orch: 1. Decision Phase
        Orch->>Alloc: decideProvider()
        Alloc-->>Orch: Returns "MOJOBOXX" or "INTERNAL"
    end

    rect rgb(230, 245, 255)
        Note right of Orch: 2. Execution Phase
        Orch->>Prov: prebook(payload)
        Prov-->>Orch: { externalId: "MB-123", status: "CONFIRMED" }
    end

    rect rgb(230, 255, 235)
        Note right of Orch: 3. Persistence Phase
        Orch->>DB: Create Ride (Internal)
        Orch->>DB: Create RideProviderMapping
    end

    Orch-->>Controller: Return Ride + Meta
    Controller-->>Client: 201 Created
```

### 6.3 Driver Assignment (Manual Dispatch)

Used when `ProviderType = INTERNAL`.

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant DB
    participant DriverApp

    Admin->>API: POST /trips/:id/assign {driverId}
    API->>DB: Create TripAssignment
    API->>DB: Update Trip Status -> "DRIVER_ASSIGNED"
    API->>DriverApp: Send Notification (FCM/Socket)
    
    DriverApp->>API: POST /trips/:id/start
    API->>DB: Update Status -> "STARTED"
    
    DriverApp->>API: POST /trips/:id/complete
    API->>DB: Update Status -> "COMPLETED"
```

---

# 7. API Reference (Postman Style)

## 🔐 Authentication Module

### 1. Send OTP
*   **Method**: `POST`
*   **URL**: `/auth/send-otp`
*   **Description**: Triggers an OTP SMS. Rate limited to 3/10min.

**Request Body**
```json
{
  "phone": "+919999999999",
  "role": "DRIVER" // Optional
}
```

**Response (200 OK)**
```json
{
  "message": "OTP sent successfully"
}
```

### 2. Verify OTP (Login)
*   **Method**: `POST`
*   **URL**: `/auth/verify-otp`
*   **Description**: Exchanges OTP for long-lived credentials.

**Request Body**
```json
{
  "phone": "+919999999999",
  "otp": "123456"
}
```

**Response (200 OK)**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "d742b0...",
  "user": {
    "id": "uuid",
    "name": "Aditya",
    "role": "DRIVER"
  }
}
```

## 👤 User Management Module

### 1. Create User (Admin)
*   **Method**: `POST`
*   **URL**: `/users`
*   **Auth**: Bearer Token (Admin only)

**Request Body**
```json
{
  "name": "Operations Manager",
  "phone": "+918888888888",
  "role": "OPERATIONS"
}
```

**Response (201 Created)**
```json
{
  "id": "uuid",
  "name": "Operations Manager",
  "phone": "+918888888888",
  "role": "OPERATIONS",
  "isActive": true
}
```

### 2. Get User Details
*   **Method**: `GET`
*   **URL**: `/users/{id}`
*   **Auth**: Bearer Token

**Response (200 OK)**
```json
{
  "id": "uuid",
  "name": "Aditya",
  "phone": "+919999999999",
  "role": "DRIVER",
  "isActive": true,
  "createdAt": "2024-12-22T10:00:00Z"
}
```

## 🏎️ Driver Module

### 1. Create Driver
*   **Method**: `POST`

**Request Body**
```json
{
  "firstName": "Ramesh",
  "lastName": "Kumar",
  "mobile": "+919999988888",
  "licenseNumber": "DL1420110012345",
  "fleetId": "uuid-fleet"
}
```

### 2. Get Driver
*   **Method**: `GET`
*   **URL**: `/drivers/{id}`

## 🏢 Fleet Module

### 1. Create Fleet
*   **Method**: `POST`

**Request Body**
```json
{
  "name": "Sharma Travels",
  "city": "Delhi",
  "mobile": "+911122334455",
  "panNumber": "ABCDE1234F"
}
```

### 2. Get Fleet
*   **Method**: `GET`
*   **URL**: `/fleets/{id}`

## 🚕 Vehicle Module

### 1. Add Vehicle
*   **Method**: `POST`

**Request Body**
```json
{
  "vehicleNumber": "DL01CAB1234",
  "vehicleName": "Tata Tigor EV",
  "vehicleModel": "2023",
  "fleetId": "uuid-fleet",
  "fuelType": "ELECTRIC",
  "ownership": "OWNED"
}
```

### 2. Get Vehicle
*   **Method**: `GET`
*   **URL**: `/vehicles/{id}`

---

## 🛣️ Trip Lifecycle Module

### 1. Create Trip (Book Ride)
*   **Method**: `POST`
*   **URL**: `/trips`
*   **Description**: Core booking endpoint. Validates T-1 logic and Pricing.

**Request Body**
```json
{
  "tripType": "AIRPORT",
  "originCity": "GURGAON",
  "destinationCity": "AIRPORT T3",
  "tripDate": "2024-12-25T10:00:00Z",
  "distanceKm": 45.5,
  "vehicleSku": "TATA_TIGOR_EV"
}
```

**Response (201 Created)**
```json
{
  "id": "uuid",
  "status": "CREATED",
  "price": 1250.00,
  "provider": "INTERNAL" // or MOJOBOXX
}
```

### 2. Get Trip Details
*   **Method**: `GET`
*   **URL**: `/trips/{id}`

### 3. Start Trip (Driver)
*   **Method**: `POST`
*   **URL**: `/trips/{id}/start`
*   **Description**: Driver confirms pickup. Status -> `STARTED`.

### 4. Complete Trip (Driver)
*   **Method**: `POST`
*   **URL**: `/trips/{id}/complete`
*   **Description**: Ride finished. Status -> `COMPLETED`. Triggers billing.

### 5. Track Trip
*   **Method**: `GET`
*   **URL**: `/trips/{id}/tracking`
*   **Response**: `{ data: { live: { lat, lng } } }`

---

## 📡 Dispatch & Provider Module

### 1. Manual Assign (Dispatcher)
*   **Method**: `POST`
*   **URL**: `/trips/{id}/assign`

**Request Body**
```json
{
  "driverId": "uuid-driver"
}
```

### 2. Force Provider Booking
*   **Method**: `POST`
*   **URL**: `/providers/{tripId}/book`
*   **Description**: Manually triggers external API sync.

### 3. Sync Provider Status
*   **Method**: `GET`
*   **URL**: `/providers/{tripId}/sync`

---

## 🛠️ Operations & Safety Module

### 1. List Stuck Trips
*   **Method**: `GET`
*   **URL**: `/ops/trips/stuck`
*   **Description**: Returns trips stuck in `STARTED` > 24 hours.

### 2. Emergency Override
*   **Method**: `POST`
*   **URL**: `/ops/trips/{id}/override-status`

**Request Body**
```json
{
  "status": "COMPLETED"
}
```

---

# 8. Setup, Testing & Operations

## 🔧 Environment Setup

Create a `.env` file in the root:

```env
PORT=5000
DATABASE_URL="postgresql://user:pass@localhost:5432/driversklub"
JWT_SECRET="super_secret_key"
EXOTEL_API_KEY="xxx"
EXOTEL_API_TOKEN="xxx"
EXOTEL_SUBDOMAIN="api.exotel.com"
MOJOBOXX_API_URL="https://api.mojoboxx.com"
MOJOBOXX_API_KEY="xxx"
```

## 🧪 Testing

We use a custom integration test suite that simulates real-world flows.

### Running the Seeded Smoke Test
This script seeds an Admin, Driver, Fleet, and Customer, then runs a full trip lifecycle.

```bash
# 1. Start Server
npm run dev

# 2. Run Test Script
npx tsx scripts/test-api-flow.ts
```

### Dredd Contract Testing
Validates `openapi.yaml` against the running server.

```bash
npx dredd openapi.yaml http://localhost:5000 --hooks-worker-handler-host=127.0.0.1
```

## 🚀 Deployment

The app is containerized using Docker.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

**Build & Run:**
```bash
docker build -t drivers-klub-backend .
docker run -p 5000:5000 --env-file .env drivers-klub-backend
```
