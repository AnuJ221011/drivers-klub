import { prisma } from '../../utils/prisma.js';
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';
import { TransactionType, TransactionStatus, PaymentMethod, PaymentModel } from '@prisma/client';

export class PayoutService {
    /**
     * Create or update daily collection for a driver
     */
    async recordDailyCollection(data: {
        driverId: string;
        vehicleId: string;
        virtualQRId?: string;
        date: Date;
        qrCollectionAmount?: number;
        cashCollectionAmount?: number;
    }) {
        const driver = await prisma.driver.findUnique({
            where: { id: data.driverId },
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        if (driver.paymentModel !== PaymentModel.PAYOUT) {
            throw new Error('Driver is not on payout model');
        }

        const qrAmount = data.qrCollectionAmount || 0;
        const cashAmount = data.cashCollectionAmount || 0;
        const totalCollection = qrAmount + cashAmount;

        const collection = await prisma.dailyCollection.upsert({
            where: {
                driverId_date: {
                    driverId: data.driverId,
                    date: data.date,
                },
            },
            update: {
                qrCollectionAmount: qrAmount,
                cashCollectionAmount: cashAmount,
                totalCollection,
                updatedAt: new Date(),
            },
            create: {
                driverId: data.driverId,
                vehicleId: data.vehicleId,
                virtualQRId: data.virtualQRId,
                date: data.date,
                qrCollectionAmount: qrAmount,
                cashCollectionAmount: cashAmount,
                totalCollection,
            },
        });

        return collection;
    }

    /**
     * Calculate revenue share for a daily collection
     */
    async calculateRevShare(collectionId: string) {
        const collection = await prisma.dailyCollection.findUnique({
            where: { id: collectionId },
            include: { driver: true },
        });

        if (!collection) {
            throw new Error('Collection not found');
        }

        const driver = collection.driver;
        const revSharePercentage = driver.revSharePercentage || parseFloat(process.env.DEFAULT_REV_SHARE_PERCENTAGE || '70');

        // Calculate revenue share
        const revShareAmount = (collection.totalCollection * revSharePercentage) / 100;

        // Get incentives for the day
        const incentives = await prisma.incentive.findMany({
            where: {
                driverId: driver.id,
                isPaid: false,
                createdAt: {
                    gte: new Date(collection.date.setHours(0, 0, 0, 0)),
                    lt: new Date(collection.date.setHours(23, 59, 59, 999)),
                },
            },
        });
        const incentiveAmount = incentives.reduce((sum, i) => sum + i.amount, 0);

        // Get penalties for the day
        const penalties = await prisma.penalty.findMany({
            where: {
                driverId: driver.id,
                isPaid: false,
                isWaived: false,
                createdAt: {
                    gte: new Date(collection.date.setHours(0, 0, 0, 0)),
                    lt: new Date(collection.date.setHours(23, 59, 59, 999)),
                },
            },
        });
        const penaltyAmount = penalties.reduce((sum, p) => sum + p.amount, 0);

        // Calculate net payout
        const netPayout = revShareAmount + incentiveAmount - penaltyAmount;

        // Update collection
        const updatedCollection = await prisma.dailyCollection.update({
            where: { id: collectionId },
            data: {
                revSharePercentage,
                revShareAmount,
                incentiveAmount,
                penaltyAmount,
                netPayout,
            },
        });

        return updatedCollection;
    }

    /**
     * Reconcile daily collection
     */
    async reconcileCollection(params: {
        collectionId: string;
        reconciledBy: string;
        expectedRevenue?: number;
        reconciliationNotes?: string;
    }) {
        const collection = await prisma.dailyCollection.findUnique({
            where: { id: params.collectionId },
        });

        if (!collection) {
            throw new Error('Collection not found');
        }

        const variance = params.expectedRevenue
            ? collection.totalCollection - params.expectedRevenue
            : null;

        const updatedCollection = await prisma.dailyCollection.update({
            where: { id: params.collectionId },
            data: {
                expectedRevenue: params.expectedRevenue,
                variance,
                isReconciled: true,
                reconciledBy: params.reconciledBy,
                reconciledAt: new Date(),
                reconciliationNotes: params.reconciliationNotes,
            },
        });

        // Auto-calculate revenue share after reconciliation
        await this.calculateRevShare(params.collectionId);

        return updatedCollection;
    }

    /**
     * Process payout for a daily collection
     */
    async processPayout(collectionId: string) {
        const collection = await prisma.dailyCollection.findUnique({
            where: { id: collectionId },
            include: {
                driver: {
                    include: { user: true },
                },
            },
        });

        if (!collection) {
            throw new Error('Collection not found');
        }

        if (collection.isPaid) {
            throw new Error('Collection already paid');
        }

        if (!collection.isReconciled) {
            throw new Error('Collection must be reconciled before payout');
        }

        if (!collection.netPayout || collection.netPayout <= 0) {
            throw new Error('Net payout must be greater than 0');
        }

        const driver = collection.driver;

        // Validate bank details
        if (!driver.bankAccountNumber || !driver.bankIfscCode || !driver.bankAccountName) {
            throw new Error('Driver bank details not configured');
        }

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                driverId: driver.id,
                type: TransactionType.PAYOUT,
                amount: collection.netPayout,
                status: TransactionStatus.PENDING,
                paymentMethod: PaymentMethod.PG_UPI,
                collectionId: collection.id,
                description: `Daily payout - ${collection.date.toISOString().split('T')[0]}`,
            },
        });

