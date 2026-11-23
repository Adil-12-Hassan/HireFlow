import { supabaseAdmin } from "../config/supabase.js";
import { internalError } from "../utils/errors.js";

// Change an application status through Postgres, not through a direct update.
// Why: Supabase JS makes a new HTTP request for every query, so a
// set_config() in one request does not live into the next request.
// This RPC runs set_config() and the UPDATE inside one Postgres
// transaction, so the trigger sees app.changed_by and records the
// right person in status_history.
export async function changeApplicationStatus(
    applicationId: string,
    newStatus: string,
    actorId: string,
): Promise<void> {
    const { error } = await supabaseAdmin.rpc("change_application_status", {
        p_application_id: applicationId,
        p_new_status: newStatus,
        p_changed_by: actorId,
    });

    if (error) {
        throw internalError("Could not change application status");
    }
}
