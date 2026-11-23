import type { NextFunction, Request, Response } from "express";
import { supabaseAnon } from "../config/supabase.js";
import { getAccessToken } from "../utils/cookies.js";
import { unauthorized } from "../utils/errors.js";

export type AuthUser = {
    id: string;
    email?: string | undefined;
};

// Tell TypeScript that every Express request can carry a logged-in user.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

// Required login: used on protected routes.
// The user id comes only from the verified cookie, never from the URL or body.
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const token = getAccessToken(req);
        if (!token) {
            throw unauthorized();
        }

        const { data, error } = await supabaseAnon.auth.getUser(token);
        if (error || !data.user) {
            throw unauthorized();
        }

        req.user = {
            id: data.user.id,
            email: data.user.email ?? undefined,
        };
        next();
    } catch (err) {
        next(err);
    }
}

// Optional login: used on public routes like open jobs and public profiles.
// If there is a valid cookie, we attach the user so visibility can use it.
// If there is no cookie, or it is invalid, we continue as a guest.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const token = getAccessToken(req);
        if (!token) {
            return next();
        }

        const { data, error } = await supabaseAnon.auth.getUser(token);
        if (error || !data.user) {
            return next();
        }

        req.user = {
            id: data.user.id,
            email: data.user.email ?? undefined,
        };
        next();
    } catch {
        next();
    }
}
