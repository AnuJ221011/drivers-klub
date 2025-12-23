import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { clearAuthToken, getAuthToken, getRefreshToken, setAuthToken, setRefreshToken } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const nextAccess = res.data?.accessToken;
    const nextRefresh = res.data?.refreshToken;
    if (nextAccess) setAuthToken(nextAccess);
    if (nextRefresh) setRefreshToken(nextRefresh);

    return nextAccess || null;
  } catch {
    return null;
  }
}

api.interceptors.response.use((res) => res, async (err: AxiosError) => {
  const status = err?.response?.status;
  const originalConfig = err.config as RetryableRequestConfig | undefined;

  // One-shot refresh + retry on 401
  if (status === 401 && originalConfig && !originalConfig._retry) {
    originalConfig._retry = true;

    const nextAccess = await refreshAccessToken();
    if (nextAccess) {
      originalConfig.headers = originalConfig.headers || {};
      (originalConfig.headers as Record<string, string>).Authorization = `Bearer ${nextAccess}`;
      return api.request(originalConfig);
    }

    clearAuthToken();
    // Ensure the app doesn't keep rendering protected pages without a session.
    // (PrivateRoute will also enforce this, but redirecting here makes the failure immediate.)
    if (window.location.pathname !== '/login') window.location.href = '/login';
  }

  return Promise.reject(err);
});

export default api;