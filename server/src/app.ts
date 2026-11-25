import express, { type RequestHandler } from "express";
import helmetImport, { type HelmetOptions } from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { requestTimer } from "./middleware/requestTimer.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { originCheck } from "./middleware/originCheck.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { notFound } from "./utils/errors.js";
import { isAllowedOrigin } from "./utils/origins.js";

// Helmet ships separate ESM/CJS typings. Depending on how the toolchain resolves
// the package (local tsc vs Vercel's builder), the default import can be either
// the function itself or a namespace object holding it as `.default`.
// Normalise both shapes so `helmet()` is always callable.
const helmet = ((helmetImport as unknown as { default?: unknown }).default ??
    helmetImport) as (options?: Readonly<HelmetOptions>) => RequestHandler;

export function createApp() {
    const app = express();

    // Behind Render / Railway, the real client IP is in a proxy header.
    // This lets rate limiting see the real IP, not the proxy IP.
    app.set("trust proxy", 1);

    // 1. Timer first, so it measures the whole request.
    app.use(requestTimer);

    // 2. Helmet adds safe security headers.
    app.use(helmet());

    // 3. CORS: only our frontend, and cookies are allowed.
    app.use(
        cors({
            // No Origin header means a non-browser client (mobile app, curl): allow it.
            origin: (origin, callback) => {
                callback(null, !origin || isAllowedOrigin(origin, env.ALLOWED_ORIGINS));
            },
            credentials: true,
        }),
    );

    // 4. General rate limit for all routes.
    app.use(generalLimiter);

    // 5. JSON body, max 100kb. Bigger bodies are rejected.
    app.use(express.json({ limit: "100kb" }));

    // 6. Read cookies into req.cookies.
    app.use(cookieParser());

    // 7. CSRF origin check for POST, PUT, PATCH, DELETE.
    app.use(originCheck);

    // 8. All API routes: /auth, /health, and later /profiles, /jobs, /applications.
    app.use(apiRouter);

    // 9. Unknown route: 404 in the same error shape.
    app.use((_req, _res, next) => {
        next(notFound("Route not found"));
    });

    // 10. Error handler last, so it catches everything above.
    app.use(errorHandler);

    return app;
}
