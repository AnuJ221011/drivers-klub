# Driver's Klub Backend - Microservices Architecture

Production-ready Backend for Driver's Klub Mobility Platform built on modern microservices architecture.

## 🎯 Project Status

**✅ PRODUCTION-READY** - Microservices architecture deployed and running

- ✅ **Microservices Architecture** - 6 independent services + API Gateway
- ✅ **103 API Endpoints** - Fully tested and documented
- ✅ **Scalable Design** - Handles 500-10,000+ concurrent users
- ✅ **Role-Based Access Control** - SUPER_ADMIN, OPERATIONS, MANAGER, DRIVER
- ✅ **Payment System Complete** - Easebuzz integration, InstaCollect, Bulk Payouts
- ✅ **Partner Integrations** - Rapido, MMT, MojoBoxx
- ✅ **Attendance System** - Check-in/out with cash collection tracking
- ✅ **CI/CD Pipeline** - Automated testing and deployment
- ✅ **Multi-Cloud Deployment** - Render (staging) + AWS EB (production)

---

## 🏗️ Architecture Overview

### Microservices

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Port 5000)               │
│              Routes all requests to services             │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐   ┌───────▼────────┐
│  Auth Service  │  │   Driver    │   │    Vehicle     │
│   (Port 3001)  │  │  Service    │   │    Service     │
│                │  │ (Port 3002) │   │  (Port 3003)   │
│ • Login/OTP    │  │ • Drivers   │   │ • Vehicles     │
│ • Users        │  │ • Attendance│   │ • Fleets       │
│ • JWT Tokens   │  │ • Breaks    │   │ • Managers     │
└────────────────┘  └─────────────┘   └────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐   ┌───────▼────────┐
│  Assignment    │  │    Trip     │   │ Notification   │
│   Service      │  │  Service    │   │   Service      │
│ (Port 3004)    │  │ (Port 3005) │   │  (Port 3006)   │
│                │  │             │   │                │
│ • Assignments  │  │ • Trips     │   │ • Alerts       │
│ • Roster       │  │ • Payments  │   │ • Push Notifs  │
│                │  │ • Pricing   │   │                │
│                │  │ • Partners  │   │                │
└────────────────┘  └─────────────┘   └────────────────┘
```

### Service Breakdown

| Service | Port | Endpoints | Responsibility |
|---------|------|-----------|----------------|
| **API Gateway** | 5000 | - | Routes requests, health checks |
| **Auth Service** | 3001 | 8 | Authentication, user management |
| **Driver Service** | 3002 | 20 | Driver profiles, attendance tracking |
| **Vehicle Service** | 3003 | 26 | Vehicles, fleets, fleet managers |
| **Assignment Service** | 3004 | 4 | Driver-vehicle assignments |
| **Trip Service** | 3005 | 44 | Trips, payments, pricing, partners |
| **Notification Service** | 3006 | 1 | Real-time notifications |

**Total: 103 Endpoints**

---

## 📚 Documentation

### Core Documentation

- **[API Reference](./docs/API_REFERENCE.md)** - Complete endpoint documentation
- **[Project Details](./docs/PROJECT_DETAILS.md)** - Architecture & database schema
- **[Payment System](./docs/PAYMENT_SYSTEM_DOCUMENTATION.md)** - Payment workflows

### Team-Specific Guides

- **[Flutter Driver App Guide](./docs/FLUTTER_DRIVER_API_GUIDE.md)** - Mobile integration
- **[React Admin Dashboard Guide](./docs/REACT_ADMIN_API_GUIDE.md)** - Web integration

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 20
PostgreSQL >= 14
npm >= 9
```

### Local Development

```bash
# Clone repository
git clone https://bitbucket.org/respare/driversklub-backend.git
cd driversklub-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run generate -w @driversklub/database

# Run database migrations
npm run migrate -w @driversklub/database

# Start all services
npm run dev
```

**Services will start on:**

- API Gateway: `http://localhost:3000`
- Auth Service: `http://localhost:3001`
- Driver Service: `http://localhost:3002`
- Vehicle Service: `http://localhost:3003`
- Assignment Service: `http://localhost:3004`
- Trip Service: `http://localhost:3005`
- Notification Service: `http://localhost:3006`

### Production Build

```bash
# Build all services
npm run build

# Start production server
npm start
```

---

## 🌐 Deployment

### Staging (Render)

- **URL**: `https://driversklub-backend.onrender.com`
- **Health Check**: `GET /health`
- **Auto-deploy**: On push to `master` branch

### Production (AWS Elastic Beanstalk)

- **Environment**: `driversklub-backend-env`
- **Region**: `ap-south-1` (Mumbai)
- **Deploy**: `eb deploy`

### CI/CD Pipeline (Bitbucket)

```yaml
1. npm ci - Install dependencies
2. npm run build - Build all services
3. npm start & - Start server in background
4. npm run test - Run integration tests
5. Deploy to AWS EB - Automated deployment
```

---

## 🔒 Security Features

- **JWT Authentication** - Access & refresh tokens
- **Role-Based Access Control** - 4 role levels
- **OTP Verification** - Secure phone-based login
- **Rate Limiting** - 100 requests/minute per IP
- **CORS Protection** - Environment-based origins
- **Input Validation** - All endpoints validated

---

## ⚡ Performance & Scalability

### Current Capacity

- **Concurrent Users**: 500-1,000
- **Requests/Second**: 50-200 RPS
- **Response Time**: <200ms (p95)
- **Database Connections**: 60 (6 services × 10 pool)

