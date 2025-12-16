import api from './axios';

export async function sendOtp(phone) {
  // OTP is sent by notification-service
  const res = await api.post('/api/notifications/send-otp', { phone });
  return res.data;
}

export async function verifyOtp(phone, otp) {
  const res = await api.post('/api/auth/verify-otp', { phone, otp });
  return res.data;
}
