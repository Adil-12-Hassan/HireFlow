import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { forbidden } from "../utils/errors.js";

// CSRF protection for cookie-authenticated writes.
// A browser always sends an Origin header for a cross-site request.
// If a user is tricked into visiting an evil site, that site can make
// the browser send our cookies to our API, but it cannot fake the Origin.
// So we block any state-changing request whose Origin is not our frontend.
export function originCheck(req: Request, _res: Response, next: NextFunction): void {
    // Safe methods do not change data, so they do not need this check.
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
        return next();
    }

    const origin = req.headers.origin;

    // No Origin header: this is not a browser request, for example curl or Postman.
    // Let it through, auth will still check the cookies.
    if (!origin) {
        return next();
    }

    if (origin === env.FRONTEND_URL) {
        return next();
    }

    return next(forbidden("Request origin is not allowed"));
}
