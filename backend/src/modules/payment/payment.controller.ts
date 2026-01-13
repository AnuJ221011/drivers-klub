import type { Request, Response } from 'express';
import { rentalService } from '../../core/payment/rental.service.js';
import { payoutService } from '../../core/payment/payout.service.js';
import { penaltyService } from '../../core/payment/penalty.service.js';
import { incentiveService } from '../../core/payment/incentive.service.js';
import { virtualQRService } from '../../core/payment/virtualqr.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { PenaltyType } from '@prisma/client';
import { prisma } from '../../utils/prisma.js';
import { ApiError } from '../../utils/apiError.js';

async function assertFleetAccess(req: Request, fleetId: string) {
    const role = req.user?.role;
    if (!role) throw new ApiError(401, 'Unauthorized');
    if (role === 'SUPER_ADMIN') return;
    const userFleetId = req.user?.fleetId;
    if (!userFleetId) throw new ApiError(403, 'User is not scoped to a fleet');
    if (userFleetId !== fleetId) throw new ApiError(403, 'Access denied');
}

async function assertDriverAccess(req: Request, driverId: string, opts?: { hubScoped?: boolean }) {
    const role = req.user?.role;
    if (!role) throw new ApiError(401, 'Unauthorized');
    if (role === 'SUPER_ADMIN') return;

    const userFleetId = req.user?.fleetId;
    const hubIds = req.user?.hubIds || [];
    if (!userFleetId) throw new ApiError(403, 'User is not scoped to a fleet');

    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { fleetId: true, hubId: true },
    });
    if (!driver) throw new ApiError(404, 'Driver not found');
    if (driver.fleetId !== userFleetId) throw new ApiError(403, 'Access denied');

    if (opts?.hubScoped && role === 'OPERATIONS') {
        if (driver.hubId && !hubIds.includes(driver.hubId)) throw new ApiError(403, 'Access denied');
    }
}

async function assertVehicleAccess(req: Request, vehicleId: string, opts?: { hubScoped?: boolean }) {
    const role = req.user?.role;
    if (!role) throw new ApiError(401, 'Unauthorized');
    if (role === 'SUPER_ADMIN') return;

    const userFleetId = req.user?.fleetId;
    const hubIds = req.user?.hubIds || [];
    if (!userFleetId) throw new ApiError(403, 'User is not scoped to a fleet');

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { fleetId: true, hubId: true },
    });
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    if (vehicle.fleetId !== userFleetId) throw new ApiError(403, 'Access denied');

    if (opts?.hubScoped && role === 'OPERATIONS') {
        if (vehicle.hubId && !hubIds.includes(vehicle.hubId)) throw new ApiError(403, 'Access denied');
    }
}

// ============================================
// DRIVER ENDPOINTS
// ============================================

/**
 * Get driver balance & rental status
 * GET /payment/balance
 */
export const getBalance = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const status = await rentalService.getDriverRentalStatus(driver.id);
    ApiResponse.send(res, 200, status, 'Balance retrieved successfully');
};

/**
 * Get driver transactions
 * GET /payment/transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { driverId: driver.id };
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.count({ where }),
    ]);

    ApiResponse.send(
        res,
        200,
        {
            transactions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        },
        'Transactions retrieved successfully'
    );
};

/**
 * Get driver incentives
 * GET /payment/incentives
 */
export const getIncentives = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { isPaid } = req.query;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const incentives = await incentiveService.getDriverIncentives(
        driver.id,
        isPaid !== undefined ? isPaid === 'true' : undefined
    );

    const summary = await incentiveService.getIncentiveSummary(driver.id);

    ApiResponse.send(
        res,
        200,
        { incentives, summary },
        'Incentives retrieved successfully'
    );
};

/**
 * Get driver penalties
 * GET /payment/penalties
 */
export const getPenalties = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { type, isPaid, isWaived } = req.query;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const penalties = await penaltyService.getDriverPenalties(driver.id, {
        type: type as PenaltyType,
        isPaid: isPaid !== undefined ? isPaid === 'true' : undefined,
        isWaived: isWaived !== undefined ? isWaived === 'true' : undefined,
    });

    ApiResponse.send(res, 200, penalties, 'Penalties retrieved successfully');
};

