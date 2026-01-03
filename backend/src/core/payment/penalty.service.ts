import { prisma } from '../../utils/prisma.js';
import { PenaltyType, TransactionType, TransactionStatus, PaymentMethod, PaymentModel } from '@prisma/client';

export class PenaltyService {
    /**
     * Create a penalty for a driver
     */
    async createPenalty(data: {
        driverId: string;
        type: PenaltyType;
        amount?: number;
        reason: string;
        category?: string;
        createdBy: string;
        suspensionStartDate?: Date;
        suspensionEndDate?: Date;
    }) {
        const driver = await prisma.driver.findUnique({
            where: { id: data.driverId },
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        // Create penalty
        const penalty = await prisma.penalty.create({
            data: {
                driverId: data.driverId,
                type: data.type,
                amount: data.amount || 0,
                reason: data.reason,
                category: data.category,
                suspensionStartDate: data.suspensionStartDate,
                suspensionEndDate: data.suspensionEndDate,
                createdBy: data.createdBy,
                isActive: true,
            },
        });

        // Handle monetary penalty with automatic deposit deduction for RENTAL model
        if (data.type === PenaltyType.MONETARY && data.amount && data.amount > 0) {
            if (driver.paymentModel === PaymentModel.RENTAL) {
                await this.handleRentalModelPenalty(penalty.id, data.driverId, data.amount);
            }
            // For PAYOUT model, penalty will be deducted from next payout
        }

        // Handle suspension
        if (data.type === PenaltyType.SUSPENSION) {
            await this.applySuspension(data.driverId, data.suspensionStartDate!, data.suspensionEndDate!);
        }

        // Handle blacklist
        if (data.type === PenaltyType.BLACKLIST) {
            await this.applyBlacklist(data.driverId);
        }

        return penalty;
    }

    /**
     * Handle monetary penalty for rental model driver
     * Auto-deduct from deposit if available
     */
    private async handleRentalModelPenalty(penaltyId: string, driverId: string, amount: number) {
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
        });

        if (!driver) return;

        const availableDeposit = driver.depositBalance;

        if (availableDeposit >= amount) {
            // Full deduction from deposit
            await prisma.$transaction([
                // Deduct from deposit
                prisma.driver.update({
                    where: { id: driverId },
                    data: {
                        depositBalance: {
                            decrement: amount,
                        },
                    },
                }),
                // Update penalty
                prisma.penalty.update({
                    where: { id: penaltyId },
                    data: {
                        deductedFromDeposit: true,
                        depositDeductionAt: new Date(),
                        depositDeductionAmount: amount,
                        isPaid: true,
                        paidAt: new Date(),
                    },
                }),
                // Create transaction record
                prisma.transaction.create({
                    data: {
                        driverId,
                        type: TransactionType.PENALTY,
                        amount: -amount, // Negative for deduction
                        status: TransactionStatus.SUCCESS,
                        paymentMethod: PaymentMethod.PG_UPI,
                        penaltyId,
                        description: `Penalty deducted from deposit`,
                    },
                }),
            ]);
        } else if (availableDeposit > 0) {
            // Partial deduction from deposit
            const remainingAmount = amount - availableDeposit;

            await prisma.$transaction([
                // Deduct available deposit
                prisma.driver.update({
                    where: { id: driverId },
                    data: {
                        depositBalance: 0,
                    },
                }),
                // Update penalty
                prisma.penalty.update({
                    where: { id: penaltyId },
                    data: {
                        deductedFromDeposit: true,
                        depositDeductionAt: new Date(),
                        depositDeductionAmount: availableDeposit,
                        isPaid: false, // Still needs payment for remaining
                    },
                }),
                // Create transaction for deducted amount
                prisma.transaction.create({
                    data: {
                        driverId,
                        type: TransactionType.PENALTY,
                        amount: -availableDeposit,
                        status: TransactionStatus.SUCCESS,
                        paymentMethod: PaymentMethod.PG_UPI,
                        penaltyId,
                        description: `Partial penalty deduction from deposit (₹${availableDeposit} of ₹${amount})`,
                    },
                }),
            ]);

            // TODO: Create payment gateway request for remaining amount
            console.log(`Remaining penalty amount: ₹${remainingAmount} - PG integration needed`);
        }
        // If no deposit available, penalty remains unpaid
    }

