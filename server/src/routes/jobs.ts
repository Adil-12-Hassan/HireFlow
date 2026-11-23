import { Router } from "express";
import * as jobController from "../controllers/jobController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { searchLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationQuerySchema, uuidParamSchema } from "../validators/common.js";
import { createJobSchema, updateJobSchema } from "../validators/jobSchemas.js";

export const jobRouter = Router();

// POST /jobs -> 201, signed in only
jobRouter.post(
    "/",
    requireAuth,
    validate({ body: createJobSchema }),
    asyncHandler(jobController.createJob),
);

// GET /jobs -> 200, public, open jobs only, with search and pagination
jobRouter.get(
    "/",
    optionalAuth,
    searchLimiter,
    validate({ query: paginationQuerySchema }),
    asyncHandler(jobController.listJobs),
);

// GET /jobs/:id -> 200, public if open, owner only if draft or closed
jobRouter.get(
    "/:id",
    optionalAuth,
    validate({ params: uuidParamSchema }),
    asyncHandler(jobController.getJob),
);

// PATCH /jobs/:id -> 200, owner only
jobRouter.patch(
    "/:id",
    requireAuth,
    validate({ params: uuidParamSchema, body: updateJobSchema }),
    asyncHandler(jobController.updateJob),
);
