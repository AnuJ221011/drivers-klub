import { TransactionType, TransactionStatus, PaymentMethod, PaymentModel } from '@prisma/client';
import { prisma } from "@driversklub/database";
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';
import { IdUtils, EntityType } from "@driversklub/common";

export class RentalService {
    /**
     * Create a rental plan for a fleet
     */
    async createRentalPlan(data: {
        fleetId: string;
        name: string;
        rentalAmount: number;
        depositAmount: number;
        validityDays: number;
    }) {
        const shortId = await IdUtils.generateShortId(prisma, EntityType.RENTAL_PLAN);
        const rentalPlan = await prisma.rentalPlan.create({
            data: {
                shortId,
                fleetId: data.fleetId,
                name: data.name,
                rentalAmount: data.rentalAmount,
                depositAmount: data.depositAmount,
                validityDays: data.validityDays,
                isActive: true,
            },
        });

        return rentalPlan;
    }

    /**
     * Get all rental plans for a fleet
     */
    async getRentalPlans(fleetId: string, activeOnly: boolean = true) {
        return prisma.rentalPlan.findMany({
            where: {
                fleetId,
                ...(activeOnly && { isActive: true }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get rental plan by ID
     */
    async getRentalPlanById(id: string) {
        return prisma.rentalPlan.findFirst({
            where: {
                OR: [{ id }, { shortId: id }]
            },
            include: { fleet: true },
        });
    }

    /**
     * Update rental plan
     */
    async updateRentalPlan(
        id: string,
        data: {
            name?: string;
            rentalAmount?: number;
            depositAmount?: number;
            validityDays?: number;
            isActive?: boolean;
        }
    ) {
        const resolved = await this.getRentalPlanById(id);
        if (!resolved) throw new Error('Rental plan not found');

        return prisma.rentalPlan.update({
            where: { id: resolved.id },
            data,
        });
    }

    /**
     * Initiate deposit payment
     */
    async initiateDepositPayment(params: {
        driverId: string;
        amount: number;
        successUrl?: string;
        failureUrl?: string;
    }) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: params.driverId }, { shortId: params.driverId }] },
            include: { user: true, fleet: true },
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        const shortId = await IdUtils.generateShortId(prisma, EntityType.TRANSACTION);

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                shortId: shortId,
                driverId: driver.id,
                type: TransactionType.DEPOSIT,
                amount: params.amount,
                status: TransactionStatus.PENDING,
                paymentMethod: PaymentMethod.PG_UPI, // Will be updated based on actual payment
                description: `Security deposit - ₹${params.amount}`,
            },
        });

        // Require real email - no fake emails
        if (!driver.fleet?.email) {
            throw new Error('Fleet email not configured. Please set fleet email in admin panel before initiating payments.');
        }
        const customerEmail = driver.fleet.email;

        // Initiate payment via Easebuzz
        const payment = await easebuzzAdapter.initiatePayment({
            amount: params.amount,
            productInfo: 'Security Deposit',
            firstName: driver.firstName,
            phone: driver.mobile,
            email: customerEmail,
            successUrl:
                params.successUrl || process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payment/success',
            failureUrl:
                params.failureUrl || process.env.PAYMENT_FAILURE_URL || 'http://localhost:3000/payment/failure',
            udf1: driver.id,
            udf2: TransactionType.DEPOSIT,
        });

        // Update transaction with Easebuzz txn ID
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                easebuzzTxnId: payment.txnId,
            },
        });

        return {
            transactionId: transaction.id,
            paymentUrl: payment.paymentUrl,
            txnId: payment.txnId,
        };
    }

    /**
     * Initiate rental payment
     */
    async initiateRentalPayment(params: {
        driverId: string;
        rentalPlanId: string;
        successUrl?: string;
        failureUrl?: string;
    }) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: params.driverId }, { shortId: params.driverId }] },
            include: { user: true, fleet: true },
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        const rentalPlan = await prisma.rentalPlan.findFirst({
            where: { OR: [{ id: params.rentalPlanId }, { shortId: params.rentalPlanId }] },
        });

        if (!rentalPlan || !rentalPlan.isActive) {
            throw new Error('Rental plan not found or inactive');
        }

        // Check if plan matches driver's fleet
        if (rentalPlan.fleetId !== driver.fleetId) {
            throw new Error('This rental plan does not belong to your fleet');
        }

        // Check if driver has sufficient deposit
        if (driver.depositBalance < rentalPlan.depositAmount) {
            throw new Error(
                `Insufficient deposit balance. Required: ₹${rentalPlan.depositAmount}, Available: ₹${driver.depositBalance}`
            );
        }

        const shortId = await IdUtils.generateShortId(prisma, EntityType.TRANSACTION);

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                shortId: shortId,
                driverId: driver.id,
                type: TransactionType.RENTAL,
                amount: rentalPlan.rentalAmount,
                status: TransactionStatus.PENDING,
                paymentMethod: PaymentMethod.PG_UPI,
                description: `Rental payment - ${rentalPlan.name}`,
                metadata: {
                    rentalPlanId: rentalPlan.id,
                    validityDays: rentalPlan.validityDays,
                },
            },
        });

        // Require real email - no fake emails
        if (!driver.fleet?.email) {
            throw new Error('Fleet email not configured. Please set fleet email in admin panel before initiating payments.');
        }
        const customerEmail = driver.fleet.email;

        // Initiate payment via Easebuzz
        const payment = await easebuzzAdapter.initiatePayment({
            amount: rentalPlan.rentalAmount,
            productInfo: `Rental - ${rentalPlan.name}`,
            firstName: driver.firstName,
            phone: driver.mobile,
            email: customerEmail,
            successUrl:
                params.successUrl || process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payment/success',
            failureUrl:
                params.failureUrl || process.env.PAYMENT_FAILURE_URL || 'http://localhost:3000/payment/failure',
            udf1: driver.id,
            udf2: TransactionType.RENTAL,
            udf3: rentalPlan.id,
        });

        // Update transaction with Easebuzz txn ID
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                easebuzzTxnId: payment.txnId,
            },
        });

        return {
            transactionId: transaction.id,
            paymentUrl: payment.paymentUrl,
            txnId: payment.txnId,
        };
    }

    /**
     * Activate rental plan after successful payment
     * Called from webhook handler
     */
    async activateRentalPlan(params: {
        driverId: string;
        rentalPlanId: string;
        transactionId: string;
    }) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: params.driverId }, { shortId: params.driverId }] },
            select: { id: true }
        });
        if (!driver) throw new Error('Driver not found');

        const rentalPlan = await prisma.rentalPlan.findFirst({
            where: { OR: [{ id: params.rentalPlanId }, { shortId: params.rentalPlanId }] },
        });

        if (!rentalPlan) {
            throw new Error('Rental plan not found');
        }

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + rentalPlan.validityDays);

        // Deactivate any existing active rentals
        await prisma.driverRental.updateMany({
            where: {
                driverId: driver.id,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });

        const shortId = await IdUtils.generateShortId(prisma, EntityType.DRIVER_RENTAL);

        // Create new rental
        const driverRental = await prisma.driverRental.create({
            data: {
                shortId,
                driverId: driver.id,
                rentalPlanId: rentalPlan.id,
                startDate,
                expiryDate,
                isActive: true,
            },
        });

        // Set driver payment model to RENTAL
        await prisma.driver.update({
            where: { id: driver.id },
            data: {
                paymentModel: PaymentModel.RENTAL,
            },
        });

        return driverRental;
    }

    /**
     * Get active rental for driver
     */
    async getActiveRental(driverId: string) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
            select: { id: true }
        });
        if (!driver) return null;

        return prisma.driverRental.findFirst({
            where: {
                driverId: driver.id,
                isActive: true,
                expiryDate: {
                    gte: new Date(),
                },
            },
            include: {
                rentalPlan: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }

    /**
     * Get rental history for driver
     */
    async getRentalHistory(driverId: string) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
            select: { id: true }
        });
        if (!driver) return [];

        return prisma.driverRental.findMany({
            where: { driverId: driver.id },
            include: {
                rentalPlan: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }

    /**
     * Add deposit to driver balance
     * Called from webhook handler
     */
    async addDeposit(driverId: string, amount: number) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
            select: { id: true }
        });
        if (!driver) throw new Error('Driver not found');

        await prisma.driver.update({
            where: { id: driver.id },
            data: {
                depositBalance: {
                    increment: amount,
                },
            },
        });

        return { success: true, newBalance: await this.getDepositBalance(driver.id) };
    }

    /**
     * Deduct from deposit (for penalties in rental model)
     */
    async deductFromDeposit(driverId: string, amount: number, reason: string) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        if (driver.depositBalance < amount) {
            throw new Error(
                `Insufficient deposit balance. Required: ₹${amount}, Available: ₹${driver.depositBalance}`
            );
        }

        await prisma.driver.update({
            where: { id: driver.id },
            data: {
                depositBalance: {
                    decrement: amount,
                },
            },
        });

        const shortId = await IdUtils.generateShortId(prisma, EntityType.TRANSACTION);

        // Create transaction record
        await prisma.transaction.create({
            data: {
                shortId: shortId,
                driverId: driver.id,
                type: TransactionType.PENALTY,
                amount: -amount, // Negative for deduction
                status: TransactionStatus.SUCCESS,
                paymentMethod: PaymentMethod.PG_UPI,
                description: `Deposit deduction - ${reason}`,
            },
        });

        return { success: true, newBalance: await this.getDepositBalance(driver.id) };
    }

    /**
     * Get deposit balance
     */
    async getDepositBalance(driverId: string) {
        const driver = await prisma.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
            select: { depositBalance: true },
        });

        return driver?.depositBalance || 0;
    }

    /**
     * Get driver rental status (for mobile app display)
     */
    async getDriverRentalStatus(driverId: string) {
        const resolvedDriver = await prisma.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
            select: {
                id: true,
                depositBalance: true,
                paymentModel: true,
            },
        });

        if (!resolvedDriver) throw new Error('Driver not found');

        const activeRental = await this.getActiveRental(resolvedDriver.id);

        if (!activeRental) {
            return {
                depositBalance: resolvedDriver?.depositBalance || 0,
                paymentModel: resolvedDriver?.paymentModel,
                hasActiveRental: false,
                rental: null,
            };
        }

        const now = new Date();
        const daysRemaining = Math.ceil(
            (activeRental.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get active vehicle assignment
        const activeAssignment = await prisma.assignment.findFirst({
            where: {
                driverId: resolvedDriver.id,
                status: 'ACTIVE',
                endTime: null,
            },
            include: {
                vehicle: true,
            },
        });

        return {
            depositBalance: resolvedDriver?.depositBalance || 0,
            paymentModel: resolvedDriver?.paymentModel,
            hasActiveRental: true,
            rental: {
                planName: activeRental.rentalPlan.name,
                amount: activeRental.rentalPlan.rentalAmount,
                startDate: activeRental.startDate,
                expiryDate: activeRental.expiryDate,
                daysRemaining,
                isExpired: daysRemaining <= 0,
                vehicle: activeAssignment ? {
                    number: activeAssignment.vehicle.vehicleNumber,
                    model: activeAssignment.vehicle.vehicleModel,
                } : null,
            },
        };
    }

    /**
     * Check and expire rentals (run daily via cron)
     */
    async expireRentals() {
        const expiredRentals = await prisma.driverRental.findMany({
            where: {
                isActive: true,
                expiryDate: {
                    lt: new Date(),
                },
            },
        });

        for (const rental of expiredRentals) {
            await prisma.driverRental.update({
                where: { id: rental.id },
                data: { isActive: false },
            });
        }

        return { expiredCount: expiredRentals.length };
    }
}

export const rentalService = new RentalService();