/**
 * Get driver daily collections (for payout model)
 * GET /payment/collections
 */
export const getCollections = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { startDate, endDate, isReconciled, isPaid } = req.query;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const collections = await payoutService.getDriverCollections(driver.id, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        isReconciled: isReconciled !== undefined ? isReconciled === 'true' : undefined,
        isPaid: isPaid !== undefined ? isPaid === 'true' : undefined,
    });

    const summary = await payoutService.getDriverPayoutSummary(
        driver.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
    );

    ApiResponse.send(
        res,
        200,
        { collections, summary },
        'Collections retrieved successfully'
    );
};

/**
 * Initiate deposit payment
 * POST /payment/deposit
 */
export const initiateDeposit = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { amount } = req.body;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const payment = await rentalService.initiateDepositPayment({
        driverId: driver.id,
        amount: Number(amount),
    });

    ApiResponse.send(res, 200, payment, 'Deposit payment initiated');
};

/**
 * Initiate rental payment
 * POST /payment/rental
 */
export const initiateRental = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { rentalPlanId } = req.body;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const payment = await rentalService.initiateRentalPayment({
        driverId: driver.id,
        rentalPlanId,
    });

    ApiResponse.send(res, 200, payment, 'Rental payment initiated');
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Create rental plan
 * POST /admin/payment/rental-plans
 */
export const createRentalPlan = async (req: Request, res: Response) => {
    const { fleetId, name, rentalAmount, depositAmount, validityDays } = req.body;
    await assertFleetAccess(req, String(fleetId));

    const plan = await rentalService.createRentalPlan({
        fleetId,
        name,
        rentalAmount: Number(rentalAmount),
        depositAmount: Number(depositAmount),
        validityDays: Number(validityDays),
    });

    ApiResponse.send(res, 201, plan, 'Rental plan created successfully');
};

/**
 * Get rental plans
 * GET /admin/payment/rental-plans/:fleetId
 */
export const getRentalPlans = async (req: Request, res: Response) => {
    const { fleetId } = req.params;
    const { activeOnly = 'true' } = req.query;
    await assertFleetAccess(req, String(fleetId));

    const plans = await rentalService.getRentalPlans(fleetId, activeOnly === 'true');

    ApiResponse.send(res, 200, plans, 'Rental plans retrieved successfully');
};

/**
 * Create penalty
 * POST /admin/payment/penalty
 */
export const createPenalty = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const {
        driverId,
        type,
        amount,
        reason,
        category,
        suspensionStartDate,
        suspensionEndDate,
    } = req.body;

    // Scope:
    // - MANAGER: fleet-only
    // - OPERATIONS: hub-only (for penalties/incentives/vehicle-qr)
    await assertDriverAccess(req, String(driverId), { hubScoped: true });

    const penalty = await penaltyService.createPenalty({
        driverId,
        type,
        amount: amount ? Number(amount) : undefined,
        reason,
        category,
        createdBy: userId,
        suspensionStartDate: suspensionStartDate ? new Date(suspensionStartDate) : undefined,
        suspensionEndDate: suspensionEndDate ? new Date(suspensionEndDate) : undefined,
    });

    ApiResponse.send(res, 201, penalty, 'Penalty created successfully');
};

/**
 * Waive penalty
 * POST /admin/payment/penalty/:id/waive
 */
export const waivePenalty = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { id: penaltyId } = req.params;
    const { waiverReason } = req.body;

    const penaltyRow = await prisma.penalty.findUnique({
        where: { id: penaltyId },
        select: { driverId: true },
    });
    if (!penaltyRow) return res.status(404).json({ message: 'Penalty not found' });
    await assertDriverAccess(req, penaltyRow.driverId, { hubScoped: true });

    const penalty = await penaltyService.waivePenalty(penaltyId, userId, waiverReason);

    ApiResponse.send(res, 200, penalty, 'Penalty waived successfully');
};

/**
 * Create incentive
 * POST /admin/payment/incentive
 */
