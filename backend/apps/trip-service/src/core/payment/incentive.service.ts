import { prisma } from "@driversklub/database";
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';
import { TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';

export class IncentiveService {
    /**
     * Create an incentive for a driver
     */
    async createIncentive(data: {
        driverId: string;
        amount: number;
        reason: string;
        category?: string;
        createdBy: string;
    }) {
        const driver = await prisma.driver.findUnique({
            where: { id: data.driverId },
            include: { user: true },
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        const incentive = await prisma.incentive.create({
            data: {
                driverId: data.driverId,
                amount: data.amount,
                reason: data.reason,
                category: data.category,
                createdBy: data.createdBy,
                isPaid: false,
            },
        });

        return incentive;
    }

    /**
     * Pay out an incentive to driver
     */
    async payoutIncentive(incentiveId: string) {
        const incentive = await prisma.incentive.findUnique({
            where: { id: incentiveId },
            include: {
                driver: {
                    include: { user: true },
                },
            },
        });

        if (!incentive) {
            throw new Error('Incentive not found');
        }

        if (incentive.isPaid) {
            throw new Error('Incentive already paid');
        }

        const driver = incentive.driver;

        // Validate bank details
        if (!driver.bankAccountNumber || !driver.bankIfscCode || !driver.bankAccountName) {
            throw new Error('Driver bank details not configured');
        }

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                driverId: driver.id,
                type: TransactionType.INCENTIVE,
                amount: incentive.amount,
                status: TransactionStatus.PENDING,
                paymentMethod: PaymentMethod.PG_UPI,
                incentiveId: incentive.id,
                description: `Incentive payout - ${incentive.reason}`,
            },
        });

        try {
            // Initiate payout via Easebuzz
            const payout = await easebuzzAdapter.createPayout({
                amount: incentive.amount,
                beneficiaryName: driver.bankAccountName,
                beneficiaryAccount: driver.bankAccountNumber,
                beneficiaryIfsc: driver.bankIfscCode,
                purpose: `Incentive - ${incentive.reason}`,
                transferMode: 'IMPS',
                email: driver.user.phone + '@driversklub.com',
                phone: driver.mobile,
            });

            // Update transaction
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: TransactionStatus.SUCCESS,
                    easebuzzTxnId: payout.txnId,
                    easebuzzPaymentId: payout.easebuzzTxnId,
                    easebuzzStatus: payout.status,
                    metadata: {
                        utr: payout.utr,
                    },
                },
            });

            // Mark incentive as paid
            await prisma.incentive.update({
                where: { id: incentiveId },
                data: {
                    isPaid: true,
                    paidAt: new Date(),
                    transactionId: transaction.id,
                },
            });

            return {
                success: true,
                txnId: payout.txnId,
                status: payout.status,
                utr: payout.utr,
            };
        } catch (error: any) {
            // Update transaction as failed
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: TransactionStatus.FAILED,
                },
            });

            throw new Error(`Payout failed: ${error.message}`);
        }
    }

    /**
     * Batch payout multiple incentives
     */
    async batchPayoutIncentives(incentiveIds: string[]) {
        const results = [];

        for (const incentiveId of incentiveIds) {
            try {
                const result = await this.payoutIncentive(incentiveId);
                results.push({ incentiveId, ...result });
            } catch (error: any) {
                results.push({ incentiveId, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Get incentives for a driver
     */
    async getDriverIncentives(driverId: string, isPaid?: boolean) {
        return prisma.incentive.findMany({
            where: {
                driverId,
                ...(isPaid !== undefined && { isPaid }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get incentive by ID
     */
    async getIncentiveById(id: string) {
        return prisma.incentive.findUnique({
            where: { id },
            include: { driver: true },
        });
    }

    /**
     * Get unpaid incentives total for driver
     */
    async getUnpaidIncentivesTotal(driverId: string) {
        const incentives = await prisma.incentive.findMany({
            where: {
                driverId,
                isPaid: false,
            },
        });

        return incentives.reduce((total, incentive) => total + incentive.amount, 0);
    }

    /**
     * Get incentive summary for driver
     */
    async getIncentiveSummary(driverId: string) {
        const all = await prisma.incentive.findMany({
            where: { driverId },
        });

        const paid = all.filter((i) => i.isPaid);
        const unpaid = all.filter((i) => !i.isPaid);

        return {
            totalIncentives: all.length,
            paidIncentives: paid.length,
            unpaidIncentives: unpaid.length,
            totalAmount: all.reduce((sum, i) => sum + i.amount, 0),
            paidAmount: paid.reduce((sum, i) => sum + i.amount, 0),
            unpaidAmount: unpaid.reduce((sum, i) => sum + i.amount, 0),
        };
    }

    /**
     * Get pending payouts (for admin dashboard)
     */
    async getPendingPayouts() {
        return prisma.incentive.findMany({
            where: {
                isPaid: false,
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        mobile: true,
                        bankAccountNumber: true,
                        bankIfscCode: true,
                        bankAccountName: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}

export const incentiveService = new IncentiveService();
