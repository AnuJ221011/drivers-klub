# 🏗️ Microservices Migration Plan for Drivers Klub

This document outlines the roadmap, architectural requirements, and structural changes needed to transition from the current monolithic architecture to a scalable microservices ecosystem.

## 1. Service Boundaries (Domain Decomposition)

Based on your current modules, we will split the application into **4 Core Services**. Each service will have its own database and deployable unit.

| Service Name | Responsibilities | Modules Included | Database |
| :--- | :--- | :--- | :--- |
| **Identity Service** | Authentication, User Management, RBAC | `auth`, `users` | `db_identity` |
| **Fleet Service** | Fleet onboarding, Managers, Vehicle Inventory | `fleets`, `fleetManagers`, `vehicles` | `db_fleet` |
| **Partner Service** | Driver profiles, KYC, Compliance | `drivers` | `db_partner` |
| **Trip Service** | Shifts (Assignments), Trip booking, Fare calculation | `assignments`, `trips` | `db_trip` |

> **Note**: An **API Gateway** will act as the single entry point, routing requests to these internal services.

---

## 2. Infrastructure Requirements

To run this architecture, you will need to introduce new infrastructure components:

### A. Core Tech Stack
- **Monorepo Tooling**: [TurboRepo](https://turbo.build/) or [Nx](https://nx.dev/) (to manage multiple apps in one repo).
- **Inter-Service Communication**:
  - **Synchronous**: HTTP (REST) or gRPC (for high performance).
  - **Asynchronous**: RabbitMQ or Kafka (for events like `TripCompleted` -> `UpdateDriverWallet`).
- **Database**:
  - Separate PostgreSQL instances (or separate logical databases within one cluster) for EACH service.
  - **Redis**: For caching and session management.

### B. DevOps & Deployment
- **Docker**: Dockerfile for each service.
- **Orchestration**: Kubernetes (K8s) or Docker Swarm.
- **API Gateway**: Kong, Nginx, or Traefik.

---

## 3. Proposed Folder Structure (Monorepo)

Moving to a `packages/` based monorepo structure is recommended.

```text
drivers-klub-backend/
├── apps/                          # Deployable Services
│   ├── api-gateway/               # Entry point (Express/Fastify gateway)
│   ├── identity-service/          # Auth & Users
│   │   ├── src/
│   │   ├── prisma/                # Own schema
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── fleet-service/             # Fleets & Vehicles
│   ├── partner-service/           # Drivers
│   └── trip-service/              # Assignments & Trips
│
├── packages/                      # Shared Code
│   ├── database/                  # Shared Prisma client generator (optional)
│   ├── common-types/              # Shared TypesScript interfaces (DTOs)
│   ├── logger/                    # Standardized Winston logger
│   └── events/                    # Shared event definitions
│
├── docker-compose.yml             # Local dev setup
├── package.json                   # Root package manager
└── turbo.json                     # Monorepo build config
```

---

## 4. Key Code Changes Required

### A. Database Decoupling
*   **Current**: `Driver` entity has a foreign key to `User`.
*   **New**: `Driver` table in *Partner Service* has a `userId` string column, but **NO foreign key constraint** to the `User` table (because it's in a different DB).
*   **Implication**: You must handle referential integrity manually or via distributed transactions (Saga pattern).

### B. Authentication
*   **Gateway**: The API Gateway will handle JWT verification. It will forward the `userId` and `role` in headers to downstream services.
*   **Services**: Services trust the gateway and don't re-verify JWTs (or verify only signature).

### C. Communication Example (Trip Creation)
1.  **Frontend** calls `POST /trips` -> **API Gateway**.
2.  **Gateway** routes to **Trip Service**.
3.  **Trip Service** needs to know if the Driver is valid.
    *   *Option A (Sync)*: Call `GET /drivers/:id` on **Partner Service**.
    *   *Option B (Async)*: **Partner Service** publishes `DriverUpdated` events. **Trip Service** keeps a local read-model replicate of valid drivers.

---

## 5. Migration Steps

1.  **Setup Monorepo**: Initialize TurboRepo.
2.  **Extract Shared Utils**: Move `logger`, `ApiError`, and shared request types to `packages/`.
3.  **Migrate Identity**: Move `auth` and `users` to `apps/identity-service`. Setup its database.
4.  **Migrate Fleet**: Move `fleets`, `vehicles` to `apps/fleet-service`.
5.  **Implement Gateway**: create a simple proxy to route `/auth` -> Identity, `/fleets` -> Fleet.
6.  **Verify**: Test end-to-end flow.
