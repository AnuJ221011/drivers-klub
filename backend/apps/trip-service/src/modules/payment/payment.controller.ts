import type { Request, Response } from 'express';
import { rentalService } from '../../core/payment/rental.service.js';
import { payoutService } from '../../core/payment/payout.service.js';
import { penaltyService } from '../../core/payment/penalty.service.js';
import { incentiveService } from '../../core/payment/incentive.service.js';
import { virtualQRService } from '../../core/payment/virtualqr.service.js';
import { ApiResponse, logger } from '@driversklub/common';
import { PenaltyType } from '@prisma/client';
import { prisma } from '@driversklub/database';

function getScope(req: Request): { role: string; fleetId: string | null; hubIds: string[] } {
    const role = String((req.user as any)?.role || '');
    const fleetId = ((req.user as any)?.fleetId as string | null | undefined) ?? null;
    const hubIds = Array.isArray((req.user as any)?.hubIds) ? ((req.user as any).hubIds as string[]) : [];
    return { role, fleetId, hubIds };
}

async function assertDriverInScope(req: Request, driverId: string) {
    const { role, fleetId, hubIds } = getScope(req);
    if (role === 'SUPER_ADMIN') return;
    if (!fleetId) throw new Error('Fleet scope not set');
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new Error('Driver not found');
    if (driver.fleetId !== fleetId) throw new Error('Access denied');
    if (role === 'OPERATIONS') {
        if (!driver.hubId || !hubIds.includes(driver.hubId)) throw new Error('Access denied');
    }
}

