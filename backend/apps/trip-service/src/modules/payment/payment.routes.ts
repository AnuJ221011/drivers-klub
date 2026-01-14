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
    getDriverRentalPlans,
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
    uploadBulkPayout,
} from './payment.controller.js';
import {
    createOrder as createOrderCtrl,
    getOrder as getOrderCtrl,
    listOrders as listOrdersCtrl
} from './order.controller.js';
import { authenticate, authorizeRoles } from '@driversklub/common';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
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

// Get available rental plans
router.get('/rental/plans', authorizeRoles('DRIVER'), getDriverRentalPlans);

// ============================================
// ADMIN ROUTES
// ============================================

// Rental Plans
router.post(
    '/admin/rental-plans',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'MANAGER'),
    createRentalPlan
);

router.get(
    '/admin/rental-plans/:fleetId',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'MANAGER'),
    getRentalPlans
);

// Penalties
router.post(
    '/admin/penalty',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    createPenalty
);

router.post(
    '/admin/penalty/:id/waive',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    waivePenalty
);

// Incentives
router.post(
    '/admin/incentive',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    createIncentive
);

router.post(
    '/admin/incentive/:id/payout',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    payoutIncentive
);

// Collections & Payouts
router.post(
    '/admin/collection/:id/reconcile',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'MANAGER'),
    reconcileCollection
);

router.post(
    '/admin/collection/:id/payout',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'MANAGER'),
    processPayout
);

router.get(
    '/admin/reconciliations/pending',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'MANAGER'),
    getPendingReconciliations
);

router.get(
    '/admin/payouts/pending',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'MANAGER'),
    getPendingPayouts
);

// Bulk Payout Upload
router.post(
    '/admin/bulk-payout',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'MANAGER'),
    upload.single('file'),
    uploadBulkPayout
);

// Virtual QR
router.post(
    '/admin/vehicle/:id/qr',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    generateVehicleQR
);

router.get(
    '/admin/vehicle/:id/qr',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    getVehicleQR
);

// ============================================
// ORDER ROUTES (InstaCollect)
// ============================================

router.post(
    '/orders',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    createOrderCtrl
);

router.get(
    '/orders/:id',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    getOrderCtrl
);

router.get(
    '/orders',
    authorizeRoles('SUPER_ADMIN', 'FLEET_ADMIN', 'OPERATIONS', 'MANAGER'),
    listOrdersCtrl
);

export default router;
