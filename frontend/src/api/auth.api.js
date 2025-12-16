import api from './axios';

export async function sendOtp(phone) {
  const res = await api.post('/api/auth/login', { phone });
  return res.data;
}

export async function verifyOtp(phone, otp) {
  const res = await api.post('/api/auth/verify-otp', { phone, otp });
  return res.data;
}
