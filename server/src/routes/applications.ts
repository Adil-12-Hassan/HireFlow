import { Router } from "express";
import * as applicationController from "../controllers/applicationController.js";
import { requireAuth } from "../middleware/auth.js";
import { applicationLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationQuerySchema, uuidParamSchema } from "../validators/common.js";
import {
    applyToJobSchema,
    changeApplicationStatusSchema,
} from "../validators/applicationSchemas.js";

export const applicationRouter = Router();

// Applications live under two prefixes, /jobs and /applications,
// so this router uses full paths and is mounted at / in index.ts.
// That is different from the other routers, which use a short prefix.

// POST /jobs/:id/applications -> 201, signed in only
applicationRouter.post(
    "/jobs/:id/applications",
    requireAuth,
    applicationLimiter,
    validate({ params: uuidParamSchema, body: applyToJobSchema }),
    asyncHandler(applicationController.applyToJob),
);

// GET /applications/me -> 200, signed in only
// This must come before /applications/:id/history, or "me"
// would be treated as an id.
applicationRouter.get(
    "/applications/me",
    requireAuth,
    validate({ query: paginationQuerySchema }),
    asyncHandler(applicationController.listMyApplications),
);

// GET /jobs/:id/applications -> 200, job owner only
applicationRouter.get(
    "/jobs/:id/applications",
    requireAuth,
    validate({ params: uuidParamSchema, query: paginationQuerySchema }),
    asyncHandler(applicationController.listJobApplications),
);

// GET /applications/:id/history -> 200, applicant and job owner only
applicationRouter.get(
    "/applications/:id/history",
    requireAuth,
    validate({ params: uuidParamSchema }),
    asyncHandler(applicationController.getApplicationHistory),
);

// PATCH /applications/:id/status -> 200, owner or applicant
applicationRouter.patch(
    "/applications/:id/status",
    requireAuth,
    validate({ params: uuidParamSchema, body: changeApplicationStatusSchema }),
    asyncHandler(applicationController.changeApplicationStatus),
);
