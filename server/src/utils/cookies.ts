import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";

export const ACCESS_COOKIE = "hireflow_access";
export const REFRESH_COOKIE = "hireflow_refresh";

// Access is short lived, refresh lives longer so the user stays signed in.
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Cookies are always HttpOnly. They are Secure + SameSite=None (so a frontend on
// another domain can use the API) when NODE_ENV is production OR the connection is
// HTTPS (also behind a proxy, trust proxy is on). Production can never send a
// cookie without Secure. Only a local http://localhost setup gets Lax, because
// browsers reject SameSite=None without Secure.
function baseOptions(res: Response, path: string): CookieOptions {
    const secure = env.NODE_ENV === "production" || res.req.secure;
    return {
        httpOnly: true,
        secure,
        sameSite: secure ? "none" : "lax",
        path,
    };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie(ACCESS_COOKIE, accessToken, {
        ...baseOptions(res, "/"),
        maxAge: ACCESS_MAX_AGE_MS,
    });
    // The refresh cookie uses path "/" so it still reaches /auth/refresh when the
    // frontend proxies the API under another prefix, for example /api/auth/refresh.
    res.cookie(REFRESH_COOKIE, refreshToken, {
        ...baseOptions(res, "/"),
        maxAge: REFRESH_MAX_AGE_MS,
    });
    // Remove the old refresh cookie that was scoped to /auth, so a browser
    // never sends two refresh cookies at once.
    res.clearCookie(REFRESH_COOKIE, baseOptions(res, "/auth"));
}

export function clearAuthCookies(res: Response): void {
    // Clear must use the same path as set, or the browser will not delete the cookie.
    res.clearCookie(ACCESS_COOKIE, baseOptions(res, "/"));
    res.clearCookie(REFRESH_COOKIE, baseOptions(res, "/"));
    res.clearCookie(REFRESH_COOKIE, baseOptions(res, "/auth"));
}

// Mobile apps (Android, iOS) send "X-Client-Type: mobile". They get the tokens
// in the JSON body and send them back in the Authorization header, because a
// native app has no browser cookie jar to rely on.
export function isTokenClient(req: Request): boolean {
    return req.headers["x-client-type"] === "mobile";
}

// Access token: "Authorization: Bearer <token>" first, then the HttpOnly cookie.
export function getAccessToken(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (header && header.toLowerCase().startsWith("bearer ")) {
        const token = header.slice(7).trim();
        if (token) return token;
    }
    return req.cookies?.[ACCESS_COOKIE];
}

// Refresh token: the cookie for browsers, or the JSON body for token clients.
export function getRefreshToken(req: Request): string | undefined {
    if (isTokenClient(req)) {
        const fromBody = (req.body as { refreshToken?: unknown } | undefined)?.refreshToken;
        if (typeof fromBody === "string" && fromBody.length > 0) return fromBody;
    }
    return req.cookies?.[REFRESH_COOKIE];
}
