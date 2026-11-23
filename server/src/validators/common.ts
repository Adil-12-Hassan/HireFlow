import { z } from "zod";

// Used for routes like GET /profiles/:id and GET /jobs/:id.
// A random string is not a valid id, so we reject it with 400
// before we ever ask the database.
export const uuidParamSchema = z
    .object({
        id: z.string().uuid("Invalid id"),
    })
    .strict();

// Used on every list endpoint: GET /jobs, GET /profiles, GET /applications/me.
// page and limit come from the URL as text, so we turn them into numbers.
// limit is capped at 50 here, and pagination.ts caps it again as a safety net.
export const paginationQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional(),
        search: z.string().trim().max(100).optional(),
    })
    .strict();

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
