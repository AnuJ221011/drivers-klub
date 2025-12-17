import axios from 'axios';

const EXOTEL_SID = process.env.EXOTEL_SID;
const EXOTEL_TOKEN = process.env.EXOTEL_TOKEN;
const EXOTEL_WHATSAPP_NUMBER = process.env.EXOTEL_WHATSAPP_NUMBER;
const EXOTEL_SMS_SENDER = process.env.EXOTEL_SMS_SENDER;

const auth = {
  username: EXOTEL_SID,
  password: EXOTEL_TOKEN,
};

// SEND WHATSAPP OTP
export async function sendWhatsappOtp(phone: string, otp: string) {
  const url = `https://api.exotel.com/v2/accounts/${EXOTEL_SID}/messages`;

  const payload = {
    from: `whatsapp:${EXOTEL_WHATSAPP_NUMBER}`,
    to: `whatsapp:${phone}`,
    template: {
      name: 'login_otp', // must be approved in Exotel
      language: 'en',
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otp }],
        },
      ],
    },
  };

  return axios.post(url, payload, { auth });
}

// SEND SMS OTP (FALLBACK)
export async function sendSmsOtp(phone: string, otp: string) {
  const url = `https://api.exotel.com/v1/Accounts/${EXOTEL_SID}/Sms/send.json`;

  const payload = {
    From: EXOTEL_SMS_SENDER,
    To: phone,
    Body: `Your Driver's Klub login OTP is ${otp}`,
  };

  return axios.post(url, payload, { auth });
}
