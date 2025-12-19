const ACCESS_TOKEN_KEY = 'dk_access_token';
const REFRESH_TOKEN_KEY = 'dk_refresh_token';

export function setAuthToken(token: string | null | undefined) {
  if (!token) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setRefreshToken(token: string | null | undefined) {
  if (!token) return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Backwards-compatible helpers used by the app
export function setLoggedIn() {
  // no-op; token presence is the source of truth
}

export function clearLoggedIn() {
  // no-op; token presence is the source of truth
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}