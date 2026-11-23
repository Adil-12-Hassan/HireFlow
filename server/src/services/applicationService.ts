import { supabaseAdmin } from "../config/supabase.js";
import { changeApplicationStatus } from "../db/audit.js";
import { badRequest, conflict, forbidden, internalError, notFound } from "../utils/errors.js";
import { paginationMeta, supabaseRange } from "../utils/pagination.js";
import type {
    ApplyToJobInput,
    ApplicationStatus,
    ChangeApplicationStatusInput,
} from "../validators/applicationSchemas.js";
import { getJobRow, type JobRow } from "./jobService.js";

export type ApplicationRow = {
    id: string;
    job_id: string;
    applicant_id: string;
    status: ApplicationStatus;
    cover_note: string | null;
    created_at: string;
    updated_at: string;
};

export type StatusHistoryRow = {
    id: string;
    application_id: string;
    status: ApplicationStatus;
    changed_by: string | null;
    changed_at: string;
};

const APPLICATION_FIELDS = "id, job_id, applicant_id, status, cover_note, created_at, updated_at";

async function getApplicationRow(applicationId: string): Promise<ApplicationRow> {
    const { data, error } = await supabaseAdmin
        .from("applications")
        .select(APPLICATION_FIELDS)
        .eq("id", applicationId)
        .single();
    if (error || !data) {
        throw notFound("Application not found");
    }
    return data as unknown as ApplicationRow;
}

// Order for forward-only owner decisions. rejected can happen at any stage.
const STATUS_ORDER: Record<string, number> = {
    applied: 0,
    in_review: 1,
    shortlisted: 2,
    interview: 3,
    offer: 4,
    hired: 5,
};

// POST /jobs/:id/applications
export async function applyToJob(applicantId: string, jobId: string, input: ApplyToJobInput) {
    const job = await getJobRow(jobId);

    if (job.owner_id === applicantId) {
        throw badRequest("You cannot apply to your own job");
    }
    // Draft or closed jobs are private, so a non-owner gets 404 here,
    // not a message that tells them the job exists but is closed.
    if (job.status !== "open") {
        throw notFound("Job not found");
    }

    const { data, error } = await supabaseAdmin
        .from("applications")
        .insert({
            job_id: jobId,
            applicant_id: applicantId,
            status: "applied",
            cover_note: input.cover_note ?? null,
        })
        .select(APPLICATION_FIELDS)
        .single();

    if (error) {
        // Unique (job_id, applicant_id). Two applies at the same time:
        // one gets 201, the other gets 409 from this same check.
        if ((error as { code?: string }).code === "23505") {
            throw conflict("You have already applied to this job");
        }
        throw internalError("Could not submit application");
    }
    if (!data) throw internalError("Could not submit application");
    return data as unknown as ApplicationRow;
}

