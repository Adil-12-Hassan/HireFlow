import { supabaseAdmin, supabaseAnon } from "../config/supabase.js";
import { env } from "../config/env.js";
import { badRequest, conflict, internalError, notFound, unauthorized } from "../utils/errors.js";
import type {
    ChangePasswordInput,
    ForgotPasswordInput,
    LoginInput,
    RegisterInput,
    ResetPasswordInput,
} from "../validators/authSchemas.js";

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export type AuthUserResult = {
    id: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
    needsVerification?: boolean;
};

// POST /auth/register
// Supabase stores and hashes the password. Express never sees the hash.
// The database trigger creates the profile and visibility rows on signup.
export async function register(input: RegisterInput): Promise<AuthUserResult> {
    const { data, error } = await supabaseAnon.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
            data: { full_name: input.full_name },
            emailRedirectTo: `${env.FRONTEND_URL}/login`,
        },
    });

    if (error) {
        if (error.code === "user_already_exists" || error.code === "email_exists" || error.message.toLowerCase().includes("already registered")) {
            throw conflict("An account with this email already exists");
        }
        throw badRequest(error.message);
    }
    if (!data.user) {
        throw internalError("Could not create account");
    }
    // With email confirmation enabled, duplicate signup can return a
    // masked user with no identities instead of an Auth error.
    if (data.user.identities?.length === 0) {
        throw conflict("An account with this email already exists");
    }

    return {
        id: data.user.id,
        email: data.user.email ?? input.email,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        // If email confirmation is on, there is no session yet.
        needsVerification: !data.session,
    };
}

// POST /auth/login
// Always a generic 401 on failure, so we do not reveal if the email
// exists, if the password was wrong, or if the email is unverified.
export async function login(input: LoginInput): Promise<AuthUserResult & AuthTokens> {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: input.email,
        password: input.password,
    });

    if (error || !data.user || !data.session) {
        if (error?.message.toLowerCase().includes("not confirmed")) {
            throw unauthorized("Please verify your email, then try again");
        }
        throw unauthorized("Invalid email or password");
    }

    return {
        id: data.user.id,
        email: data.user.email ?? input.email,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
    };
}

// POST /auth/refresh
// Uses the refresh cookie only. Returns a new pair of tokens.
export async function refreshSession(refreshToken: string): Promise<AuthTokens> {
    const { data, error } = await supabaseAnon.auth.refreshSession({
        refresh_token: refreshToken,
    });

    if (error || !data.session) {
        throw unauthorized("Session has expired, please sign in again");
    }

    return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
    };
}

// GET /auth/me
export async function getMe(userId: string, email?: string): Promise<{
    id: string;
    email?: string;
    full_name: string;
    headline: string | null;
    location: string | null;
}> {
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, headline, location")
        .eq("id", userId)
        .single();

    if (error || !data) {
        throw notFound("Profile not found");
    }

    return {
        id: data.id as string,
        email,
        full_name: (data.full_name as string) ?? "",
        headline: (data.headline as string | null) ?? null,
        location: (data.location as string | null) ?? null,
    };
}

// POST /auth/logout
// Signs the user out everywhere, then the controller clears the cookies.
// Report revocation failures rather than claiming the session was revoked.
export async function logout(accessToken: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, "global");
    if (error) throw internalError("Could not revoke session. Please retry logout.");
}

// POST /auth/forgot-password
// Always succeeds from the outside, even if the email does not exist,
// so we do not reveal who has an account.
export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
    await supabaseAnon.auth.resetPasswordForEmail(input.email, {
        redirectTo: `${env.FRONTEND_URL}/reset-password`,
    });
}

// POST /auth/reset-password
// The token comes from the email link. We check it with Supabase first,
// then set the new password with the admin client.
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
    const { data, error } = await supabaseAnon.auth.getUser(input.token);
    if (error || !data.user) {
        throw unauthorized("Reset link is invalid or has expired");
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
        password: input.password,
    });
    if (updateError) {
        throw internalError("Could not reset password");
    }
}

// POST /auth/change-password, signed in only
export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) {
        throw notFound("User not found");
    }

    // Check the current password by trying to sign in with it.
    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
        email: userData.user.email,
        password: input.currentPassword,
    });
    if (signInError) {
        throw unauthorized("Current password is incorrect");
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: input.newPassword,
    });
    if (updateError) {
        throw internalError("Could not change password");
    }
}

// GET /auth/verify?token_hash=...&type=email
// Supabase email link calls this. It confirms the email and, if Supabase
// returns a session, the controller sets the cookies.
export async function verifyEmail(tokenHash: string): Promise<AuthTokens | null> {
    const { data, error } = await supabaseAnon.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
    });
    if (error) {
        throw badRequest("Verification link is invalid or has expired");
    }
    if (!data.session) {
        return null;
    }
    return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
    };
}
