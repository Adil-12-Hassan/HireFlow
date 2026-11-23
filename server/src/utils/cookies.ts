import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";

export const ACCESS_COOKIE = "hireflow_access";
export const REFRESH_COOKIE = "hireflow_refresh";

// Access is short lived, refresh lives longer so the user stays signed in.
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function baseOptions(path: string): CookieOptions {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        path,
    };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie(ACCESS_COOKIE, accessToken, {
        ...baseOptions("/"),
        maxAge: ACCESS_MAX_AGE_MS,
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
        ...baseOptions("/auth"),
        maxAge: REFRESH_MAX_AGE_MS,
    });
}

export function clearAuthCookies(res: Response): void {
    // Clear must use the same path as set, or the browser will not delete the cookie.
    res.clearCookie(ACCESS_COOKIE, baseOptions("/"));
    res.clearCookie(REFRESH_COOKIE, baseOptions("/auth"));
}

export function getAccessToken(req: Request): string | undefined {
    return req.cookies?.[ACCESS_COOKIE];
}

export function getRefreshToken(req: Request): string | undefined {
    return req.cookies?.[REFRESH_COOKIE];
}
