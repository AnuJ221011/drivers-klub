import type { Request, Response } from 'express';
import { orderService } from '../../core/payment/order.service.js';
import { ApiResponse, logger } from '@driversklub/common';

/**
 * Create a new Payment Order
 * POST /payment/orders
 */
export const createOrder = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any; // Optional: Link to creator
    const {
        customerName,
        customerPhone,
        customerEmail,
        description,
        amount
    } = req.body;

    if (!customerName || !customerPhone || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const order = await orderService.createOrder({
            userId,
            customerName,
            customerPhone,
            customerEmail,
            description,
            amount: Number(amount)
        });

        ApiResponse.send(res, 201, order, 'Payment order created successfully');
    } catch (error: any) {
        logger.error('[OrderController] Create Order Error:', error);
        res.status(500).json({
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};

/**
 * Get Order Details
 * GET /payment/orders/:id
 */
export const getOrder = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const order = await orderService.getOrder(id);

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    ApiResponse.send(res, 200, order, 'Order details retrieved');
};

/**
 * List Orders for User
 * GET /payment/orders
 */
export const listOrders = async (req: Request, res: Response) => {
    const { id: userId } = req.user as any;

    const orders = await orderService.listOrders(userId);

    ApiResponse.send(res, 200, orders, 'Orders retrieved successfully');
};