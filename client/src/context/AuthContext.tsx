import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth";
import type { Me } from "../api/auth";
import { SessionError } from "../api/client";

type AuthContextValue = {
    user: Me | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: { email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    // One query for the signed-in user. retry is false on purpose,
    // a 401 here means signed out, not a temporary error to retry.
    const { data, isLoading } = useQuery({
        queryKey: ["me"],
        queryFn: authApi.getMe,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    const user = data ?? null;

    async function login(data: { email: string; password: string }) {
        await authApi.login(data);
        await queryClient.refetchQueries({ queryKey: ["me"] });
        // The server said yes, but if /auth/me still has no user, the browser did
        // not keep the session cookie. Say so, instead of silently bouncing the
        // user back to the sign-in page.
        if (!queryClient.getQueryData(["me"])) {
            throw new SessionError(
                "Signed in, but your browser did not keep the session. Allow cookies for this site (or turn off cross-site tracking protection) and try again.",
            );
        }
    }

    async function logout() {
        try {
            await authApi.logout();
        } finally {
            // Clear all account data, including jobs and applications
            // cached for this user, then mark me as signed out.
            queryClient.clear();
            queryClient.setQueryData(["me"], null);
        }
    }

    async function refreshUser() {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
    }

    return (
        <AuthContext.Provider
            value={{ user, isLoading, isAuthenticated: user !== null, login, logout, refreshUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
}
