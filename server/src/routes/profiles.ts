import { Router } from "express";
import * as profileController from "../controllers/profileController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { searchLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationQuerySchema, uuidParamSchema } from "../validators/common.js";
import {
    createExperienceSchema,
    createProjectSchema,
    setSkillsSchema,
    updateExperienceSchema,
    updateProfileSchema,
    updateProjectSchema,
    updateVisibilitySchema,
} from "../validators/profileSchemas.js";

export const profileRouter = Router();

// GET /profiles -> 200, public discovery with search and pagination
profileRouter.get(
    "/",
    optionalAuth,
    searchLimiter,
    validate({ query: paginationQuerySchema }),
    asyncHandler(profileController.listProfiles),
);

// GET /profiles/me -> 200, signed in only
// This must come before GET /:id, or "me" would be treated as an id.
profileRouter.get("/me", requireAuth, asyncHandler(profileController.getMyProfile));

// GET /profiles/:id -> 200, filtered by visibility
profileRouter.get(
    "/:id",
    optionalAuth,
    validate({ params: uuidParamSchema }),
    asyncHandler(profileController.getProfile),
);

// PATCH /profiles/me -> 200
profileRouter.patch(
    "/me",
    requireAuth,
    validate({ body: updateProfileSchema }),
    asyncHandler(profileController.updateMyProfile),
);

// PUT /profiles/me/visibility -> 200
profileRouter.put(
    "/me/visibility",
    requireAuth,
    validate({ body: updateVisibilitySchema }),
    asyncHandler(profileController.updateMyVisibility),
);

// PUT /profiles/me/skills -> 200
profileRouter.put(
    "/me/skills",
    requireAuth,
    validate({ body: setSkillsSchema }),
    asyncHandler(profileController.setMySkills),
);

// POST /profiles/me/experiences -> 201
profileRouter.post(
    "/me/experiences",
    requireAuth,
    validate({ body: createExperienceSchema }),
    asyncHandler(profileController.createExperience),
);

// PATCH /profiles/me/experiences/:id -> 200
profileRouter.patch(
    "/me/experiences/:id",
    requireAuth,
    validate({ params: uuidParamSchema, body: updateExperienceSchema }),
    asyncHandler(profileController.updateExperience),
);

// DELETE /profiles/me/experiences/:id -> 204
profileRouter.delete(
    "/me/experiences/:id",
    requireAuth,
    validate({ params: uuidParamSchema }),
    asyncHandler(profileController.deleteExperience),
);

// POST /profiles/me/projects -> 201
profileRouter.post(
    "/me/projects",
    requireAuth,
    validate({ body: createProjectSchema }),
    asyncHandler(profileController.createProject),
);

// PATCH /profiles/me/projects/:id -> 200
profileRouter.patch(
    "/me/projects/:id",
    requireAuth,
    validate({ params: uuidParamSchema, body: updateProjectSchema }),
    asyncHandler(profileController.updateProject),
);

// DELETE /profiles/me/projects/:id -> 204
profileRouter.delete(
    "/me/projects/:id",
    requireAuth,
    validate({ params: uuidParamSchema }),
    asyncHandler(profileController.deleteProject),
);
