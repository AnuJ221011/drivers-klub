import api from './axios';
import type { TokenPair } from '../models/auth/tokens';
import { getRefreshToken } from '../utils/auth';

export type SendOtpResponse = {
  message: string;
};

export type LogoutResponse = { message: string };

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const res = await api.post<SendOtpResponse>('/auth/send-otp', { phone });
  return res.data;
}

export async function verifyOtp(phone: string, otp: string): Promise<TokenPair> {
  // OTP bypass support (dev/staging):
  // Backend bypass triggers when:
  // - NODE_ENV !== "production"
  // - verifiedKey === OTP_BYPASS_KEY
  //
  // Configure frontend via VITE_OTP_BYPASS_KEY. If not set, we default to "pass"
  // in non-production builds so staging/dev can bypass without UI changes.
  const bypassKey =
    (import.meta.env.VITE_OTP_BYPASS_KEY as string | undefined) ??
    (import.meta.env.MODE !== 'production' ? 'pass' : undefined);

  const payload: { phone: string; otp: string; verifiedKey?: string } = { phone, otp };
  if (bypassKey) payload.verifiedKey = bypassKey;

  const res = await api.post<TokenPair>('/auth/verify-otp', payload);
  return res.data;
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  const res = await api.post<TokenPair>('/auth/refresh', { refreshToken });
  return res.data;
}


export async function logout(refreshToken?: string | null): Promise<LogoutResponse> {
  const token = refreshToken ?? getRefreshToken();
  const res = await api.post<LogoutResponse>('/auth/logout', token ? { refreshToken: token } : {});
  return res.data;
}