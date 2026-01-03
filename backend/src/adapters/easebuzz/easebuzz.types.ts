/**
 * Easebuzz Payment Gateway Types
 * 
 * TypeScript interfaces for Easebuzz API integration
 * Documentation: https://docs.easebuzz.in/
 */

// ============================================
// Payment Gateway (Payment In)
// ============================================

export interface InitiatePaymentRequest {
    key: string;              // Merchant key
    txnid: string;            // Unique transaction ID
    amount: string;           // Amount in INR (string format)
    productinfo: string;      // Product description
    firstname: string;        // Customer name
    phone: string;            // Customer phone (10 digits)
    email: string;            // Customer email
    surl: string;             // Success URL
    furl: string;             // Failure URL
    hash: string;             // SHA-512 hash
    udf1?: string;            // Custom field 1 (e.g., driverId)
    udf2?: string;            // Custom field 2 (e.g., transactionType)
    udf3?: string;            // Custom field 3
    udf4?: string;            // Custom field 4
    udf5?: string;            // Custom field 5
}

export interface PaymentResponse {
    status: number;           // 1 = success, 0 = failure
    data: string;             // Payment URL or error message
}

export interface PaymentWebhookPayload {
    key: string;              // Merchant key
    txnid: string;
    status: string;           // 'success', 'failure', 'pending'
    amount: string;
    firstname: string;
    email: string;
    phone: string;
    productinfo: string;
    hash: string;
    easepayid: string;        // Easebuzz payment ID
    bank_ref_num?: string;    // Bank reference number
    bankcode?: string;
    cardCategory?: string;
    card_type?: string;
    addedon: string;          // Timestamp
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    error_Message?: string;
}

// ============================================
// Payouts (Payment Out)
// ============================================

export interface CreatePayoutRequest {
    merchant_key: string;
    merchant_txn_id: string;  // Unique transaction ID
    beneficiary_name: string;
    beneficiary_account: string;
    beneficiary_ifsc: string;
    amount: string;           // Amount in INR
    purpose: string;          // Payout purpose
    transfer_mode: 'NEFT' | 'RTGS' | 'IMPS';
    hash: string;             // SHA-256 hash
    email?: string;           // Optional email
    phone?: string;           // Optional phone
}

export interface PayoutResponse {
    status: number;           // 1 = success, 0 = failure
    msg: string;
    data: {
        txn_id: string;         // Easebuzz transaction ID
        status: string;         // PENDING, SUCCESS, FAILED
        utr?: string;           // UTR number (if successful)
        merchant_txn_id: string;
    };
}

export interface PayoutStatusRequest {
    merchant_key: string;
    merchant_txn_id: string;
    hash: string;
}

export interface PayoutStatusResponse {
    status: number;
    msg: string;
    data: {
        txn_id: string;
        merchant_txn_id: string;
        status: string;         // PENDING, SUCCESS, FAILED
        utr?: string;
        amount: string;
        beneficiary_name: string;
        beneficiary_account: string;
        transfer_mode: string;
        created_at: string;
        updated_at: string;
    };
}

// ============================================
// Virtual Accounts (InstaCollect)
// ============================================

export interface CreateVirtualAccountRequest {
    merchant_key: string;
    virtual_account_name: string;  // Vehicle number or identifier
    customer_name: string;         // Fleet name
    customer_mobile: string;
    customer_email: string;
    udf1?: string;                 // Custom field (e.g., vehicleId)
    udf2?: string;
    hash: string;
}

export interface VirtualAccountResponse {
    status: number;
    msg: string;
    data: {
        virtual_account_id: string;
        virtual_account_number: string;
        ifsc_code: string;
        qr_code: string;              // Base64 QR code
        upi_id: string;
    };
}

export interface VirtualAccountWebhookPayload {
    merchant_key: string;
    virtual_account_id: string;
    txn_id: string;
    amount: string;
    payment_mode: string;         // UPI, NEFT, RTGS, IMPS
    utr: string;                  // UTR/reference number
    txn_date: string;             // Transaction timestamp
    udf1?: string;
    udf2?: string;
    hash: string;
}

// ============================================
// Common Types
// ============================================

export interface EasebuzzConfig {
    merchantKey: string;
    saltKey: string;
    environment: 'test' | 'production';
    baseUrl: string;
}

export interface HashGenerationParams {
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
    salt: string;
}

export interface PayoutHashParams {
    merchant_key: string;
    merchant_txn_id: string;
    amount: string;
    salt: string;
}

export interface VirtualAccountHashParams {
    merchant_key: string;
    virtual_account_name: string;
    customer_mobile: string;
    customer_email: string;
    customer_name?: string;   // Optional for some hash calculations
    udf1?: string;            // Optional custom field
    salt: string;
}

export type TransferMode = 'NEFT' | 'RTGS' | 'IMPS';
export type PaymentStatus = 'success' | 'failure' | 'pending';
export type PayoutStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
