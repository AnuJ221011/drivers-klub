## Project Structure for DriversKlub Backend
The DriversKlub backend project is organized into a modular structure to enhance maintainability and scalability. Below is an overview of the main directories and files within the project:

```bash
driversklub-backend/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   │
│   ├── server.ts
│   ├── app.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── constants.ts
│   │
│   ├── utils/
│   │   ├── prisma.ts
│   │   ├── logger.ts
│   │   └── correlationId.ts
│   │
│   ├── middlewares/
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── errorHandler.ts
│   │   └── requestLogger.ts
│   │
│   ├── shared/
│   │   ├── enums/
│   │   │   ├── provider.enum.ts
│   │   │   ├── ride-status.enum.ts
│   │   │   └── user-role.enum.ts
│   │   │
│   │   ├── errors/
│   │   │   ├── api.error.ts
│   │   │   └── provider.error.ts
│   │   │
│   │   └── types/
│   │       └── common.types.ts
│   │
│   ├── core/
│   │   └── trip/
│   │       │
│   │       ├── contracts/
│   │       │   ├── external-provider.contract.ts
│   │       │   ├── fare.contract.ts
│   │       │   └── booking.contract.ts
│   │       │
│   │       ├── entities/
│   │       │   └── trip.entity.ts
│   │       │
│   │       ├── mappers/
│   │       │   └── provider-status.mapper.ts
│   │       │
│   │       ├── repositories/
│   │       │   └── ride-provider-mapping.repo.ts
│   │       │
│   │       ├── services/
│   │       │   ├── trip-allocation.service.ts
│   │       │   ├── ride.service.ts
│   │       │   └── provider-status-sync.service.ts
│   │       │
│   │       └── orchestrator/
│   │           ├── trip.orchestrator.ts
│   │           └── provider.registry.ts
│   │
│   ├── adapters/
│   │   └── providers/
│   │       │
│   │       ├── internal/
│   │       │   ├── internal.adapter.ts
│   │       │   └── internal.types.ts
│   │       │
│   │       └── mojoboxx/
│   │           ├── mojoboxx.adapter.ts
│   │           ├── mojoboxx.client.ts
│   │           ├── mojoboxx.auth.ts
│   │           ├── mojoboxx.mapper.ts
│   │           ├── mojoboxx.types.ts
│   │           └── mojoboxx.errors.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── token.service.ts
│   │   │   └── otp/
│   │   │       ├── otp.service.ts
│   │   │       ├── otp.repository.ts
│   │   │       └── otp.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repo.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── fleets/
│   │   │   ├── fleet.controller.ts
│   │   │   ├── fleet.service.ts
│   │   │   └── fleet.repo.ts
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicle.controller.ts
│   │   │   ├── vehicle.service.ts
│   │   │   └── vehicle.repo.ts
│   │   │
│   │   ├── drivers/
│   │   │   ├── driver.controller.ts
│   │   │   ├── driver.service.ts
│   │   │   └── driver.repo.ts
│   │   │
│   │   └── trips/
│   │       ├── trip.controller.ts
│   │       ├── trip.routes.ts
│   │       └── trip.dto.ts
│   │
│   ├── jobs/
│   │   └── provider-status-sync.job.ts
│   │
│   └── routes.ts
│
├── .env
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```
This structure separates concerns into different directories such as `core` for business logic, `adapters` for external integrations, and `modules` for feature-specific implementations. Each module contains its own controllers, services, and repositories to encapsulate functionality effectively.