    /**
     * Apply suspension to driver
     */
    private async applySuspension(driverId: string, startDate: Date, endDate: Date) {
        await prisma.driver.update({
            where: { id: driverId },
            data: {
                status: 'INACTIVE',
            },
        });

        // TODO: Cancel active trips, pause rental plan
        console.log(`Driver ${driverId} suspended from ${startDate} to ${endDate}`);
    }

    /**
     * Apply blacklist to driver
     */
    private async applyBlacklist(driverId: string) {
        await prisma.driver.update({
            where: { id: driverId },
            data: {
                status: 'INACTIVE',
                isAvailable: false,
            },
        });

        // TODO: Initiate deposit refund process
        console.log(`Driver ${driverId} blacklisted`);
    }

    /**
     * Waive a penalty
     */
    async waivePenalty(penaltyId: string, waivedBy: string, waiverReason: string) {
        const penalty = await prisma.penalty.findUnique({
            where: { id: penaltyId },
            include: { driver: true },
        });

        if (!penalty) {
            throw new Error('Penalty not found');
        }

        if (penalty.isWaived) {
            throw new Error('Penalty already waived');
        }

        // Refund deposit if it was deducted
        if (penalty.deductedFromDeposit && penalty.depositDeductionAmount) {
            await prisma.driver.update({
                where: { id: penalty.driverId },
                data: {
                    depositBalance: {
                        increment: penalty.depositDeductionAmount,
                    },
                },
            });

            // Create refund transaction
            await prisma.transaction.create({
                data: {
                    driverId: penalty.driverId,
                    type: TransactionType.PENALTY,
                    amount: penalty.depositDeductionAmount,
                    status: TransactionStatus.SUCCESS,
                    paymentMethod: PaymentMethod.PG_UPI,
                    penaltyId,
                    description: `Penalty waived - Deposit refunded`,
                },
            });
        }

        // Cancel suspension if applicable
        if (penalty.type === PenaltyType.SUSPENSION) {
            await prisma.driver.update({
                where: { id: penalty.driverId },
                data: {
                    status: 'ACTIVE',
                },
            });
        }

        // Cancel blacklist if applicable
        if (penalty.type === PenaltyType.BLACKLIST) {
            await prisma.driver.update({
                where: { id: penalty.driverId },
                data: {
                    status: 'ACTIVE',
                    isAvailable: true,
                },
            });
        }

        // Update penalty
        const updatedPenalty = await prisma.penalty.update({
            where: { id: penaltyId },
            data: {
                isWaived: true,
                waivedBy,
                waivedAt: new Date(),
                waiverReason,
                isPaid: true, // Mark as paid since it's waived
            },
        });

        return updatedPenalty;
    }

    /**
     * Review a penalty
     */
    async reviewPenalty(penaltyId: string, reviewedBy: string, reviewNotes: string) {
        return prisma.penalty.update({
            where: { id: penaltyId },
            data: {
                reviewedBy,
                reviewedAt: new Date(),
                reviewNotes,
            },
        });
    }

    /**
     * Get penalties for a driver
     */
    async getDriverPenalties(driverId: string, filters?: {
        type?: PenaltyType;
        isPaid?: boolean;
        isWaived?: boolean;
    }) {
        return prisma.penalty.findMany({
            where: {
                driverId,
                ...(filters?.type && { type: filters.type }),
                ...(filters?.isPaid !== undefined && { isPaid: filters.isPaid }),
                ...(filters?.isWaived !== undefined && { isWaived: filters.isWaived }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get penalty by ID
     */
    async getPenaltyById(id: string) {
        return prisma.penalty.findUnique({
            where: { id },
            include: { driver: true },
        });
    }

    /**
     * Get unpaid penalties total for driver
     */
    async getUnpaidPenaltiesTotal(driverId: string) {
        const penalties = await prisma.penalty.findMany({
            where: {
                driverId,
                type: PenaltyType.MONETARY,
                isPaid: false,
                isWaived: false,
            },
        });

        return penalties.reduce((total, penalty) => total + penalty.amount, 0);
    }
}

export const penaltyService = new PenaltyService();
