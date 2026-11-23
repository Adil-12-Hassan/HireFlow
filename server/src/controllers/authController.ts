import type { Request, Response } from "express";
import * as authService from "../services/authService.js";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAuthCookies } from "../utils/cookies.js";
import { badRequest, unauthorized } from "../utils/errors.js";

// POST /auth/register -> 201
export async function register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    if (result.accessToken && result.refreshToken) {
        setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    res.status(201).json({
        id: result.id,
        email: result.email,
        needsVerification: result.needsVerification ?? false,
    });
}

// POST /auth/login -> 200
export async function login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ id: result.id, email: result.email });
}

// POST /auth/refresh -> 200
// Accepts only the HttpOnly refresh cookie.
export async function refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) {
        throw unauthorized("Session has expired, please sign in again");
    }
    const tokens = await authService.refreshSession(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(200).json({ ok: true });
}

// POST /auth/logout -> 204, no body
export async function logout(req: Request, res: Response): Promise<void> {
    const token = getAccessToken(req);
    if (!token) throw unauthorized();
    await authService.logout(token);
    clearAuthCookies(res);
    res.status(204).send();
}

// GET /auth/me -> 200
export async function me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw unauthorized();
    }
    const profile = await authService.getMe(req.user.id, req.user.email);
    res.status(200).json(profile);
}

// POST /auth/forgot-password -> 200, always the same message
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body);
    res.status(200).json({
        message: "If an account with this email exists, a reset link has been sent",
    });
}

// POST /auth/reset-password -> 200
export async function resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body);
    res.status(200).json({ message: "Password has been reset. Please sign in." });
}

// POST /auth/change-password -> 200, signed in only
export async function changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw unauthorized();
    }
    await authService.changePassword(req.user.id, req.body);
    res.status(200).json({ message: "Password changed" });
}

// GET /auth/verify?token_hash=... -> 200
export async function verifyEmail(req: Request, res: Response): Promise<void> {
    const tokenHash = req.query.token_hash as string | undefined;
    if (!tokenHash) {
        throw badRequest("Missing verification token");
    }
    const tokens = await authService.verifyEmail(tokenHash);
    if (tokens) {
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    }
    res.status(200).json({ verified: true });
}
