import { Router } from 'express';
import {
    // Driver endpoints
    getBalance,
    getTransactions,
    getIncentives,
    getPenalties,
    getCollections,
    initiateDeposit,
    initiateRental,
    // Admin endpoints
    createRentalPlan,
    getRentalPlans,
    createPenalty,
    waivePenalty,
    createIncentive,
    payoutIncentive,
    reconcileCollection,
    processPayout,
    getPendingReconciliations,
    getPendingPayouts,
    generateVehicleQR,
    getVehicleQR,
} from './payment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorizeRoles } from '../../middlewares/authorize.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// DRIVER ROUTES
// ============================================

// Get balance & rental status
router.get('/balance', authorizeRoles('DRIVER'), getBalance);

// Get transactions
router.get('/transactions', authorizeRoles('DRIVER'), getTransactions);

// Get incentives
router.get('/incentives', authorizeRoles('DRIVER'), getIncentives);

// Get penalties
router.get('/penalties', authorizeRoles('DRIVER'), getPenalties);

// Get daily collections (payout model)
router.get('/collections', authorizeRoles('DRIVER'), getCollections);

// Initiate deposit payment
router.post('/deposit', authorizeRoles('DRIVER'), initiateDeposit);

// Initiate rental payment
router.post('/rental', authorizeRoles('DRIVER'), initiateRental);

// ============================================
// ADMIN ROUTES
// ============================================

// Rental Plans
router.post(
    '/admin/rental-plans',
    authorizeRoles('SUPER_ADMIN', 'MANAGER'),
    createRentalPlan
);

router.get(
    '/admin/rental-plans/:fleetId',
    authorizeRoles('SUPER_ADMIN', 'MANAGER'),
    getRentalPlans
);

// Penalties
router.post(
    '/admin/penalty',
    authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'),
    createPenalty
);

router.post(
    '/admin/penalty/:id/waive',
    authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'),
    waivePenalty
);

// Incentives
router.post(
    '/admin/incentive',
    authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'),
    createIncentive
);

router.post(
    '/admin/incentive/:id/payout',
    authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'),
    payoutIncentive
);

// Collections & Payouts
router.post(
    '/admin/collection/:id/reconcile',
    authorizeRoles('SUPER_ADMIN', 'MANAGER'),
    reconcileCollection
);

router.post(
    '/admin/collection/:id/payout',
    authorizeRoles('SUPER_ADMIN', 'MANAGER'),
    processPayout
);

router.get(
    '/admin/reconciliations/pending',
    authorizeRoles('SUPER_ADMIN', 'MANAGER'),
    getPendingReconciliations
);

router.get(
    '/admin/payouts/pending',
    authorizeRoles('SUPER_ADMIN', 'MANAGER'),
    getPendingPayouts
);

// Virtual QR
router.post(
    '/admin/vehicle/:id/qr',
    authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'),
    generateVehicleQR
);

router.get(
    '/admin/vehicle/:id/qr',
    authorizeRoles('SUPER_ADMIN', 'OPERATIONS', 'MANAGER'),
    getVehicleQR
);

export default router;
