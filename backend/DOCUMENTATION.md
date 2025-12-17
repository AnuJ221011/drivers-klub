# DriversKlub Backend Documentation

## 1. Project Overview

DriversKlub Backend is a microservices-based application built with **Node.js**, **Express**, and **TypeScript**. It utilizes **Prisma** as an ORM with **PostgreSQL** for data persistence. The system is designed to handle driver management, vehicle assignments, trip coordination, and notifications.

### Architecture
The project follows a microservices architecture managed by a central **API Gateway**.

```mermaid
graph TD
    Client[Client App] --> Gateway[API Gateway :3000]
    Gateway --> Auth[Auth Service :3001]
    Gateway --> Driver[Driver Service :3002]
    Gateway --> Vehicle[Vehicle Service :3003]
    Gateway --> Assignment[Assignment Service :3004]
    Gateway --> Trip[Trip Service :3005]
    Gateway --> Notification[Notification Service :3006]
    
    Auth --> DB[(PostgreSQL)]
    Driver --> DB
    Vehicle --> DB
    Assignment --> DB
    Trip --> DB
    Notification --> Exotel[Exotel API]
    Notification --> DB
```

### Project Flow
1.  **Request Entry**: All client requests hit the **API Gateway** on port 3000.
2.  **Authentication**: The Gateway validates the JWT token (if required) using `verifyToken` middleware.
3.  **Routing**: Validated requests are proxied to the appropriate microservice (e.g., `/api/drivers` -> Driver Service :3002).
4.  **Processing**: The microservice processes the request, interacting with the **PostgreSQL** database via **Prisma** if needed.
5.  **Response**: The service returns the response to the Gateway, which forwards it back to the client.

### Folder Structure
```
driversklub-backend/
├── prisma/                 # Database schema and migrations
├── services/               # Microservices
│   ├── api-gateway/        # Entry point, routing, auth middleware
│   ├── auth-service/       # Login, OTP, JWT generation
│   ├── daily-assignment-service/ # Driver-Vehicle assignment
│   ├── driver-service/     # Driver management
│   ├── notification-service/ # integration with Exotel (SMS/WhatsApp)
│   ├── trip-service/       # Trip booking and management
│   └── vehicle-service/    # Vehicle management
├── shared/                 # Shared utilities (Prisma client, JWT)
├── dist/                   # Compiled JavaScript (after build)
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## 2. Technology Stack

-   **Runtime**: Node.js (v18+ recommended)
-   **Language**: TypeScript
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Authentication**: JWT (JSON Web Tokens)
-   **External APIs**: Exotel (WhatsApp/SMS)

## 3. Prerequisites

Ensure the following are installed on your system or production server:
-   **Node.js**: v18.0.0 or higher
-   **npm**: v9.0.0 or higher
-   **PostgreSQL**: v14.0.0 or higher

## 4. Environment Variables

Create a `.env` file in the root directory. The following variables are required:

### General & Database
```env
DATABASE_URL="postgresql://user:password@localhost:5432/driversklub?schema=public"
JWT_SECRET="your_secure_jwt_secret_key"
```

### Service Ports (Defaults)
```env
GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
DRIVER_SERVICE_PORT=3002
VEHICLE_SERVICE_PORT=3003
ASSIGNMENT_SERVICE_PORT=3004
TRIP_SERVICE_PORT=3005
NOTIFICATION_SERVICE_PORT=3006
```

### External Services (Exotel)
Required for OTP notifications.
```env
EXOTEL_SID="your_exotel_sid"
EXOTEL_TOKEN="your_exotel_token"
EXOTEL_WHATSAPP_NUMBER="your_whatsapp_number"
EXOTEL_SMS_SENDER="your_sms_sender_id"
```

## 5. Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd driversklub-backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Database Setup**:
    Ensure PostgreSQL is running and the database specified in `DATABASE_URL` exists.
    ```bash
    # Run migrations to create tables
    npx prisma migrate deploy

    # Generate Prisma Client
    npx prisma generate
    ```

## 6. Running the Application

### Development
Run all services concurrently with hot-reloading:
```bash
npm run dev
```

### Production Build
1.  **Compile TypeScript**:
    ```bash
    npm run build
    ```
    This will generate JavaScript files in the `dist/` directory.

2.  **Start Services**:
    You can use a process manager like **PM2** to run the services in production.
    ```bash
    # Example PM2 ecosystem.config.js setup recommended
    pm2 start dist/services/api-gateway/index.js --name gateway
    pm2 start dist/services/auth-service/index.js --name auth
    # ... repeat for all services
    ```

## 7. API Reference

All requests should be routed through the API Gateway (Port 3000).
**Base URL**: `http://localhost:3000/api`

### Auth Service
-   `POST /auth/login`: Login with phone number.
-   `POST /auth/verify-otp`: Verify OTP to receive JWT.

### Driver Service (`/api/drivers`)
-   `POST /`: Create a new driver.
-   `GET /`: List all drivers.

### Vehicle Service (`/api/vehicles`)
-   `POST /`: Create a new vehicle.
-   `GET /`: List all vehicles.
-   `POST /assign`: Assign a vehicle to a driver (Permanent/Owner).

### Daily Assignment Service (`/api/assignments`)
-   `POST /`: Assign a vehicle to a driver for the current day.
-   `GET /driver/:driverId`: Get today's assignment for a driver.

### Trip Service (`/api/trips`)
-   `POST /`: Create a new trip (Booking).
-   `POST /allot`: Allot a trip to a driver.
-   `GET /`: List all trips.
-   `PATCH /status`: Update trip status (e.g., ONGOING, COMPLETED).

### Notification Service (`/api/notifications`)
-   `POST /send-otp`: Trigger an OTP via WhatsApp or SMS.

## 8. Database Schema

### Core Models
-   **User**: Admin users (Operations, Managers).
-   **Driver**: Drivers registered in the system.
-   **Vehicle**: Fleet vehicles.
-   **DailyAssignment**: Tracks which driver has which vehicle on a specific date.
-   **Trip**: Booking details, status, and assignment.
-   **TripEvent**: Audit log for trip status changes.
-   **WhatsappOtp**: Temporary storage for OTP verification.

## 9. Development Guidelines

-   **Type Safety**: Always use TypeScript types. Run `npm run check` to verify.
-   **Linting**: Ensure code follows standard practices.
-   **Database Changes**:
    1.  Modify `prisma/schema.prisma`.
    2.  Run `npx prisma migrate dev --name <migration_name>` locally.
    3.  Commit the migration file.

