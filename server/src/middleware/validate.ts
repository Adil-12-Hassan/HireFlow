import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import { badRequest } from "../utils/errors.js";

type ValidateSchemas = {
    body?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
};

// Run Zod schemas for body, URL params, and query string.
// The parsed result replaces the original data, so controllers
// only ever see clean, typed values.
export function validate(schemas: ValidateSchemas) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            if (schemas.query) {
                // Express 5 exposes query through a getter without a setter.
                Object.defineProperty(req, "query", {
                    value: schemas.query.parse(req.query),
                    configurable: true,
                    enumerable: true,
                    writable: true,
                });
            }
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                const first = err.issues[0];
                return next(badRequest(first?.message ?? "Invalid request"));
            }
            return next(err);
        }
    };
}
