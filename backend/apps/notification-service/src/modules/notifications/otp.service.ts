import crypto from "crypto";
import axios from "axios";
import { ApiError, logger } from "@driversklub/common";

export interface OtpSendRequest {
  phone: string;
  otp: string;
  message?: string;
}

const DEFAULT_EXOTEL_BASE_URL = "https://api.exotel.com";
const DEFAULT_EXOTEL_SMS_ENDPOINT = "send";
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
  /**
   * Send OTP via Exotel SMS API
   */
    async sendOtpViaExotel(request: OtpSendRequest): Promise<boolean> {
        const exotelAccountSid = process.env.EXOTEL_ACCOUNT_SID;
        const exotelApiKey = process.env.EXOTEL_API_KEY;
        const exotelApiToken = process.env.EXOTEL_API_TOKEN;
        const exotelSenderId = process.env.EXOTEL_SENDER_ID;
        const exotelDltEntityId = process.env.EXOTEL_DLT_ENTITY_ID;
        const exotelDltTemplateId = process.env.EXOTEL_DLT_TEMPLATE_ID;
        const exotelSmsType = process.env.EXOTEL_SMS_TYPE;
        const exotelSmsPriority = process.env.EXOTEL_SMS_PRIORITY;
        if (!exotelAccountSid || !exotelApiKey || !exotelApiToken || !exotelSenderId) {
            throw new ApiError(500, "Exotel credentials not configured");
        }

        const { phone, otp, message } = request;

        const formattedPhone = this.formatPhoneNumber(phone);

        try {
            const payload = new URLSearchParams({
                From: exotelSenderId,
                To: formattedPhone,
                Body: buildOtpBody(otp)
            });
            appendIfPresent(payload, "DltEntityId", exotelDltEntityId);
            appendIfPresent(payload, "DltTemplateId", exotelDltTemplateId);
            appendIfPresent(payload, "SmsType", exotelSmsType);
            appendIfPresent(payload, "Priority", exotelSmsPriority);
            const response = await axios.post(
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

            logger.info(`OTP sent successfully via Exotel to ${phone}`, {
            response: response.data,
          });

          return true;
        } catch (error: any) {
      logger.error(`Failed to send OTP via Exotel to ${phone}`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Exotel OTP send failed: ${error.message}`);
    }
    }


  /**
   * Format phone number to ensure it's in the correct format for Exotel
   * Exotel typically expects phone numbers with country code (e.g., +919876543210)
   */
  formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");

    // If phone doesn't start with +, assume it's Indian number and add +91
    if (!cleaned.startsWith("+")) {
      // If it starts with 0, remove it
      if (cleaned.startsWith("0")) {
        cleaned = cleaned.substring(1);
      }
      // Add +91 if it's a 10-digit number
      if (cleaned.length === 10) {
        cleaned = `+91${cleaned}`;
      }
    }

    return cleaned;
  }
}
