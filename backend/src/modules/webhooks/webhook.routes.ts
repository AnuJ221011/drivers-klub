import { Router } from 'express';
import {
    handlePaymentWebhook,
    handleVirtualAccountWebhook,
} from './easebuzz.webhook.js';

const router = Router();

// Easebuzz Payment Gateway webhook
router.post('/easebuzz/payment', handlePaymentWebhook);

// Easebuzz Virtual Account webhook
router.post('/easebuzz/virtual-account', handleVirtualAccountWebhook);

export default router;
