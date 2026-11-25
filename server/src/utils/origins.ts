// FRONTEND_URL may hold one origin or a comma separated list, for example
// "https://hireflow.app,https://hireflow-git-main.vercel.app".
// Trailing slashes are removed so "https://x.app/" still matches the
// browser's Origin header, which never has a trailing slash.
export function parseOrigins(raw: string): string[] {
    return raw
        .split(",")
        .map((part) => part.trim().replace(/\/+$/, ""))
        .filter(Boolean);
}

export function isAllowedOrigin(origin: string, allowed: readonly string[]): boolean {
    return allowed.includes(origin);
}
