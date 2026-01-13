import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import PhoneInput from '../components/ui/PhoneInput';
import Input from '../components/LoginInput';
import Button from '../components/ui/Button';
import { sendOtp, verifyOtp } from '../api/auth.api';
import { setLoggedIn } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

function normalizePhoneDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

type Step = 'send' | 'verify';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybeAny = err as { response?: { data?: unknown } };
    const data = maybeAny.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      return String((data as Record<string, unknown>).message);
    }
  }
  return fallback;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens } = useAuth();

  const [step, setStep] = useState<Step>('send');
  const [phone, setPhone] = useState<string>(''); // digits only
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const otpRef = useRef<HTMLInputElement | null>(null);

  const canSend = useMemo(() => normalizePhoneDigits(phone).length === 10, [phone]);
  const canVerify = useMemo(() => otp.trim().length >= 4, [otp]);

  async function handleSendOtp(e?: FormEvent) {
    e?.preventDefault?.();
    const normalized = normalizePhoneDigits(phone);
    if (!normalized) return toast.error('Please enter phone number');
    if (normalized.length !== 10) return toast.error('Phone number must be 10 digits');

    setLoading(true);
    try {
      const otpData = await sendOtp(normalized);

      toast.success(otpData?.message || 'OTP sent successfully');
      setStep('verify');
      setTimeout(() => otpRef.current?.focus?.(), 50);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e?: FormEvent) {
    e?.preventDefault?.();
    const normalized = normalizePhoneDigits(phone);
    if (!normalized) return toast.error('Phone number missing');
    if (!otp.trim()) return toast.error('Please enter OTP');

    setLoading(true);
    try {
      const tokens = await verifyOtp(normalized, otp.trim());
      if (tokens?.accessToken && tokens?.refreshToken) {
        setTokens(tokens);
      }
      setLoggedIn();
      toast.success('Verified successfully');
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Invalid or expired OTP'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Admin Login</h1>
            <p className="mt-1 text-sm text-gray-600">
              {step === 'send'
                ? 'Enter your phone number to receive an OTP on WhatsApp.'
                : 'Enter the OTP sent to your WhatsApp.'}
            </p>
          </div>

          {step === 'send' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <PhoneInput
                id="phone"
                label="Phone number"
                value={phone}
                onChange={setPhone}
                disabled={loading}
                // match login styling
                wrapperClassName=""
                labelClassName="mb-1 text-sm font-medium text-gray-700"
                prefixClassName="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-l-lg"
                inputClassName="rounded-r-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-black"
                helperClassName="mt-1 text-xs"
              />

              <Button type="submit" loading={loading} disabled={!canSend} className="w-full">
                Get OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <PhoneInput
                id="phone_readonly"
                label="Phone number"
                value={phone}
                onChange={() => {}}
                disabled
                wrapperClassName=""
                labelClassName="mb-1 text-sm font-medium text-gray-700"
                prefixClassName="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-l-lg"
                inputClassName="rounded-r-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-black"
                helperClassName="mt-1 text-xs"
              />

              <Input
                ref={otpRef}
                id="otp"
                label="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={loading}
              />

              <Button type="submit" loading={loading} disabled={!canVerify} className="w-full">
                Verify OTP
              </Button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm font-medium text-gray-900 underline underline-offset-4"
                  onClick={() => {
                    setStep('send');
                    setOtp('');
                  }}
                  disabled={loading}
                >
                  Change phone
                </button>

                <button
                  type="button"
                  className="text-sm font-medium text-gray-900 underline underline-offset-4"
                  onClick={() => void handleSendOtp()}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}