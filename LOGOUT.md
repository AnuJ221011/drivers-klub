# Logout (End-to-End)

This document describes the **logout flow only**, from the frontend UI down to backend token revocation.

---

## Frontend → User Experience

### Where it lives
- **Header dropdown**: `frontend/src/components/layout/Header.tsx`

### User steps
1. User clicks the **initials avatar** in the header.
2. A dropdown opens with **Logout**.
3. On clicking **Logout**, the app shows a confirmation dialog:
   - **Message**: `"Are you sure you want to logout?"`
4. If user confirms, logout is executed. If user cancels, nothing happens.

---

## Frontend → Client Logic

### Tokens (storage)
- **Access token key**: `dk_access_token`
- **Refresh token key**: `dk_refresh_token`
- Stored in `localStorage` via: `frontend/src/utils/auth.ts`

### API call
- **Function**: `logout(...)` in `frontend/src/api/auth.api.ts`
- **Request**: `POST /auth/logout`
- **Body**: `{ "refreshToken": "<refresh-token>" }` (sent when available)
- **Headers**: `Authorization: Bearer <access-token>` is automatically attached by Axios when present.

### Auth context logout behavior
Logout is centralized in `frontend/src/context/AuthContext.tsx`:
1. Calls backend logout (best-effort).
2. Clears local tokens from `localStorage`.
3. Resets auth state.
4. Redirects to `/login`.

**Important**: Even if the backend call fails (offline / server down), the frontend still clears the session locally so the user is logged out on that device.

---

## Backend → API

### Endpoint
- **Method/Path**: `POST /auth/logout`
- **Content-Type**: `application/json`
- **Auth**: Optional, but recommended:
  - `Authorization: Bearer <ACCESS_TOKEN>`

### Request body (optional)

```json
{
  "refreshToken": "<refresh-token>"
}
```

### Response (success)

```json
{
  "message": "Logged out"
}
```

### Behavior (what actually happens)
Backend stores refresh tokens in DB (`RefreshToken` table). Logout revokes them:
- If `refreshToken` is provided: delete that token from DB (best-effort).
- If backend can identify the user (via access token or a valid refresh JWT): delete **all** refresh tokens for that user (logout from all sessions).

After logout, the client cannot refresh using revoked tokens; `/auth/refresh` will return **401** for revoked tokens.

---

## End-to-End Sequence (What happens on logout)

1. **User clicks initials → Logout** in header.
2. Frontend shows confirm dialog `"Are you sure you want to logout?"`.
3. On confirm, frontend sends `POST /auth/logout` with refresh token (if available) and access token header (if available).
4. Backend deletes refresh token rows from DB.
5. Frontend clears `dk_access_token` and `dk_refresh_token` from `localStorage`.
6. Frontend redirects to `/login`.

---

## Examples

### cURL

```bash
curl -X POST "http://localhost:4000/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

### Postman
- Create request: `POST {{BASE_URL}}/auth/logout`
- Set header: `Authorization: Bearer {{ACCESS_TOKEN}}`
- Body (raw JSON):

```json
{
  "refreshToken": "{{REFRESH_TOKEN}}"
}
```

Optional “Tests” tab snippet to clear env vars after logout:

```javascript
pm.environment.unset("ACCESS_TOKEN");
pm.environment.unset("REFRESH_TOKEN");
```
