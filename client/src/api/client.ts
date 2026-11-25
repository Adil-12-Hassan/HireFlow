import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
};

// In development the API runs on localhost. A production build must set
// VITE_API_URL, otherwise requests would go to the frontend's own host.
const API_URL = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:5000" : ""))
    .trim()
    .replace(/\/+$/, "");

if (!API_URL && !import.meta.env.DEV) {
    console.error("VITE_API_URL is not set. Set it to your API address and rebuild the frontend.");
}

export const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// One refresh request shared by all requests that fail with 401 at the same time.
let refreshPromise: Promise<void> | null = null;

function doRefresh(): Promise<void> {
    if (!refreshPromise) {
        refreshPromise = api
            .post("/auth/refresh", {}, {
                _skipAuthRefresh: true,
            } as RetryConfig)
            .then(() => undefined)
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

const AUTH_URLS = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify",
];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config as RetryConfig | undefined;
        if (!original || original._skipAuthRefresh || original._retry) {
            return Promise.reject(error);
        }
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }
        // Auth calls never trigger a refresh, or they would loop.
        if (AUTH_URLS.some((url) => (original.url ?? "").includes(url))) {
            return Promise.reject(error);
        }
        original._retry = true;
        try {
            await doRefresh();
            return api(original);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    },
);

// Thrown when the server accepted a login but the browser did not keep the session.
export class SessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SessionError";
    }
}

// True when the server answered 401, meaning "not signed in".
export function isUnauthorizedError(error: unknown): boolean {
    return axios.isAxiosError(error) && error.response?.status === 401;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof SessionError) return error.message;
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string } | undefined;
        if (data?.error) return data.error;
        // No response at all: the server is down, offline, or CORS blocked the call.
        if (!error.response) {
            return "Cannot reach the server. Check your internet connection and try again.";
        }
        // A response that is not our JSON error, for example a platform error page.
        const status = error.response.status;
        if (status === 429) return "Too many requests, please try again later.";
        if (status >= 500) return "The server had a problem. Please try again in a moment.";
        return `The request was refused (HTTP ${status}).`;
    }
    return "Something went wrong";
}

export type PageMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

export type Paginated<T> = {
    data: T[];
    meta: PageMeta;
};
