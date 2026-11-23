import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";

// Last middleware in Express. Every error passed with next(err)
// ends up here, so the client always gets the same shape.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err && typeof err === "object" && "type" in err) {
        if (err.type === "entity.parse.failed") {
            res.status(400).json({ error: "Invalid JSON body" });
            return;
        }
        if (err.type === "entity.too.large") {
            res.status(413).json({ error: "Request body is too large" });
            return;
        }
    }
    if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    // Unexpected error: log the full detail on the server for us to fix,
    // but send only a generic message to the browser.
    // Never send a stack trace or a raw database error to the client.
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
}
