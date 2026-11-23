import { Router } from "express";
import { applicationRouter } from "./applications.js";
import { authRouter } from "./auth.js";
import { healthRouter } from "./health.js";
import { jobRouter } from "./jobs.js";
import { profileRouter } from "./profiles.js";

export const apiRouter = Router();

// Auth: POST /auth/register, POST /auth/login, POST /auth/refresh,
// POST /auth/logout, GET /auth/me, and the password and verify routes.
apiRouter.use("/auth", authRouter);

// Health: GET /health, GET /health/db, GET /health/metrics
apiRouter.use("/health", healthRouter);

// Profiles: GET /profiles, GET /profiles/me, GET /profiles/:id,
// PATCH /profiles/me, PUT /profiles/me/visibility, PUT /profiles/me/skills,
// and experiences and projects under /profiles/me
apiRouter.use("/profiles", profileRouter);

// Jobs: POST /jobs, GET /jobs, GET /jobs/:id, PATCH /jobs/:id
apiRouter.use("/jobs", jobRouter);

// Applications: POST /jobs/:id/applications, GET /jobs/:id/applications,
// GET /applications/me, GET /applications/:id/history,
// PATCH /applications/:id/status
// Mounted at / on purpose, not at /applications. This router uses
// full paths because it lives under both /jobs and /applications.
// If it was mounted at /applications, the /jobs/:id/applications
// routes would become /applications/jobs/:id/applications, which is wrong.
apiRouter.use("/", applicationRouter);
