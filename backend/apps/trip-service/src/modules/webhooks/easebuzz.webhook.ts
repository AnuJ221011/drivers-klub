import type { Request, Response } from 'express';
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';
import type {
    PaymentWebhookPayload,
    VirtualAccountWebhookPayload,
} from '../../adapters/easebuzz/easebuzz.types.js';
import { prisma } from '@driversklub/database';
import { TransactionStatus, PaymentMethod } from '@prisma/client';
import { rentalService } from '../../core/payment/rental.service.js';
import { orderService } from '../../core/payment/order.service.js';
import { logger } from '@driversklub/common';

/**
 * Handle Easebuzz Payment Gateway webhook
 * Called when payment is completed (success/failure)
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
    try {
        const webhookData: PaymentWebhookPayload = req.body;

        // Verify webhook authenticity
        const isValid = easebuzzAdapter.verifyPaymentWebhook(webhookData);
        if (!isValid) {
            logger.error('Invalid payment webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const {
            txnid,
            status,
            amount,
            easepayid,
        } = webhookData;

        logger.info(`Payment webhook received: ${txnid}, status: ${status}`);

        // Map Easebuzz status to our TransactionStatus
        let transactionStatus: TransactionStatus;
        if (status === 'success') {
            transactionStatus = TransactionStatus.SUCCESS;
        } else if (status === 'failure') {
            transactionStatus = TransactionStatus.FAILED;
        } else {
            transactionStatus = TransactionStatus.PENDING;
        }

        // Update transaction in database
        const transaction = await prisma.transaction.findFirst({
            where: { easebuzzTxnId: txnid },
        });

        if (transaction) {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: transactionStatus,
                    easebuzzStatus: status,
                    easebuzzPaymentId: easepayid,
                    updatedAt: new Date(),
                },
            });

            // If payment successful, handle post-payment actions
            if (transactionStatus === TransactionStatus.SUCCESS) {
                await handleSuccessfulPayment(transaction, parseFloat(amount));
            }

            logger.info(`Transaction ${txnid} updated to ${transactionStatus}`);
        } else {
            logger.warn(`Transaction not found for txnid: ${txnid}`);
        }

        // Always respond with 200 to acknowledge webhook
        res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        logger.error('Payment webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Handle Easebuzz Virtual Account webhook
 * Called when payment is received on vehicle QR code
 */
export const handleVirtualAccountWebhook = async (req: Request, res: Response) => {
    try {
        const webhookData: VirtualAccountWebhookPayload = req.body;

        // Verify webhook authenticity
        const isValid = easebuzzAdapter.verifyVirtualAccountWebhook(webhookData);
        if (!isValid) {
            logger.error('Invalid virtual account webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const {
            virtual_account_id,
            txn_id,
            amount,
            payment_mode,
            utr,
            txn_date,
            udf2: type // 'VEHICLE' or 'ORDER'
        } = webhookData;

        logger.info(`Virtual account payment: ${txn_id}, amount: ${amount}, type: ${type || 'VEHICLE'}`);

        // HANDLE INSTACOLLECT ORDER PAYMENT
        if (type === 'ORDER') {
            await orderService.recordPayment(virtual_account_id, parseFloat(amount), {
                easebuzzTxnId: txn_id,
                easebuzzPaymentId: utr,
                paymentMode: payment_mode,
                txnDate: txn_date,
            });
            return res.status(200).json({ status: 'ok' });
        }

        // HANDLE VEHICLE QR PAYMENT (Default)
        // Find the virtual QR record
        const virtualQR = await prisma.virtualQR.findFirst({
            where: { virtualAccountId: virtual_account_id },
            include: { vehicle: true },
        });

        if (!virtualQR) {
            logger.error(`Virtual QR not found for account: ${virtual_account_id}`);
            return res.status(404).json({ error: 'Virtual account not found' });
        }

        // ... existing logic for vehicle ...
        const activeAssignment = await prisma.assignment.findFirst({
            where: {
                vehicleId: virtualQR.vehicleId,
                status: 'ACTIVE',
                endTime: null,
            },
            orderBy: { startTime: 'desc' },
        });

        if (!activeAssignment) {
            logger.warn(`No active assignment for vehicle: ${virtualQR.vehicleId}`);
            // Store payment but don't attribute to driver yet
            return res.status(200).json({ status: 'ok', message: 'No active assignment' });
        }

        const driverId = activeAssignment.driverId;
        const paymentAmount = parseFloat(amount);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update or create daily collection record
        const dailyCollection = await prisma.dailyCollection.upsert({
            where: {
                driverId_date: {
                    driverId,
                    date: today,
                },
            },
            update: {
                qrCollectionAmount: {
                    increment: paymentAmount,
                },
                totalCollection: {
                    increment: paymentAmount,
                },
                updatedAt: new Date(),
            },
            create: {
                driverId,
                vehicleId: virtualQR.vehicleId,
                virtualQRId: virtualQR.id,
                date: today,
                qrCollectionAmount: paymentAmount,
                cashCollectionAmount: 0,
                totalCollection: paymentAmount,
            },
        });

        // Create transaction record
        await prisma.transaction.create({
            data: {
                driverId,
                type: 'DAILY_COLLECTION',
                amount: paymentAmount,
                status: TransactionStatus.SUCCESS,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                paymentMethod: PaymentMethod.VIRTUAL_QR,
                easebuzzTxnId: txn_id,
                easebuzzStatus: 'success',
                easebuzzPaymentId: utr,
                collectionId: dailyCollection.id,
                description: `QR payment - Vehicle ${virtualQR.vehicle.vehicleNumber}`,
                metadata: {
                    paymentMode: payment_mode,
                    txnDate: txn_date,
                    virtualAccountId: virtual_account_id,
                },
            },
        });

        logger.info(`QR payment recorded for driver ${driverId}: ₹${paymentAmount}`);

        res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        logger.error('Virtual account webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Handle post-payment actions based on transaction type
 */
async function handleSuccessfulPayment(
    transaction: any,
    amount: number
): Promise<void> {
    const { driverId, type } = transaction;

    switch (type) {
        case 'DEPOSIT':
            // Add to driver's deposit balance
            await prisma.driver.update({
                where: { id: driverId },
                data: {
                    depositBalance: {
                        increment: amount,
                    },
                },
            });
            logger.info(`Deposit added for driver ${driverId}: ₹${amount}`);
            break;

        case 'RENTAL':
            // Activate rental plan
            if (transaction.metadata && typeof transaction.metadata === 'object' && 'rentalPlanId' in transaction.metadata) {
                await rentalService.activateRentalPlan({
                    driverId,
                    rentalPlanId: (transaction.metadata as any).rentalPlanId,
                    transactionId: transaction.id,
                });
                logger.info(`Rental plan activated for driver ${driverId}: ₹${amount}`);
            } else {
                logger.error(`Failed to activate rental: Missing rentalPlanId in metadata for txn ${transaction.id}`);
            }
            break;

        case 'PENALTY':
            // Mark penalty as paid
            if (transaction.penaltyId) {
                await prisma.penalty.update({
                    where: { id: transaction.penaltyId },
                    data: {
                        isPaid: true,
                        paidAt: new Date(),
                        transactionId: transaction.id,
                    },
                });
                logger.info(`Penalty paid for driver ${driverId}: ₹${amount}`);
            }
            break;

        default:
            logger.info(`Payment successful for ${type}: ₹${amount}`);
    }
}
