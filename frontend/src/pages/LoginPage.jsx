import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Input from '../components/Input';
import Button from '../components/Button';
import { login, sendOtp, verifyOtp } from '../api/auth.api';
import { setAuthToken, setLoggedIn } from '../utils/auth';

function normalizePhone(value) {
  // Keep digits and leading + only
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  return trimmed.replace(/\D/g, '');
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState('send'); // 'send' | 'verify'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const otpRef = useRef(null);

  const canSend = useMemo(() => normalizePhone(phone).length >= 10, [phone]);
  const canVerify = useMemo(() => otp.trim().length >= 4, [otp]);

  async function handleSendOtp(e) {
    e?.preventDefault?.();
    const normalized = normalizePhone(phone);
    if (!normalized) return toast.error('Please enter phone number');

    setLoading(true);
    try {
      // 1) create/fetch user + token (backend logic)
      const loginData = await login(normalized);
      const token = loginData?.token || null;
      setLoginToken(token);

      // 2) request OTP (needs token because notifications is behind gateway auth)
      const otpData = await sendOtp(normalized, token);
      toast.success(otpData?.message || 'OTP sent successfully');
      setStep('verify');
      setTimeout(() => otpRef.current?.focus?.(), 50);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start login');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e?.preventDefault?.();
    const normalized = normalizePhone(phone);
    if (!normalized) return toast.error('Phone number missing');
    if (!otp.trim()) return toast.error('Please enter OTP');

    setLoading(true);
    try {
      const data = await verifyOtp(normalized, otp.trim());
      if (data?.token) {
        setAuthToken(data.token);
        setLoggedIn();
      }
      toast.success(data?.message || 'Verified successfully');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP');
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
              <Input
                id="phone"
                label="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                inputMode="tel"
                autoComplete="tel"
                disabled={loading}
              />

              <Button
                type="submit"
                loading={loading}
                disabled={!canSend}
                className="w-full"
              >
                Send OTP via WhatsApp
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Input
                id="phone_readonly"
                label="Phone number"
                value={normalizePhone(phone)}
                onChange={() => {}}
                disabled
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

              <Button
                type="submit"
                loading={loading}
                disabled={!canVerify}
                className="w-full"
              >
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
                  onClick={handleSendOtp}
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
