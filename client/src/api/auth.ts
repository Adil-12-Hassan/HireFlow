import { api } from "./client";

// What GET /auth/me returns. Full profile fields come from GET /profiles/me.
export type Me = {
    id: string;
    email?: string;
    full_name: string;
    headline: string | null;
    location: string | null;
};

export async function register(data: { full_name: string; email: string; password: string }) {
    const res = await api.post("/auth/register", data);
    return res.data;
}

export async function login(data: { email: string; password: string }) {
    const res = await api.post("/auth/login", data);
    return res.data;
}

export async function logout() {
    await api.post("/auth/logout");
}

export async function getMe(): Promise<Me> {
    const res = await api.get("/auth/me");
    return res.data as Me;
}

export async function forgotPassword(email: string) {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
}

export async function resetPassword(data: { token: string; password: string }) {
    const res = await api.post("/auth/reset-password", data);
    return res.data;
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await api.post("/auth/change-password", data);
    return res.data;
}

// GET /auth/verify?token_hash=... from the email link.
export async function verifyEmail(tokenHash: string) {
    const res = await api.get("/auth/verify", { params: { token_hash: tokenHash } });
    return res.data;
}