### Scaling Path

- **Phase 1** (Redis caching): 2,000 users
- **Phase 2** (Multi-instance): 5,000 users
- **Phase 3** (Service separation): 10,000+ users

See [Scalability Plan](./docs/SCALABILITY_PLAN.md) for details.

---

## 📝 Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/driversklub"

# App Config
PORT=3000
NODE_ENV=development

# Authentication
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# OTP Service
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_BYPASS_KEY="dev_bypass_key"

# Payment Gateway (Easebuzz)
EASEBUZZ_MERCHANT_KEY="your-key"
EASEBUZZ_SALT_KEY="your-salt"
EASEBUZZ_ENV="test"

# Partner APIs
RAPIDO_API_KEY="your-rapido-key"
RAPIDO_BASE_URL="https://api.rapido.bike"
MMT_WEBHOOK_URL="https://api.mmt.com/webhook"

# Redis (for scaling)
REDIS_URL="redis://localhost:6379"

# Worker
WORKER_ENABLED=true
WORKER_SYNC_INTERVAL_MS=300000
```

See `.env.example` for complete list.

---

## 🧪 Testing

### Run All Tests

```bash
npm run test
```

### Test Coverage

- ✅ Authentication (OTP, JWT, Refresh)
- ✅ Driver Management (CRUD, Attendance)
- ✅ Vehicle Management (CRUD, Fleet ops)
- ✅ Trip Lifecycle (Create, Assign, Complete)
- ✅ Payment System (Rental, Deposits, Payouts)
- ✅ Partner Integrations (Rapido, MMT)

---

## 🔧 Key Features

### Attendance System

```http
POST /attendance/check-in
{
  "driverId": "uuid",
  "lat": 28.7041,
  "lng": 77.1025,
  "odometer": 1000,
  "selfieUrl": "https://..."
}

POST /attendance/check-out
{
  "driverId": "uuid",
  "odometer": 1250,
  "cashDeposited": 5000  # Amount collected during shift
}
```

**Response includes:**

- Check-in/out times
- Odometer readings
- **Cash deposited** (for admin panel)
- Break durations
- Approval status

### Payment System

- **Rental Plans** - Subscription-based vehicle rental
- **Security Deposits** - Easebuzz integration
- **Bulk Payouts** - CSV upload for mass disbursement
- **InstaCollect Orders** - Ad-hoc payment links
- **Virtual QR Codes** - Per-vehicle payment collection

### Partner Integrations

- **Rapido** - Auto online/offline status sync
- **MakeMyTrip** - Trip booking & management
- **MojoBoxx** - Legacy provider support

---

## 📊 API Endpoints Summary

### Authentication (8 endpoints)

```
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/refresh
POST /auth/logout
GET  /users
POST /users
GET  /users/:id
PATCH /users/:id/deactivate
```

### Driver Management (20 endpoints)

```
POST /drivers
GET  /drivers/fleet/:fleetId
GET  /drivers/me
PATCH /drivers/:id
POST /attendance/check-in
POST /attendance/check-out
POST /attendance/start-break
POST /attendance/end-break
GET  /attendance/history
... (11 more)
```

### Vehicle Management (26 endpoints)

```
POST /vehicles
GET  /vehicles/fleet/:fleetId
PATCH /vehicles/:id
GET  /fleets
POST /fleets
POST /fleets/:id/hubs
GET  /fleet-managers
... (19 more)
```

### Trip Management (44 endpoints)

```
POST /trips
GET  /trips/:id
POST /trips/:id/start
POST /trips/:id/complete
POST /admin/trips/assign
GET  /payments/balance
POST /payments/rental
POST /pricing/preview
POST /webhooks/easebuzz/payment
... (35 more)
```

**See [API Reference](./docs/API_REFERENCE.md) for complete documentation.**

---

## 🛠️ Development

### Project Structure

```
driversklub-backend/
├── apps/
│   ├── api-gateway/          # Routes all requests
│   ├── auth-service/         # Authentication
│   ├── driver-service/       # Drivers & attendance
│   ├── vehicle-service/      # Vehicles & fleets
│   ├── assignment-service/   # Driver-vehicle assignments
│   ├── trip-service/         # Trips, payments, partners
│   └── notification-service/ # Notifications
├── packages/
│   ├── database/             # Prisma schema & client
│   └── common/               # Shared utilities
├── scripts/
│   ├── test-project.ts       # Integration tests
│   └── build-eb-bundle.ts    # AWS deployment bundle
├── bitbucket-pipelines.yml   # CI/CD configuration
└── README.md                 # This file
```

### Adding a New Endpoint

1. Add route in appropriate service
2. Implement controller logic
3. Update API documentation
4. Add integration test
5. Deploy via CI/CD

---

## 🚦 Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# Individual Services
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Driver
curl http://localhost:3003/health  # Vehicle
curl http://localhost:3004/health  # Assignment
curl http://localhost:3005/health  # Trip
curl http://localhost:3006/health  # Notification
```

---

## 📞 Support

- **Technical Issues**: Check [API Reference](./docs/API_REFERENCE.md)
- **Architecture Questions**: See [Project Details](./docs/PROJECT_DETAILS.md)
- **Payment Integration**: Review [Payment System Docs](./docs/PAYMENT_SYSTEM_DOCUMENTATION.md)

---

## 📄 License

Proprietary - Driver's Klub

---

**Status:** ✅ **PRODUCTION-READY** | **Last Updated:** January 12, 2026 | **Version:** 4.0.0 (Microservices)
