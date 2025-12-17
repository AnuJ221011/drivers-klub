import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, clearAuthToken } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // If token is invalid/expired, log out silently
    if (err?.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(err);
  },
);

export default api;

