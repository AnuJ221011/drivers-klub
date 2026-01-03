/**
 * Easebuzz Utility Functions
 * 
 * Hash generation and verification for Easebuzz API
 */

import crypto from 'crypto';
import {
    HashGenerationParams,
    PayoutHashParams,
    VirtualAccountHashParams,
} from './easebuzz.types.js';

/**
 * Generate SHA-512 hash for payment gateway requests
 * 
 * Hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|||||||||salt
 */
export function generatePaymentHash(params: HashGenerationParams): string {
    const {
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        udf1 = '',
        udf2 = '',
        udf3 = '',
        udf4 = '',
        udf5 = '',
        salt,
    } = params;

    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}|||||||||${salt}`;

    return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Verify payment webhook hash
 * 
 * Hash format (reverse): salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
export function verifyPaymentWebhookHash(
    webhookData: {
        key: string;
        txnid: string;
        amount: string;
        productinfo: string;
        firstname: string;
        email: string;
        udf1?: string;
        udf2?: string;
        udf3?: string;
        udf4?: string;
        udf5?: string;
        status: string;
        hash: string;
    },
    salt: string
): boolean {
    const {
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        udf1 = '',
        udf2 = '',
        udf3 = '',
        udf4 = '',
        udf5 = '',
        status,
        hash: receivedHash,
    } = webhookData;

    const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

    const calculatedHash = crypto
        .createHash('sha512')
        .update(hashString)
        .digest('hex');

    return calculatedHash === receivedHash;
}

/**
 * Generate SHA-256 hash for payout requests
 * 
 * Hash format: merchant_key|merchant_txn_id|amount|salt
 */
export function generatePayoutHash(params: PayoutHashParams): string {
    const { merchant_key, merchant_txn_id, amount, salt } = params;

    const hashString = `${merchant_key}|${merchant_txn_id}|${amount}|${salt}`;

    return crypto.createHash('sha256').update(hashString).digest('hex');
}

/**
 * Generate hash for virtual account creation
 * 
 * Hash format: merchant_key|virtual_account_name|customer_mobile|customer_email|salt
 */
export function generateVirtualAccountHash(
    params: VirtualAccountHashParams
): string {
    const { merchant_key, virtual_account_name, customer_mobile, customer_email, salt } =
        params;

    const hashString = `${merchant_key}|${virtual_account_name}|${customer_mobile}|${customer_email}|${salt}`;

    return crypto.createHash('sha256').update(hashString).digest('hex');
}

/**
 * Verify virtual account webhook hash
 * 
 * Hash format: merchant_key|virtual_account_id|txn_id|amount|salt
 */
export function verifyVirtualAccountWebhookHash(
    webhookData: {
        merchant_key: string;
        virtual_account_id: string;
        txn_id: string;
        amount: string;
        hash: string;
    },
    salt: string
): boolean {
    const { merchant_key, virtual_account_id, txn_id, amount, hash: receivedHash } =
        webhookData;

    const hashString = `${merchant_key}|${virtual_account_id}|${txn_id}|${amount}|${salt}`;

    const calculatedHash = crypto
        .createHash('sha256')
        .update(hashString)
        .digest('hex');

    return calculatedHash === receivedHash;
}

/**
 * Generate unique transaction ID
 * Format: TXN_<timestamp>_<random>
 */
export function generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN_${timestamp}_${random}`;
}

/**
 * Format amount for Easebuzz (string with 2 decimal places)
 */
export function formatAmount(amount: number): string {
    return amount.toFixed(2);
}

/**
 * Parse amount from Easebuzz response (string to number)
 */
export function parseAmount(amount: string): number {
    return parseFloat(amount);
}
