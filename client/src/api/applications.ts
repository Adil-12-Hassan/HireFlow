import { api, type Paginated } from "./client";

export type ApplicationStatus =
    | "applied"
    | "in_review"
    | "shortlisted"
    | "interview"
    | "offer"
    | "hired"
    | "rejected"
    | "withdrawn";

export type Application = {
    id: string;
    job_id: string;
    applicant_id: string;
    status: ApplicationStatus;
    cover_note: string | null;
    created_at: string;
    updated_at: string;
    job?: { id: string; title: string; status: string } | null;
    applicant?: { id: string; full_name: string; headline: string | null; location: string | null } | null;
};

export type StatusHistoryItem = {
    id: string;
    application_id: string;
    status: ApplicationStatus;
    changed_by: string | null;
    changed_at: string;
};

export async function applyToJob(jobId: string, data?: { cover_note?: string | null }): Promise<Application> {
    const res = await api.post(`/jobs/${jobId}/applications`, data ?? {});
    return res.data as Application;
}

export async function listMyApplications(params?: { page?: number; limit?: number }): Promise<Paginated<Application>> {
    const res = await api.get("/applications/me", { params });
    return res.data as Paginated<Application>;
}

export async function listJobApplications(jobId: string, params?: { page?: number; limit?: number }): Promise<Paginated<Application>> {
    const res = await api.get(`/jobs/${jobId}/applications`, { params });
    return res.data as Paginated<Application>;
}

export async function changeApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const res = await api.patch(`/applications/${id}/status`, { status });
    return res.data as Application;
}

export async function getApplicationHistory(id: string): Promise<StatusHistoryItem[]> {
    const res = await api.get(`/applications/${id}/history`);
    return res.data as StatusHistoryItem[];
}