async function assertVehicleInScope(req: Request, vehicleId: string) {
    const { role, fleetId, hubIds } = getScope(req);
    if (role === 'SUPER_ADMIN') return;
    if (!fleetId) throw new Error('Fleet scope not set');
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new Error('Vehicle not found');
    if (vehicle.fleetId !== fleetId) throw new Error('Access denied');
    if (role === 'OPERATIONS') {
        if (!vehicle.hubId || !hubIds.includes(vehicle.hubId)) throw new Error('Access denied');
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
    try {
        const { id: userId } = req.user as any;
        const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

        const driver = await prisma.driver.findFirst({
            where: { userId },
        });

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const where: any = { driverId: driver.id };
        if (type) where.type = type;
        if (status) where.status = status;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const start = new Date(startDate as string);
                if (!isNaN(start.getTime())) {
                    where.createdAt.gte = start;
                }
            }
            if (endDate) {
                const end = new Date(endDate as string);
                if (!isNaN(end.getTime())) {
                    where.createdAt.lte = end;
                }
            }
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limitNum,
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
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            'Transactions retrieved successfully'
        );
    } catch (error: any) {
        logger.error('[PaymentController] Get Transactions Error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
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
    try {
        const { id: userId } = req.user as any;
        const { rentalPlanId } = req.body;

        // Validate required field
        if (!rentalPlanId) {
            return res.status(400).json({
                success: false,
                message: 'rentalPlanId is required'
            });
        }

        const driver = await prisma.driver.findFirst({
            where: { userId },
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        const payment = await rentalService.initiateRentalPayment({
            driverId: driver.id,
            rentalPlanId,
        });

        ApiResponse.send(res, 200, payment, 'Rental payment initiated');
    } catch (error: any) {
        logger.error('[PaymentController] Initiate Rental Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate rental payment',
        });
    }
};

/**
 * Get available rental plans for driver
 * GET /payment/rental/plans
 */
export const getDriverRentalPlans = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;

    const driver = await prisma.driver.findFirst({
        where: { userId },
    });

    if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    const plans = driver.fleetId
        ? await rentalService.getRentalPlans(driver.fleetId, true)
        : [];

    ApiResponse.send(res, 200, plans, 'Rental plans retrieved successfully');
};

/**
 * Get weekly earnings summary
 * GET /payments/earnings/weekly
 */
export const getWeeklyEarnings = async (req: Request, res: Response) => {
    try {
        const { id: userId } = req.user as any;
        const { weeks = 5 } = req.query;

        const driver = await prisma.driver.findFirst({
            where: { userId },
        });

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const numWeeks = Math.min(Math.max(1, Number(weeks)), 12); // 1-12 weeks
        const weeklyData = [];
        let totalEarnings = 0;

        // Get current date in IST
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istNow = new Date(now.getTime() + istOffset);

        // Calculate Monday of current week
        const dayOfWeek = istNow.getUTCDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(istNow);
        currentMonday.setUTCDate(istNow.getUTCDate() - daysToMonday);
        currentMonday.setUTCHours(0, 0, 0, 0);

        for (let i = 0; i < numWeeks; i++) {
            const weekStart = new Date(currentMonday);
            weekStart.setUTCDate(currentMonday.getUTCDate() - (i * 7));

            const weekEnd = new Date(weekStart);
            weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
            weekEnd.setUTCHours(23, 59, 59, 999);

            // Get completed rides (trips) count & earnings
            const completedRides = await prisma.ride.findMany({
                where: {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: weekStart,
                        lte: weekEnd,
                    },
                    tripAssignments: {
                        some: { driverId: driver.id },
                    },
                },
                select: { price: true },
            });
            const tripCount = completedRides.length;
            const tripEarningsSum = completedRides.reduce((sum, r) => sum + (r.price || 0), 0);

            // Get incentives
            const incentiveAgg = await prisma.incentive.aggregate({
                where: {
                    driverId: driver.id,
                    createdAt: {
                        gte: weekStart,
                        lte: weekEnd,
                    },
                },
                _sum: { amount: true },
            });

            // Get penalties (deductions)
            const penaltyAgg = await prisma.penalty.aggregate({
                where: {
                    driverId: driver.id,
                    type: 'MONETARY',
                    isWaived: false,
                    createdAt: {
                        gte: weekStart,
                        lte: weekEnd,
                    },
                },
                _sum: { amount: true },
            });

            const tripEarnings = tripEarningsSum;
            const incentives = incentiveAgg._sum.amount || 0;
            const penalties = penaltyAgg._sum.amount || 0;
            const netEarnings = tripEarnings + incentives - penalties;

            const weekData = {
                weekNumber: getWeekNumber(weekStart),
                startDate: weekStart.toISOString().split('T')[0],
                endDate: weekEnd.toISOString().split('T')[0],
                tripCount,
                tripEarnings,
                incentives,
                penalties,
                netEarnings,
            };

            if (i === 0) {
                weeklyData.push({ type: 'current', ...weekData });
            } else {
                weeklyData.push(weekData);
            }

            totalEarnings += netEarnings;
        }

        ApiResponse.send(
            res,
            200,
            {
                currentWeek: weeklyData[0],
                previousWeeks: weeklyData.slice(1),
                totalEarnings,
            },
            'Weekly earnings retrieved successfully'
        );
    } catch (error: any) {
        logger.error('[PaymentController] Get Weekly Earnings Error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Create rental plan
 * POST /admin/payment/rental-plans
 */
export const createRentalPlan = async (req: Request, res: Response) => {
    const { role, fleetId: scopedFleetId } = getScope(req);
    let { fleetId } = req.body as { fleetId?: string };
    const { name, rentalAmount, depositAmount, validityDays } = req.body;

    // For non-super roles, fleet scope is fixed from JWT.
    if (role !== 'SUPER_ADMIN') {
        if (!scopedFleetId) return res.status(403).json({ message: 'Fleet scope not set for this user' });
        fleetId = scopedFleetId;
    }

    if (!fleetId) {
        return res.status(400).json({ message: 'Fleet ID is required' });
    }

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
    const { fleetId } = req.params as { fleetId: string };
    const { activeOnly = 'true' } = req.query;

    const scope = getScope(req);
    if (scope.role !== 'SUPER_ADMIN') {
        if (!scope.fleetId) return res.status(403).json({ message: 'Fleet scope not set for this user' });
        if (fleetId !== scope.fleetId) return res.status(403).json({ message: 'Access denied' });
    }

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

    try {
        await assertDriverInScope(req, driverId);
    } catch (e: any) {
        const msg = e?.message || 'Access denied';
        const code = msg === 'Driver not found' ? 404 : msg === 'Fleet scope not set' ? 403 : 403;
        return res.status(code).json({ message: msg });
    }

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
    const { id: penaltyId } = req.params as { id: string };
    const { waiverReason } = req.body;

    const scope = getScope(req);
    if (scope.role !== 'SUPER_ADMIN') {
        if (!scope.fleetId) return res.status(403).json({ message: 'Fleet scope not set for this user' });
        const penaltyRow = await prisma.penalty.findUnique({ where: { id: penaltyId } });
        if (!penaltyRow) return res.status(404).json({ message: 'Penalty not found' });
        try {
            await assertDriverInScope(req, penaltyRow.driverId);
        } catch (e: any) {
            const msg = e?.message || 'Access denied';
            const code = msg === 'Driver not found' ? 404 : msg === 'Fleet scope not set' ? 403 : 403;
            return res.status(code).json({ message: msg });
        }
    }

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

    try {
        await assertDriverInScope(req, driverId);
    } catch (e: any) {
        const msg = e?.message || 'Access denied';
        const code = msg === 'Driver not found' ? 404 : msg === 'Fleet scope not set' ? 403 : 403;
        return res.status(code).json({ message: msg });
    }

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
    const { id: incentiveId } = req.params as { id: string };

    const scope = getScope(req);
    if (scope.role !== 'SUPER_ADMIN') {
        const incentive = await prisma.incentive.findUnique({ where: { id: incentiveId } });
        if (!incentive) return res.status(404).json({ message: 'Incentive not found' });
        try {
            await assertDriverInScope(req, incentive.driverId);
        } catch (e: any) {
            const msg = e?.message || 'Access denied';
            const code = msg === 'Driver not found' ? 404 : msg === 'Fleet scope not set' ? 403 : 403;
            return res.status(code).json({ message: msg });
        }
    }

    const result = await incentiveService.payoutIncentive(incentiveId);

    ApiResponse.send(res, 200, result, 'Incentive payout initiated');
};

/**
 * Reconcile daily collection
 * POST /admin/payment/collection/:id/reconcile
 */
export const reconcileCollection = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;
    const { id: collectionId } = req.params as { id: string };
    const { expectedRevenue, reconciliationNotes } = req.body;

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
    const { id: collectionId } = req.params as { id: string };

    const result = await payoutService.processPayout(collectionId);

    ApiResponse.send(res, 200, result, 'Payout processed successfully');
};

/**
 * Get pending reconciliations
 * GET /admin/payment/reconciliations/pending
 */
export const getPendingReconciliations = async (req: Request, res: Response) => {
    const scope = getScope(req);
    const reconciliations = await payoutService.getPendingReconciliations(
        scope.role === 'SUPER_ADMIN' ? undefined : { fleetId: scope.fleetId }
    );

    ApiResponse.send(res, 200, reconciliations, 'Pending reconciliations retrieved');
};

/**
 * Get pending payouts
 * GET /admin/payment/payouts/pending
 */
export const getPendingPayouts = async (req: Request, res: Response) => {
    const scope = getScope(req);
    const payouts = await payoutService.getPendingPayouts(
        scope.role === 'SUPER_ADMIN' ? undefined : { fleetId: scope.fleetId }
    );

    ApiResponse.send(res, 200, payouts, 'Pending payouts retrieved');
};

/**
 * Generate vehicle QR code
 * POST /admin/payment/vehicle/:id/qr
 */
export const generateVehicleQR = async (req: Request, res: Response) => {
    try {
        const { id: vehicleId } = req.params as { id: string };

        try {
            await assertVehicleInScope(req, vehicleId);
        } catch (e: any) {
            const msg = e?.message || 'Access denied';
            const code = msg === 'Vehicle not found' ? 404 : msg === 'Fleet scope not set' ? 403 : 403;
            return res.status(code).json({ message: msg });
        }

        const qr = await virtualQRService.generateVehicleQR(vehicleId);
        if (!vehicleId) {
            return res.status(400).json({
                success: false,
                message: 'vehicleId is required'
            });
        }


        ApiResponse.send(res, 201, qr, 'Virtual QR generated successfully');
    } catch (error: any) {
        logger.error('[PaymentController] Generate Vehicle QR Error:', error);

        // Handle specific errors
        if (error.message?.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message?.includes('Easebuzz')) {
            return res.status(502).json({
                success: false,
                message: 'Payment gateway error. Please try again later.',
                details: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate QR code',
        });
    }
};

/**
 * Get vehicle QR code
 * GET /admin/payment/vehicle/:id/qr
 */
export const getVehicleQR = async (_req: Request, res: Response) => {
    try {
        const { id: vehicleId } = _req.params as { id: string };

        try {
            await assertVehicleInScope(_req, vehicleId);
        } catch (e: any) {
            const msg = e?.message || 'Access denied';
            const code = msg === 'Vehicle not found' ? 404 : msg === 'Fleet scope not set' ? 403 : 403;
            return res.status(code).json({ message: msg });
        }

        const qr = await virtualQRService.getVehicleQR(vehicleId);

        if (!qr) {
            return res.status(404).json({
                success: false,
                message: 'Virtual QR not found. Generate one first using POST method.'
            });
        }

        ApiResponse.send(res, 200, qr, 'Virtual QR retrieved successfully');
    } catch (error: any) {
        logger.error('[PaymentController] Get Vehicle QR Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve QR code',
        });
    }
};

/**
 * Upload bulk payout file
 * POST /admin/payment/bulk-payout
 */
export const uploadBulkPayout = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const result = await payoutService.processBulkPayout(req.file.buffer);
        ApiResponse.send(res, 200, result, 'Bulk payout processed successfully');
    } catch (error: any) {
        return res.status(500).json({
            message: 'Error processing bulk payout',
            error: error.message
        });
    }
};