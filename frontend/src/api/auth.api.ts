import api from './axios';
import type { TokenPair } from '../models/auth/tokens';

export type SendOtpResponse = {
  message: string;
};

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const res = await api.post<SendOtpResponse>('/auth/send-otp', { phone });
  return res.data;
}

export async function verifyOtp(phone: string, otp: string): Promise<TokenPair> {
  const res = await api.post<TokenPair>('/auth/verify-otp', { phone, otp });
  return res.data;
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  const res = await api.post<TokenPair>('/auth/refresh', { refreshToken });
  return res.data;
}