export const createIncentive = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { driverId, amount, reason, category } = req.body;

    await assertDriverAccess(req, String(driverId), { hubScoped: true });

    const incentive = await incentiveService.createIncentive({
        driverId,
        amount: Number(amount),
        reason,
        category,
        createdBy: userId,
    });

    ApiResponse.send(res, 201, incentive, 'Incentive created successfully');
};

/**
 * Payout incentive
 * POST /admin/payment/incentive/:id/payout
 */
export const payoutIncentive = async (req: Request, res: Response) => {
    const { id: incentiveId } = req.params;

    const incentiveRow = await prisma.incentive.findUnique({
        where: { id: incentiveId },
        select: { driverId: true },
    });
    if (!incentiveRow) return res.status(404).json({ message: 'Incentive not found' });
    await assertDriverAccess(req, incentiveRow.driverId, { hubScoped: true });

    const result = await incentiveService.payoutIncentive(incentiveId);

    ApiResponse.send(res, 200, result, 'Incentive payout initiated');
};

/**
 * Reconcile daily collection
 * POST /admin/payment/collection/:id/reconcile
 */
export const reconcileCollection = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { id: collectionId } = req.params;
    const { expectedRevenue, reconciliationNotes } = req.body;

    // Manager: fleet-only access (collection belongs to a driver)
    const col = await payoutService.getCollectionById(collectionId);
    if (!col) return res.status(404).json({ message: 'Collection not found' });
    await assertFleetAccess(req, col.driver.fleetId);

    const collection = await payoutService.reconcileCollection({
        collectionId,
        reconciledBy: userId,
        expectedRevenue: expectedRevenue ? Number(expectedRevenue) : undefined,
        reconciliationNotes,
    });

    ApiResponse.send(res, 200, collection, 'Collection reconciled successfully');
};

/**
 * Process payout
 * POST /admin/payment/collection/:id/payout
 */
export const processPayout = async (req: Request, res: Response) => {
    const { id: collectionId } = req.params;

    const col = await payoutService.getCollectionById(collectionId);
    if (!col) return res.status(404).json({ message: 'Collection not found' });
    await assertFleetAccess(req, col.driver.fleetId);

    const result = await payoutService.processPayout(collectionId);

    ApiResponse.send(res, 200, result, 'Payout processed successfully');
};

/**
 * Get pending reconciliations
 * GET /admin/payment/reconciliations/pending
 */
export const getPendingReconciliations = async (req: Request, res: Response) => {
    const role = req.user?.role;
    const scope =
        role && role !== 'SUPER_ADMIN'
            ? { fleetId: req.user?.fleetId }
            : undefined;
    const reconciliations = await payoutService.getPendingReconciliations(scope);

    ApiResponse.send(res, 200, reconciliations, 'Pending reconciliations retrieved');
};

/**
 * Get pending payouts
 * GET /admin/payment/payouts/pending
 */
export const getPendingPayouts = async (req: Request, res: Response) => {
    const role = req.user?.role;
    const scope =
        role && role !== 'SUPER_ADMIN'
            ? { fleetId: req.user?.fleetId }
            : undefined;
    const payouts = await payoutService.getPendingPayouts(scope);

    ApiResponse.send(res, 200, payouts, 'Pending payouts retrieved');
};

/**
 * Generate vehicle QR code
 * POST /admin/payment/vehicle/:id/qr
 */
export const generateVehicleQR = async (req: Request, res: Response) => {
    const { id: vehicleId } = req.params;

    await assertVehicleAccess(req, vehicleId, { hubScoped: true });

    const qr = await virtualQRService.generateVehicleQR(vehicleId);

    ApiResponse.send(res, 201, qr, 'Virtual QR generated successfully');
};

/**
 * Get vehicle QR code
 * GET /admin/payment/vehicle/:id/qr
 */
export const getVehicleQR = async (_req: Request, res: Response) => {
    const { id: vehicleId } = _req.params;

    await assertVehicleAccess(_req, vehicleId, { hubScoped: true });

    const qr = await virtualQRService.getVehicleQR(vehicleId);

    if (!qr) {
        return res.status(404).json({ message: 'Virtual QR not found' });
    }

    ApiResponse.send(res, 200, qr, 'Virtual QR retrieved successfully');
};
