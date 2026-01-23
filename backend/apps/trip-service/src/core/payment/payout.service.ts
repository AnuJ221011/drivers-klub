import { prisma, vehicleSelect } from "@driversklub/database";
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
    // calcRevShare method removed as per 'Manual Payout' requirement.
    // Payouts are now determined solely via Bulk CSV Upload.

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

        // Auto-calculate logic removed. Reconciliation now just certifies the totalCollection.
        // await this.calculateRevShare(params.collectionId);

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
                vehicle: { select: vehicleSelect },
                virtualQR: true,
            },
        });
    }

    /**
     * Get pending reconciliations (for admin dashboard)
     */
    async getPendingReconciliations(scope?: { fleetId?: string | null; hubIds?: string[] }) {
        const fleetId = scope?.fleetId ?? null;
        const hubIds = Array.isArray(scope?.hubIds) ? scope!.hubIds! : [];

        return prisma.dailyCollection.findMany({
            where: {
                isReconciled: false,
                ...(fleetId
                    ? {
                        driver: {
                            fleetId,
                            ...(hubIds.length ? { hubId: { in: hubIds } } : {}),
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
    async getPendingPayouts(scope?: { fleetId?: string | null; hubIds?: string[] }) {
        const fleetId = scope?.fleetId ?? null;
        const hubIds = Array.isArray(scope?.hubIds) ? scope!.hubIds! : [];

        return prisma.dailyCollection.findMany({
            where: {
                isReconciled: true,
                isPaid: false,
                netPayout: {
                    gt: 0,
                },
                ...(fleetId
                    ? {
                        driver: {
                            fleetId,
                            ...(hubIds.length ? { hubId: { in: hubIds } } : {}),
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
        // 1. Get Collections (Gross Earnings)
        const collections = await this.getDriverCollections(driverId, {
            startDate,
            endDate,
        });

        // 2. Get Actual Payouts (Real Money Paid)
        const payouts = await prisma.transaction.findMany({
            where: {
                driverId,
                type: TransactionType.PAYOUT,
                status: TransactionStatus.SUCCESS,
                ...(startDate || endDate ? {
                    createdAt: {
                        ...(startDate && { gte: startDate }),
                        ...(endDate && { lte: endDate })
                    }
                } : {})
            }
        });

        // 3. Get Incentives & Penalties (For strict equation balance)
        const dateFilter = startDate || endDate ? {
            createdAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate })
            }
        } : {};

        const incentives = await prisma.incentive.findMany({
            where: { driverId, ...dateFilter }
        });

        const penalties = await prisma.penalty.findMany({
            where: { driverId, ...dateFilter }
        });

        // 4. Calculate Summary adhering to User Equation:
        // Equation: Earnings - Penalties + Incentives - Deductions = Payout
        // Therefore: Deductions = Earnings - Penalties + Incentives - Payout

        const totalCollections = collections.reduce((sum, c) => sum + c.totalCollection, 0);
        const totalIncentives = incentives.reduce((sum, i) => sum + i.amount, 0);
        const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
        const totalPayout = payouts.reduce((sum, t) => sum + t.amount, 0);

        const netEarnings = totalCollections + totalIncentives - totalPenalties;
        // If Payout > NetEarnings (Advance Payment), Deductions is negative (meaning platform paid extra?)
        // Usually NetEarnings > Payout, so Deductions is positive (Platform Commission).
        const deductions = netEarnings - totalPayout;

        return {
            totalDays: collections.length,
            totalCollections, // Gross Earnings
            totalIncentives,  // Added
            totalPenalties,   // Deducted
            totalPayout,     // Actual Paid
            deductions,      // Derived Commission
            balance: 0,      // Explicitly 0
            // Compatibility
            totalRevShare: 0,
            paidDays: 0,
            unpaidDays: collections.length,
            paidAmount: totalPayout,
            unpaidAmount: 0
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

    /**
     * Process bulk payout from CSV file
     */
    async processBulkPayout(fileBuffer: Buffer) {
        const Readable = (await import('stream')).Readable;
        const csv = (await import('csv-parser')).default;

        const results: any[] = [];
        const processStats = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            amountDisbursed: 0,
            details: [] as any[]
        };

        return new Promise((resolve, reject) => {
            const stream = Readable.from(fileBuffer);

            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    processStats.total = results.length;

                    for (const row of results) {
                        const description = row.payoutCycle || 'Bulk Payout Upload';
                        const amount = parseFloat(row.amount || '0');

                        try {
                            // 1. Identify Driver
                            let driver = null;
                            if (row.phone) {
                                driver = await prisma.driver.findFirst({
                                    where: { mobile: row.phone },
                                    include: { user: true }
                                });
                            } else if (row.accountNumber) {
                                driver = await prisma.driver.findFirst({
                                    where: { bankAccountNumber: row.accountNumber },
                                    include: { user: true }
                                });
                            }

                            if (!driver) {
                                throw new Error(`Driver not found for Phone: ${row.phone}`);
                            }

                            // 2. Validate Bank Details
                            if (!driver.bankAccountNumber || !driver.bankIfscCode || !driver.bankAccountName) {
                                throw new Error('Driver Bank Details Missing');
                            }

                            // 3. Idempotency Check (Prevent Double Pay)
                            // We check if a payout of same amount & description exists for this driver today or recently
                            const duplicate = await prisma.transaction.findFirst({
                                where: {
                                    driverId: driver.id,
                                    type: TransactionType.PAYOUT,
                                    amount: amount,
                                    description: description,
                                    status: { in: [TransactionStatus.SUCCESS, TransactionStatus.PENDING] }
                                }
                            });

                            if (duplicate) {
                                processStats.skipped++;
                                processStats.details.push({
                                    phone: row.phone,
                                    status: 'SKIPPED',
                                    message: 'Duplicate transaction found'
                                });
                                continue;
                            }

                            // 4. Create PENDING Transaction
                            // This locks the intent to pay
                            let transaction = null;
                            if (amount > 0) {
                                transaction = await prisma.transaction.create({
                                    data: {
                                        driverId: driver.id,
                                        type: TransactionType.PAYOUT,
                                        amount: amount,
                                        status: TransactionStatus.PENDING, // <--- Starts as PENDING
                                        paymentMethod: PaymentMethod.PG_UPI, // or IMPS/BANK_TRANSFER
                                        description: description,
                                        metadata: {
                                            source: 'bulk_upload',
                                            rawRow: row
                                        }
                                    }
                                });

                                // 5. Execute Payout via Easebuzz
                                try {
                                    const payoutResult = await easebuzzAdapter.createPayout({
                                        amount: amount,
                                        beneficiaryName: driver.bankAccountName,
                                        beneficiaryAccount: driver.bankAccountNumber,
                                        beneficiaryIfsc: driver.bankIfscCode,
                                        purpose: description,
                                        transferMode: 'IMPS',
                                        email: driver.user.phone ? `${driver.user.phone}@driversklub.com` : 'admin@driversklub.com',
                                        phone: driver.mobile
                                    });

                                    // 6a. Success: Update Transaction
                                    await prisma.transaction.update({
                                        where: { id: transaction.id },
                                        data: {
                                            status: TransactionStatus.SUCCESS,
                                            easebuzzTxnId: payoutResult.txnId,
                                            easebuzzPaymentId: payoutResult.easebuzzTxnId,
                                            easebuzzStatus: payoutResult.status,
                                            metadata: {
                                                ...((transaction.metadata as object) || {}),
                                                utr: payoutResult.utr
                                            }
                                        }
                                    });

                                    processStats.amountDisbursed += amount;

                                } catch (payoutError: any) {
                                    // 6b. Failure: Update Transaction to FAILED
                                    console.error(`Payout API Failed for ${driver.id}:`, payoutError);
                                    await prisma.transaction.update({
                                        where: { id: transaction.id },
                                        data: {
                                            status: TransactionStatus.FAILED,
                                            metadata: {
                                                ...((transaction.metadata as object) || {}),
                                                failureReason: payoutError.message
                                            }
                                        }
                                    });
                                    throw new Error(`Easebuzz Error: ${payoutError.message}`);
                                }
                            }

                            // 7. Handle Penalty (Record Tracking Only)
                            const penalty = parseFloat(row.penalty || '0');
                            if (penalty > 0) {
                                await prisma.penalty.create({
                                    data: {
                                        driverId: driver.id,
                                        type: 'MONETARY',
                                        amount: penalty,
                                        reason: `Bulk Penalty: ${description}`,
                                        isPaid: true,
                                        paidAt: new Date(),
                                        createdBy: 'SYSTEM_BULK_UPLOAD'
                                    }
                                });
                            }

                            // 8. Handle Incentive (Record Tracking Only)
                            const incentive = parseFloat(row.incentive || '0');
                            if (incentive > 0) {
                                await prisma.incentive.create({
                                    data: {
                                        driverId: driver.id,
                                        amount: incentive,
                                        reason: `Bulk Incentive: ${description}`,
                                        isPaid: true,
                                        paidAt: new Date(),
                                        createdBy: 'SYSTEM_BULK_UPLOAD'
                                    }
                                });
                            }

                            processStats.success++;
                            processStats.details.push({
                                phone: row.phone,
                                status: 'SUCCESS',
                                driverId: driver.id,
                                amount: amount,
                                utr: transaction?.metadata ? (transaction.metadata as any).utr : 'N/A'
                            });

                        } catch (error: any) {
                            processStats.failed++;
                            processStats.details.push({
                                phone: row.phone,
                                status: 'FAILED',
                                error: error.message
                            });
                        }
                    }
                    resolve(processStats);
                })
                .on('error', (error) => reject(error));
        });
    }
}

export const payoutService = new PayoutService();
