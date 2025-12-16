import axios from 'axios';

// Supports both older env names and Exotel docs naming:
// - v2 WhatsApp API: https://{AuthKey}:{AuthToken}@{SubDomain}/v2/accounts/{AccountSid}/messages
// - v1 SMS API: https://{SubDomain}/v1/Accounts/{AccountSid}/Sms/send.json (form-data / urlencoded)
const EXOTEL_SUBDOMAIN = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
const EXOTEL_ACCOUNT_SID = process.env.EXOTEL_ACCOUNT_SID || process.env.EXOTEL_SID;
const EXOTEL_AUTH_KEY = process.env.EXOTEL_AUTH_KEY || process.env.EXOTEL_SID;
const EXOTEL_AUTH_TOKEN = process.env.EXOTEL_AUTH_TOKEN || process.env.EXOTEL_TOKEN;

const EXOTEL_WHATSAPP_FROM = process.env.EXOTEL_WHATSAPP_NUMBER; // e.g. whatsapp:+91xxxxxxxxxx OR approved WhatsApp sender
const EXOTEL_SMS_SENDER = process.env.EXOTEL_SMS_SENDER;

const EXOTEL_STATUS_CALLBACK = process.env.EXOTEL_STATUS_CALLBACK;
const EXOTEL_CUSTOM_DATA = process.env.EXOTEL_CUSTOM_DATA;

// Optional DLT / SMS fields (India)
const EXOTEL_DLT_TEMPLATE_ID = process.env.EXOTEL_DLT_TEMPLATE_ID;
const EXOTEL_DLT_ENTITY_ID = process.env.EXOTEL_DLT_ENTITY_ID;

const auth = {
  username: EXOTEL_AUTH_KEY,
  password: EXOTEL_AUTH_TOKEN,
};

// SEND WHATSAPP OTP
export async function sendWhatsappOtp(phone, otp) {
  const url = `https://${EXOTEL_SUBDOMAIN}/v2/accounts/${EXOTEL_ACCOUNT_SID}/messages`;

  const payload = {
    ...(EXOTEL_CUSTOM_DATA ? { custom_data: EXOTEL_CUSTOM_DATA } : {}),
    ...(EXOTEL_STATUS_CALLBACK ? { status_callback: EXOTEL_STATUS_CALLBACK } : {}),
    whatsapp: {
      messages: [
        {
          from: EXOTEL_WHATSAPP_FROM,
          to: phone,
          content: {
            type: 'text',
            text: {
              body: `Your Driver's Klub login OTP is ${otp}`,
            },
          },
        },
      ],
    },
  };

  return axios.post(url, payload, { auth });
}

// SEND SMS OTP (FALLBACK)
export async function sendSmsOtp(phone, otp) {
  const url = `https://${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Sms/send.json`;

  // Exotel expects form-data; application/x-www-form-urlencoded works well with axios.
  const payload = new URLSearchParams();
  payload.set('From', EXOTEL_SMS_SENDER || '');
  payload.set('To', phone);
  payload.set('Body', `Your Driver's Klub login OTP is ${otp}`);
  if (EXOTEL_DLT_TEMPLATE_ID) payload.set('DltTemplateId', EXOTEL_DLT_TEMPLATE_ID);
  if (EXOTEL_DLT_ENTITY_ID) payload.set('DltEntityId', EXOTEL_DLT_ENTITY_ID);

  return axios.post(url, payload, {
    auth,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}
