import { api, type Paginated } from "./client";

export type JobStatus = "draft" | "open" | "closed";

export type Job = {
    id: string;
    owner_id: string;
    title: string;
    description: string | null;
    status: JobStatus;
    created_at: string;
    updated_at: string;
};

export async function listJobs(params?: { page?: number; limit?: number; search?: string }): Promise<Paginated<Job>> {
    const res = await api.get("/jobs", { params });
    return res.data as Paginated<Job>;
}

export async function getJob(id: string): Promise<Job> {
    const res = await api.get(`/jobs/${id}`);
    return res.data as Job;
}

export async function createJob(data: {
    title: string;
    description?: string | null;
    status?: "draft" | "open";
}): Promise<Job> {
    const res = await api.post("/jobs", data);
    return res.data as Job;
}

export async function updateJob(id: string, data: {
    title?: string;
    description?: string | null;
    status?: JobStatus;
}): Promise<Job> {
    const res = await api.patch(`/jobs/${id}`, data);
    return res.data as Job;
}
