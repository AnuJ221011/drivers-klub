import api from './axios';

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type SendOtpResponse = {
  message: string;
};

export type VerifyOtpResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

// Step 1: ensure user exists (backend creates if missing) and get a token
export async function login(phone: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/api/auth/login', { phone });
  return res.data;
}

// Step 2: request OTP (gateway currently protects notifications routes)
export async function sendOtp(phone: string, token?: string | null): Promise<SendOtpResponse> {
  const res = await api.post<SendOtpResponse>(
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

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const res = await api.post<VerifyOtpResponse>('/api/auth/verify-otp', { phone, otp });
  return res.data;
}

