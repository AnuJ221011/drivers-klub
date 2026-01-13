import { prisma } from "@driversklub/database";
import { easebuzzAdapter } from '../../adapters/easebuzz/easebuzz.adapter.js';
import { PaymentOrder, OrderStatus, Transaction, TransactionStatus, PaymentMethod, TransactionType } from '@prisma/client';

export class OrderService {
    /**
     * Create a new InstaCollect Order
     */
    async createOrder(data: {
        userId?: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        description?: string;
        amount: number;
    }): Promise<PaymentOrder> {
        // 1. Create Virtual Account via Easebuzz
        // We use the Order ID (generated effectively by UUID) as part of the vehicle number field 
        // because Easebuzz expects a unique identifier.
        // For 'ORDER' type, we will use a generated reference.

        const referenceId = `ORD-${Date.now()}`;

        const vaResponse = await easebuzzAdapter.createVirtualAccount({
            vehicleNumber: referenceId, // Using Ref ID as identifiers
            vehicleId: referenceId,     // Storing Ref ID in udf1
            fleetName: data.customerName,
            customerMobile: data.customerPhone,
            customerEmail: data.customerEmail || 'no-email@example.com',
            type: 'ORDER', // Critical: Signals this is an Order QR
        });

        // 2. Create PaymentOrder Record
        const order = await prisma.paymentOrder.create({
            data: {
                userId: data.userId,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                customerEmail: data.customerEmail,
                description: data.description,
                totalAmount: data.amount,
                collectedAmount: 0,
                remainingAmount: data.amount,
                status: OrderStatus.PENDING,
                // VA Details
                virtualAccountId: vaResponse.virtualAccountId,
                virtualAccountNumber: vaResponse.virtualAccountNumber,
                ifscCode: vaResponse.ifscCode,
                qrCodeBase64: vaResponse.qrCodeBase64,
                upiId: vaResponse.upiId,
            },
        });

        return order;
    }

    /**
     * Get Order by ID
     */
    async getOrder(id: string): Promise<(PaymentOrder & { transactions: Transaction[] }) | null> {
        return prisma.paymentOrder.findUnique({
            where: { id },
            include: {
                transactions: true, // Show history
            }
        });
    }

    /**
     * List Orders for a User
     */
    async listOrders(userId: string): Promise<PaymentOrder[]> {
        return prisma.paymentOrder.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Record a Payment (Called by Webhook)
     */
    async recordPayment(
        virtualAccountId: string,
        amount: number,
        txnDetails: {
            easebuzzTxnId: string;
            easebuzzPaymentId?: string; // UTR
            paymentMode: string;
            txnDate: string;
        }
    ): Promise<void> {
        // 1. Find Order
        const order = await prisma.paymentOrder.findUnique({
            where: { virtualAccountId },
        });

        if (!order) {
            throw new Error(`Order not found for VA: ${virtualAccountId}`);
        }

        // 2. Create Transaction Record
        await prisma.transaction.create({
            data: {
                paymentOrderId: order.id,
                driverId: order.userId, // Link to creator if available
                type: TransactionType.ORDER_PAYMENT,
                amount: amount,
                status: TransactionStatus.SUCCESS,
                paymentMethod: PaymentMethod.VIRTUAL_QR,
                description: `Payment for Order #${order.id.slice(0, 8)}`,

                // Easebuzz details
                easebuzzTxnId: txnDetails.easebuzzTxnId,
                easebuzzPaymentId: txnDetails.easebuzzPaymentId,
                easebuzzStatus: 'success',
                metadata: {
                    paymentMode: txnDetails.paymentMode,
                    txnDate: txnDetails.txnDate,
                }
            }
        });

        // 3. Update Order Ledger
        const newCollected = order.collectedAmount + amount;
        const newRemaining = order.totalAmount - newCollected;

        let newStatus: OrderStatus = OrderStatus.PARTIAL;
        if (newCollected >= order.totalAmount) {
            newStatus = OrderStatus.COMPLETED;
        }

        await prisma.paymentOrder.update({
            where: { id: order.id },
            data: {
                collectedAmount: newCollected,
                remainingAmount: newRemaining,
                status: newStatus,
            }
        });

        console.log(`Order ${order.id} updated: Paid ${amount}, Remaining ${newRemaining}, Status ${newStatus}`);
    }
}

export const orderService = new OrderService();