        try {
            // Initiate payout via Easebuzz
            const payout = await easebuzzAdapter.createPayout({
                amount: collection.netPayout,
                beneficiaryName: driver.bankAccountName,
                beneficiaryAccount: driver.bankAccountNumber,
                beneficiaryIfsc: driver.bankIfscCode,
                purpose: `Daily Revenue Share - ${collection.date.toISOString().split('T')[0]}`,
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

            // Mark collection as paid
            await prisma.dailyCollection.update({
                where: { id: collectionId },
                data: {
                    isPaid: true,
                    paidAt: new Date(),
                    payoutTransactionId: transaction.id,
                },
            });

            return {
                success: true,
                txnId: payout.txnId,
                status: payout.status,
                utr: payout.utr,
                amount: collection.netPayout,
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
     * Get daily collections for a driver
     */
    async getDriverCollections(driverId: string, filters?: {
        startDate?: Date;
        endDate?: Date;
        isReconciled?: boolean;
        isPaid?: boolean;
    }) {
        return prisma.dailyCollection.findMany({
            where: {
                driverId,
                ...(filters?.startDate && {
                    date: { gte: filters.startDate },
                }),
                ...(filters?.endDate && {
                    date: { lte: filters.endDate },
                }),
                ...(filters?.isReconciled !== undefined && {
                    isReconciled: filters.isReconciled,
                }),
                ...(filters?.isPaid !== undefined && {
                    isPaid: filters.isPaid,
                }),
            },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get collection by ID
     */
    async getCollectionById(id: string) {
        return prisma.dailyCollection.findUnique({
            where: { id },
            include: {
                driver: true,
                vehicle: true,
                virtualQR: true,
            },
        });
    }

    /**
     * Get pending reconciliations (for admin dashboard)
     */
    async getPendingReconciliations(scope?: { fleetId?: string; hubIds?: string[] }) {
        return prisma.dailyCollection.findMany({
            where: {
                isReconciled: false,
                ...(scope?.fleetId
                    ? {
                          driver: {
                              fleetId: scope.fleetId,
                              ...(scope.hubIds && scope.hubIds.length > 0
                                  ? { hubId: { in: scope.hubIds } }
                                  : {}),
                          },
                      }
                    : {}),
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        mobile: true,
                        fleetId: true,
                        hubId: true,
                    },
                },
                vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
            },
            orderBy: { date: 'asc' },
        });
    }

    /**
     * Get pending payouts (for admin dashboard)
     */
    async getPendingPayouts(scope?: { fleetId?: string; hubIds?: string[] }) {
        return prisma.dailyCollection.findMany({
            where: {
                isReconciled: true,
                isPaid: false,
                netPayout: {
                    gt: 0,
                },
                ...(scope?.fleetId
                    ? {
                          driver: {
                              fleetId: scope.fleetId,
                              ...(scope.hubIds && scope.hubIds.length > 0
                                  ? { hubId: { in: scope.hubIds } }
                                  : {}),
                          },
                      }
                    : {}),
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
                        fleetId: true,
                        hubId: true,
                    },
                },
            },
            orderBy: { date: 'asc' },
        });
    }

    /**
     * Get driver payout summary
     */
    async getDriverPayoutSummary(driverId: string, startDate?: Date, endDate?: Date) {
        const collections = await this.getDriverCollections(driverId, {
            startDate,
            endDate,
        });

        const totalCollections = collections.reduce((sum, c) => sum + c.totalCollection, 0);
        const totalRevShare = collections.reduce((sum, c) => sum + (c.revShareAmount || 0), 0);
        const totalIncentives = collections.reduce((sum, c) => sum + c.incentiveAmount, 0);
        const totalPenalties = collections.reduce((sum, c) => sum + c.penaltyAmount, 0);
        const totalPayout = collections.reduce((sum, c) => sum + (c.netPayout || 0), 0);

        const paidCollections = collections.filter((c) => c.isPaid);
        const unpaidCollections = collections.filter((c) => !c.isPaid);

        return {
            totalDays: collections.length,
            totalCollections,
            totalRevShare,
            totalIncentives,
            totalPenalties,
            totalPayout,
            paidDays: paidCollections.length,
            unpaidDays: unpaidCollections.length,
            paidAmount: paidCollections.reduce((sum, c) => sum + (c.netPayout || 0), 0),
            unpaidAmount: unpaidCollections.reduce((sum, c) => sum + (c.netPayout || 0), 0),
        };
    }

    /**
     * Batch process payouts
     */
    async batchProcessPayouts(collectionIds: string[]) {
        const results = [];

        for (const collectionId of collectionIds) {
            try {
                const result = await this.processPayout(collectionId);
                results.push({ collectionId, ...result });
            } catch (error: any) {
                results.push({ collectionId, success: false, error: error.message });
            }
        }

        return results;
    }
}

export const payoutService = new PayoutService();
