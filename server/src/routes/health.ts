import { Router } from "express";
import * as healthController from "../controllers/healthController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthRouter = Router();

// GET /health -> 200
healthRouter.get("/", asyncHandler(healthController.health));

// GET /health/db -> 200 or 503
healthRouter.get("/db", asyncHandler(healthController.healthDb));

// GET /health/metrics -> 200
healthRouter.get("/metrics", asyncHandler(healthController.healthMetrics));
