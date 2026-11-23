import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
};

export const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
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

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string } | undefined;
        if (data?.error) return data.error;
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
