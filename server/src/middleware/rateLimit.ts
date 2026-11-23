import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

// All limiters reply with the same error shape as the rest of the API:
// { "error": "message" } with status 429.
function tooMany(message: string) {
    return (_req: Request, res: Response) => {
        res.status(429).json({ error: message });
    };
}

// General API use: 300 requests per 15 minutes per IP.
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooMany("Too many requests, please try again later"),
});

// Register and login: 10 attempts per 15 minutes per IP.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooMany("Too many auth attempts, please try again later"),
});

// Login is stricter: 5 attempts per 15 minutes per IP.
// This slows password spraying and credential stuffing.
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooMany("Too many login attempts, please try again in 15 minutes"),
});

// Password reset request: 5 per hour per IP.
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooMany("Too many password reset requests, please try again later"),
});

// Search and discovery: 60 per 15 minutes per IP.
export const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooMany("Too many search requests, please try again later"),
});

// Applying to jobs: 20 per hour per IP.
export const applicationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooMany("Too many applications, please try again later"),
});
