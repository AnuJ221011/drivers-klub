const TOKEN_KEY = 'dk_admin_token';

export function setAuthToken(token: string | null | undefined) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
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
