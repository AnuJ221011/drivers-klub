import { prisma } from '../../utils/prisma.js';
import { PenaltyType, TransactionType, TransactionStatus, PaymentMethod, PaymentModel } from '@prisma/client';
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';

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
            include: { user: true },
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
                return this.handleRentalModelPenalty(penalty.id, data.driverId, data.amount, driver);
            }
            // For PAYOUT model, penalty will be deducted from next payout
        }

        // Handle suspension
        if (data.type === PenaltyType.SUSPENSION) {
            await this.applySuspension(data.driverId, data.suspensionStartDate!, data.suspensionEndDate!);
        }

        // Handle blacklist
        if (data.type === PenaltyType.BLACKLIST) {
            await this.applyBlacklist(data.driverId, driver);
        }

        return penalty;
    }

    /**
     * Handle monetary penalty for rental model driver
     * Auto-deduct from deposit if available
     */
    private async handleRentalModelPenalty(penaltyId: string, driverId: string, amount: number, driver: any) {
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
            return { message: 'Penalty deducted from deposit' };
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

            // Create payment link for remaining amount
            try {
                const transaction = await prisma.transaction.create({
                    data: {
                        driverId,
                        type: TransactionType.PENALTY,
                        amount: remainingAmount,
                        status: TransactionStatus.PENDING,
                        paymentMethod: PaymentMethod.PG_UPI,
                        penaltyId,
                        description: `Penalty remaining balance payment (Total: ₹${amount})`,
                    },
                });

                const payment = await easebuzzAdapter.initiatePayment({
                    amount: remainingAmount,
                    productInfo: 'Penalty Payment',
                    firstName: driver.firstName,
                    phone: driver.mobile,
                    email: driver.user?.email || 'driver@driversklub.com',
                    successUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payment/success',
                    failureUrl: process.env.PAYMENT_FAILURE_URL || 'http://localhost:3000/payment/failure',
                    udf1: driverId,
                    udf2: TransactionType.PENALTY,
                    udf3: penaltyId,
                });

                // Update transaction with Easebuzz txn ID
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        easebuzzTxnId: payment.txnId,
                    },
                });

                return {
                    message: `Partial deduction (₹${availableDeposit}). Payment link generated for remaining ₹${remainingAmount}.`,
                    paymentUrl: payment.paymentUrl,
                    remainingAmount
                };

            } catch (error: any) {
                console.error('Failed to generate penalty payment link:', error);
                return {
                    message: `Partial deduction (₹${availableDeposit}). Failed to generate payment link for remaining ₹${remainingAmount}.`,
                    error: error.message
                };
            }
        } else {
            // No deposit available - Generate full payment link
            try {
                const transaction = await prisma.transaction.create({
                    data: {
                        driverId,
                        type: TransactionType.PENALTY,
                        amount: amount,
                        status: TransactionStatus.PENDING,
                        paymentMethod: PaymentMethod.PG_UPI,
                        penaltyId,
                        description: `Penalty payment`,
                    },
                });

                const payment = await easebuzzAdapter.initiatePayment({
                    amount: amount,
                    productInfo: 'Penalty Payment',
                    firstName: driver.firstName,
                    phone: driver.mobile,
                    email: driver.user?.email || 'driver@driversklub.com',
                    successUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payment/success',
                    failureUrl: process.env.PAYMENT_FAILURE_URL || 'http://localhost:3000/payment/failure',
                    udf1: driverId,
                    udf2: TransactionType.PENALTY,
                    udf3: penaltyId,
                });

                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { easebuzzTxnId: payment.txnId },
                });

                return {
                    message: 'Insufficient deposit. Payment link generated.',
                    paymentUrl: payment.paymentUrl,
                    amount
                };
            } catch (error: any) {
                console.error('Failed to generate penalty payment link:', error);
                throw new Error('Failed to generate payment link');
            }
        }
    }

    /**
     * Apply suspension to driver
     */
    private async applySuspension(driverId: string, startDate: Date, endDate: Date) {
        await prisma.$transaction(async (tx) => {
            // 1. Update Driver Status
            await tx.driver.update({
                where: { id: driverId },
                data: {
                    status: 'SUSPENDED', // Ensure this enum exists or use 'INACTIVE'
                    isAvailable: false,
                },
            });

            // 2. Cancel Active/Future Trips
            // Fetch active trips first to get IDs if needed, or updateMany directly
            // In a real system, we might need to notify providers. For now, database update is key.
            const cancelledTrips = await tx.ride.updateMany({
                where: {
                    tripAssignments: { some: { driverId } },
                    status: { in: ['CREATED', 'DRIVER_ASSIGNED'] } // Don't cancel STARTED trips automatically
                },
                data: {
                    status: 'CANCELLED', // Using 'CANCELLED' as generic
                }
            });

            // 3. Pause/Expire Active Rental
            await tx.driverRental.updateMany({
                where: {
                    driverId: driverId,
                    isActive: true,
                },
                data: {
                    isActive: false, // Effectively pauses benefit
                },
            });

            console.log(`Driver ${driverId} suspended from ${startDate.toISOString()} to ${endDate.toISOString()}. Cancelled ${cancelledTrips.count} trips.`);
        });
    }

    /**
     * Apply blacklist to driver
     */
    private async applyBlacklist(driverId: string, driver: any) {
        await prisma.driver.update({
            where: { id: driverId },
            data: {
                status: 'BLACKLISTED', // or INACTIVE
                isAvailable: false,
            },
        });

        // Initiate deposit refund process
        if (driver.depositBalance > 0) {
            try {
                // If driver has bank account (implied by payout model or saved beneficiary), process payout.
                // Assuming we have beneficiary details. If not, we just zero the balance and log manual refund needed.
                // For now, we will create a 'PENDING_REFUND' transaction and zero the wallet.

                const payoutTransaction = await prisma.transaction.create({
                    data: {
                        driverId,
                        type: TransactionType.PAYOUT, // Or REFUND
                        amount: driver.depositBalance,
                        status: TransactionStatus.PENDING, // Pending manual/auto processing
                        paymentMethod: PaymentMethod.BANK_TRANSFER,
                        description: 'Security Deposit Refund (Blacklist)',
                    },
                });

                // Zero out the wallet
                await prisma.driver.update({
                    where: { id: driverId },
                    data: { depositBalance: 0 }
                });

                console.log(`Refund initiated for Driver ${driverId}: ₹${payoutTransaction.amount}`);
                // In production: Call EasebuzzAdapter.createPayout() here if account details exist.

            } catch (error) {
                console.error('Failed to initiate blacklist refund:', error);
            }
        }

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
