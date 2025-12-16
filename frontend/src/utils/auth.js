const TOKEN_KEY = 'dk_admin_token';

export function setAuthToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken() {
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

export function isAuthenticated() {
  return Boolean(getAuthToken());
}
