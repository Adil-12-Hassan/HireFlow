import { z } from "zod";

const emailField = z.string().trim().toLowerCase().email("Enter a valid email address");
const passwordField = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters");

// POST /auth/register
export const registerSchema = z
    .object({
        full_name: z.string().trim().min(1, "Full name is required").max(100),
        email: emailField,
        password: passwordField,
    })
    .strict();

// POST /auth/login
// Login does not check password strength, only that a password was sent.
// Supabase checks if it is correct, and we always reply with a generic 401.
export const loginSchema = z
    .object({
        email: emailField,
        password: z.string().min(1, "Password is required").max(128),
    })
    .strict();

// POST /auth/forgot-password
export const forgotPasswordSchema = z
    .object({
        email: emailField,
    })
    .strict();

// POST /auth/reset-password
// token comes from the reset link Supabase emailed to the user.
export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, "Reset token is required"),
        password: passwordField,
    })
    .strict();

// POST /auth/change-password, signed in only
export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required").max(128),
        newPassword: passwordField,
    })
    .strict()
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from the current password",
        path: ["newPassword"],
    });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
