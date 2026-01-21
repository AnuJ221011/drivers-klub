import crypto from "crypto";
import axios from "axios";
import { OtpRepository } from "./otp.repository.js";
import { ApiError } from "@driversklub/common";

const repo = new OtpRepository();
const DEFAULT_EXOTEL_BASE_URL = "https://api.exotel.com";
const DEFAULT_EXOTEL_SMS_ENDPOINT = "sendCopy";
const DEFAULT_OTP_TEMPLATE = "Your Driver's Klub OTP is {{otp}}";

const getExotelBaseUrl = () => {
    const rawBaseUrl = process.env.EXOTEL_BASE_URL;
    if (!rawBaseUrl) {
        return DEFAULT_EXOTEL_BASE_URL;
    }
    const trimmed = rawBaseUrl.trim().replace(/\/+$/, "");
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

const getExotelSmsEndpoint = () => {
    const rawEndpoint = process.env.EXOTEL_SMS_ENDPOINT;
    if (!rawEndpoint) {
        return DEFAULT_EXOTEL_SMS_ENDPOINT;
    }
    return rawEndpoint.trim().replace(/^\/+|\/+$/g, "");
};

const renderOtpTemplate = (template: string, otp: string) => {
    return template
        .replace(/#var#/gi, otp)
        .replace(/\{\{\s*otp\s*\}\}/gi, otp)
        .replace(/\{otp\}/gi, otp);
};

const buildOtpBody = (otp: string) => {
    const rawTemplate = process.env.EXOTEL_SMS_BODY_TEMPLATE?.trim();
    const template = rawTemplate || DEFAULT_OTP_TEMPLATE;
    return renderOtpTemplate(template, otp);
};

const buildExotelSendUrl = (accountSid: string) => {
    const endpoint = getExotelSmsEndpoint();
    return `${getExotelBaseUrl()}/v1/Accounts/${accountSid}/Sms/${endpoint}`;
};

const appendIfPresent = (
    params: URLSearchParams,
    key: string,
    value?: string
) => {
    if (value) {
        params.append(key, value);
    }
};

export class OtpService {
    generateOtp(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    async sendOtp(phone: string) {
        await repo.invalidateOld(phone);

        const otp = this.generateOtp();
        const expiresAt = new Date(
            Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000
        );

        const isProduction = process.env.NODE_ENV === "production";
        const exotelAccountSid = process.env.EXOTEL_ACCOUNT_SID;
        const exotelApiKey = process.env.EXOTEL_API_KEY;
        const exotelApiToken = process.env.EXOTEL_API_TOKEN;
        const exotelSenderId = process.env.EXOTEL_SENDER_ID;
        const exotelDltEntityId = process.env.EXOTEL_DLT_ENTITY_ID;
        const exotelDltTemplateId = process.env.EXOTEL_DLT_TEMPLATE_ID;
        const exotelSmsType = process.env.EXOTEL_SMS_TYPE;
        const exotelSmsPriority = process.env.EXOTEL_SMS_PRIORITY;
        const exotelEncodingType = process.env.EXOTEL_ENCODING_TYPE;
        const exotelCustomField = process.env.EXOTEL_CUSTOM_FIELD;
        const exotelStatusCallback = process.env.EXOTEL_STATUS_CALLBACK_URL;

        // LOG FIRST (So we see it even if DB fails)
        if (
            !isProduction ||
            !exotelAccountSid ||
            !exotelApiKey ||
            !exotelApiToken ||
            !exotelSenderId
        ) {
            console.log("==========================================");
            console.log(`[DEV OTP] Phone: ${phone}`);
            console.log(`[DEV OTP] Code : ${otp}`);
            console.log("==========================================");
        }

        try {
            await repo.create({ phone, otp, expiresAt });
        } catch (error) {
            console.error("OTP DB Persist Failed:", error);
            throw new ApiError(500, "Failed to persist OTP");
        }

        // 🔹 EXOTEL SEND OTP (IF CONFIGURED)
        if (exotelAccountSid && exotelApiKey && exotelApiToken && exotelSenderId) {
            try {
                const payload = new URLSearchParams({
                    From: exotelSenderId,
                    To: phone,
                    Body: buildOtpBody(otp)
                });
                appendIfPresent(payload, "DltEntityId", exotelDltEntityId);
                appendIfPresent(payload, "DltTemplateId", exotelDltTemplateId);
                appendIfPresent(payload, "SmsType", exotelSmsType);
                appendIfPresent(payload, "Priority", exotelSmsPriority);
                appendIfPresent(payload, "EncodingType", exotelEncodingType);
                appendIfPresent(payload, "CustomField", exotelCustomField);
                appendIfPresent(payload, "StatusCallback", exotelStatusCallback);
                await axios.post(
                    buildExotelSendUrl(exotelAccountSid),
                    payload.toString(),
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        auth: {
                            username: exotelApiKey,
                            password: exotelApiToken
                        }
                    }
                );
            } catch (error) {
                console.error("Exotel OTP Send Failed:", error);
                throw new ApiError(500, "Failed to send OTP via SMS provider");
            }
        }

        return { success: true };
    }

    async verifyOtp(
        phone: string,
        otp: string,
        verifiedKey?: string
    ) {
        /**
         * 🚧 DEV / STAGING OTP BYPASS
         * This block exists ONLY because SMS provider (Exotel) is not available.
         * REMOVE this block in production.
         */
        if (
            process.env.NODE_ENV !== "production" &&
            verifiedKey === process.env.OTP_BYPASS_KEY
        ) {
            return true;
        }

        // 🔒 REAL OTP VERIFICATION (PRODUCTION FLOW)
        const record = await repo.findActive(phone);
        if (!record) {
            throw new ApiError(400, "OTP expired or not found");
        }

        if (record.attempts >= Number(process.env.OTP_MAX_ATTEMPTS || 3)) {
            throw new ApiError(429, "OTP attempt limit exceeded");
        }

        if (record.otp !== otp) {
            await repo.incrementAttempts(record.id);
            throw new ApiError(400, "Invalid OTP");
        }

        // Delete OTP after successful verification to prevent reuse
        await repo.deleteOtp(record.id);
        return true;
    }
}
