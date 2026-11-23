import { supabaseAdmin } from "../config/supabase.js";
import { badRequest, forbidden, internalError, notFound } from "../utils/errors.js";
import { paginationMeta, supabaseRange } from "../utils/pagination.js";
import type {
    CreateJobInput,
    JobStatus,
    UpdateJobInput,
} from "../validators/jobSchemas.js";

export type JobRow = {
    id: string;
    owner_id: string;
    title: string;
    description: string | null;
    status: JobStatus;
    created_at: string;
    updated_at: string;
};

const JOB_FIELDS = "id, owner_id, title, description, status, created_at, updated_at";

function clean<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
            out[key] = value;
        }
    }
    return out;
}

// Raw row, no visibility check. Used inside this file and by
// applicationService, which needs to check the real status and owner
// before it decides if someone can apply.
export async function getJobRow(jobId: string): Promise<JobRow> {
    const { data, error } = await supabaseAdmin
        .from("jobs")
        .select(JOB_FIELDS)
        .eq("id", jobId)
        .single();
    if (error || !data) {
        throw notFound("Job not found");
    }
    return data as unknown as JobRow;
}

function assertStatusTransition(current: JobStatus, next: JobStatus): void {
    if (next === current) return;
    if (current === "closed") {
        throw badRequest("A closed job cannot be updated");
    }
    if (current === "open" && next === "draft") {
        throw badRequest("An open job cannot go back to draft");
    }
    // Allowed: draft -> open, draft -> closed, open -> closed.
}

// POST /jobs
export async function createJob(ownerId: string, input: CreateJobInput) {
    const { data, error } = await supabaseAdmin
        .from("jobs")
        .insert({
            owner_id: ownerId,
            title: input.title,
            description: input.description ?? null,
            status: input.status ?? "draft",
        })
        .select(JOB_FIELDS)
        .single();
    if (error || !data) {
        throw internalError("Could not create job");
    }
    return data as unknown as JobRow;
}

// GET /jobs, public. Only open jobs, newest first.
// Ordering matches the jobs_open_newest_idx index:
// created_at DESC, id DESC, where status = 'open'.
export async function listOpenJobs(query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query;
    const { from, to } = supabaseRange(page, limit);

    let builder = supabaseAdmin
        .from("jobs")
        .select(JOB_FIELDS, { count: "exact" })
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);

    if (search) {
        const term = search.replace(/[%_]/g, "");
        builder = builder.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error, count } = await builder;
    if (error) throw internalError("Could not load jobs");
    return { data: (data ?? []) as unknown as JobRow[], meta: paginationMeta(count ?? 0, page, limit) };
}

// GET /jobs/:id
// Open jobs: anyone, even a guest.
// Draft or closed jobs: owner only. A non-owner gets 404,
// not 403, so they cannot tell a private job exists.
export async function getJobById(viewerId: string | undefined, jobId: string) {
    const job = await getJobRow(jobId);
    if (job.status !== "open" && viewerId !== job.owner_id) {
        throw notFound("Job not found");
    }
    return job;
}

// PATCH /jobs/:id, owner only.
// A draft or closed job is private, so a non-owner gets 404.
// An open job is public, so a non-owner who tries to edit it gets 403.
export async function updateJob(ownerId: string, jobId: string, input: UpdateJobInput) {
    const job = await getJobRow(jobId);

    if (job.status !== "open" && ownerId !== job.owner_id) {
        throw notFound("Job not found");
    }
    if (job.status === "open" && ownerId !== job.owner_id) {
        throw forbidden("You can only edit your own job");
    }

    const updates = clean(input);
    if (Object.keys(updates).length === 0) {
        throw badRequest("Provide at least one field to update");
    }

    if (typeof updates.status === "string") {
        assertStatusTransition(job.status, updates.status as JobStatus);
    }

    const { data, error } = await supabaseAdmin
        .from("jobs")
        .update(updates)
        .eq("id", jobId)
        .select(JOB_FIELDS)
        .single();
    if (error || !data) {
        throw internalError("Could not update job");
    }
    return data as unknown as JobRow;
}
