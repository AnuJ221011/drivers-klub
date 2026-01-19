import { Router } from 'express';
import type { Request, Response } from 'express';
import {
    handlePaymentWebhook,
    handleVirtualAccountWebhook,
} from './easebuzz.webhook.js';

const router = Router();

// Easebuzz Payment Gateway webhook
router.post('/easebuzz/payment', handlePaymentWebhook);

// Easebuzz Virtual Account webhook
router.post('/easebuzz/virtual-account', handleVirtualAccountWebhook);

// ============================================
// PUBLIC PAYMENT REDIRECT HANDLERS
// (No authentication required - Easebuzz redirects here)
// ============================================

/**
 * Payment Success Redirect
 * GET /webhooks/payment/success
 * Easebuzz redirects here after successful payment
 */
router.get('/payment/success', (req: Request, res: Response) => {
    const { txnid, amount, status } = req.query;

    // Return a simple HTML page that can communicate with mobile app
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f9f0; }
                .success { color: #28a745; font-size: 48px; }
                h1 { color: #333; }
                p { color: #666; }
                .amount { font-size: 24px; font-weight: bold; color: #28a745; }
                .btn { 
                    background: #28a745; color: white; padding: 15px 30px; 
                    border: none; border-radius: 8px; font-size: 18px; 
                    cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="success">✓</div>
            <h1>Payment Successful!</h1>
            <p class="amount">₹${amount || 'N/A'}</p>
            <p>Transaction ID: ${txnid || 'N/A'}</p>
            <p>Your deposit has been added to your account.</p>
            <a href="driversklub://payment/success?txnid=${txnid}&amount=${amount}" class="btn">Return to App</a>
            <script>
                // Try to redirect to app after 3 seconds
                setTimeout(function() {
                    window.location.href = 'driversklub://payment/success?txnid=${txnid}&amount=${amount}';
                }, 3000);
            </script>
        </body>
        </html>
    `);
});

/**
 * Payment Failure Redirect
 * GET /webhooks/payment/failure
 * Easebuzz redirects here after failed payment
 */
router.get('/payment/failure', (req: Request, res: Response) => {
    const { txnid, amount, error_Message } = req.query;

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Failed</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fff5f5; }
                .failure { color: #dc3545; font-size: 48px; }
                h1 { color: #333; }
                p { color: #666; }
                .error { color: #dc3545; }
                .btn { 
                    background: #dc3545; color: white; padding: 15px 30px; 
                    border: none; border-radius: 8px; font-size: 18px; 
                    cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="failure">✕</div>
            <h1>Payment Failed</h1>
            <p class="error">${error_Message || 'Transaction could not be completed'}</p>
            <p>Transaction ID: ${txnid || 'N/A'}</p>
            <a href="driversklub://payment/failure?txnid=${txnid}" class="btn">Return to App</a>
            <script>
                setTimeout(function() {
                    window.location.href = 'driversklub://payment/failure?txnid=${txnid}';
                }, 3000);
            </script>
        </body>
        </html>
    `);
});

export default router;
