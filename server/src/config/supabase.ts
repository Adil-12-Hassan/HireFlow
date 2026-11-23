import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Public client, used only for Auth calls like sign up, sign in, and password reset.
// It uses the anon key, it cannot bypass RLS.
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

// Admin client, used only on the server for database work.
// It uses the service-role key and bypasses RLS, so every service
// that uses it must check ownership first.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
