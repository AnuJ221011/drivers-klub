import api from './axios';

// Step 1: ensure user exists (backend creates if missing) and get a token
export async function login(phone) {
  const res = await api.post('/api/auth/login', { phone });
  return res.data;
}

// Step 2: request OTP (gateway currently protects notifications routes)
export async function sendOtp(phone, token) {
  const res = await api.post(
    '/api/notifications/send-otp',
    { phone },
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  );
  return res.data;
}

export async function verifyOtp(phone, otp) {
  const res = await api.post('/api/auth/verify-otp', { phone, otp });
  return res.data;
}
