# Payment Module - Folder Structure

This directory contains all payment and payout related code for the Driver's Klub backend.

## Directory Structure

```
src/
├── adapters/easebuzz/          # Easebuzz payment gateway integration
│   ├── easebuzz.types.ts       # TypeScript interfaces for Easebuzz API
│   ├── easebuzz.adapter.ts     # Core adapter (PG, Payout, Virtual Account)
│   └── easebuzz.utils.ts       # Hash generation, verification utilities
│
├── core/payment/               # Business logic for payment operations
│   ├── services/
│   │   ├── rental.service.ts           # Rental model logic
│   │   ├── payout.service.ts           # Payout model logic
│   │   ├── collection.service.ts       # Daily collection & reconciliation
│   │   └── transaction.service.ts      # Transaction management
│   ├── repositories/
│   │   ├── rental.repository.ts        # Rental plan & driver rental DB ops
│   │   ├── transaction.repository.ts   # Transaction DB operations
│   │   ├── incentive.repository.ts     # Incentive DB operations
│   │   ├── penalty.repository.ts       # Penalty DB operations
│   │   └── collection.repository.ts    # Daily collection DB operations
│   └── utils/
│       └── payment.calculator.ts       # Revenue share, net payout calculations
│
├── modules/payment/            # API layer for payment endpoints
│   ├── payment.controller.ts   # Driver & Admin payment controllers
│   ├── payment.routes.ts       # Route definitions
│   ├── payment.dto.ts          # Request/response DTOs
│   └── payment.validator.ts    # Input validation
│
└── modules/webhooks/           # Webhook handlers
    ├── easebuzz.webhook.ts     # Easebuzz payment & virtual account webhooks
    └── webhook.routes.ts       # Webhook route definitions
```

## Implementation Order

1. **Phase 1**: Database schema (Prisma migration)
2. **Phase 2**: Easebuzz adapter (`src/adapters/easebuzz/`)
3. **Phase 3**: Core services (`src/core/payment/services/`)
4. **Phase 4**: Repositories (`src/core/payment/repositories/`)
5. **Phase 5**: API controllers (`src/modules/payment/`)
6. **Phase 6**: Webhook handlers (`src/modules/webhooks/`)

## Key Files to Create

### Adapters
- [ ] `easebuzz.types.ts` - API interfaces
- [ ] `easebuzz.adapter.ts` - Payment, Payout, Virtual Account APIs
- [ ] `easebuzz.utils.ts` - Hash generation & verification

### Core Services
- [ ] `rental.service.ts` - Deposit, rental plan activation
- [ ] `payout.service.ts` - Revenue share calculation, payout trigger
- [ ] `collection.service.ts` - Daily collection tracking, reconciliation
- [ ] `transaction.service.ts` - Transaction CRUD, history queries

### Repositories
- [ ] `rental.repository.ts` - RentalPlan, DriverRental operations
- [ ] `transaction.repository.ts` - Transaction operations
- [ ] `incentive.repository.ts` - Incentive operations
- [ ] `penalty.repository.ts` - Penalty operations
- [ ] `collection.repository.ts` - DailyCollection operations

### API Layer
- [ ] `payment.dto.ts` - Request/response types
- [ ] `payment.validator.ts` - Input validation schemas
- [ ] `payment.controller.ts` - Driver & Admin endpoints
- [ ] `payment.routes.ts` - Route configuration

### Webhooks
- [ ] `easebuzz.webhook.ts` - Payment & virtual account webhooks
- [ ] `webhook.routes.ts` - Webhook endpoints

## Environment Variables

Add to `.env`:
```env
# Easebuzz Configuration
EASEBUZZ_MERCHANT_KEY=your-merchant-key
EASEBUZZ_SALT_KEY=your-salt-key
EASEBUZZ_ENV=test
EASEBUZZ_BASE_URL=https://testpay.easebuzz.in

# Payment Configuration
DEFAULT_REV_SHARE_PERCENTAGE=70
MIN_PAYOUT_AMOUNT=100
MAX_TRANSACTION_AMOUNT=100000
```

## Next Steps

1. Review `PAYMENT_SYSTEM_DOCUMENTATION.md` for detailed specifications
2. Run Prisma migration to create database tables
3. Implement Easebuzz adapter
4. Build core services
5. Create API endpoints
6. Test with Easebuzz sandbox
