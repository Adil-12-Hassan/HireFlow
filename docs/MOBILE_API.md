# Using the HireFlow API from Android and iOS (Swift)

The web app signs in with HttpOnly cookies. A native app has no browser cookie jar,
so the API has a token mode for it. Send this header on **every** request:

```
X-Client-Type: mobile
```

## Sign in

`POST /auth/login` with `{ "email": "...", "password": "..." }` returns:

```json
{ "id": "...", "email": "...", "accessToken": "...", "refreshToken": "..." }
```

No cookies are set in this mode. `POST /auth/register` and `GET /auth/verify` return the
tokens the same way when Supabase creates a session.

## Call protected routes

Send the access token on each request:

```
Authorization: Bearer <accessToken>
```

## Refresh

The access token is short lived. When a request returns `401`, call
`POST /auth/refresh` with `{ "refreshToken": "..." }`. The response has a new
`accessToken` and a new `refreshToken`. Always store the new refresh token, the old one
stops working. If refresh returns `401`, the user must sign in again.

## Sign out

`POST /auth/logout` with the Bearer header returns `204`. Delete both tokens from the device.

## Store tokens safely

- Android: Keystore-backed `EncryptedSharedPreferences` (or DataStore with encryption).
- iOS (Swift): Keychain. Never `UserDefaults`.

## Other things to know

- Errors always look like `{ "error": "message" }`.
- Lists return `{ "data": [...], "meta": { page, limit, total, totalPages, hasNextPage, hasPrevPage } }`.
- `GET /jobs/mine` lists the signed-in user's own jobs in every status (draft, open, closed).
- Rate limits are per IP. Many phones share one carrier IP, so keep retry logic gentle on `429`.
- Native apps send no `Origin` header, so CORS and the CSRF origin check do not apply to them.
