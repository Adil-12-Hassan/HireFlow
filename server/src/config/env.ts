import dotenv from "dotenv";
import { z } from "zod";
import { parseOrigins } from "../utils/origins.js";

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // One origin or a comma separated list of origins.
    FRONTEND_URL: z
        .string()
        .min(1, "FRONTEND_URL is required")
        .refine(
            (value) => {
                const origins = parseOrigins(value);
                return origins.length > 0 && origins.every((o) => z.string().url().safeParse(o).success);
            },
            { message: "FRONTEND_URL must be one or more valid URLs separated by commas" },
        ),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

const parsed = envSchema.parse(process.env);
const origins = parseOrigins(parsed.FRONTEND_URL);

export const env = {
    ...parsed,
    // Main frontend, used in email links. This is the first origin in the list.
    FRONTEND_URL: origins[0] as string,
    // Every origin allowed for CORS and the CSRF origin check.
    ALLOWED_ORIGINS: origins,
};
export type Env = typeof env;
