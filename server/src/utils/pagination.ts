import { badRequest } from "./errors.js";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export type Pagination = {
    page: number;
    limit: number;
};

export type PaginationMeta = Pagination & {
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

function parsePositiveInt(value: unknown, fallback: number, name: string): number {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw badRequest(`${name} must be a positive whole number`);
    }
    return parsed;
}

export function parsePagination(query: { page?: unknown; limit?: unknown }): Pagination {
    const page = parsePositiveInt(query.page, DEFAULT_PAGE, "page");
    let limit = parsePositiveInt(query.limit, DEFAULT_LIMIT, "limit");
    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }
    return { page, limit };
}

export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

// Supabase .range() takes an inclusive end, so page 1 with limit 20 is 0 to 19.
export function supabaseRange(page: number, limit: number): { from: number; to: number } {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
}
