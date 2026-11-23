import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter, loginLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    changePasswordSchema,
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
} from "../validators/authSchemas.js";

export const authRouter = Router();

// POST /auth/register -> 201
authRouter.post(
    "/register",
    authLimiter,
    validate({ body: registerSchema }),
    asyncHandler(authController.register),
);

// POST /auth/login -> 200
authRouter.post(
    "/login",
    loginLimiter,
    validate({ body: loginSchema }),
    asyncHandler(authController.login),
);

// POST /auth/refresh -> 200, refresh cookie only
authRouter.post("/refresh", asyncHandler(authController.refresh));

// POST /auth/logout -> 204, signed in only
authRouter.post("/logout", requireAuth, asyncHandler(authController.logout));

// GET /auth/me -> 200, signed in only
authRouter.get("/me", requireAuth, asyncHandler(authController.me));

// POST /auth/forgot-password -> 200
authRouter.post(
    "/forgot-password",
    passwordResetLimiter,
    validate({ body: forgotPasswordSchema }),
    asyncHandler(authController.forgotPassword),
);

// POST /auth/reset-password -> 200
authRouter.post(
    "/reset-password",
    passwordResetLimiter,
    validate({ body: resetPasswordSchema }),
    asyncHandler(authController.resetPassword),
);

// POST /auth/change-password -> 200, signed in only
authRouter.post(
    "/change-password",
    requireAuth,
    validate({ body: changePasswordSchema }),
    asyncHandler(authController.changePassword),
);

// GET /auth/verify?token_hash=... -> 200
authRouter.get("/verify", asyncHandler(authController.verifyEmail));