// GET /applications/me
// One query for the page of applications, then one batched query
// for all their jobs. No query per application.
export async function listMyApplications(
    userId: string,
    query: { page: number; limit: number; search?: string },
) {
    const { page, limit } = query;
    const { from, to } = supabaseRange(page, limit);

    const { data, error, count } = await supabaseAdmin
        .from("applications")
        .select(APPLICATION_FIELDS, { count: "exact" })
        .eq("applicant_id", userId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
    if (error) throw internalError("Could not load applications");

    const rows = (data ?? []) as unknown as ApplicationRow[];
    const jobIds = [...new Set(rows.map((r) => r.job_id))];
    const jobsById = new Map<string, JobRow>();
    if (jobIds.length > 0) {
        const { data: jobRows, error: jobError } = await supabaseAdmin
            .from("jobs")
            .select("id, owner_id, title, description, status, created_at, updated_at")
            .in("id", jobIds);
        if (jobError) throw internalError("Could not load jobs");
        for (const j of (jobRows ?? []) as unknown as JobRow[]) jobsById.set(j.id, j);
    }

    const items = rows.map((a) => {
        const job = jobsById.get(a.job_id);
        return {
            ...a,
            job: job ? { id: job.id, title: job.title, status: job.status } : null,
        };
    });
    return { data: items, meta: paginationMeta(count ?? 0, page, limit) };
}

// GET /jobs/:id/applications, owner only.
// A private job gives 404 to a non-owner, a public open job gives 403.
export async function listJobApplications(
    ownerId: string,
    jobId: string,
    query: { page: number; limit: number; search?: string },
) {
    const job = await getJobRow(jobId);
    if (job.status !== "open" && ownerId !== job.owner_id) {
        throw notFound("Job not found");
    }
    if (ownerId !== job.owner_id) {
        throw forbidden("You can only view applications for your own job");
    }

    const { page, limit } = query;
    const { from, to } = supabaseRange(page, limit);

    const { data, error, count } = await supabaseAdmin
        .from("applications")
        .select(APPLICATION_FIELDS, { count: "exact" })
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
    if (error) throw internalError("Could not load applications");

    const rows = (data ?? []) as unknown as ApplicationRow[];
    const applicantIds = [...new Set(rows.map((r) => r.applicant_id))];
    const profilesById = new Map<string, { id: string; full_name: string; headline: string | null; location: string | null }>();
    if (applicantIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, headline, location")
            .in("id", applicantIds);
        if (profileError) throw internalError("Could not load applicants");
        for (const p of (profileRows ?? []) as unknown as { id: string; full_name: string; headline: string | null; location: string | null }[]) {
            profilesById.set(p.id, p);
        }
    }

    const items = rows.map((a) => ({
        ...a,
        applicant: profilesById.get(a.applicant_id) ?? null,
    }));
    return { data: items, meta: paginationMeta(count ?? 0, page, limit) };
}

// PATCH /applications/:id/status
// Owner: forward only, or rejected at any stage. Applicant: withdrawn only.
// hired, rejected and withdrawn are final, they cannot change again.
export async function changeStatus(
    actorId: string,
    applicationId: string,
    input: ChangeApplicationStatusInput,
) {
    const application = await getApplicationRow(applicationId);
    const job = await getJobRow(application.job_id);
    const newStatus = input.status;

    const isOwner = job.owner_id === actorId;
    const isApplicant = application.applicant_id === actorId;
    if (!isOwner && !isApplicant) {
        throw notFound("Application not found");
    }

    if (application.status === newStatus) {
        throw badRequest("Application is already in that status");
    }
    if (
        application.status === "hired" ||
        application.status === "rejected" ||
        application.status === "withdrawn"
    ) {
        throw badRequest("This application is already closed and cannot be changed");
    }

    if (isApplicant && !isOwner) {
        if (newStatus !== "withdrawn") {
            throw forbidden("Applicants can only withdraw their application");
        }
    }

    if (isOwner) {
        if (newStatus === "withdrawn") {
            throw forbidden("Only the applicant can withdraw an application");
        }
        if (newStatus !== "rejected") {
            const currentOrder = STATUS_ORDER[application.status] ?? 0;
            const nextOrder = STATUS_ORDER[newStatus] ?? 0;
            if (nextOrder <= currentOrder) {
                throw badRequest("Invalid status change");
            }
        }
    }

    // Never update applications directly for a status change.
    // This RPC sets app.changed_by and updates in one Postgres
    // transaction, so the trigger records the right actor in history.
    await changeApplicationStatus(applicationId, newStatus, actorId);

    return getApplicationRow(applicationId);
}

// GET /applications/:id/history, applicant and job owner only.
export async function getApplicationHistory(viewerId: string, applicationId: string) {
    const application = await getApplicationRow(applicationId);
    const job = await getJobRow(application.job_id);
    if (viewerId !== application.applicant_id && viewerId !== job.owner_id) {
        throw notFound("Application not found");
    }

    const { data, error } = await supabaseAdmin
        .from("status_history")
        .select("id, application_id, status, changed_by, changed_at")
        .eq("application_id", applicationId)
        .order("changed_at", { ascending: true })
        .order("id", { ascending: true });
    if (error) throw internalError("Could not load status history");
    return (data ?? []) as unknown as StatusHistoryRow[];
}
