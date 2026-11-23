import { api, type Paginated } from "./client";

export type VisibilityLevel = "only_me" | "connections" | "members" | "public";
export type VisibilitySection = "about" | "skills" | "experience" | "projects" | "contact";
export type VisibilityMap = Record<VisibilitySection, VisibilityLevel>;

export type Experience = {
    id: string;
    company: string;
    role: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
};

export type Project = {
    id: string;
    title: string;
    description: string | null;
    link: string | null;
};

export type Profile = {
    id: string;
    full_name: string;
    headline: string | null;
    about: string | null;
    location: string | null;
    contact?: string | null;
    created_at: string;
    updated_at?: string;
    skills?: string[];
    experiences?: Experience[];
    projects?: Project[];
    visibility?: VisibilityMap;
};

export async function listProfiles(params?: { page?: number; limit?: number; search?: string }): Promise<Paginated<Profile>> {
    const res = await api.get("/profiles", { params });
    return res.data as Paginated<Profile>;
}

export async function getProfile(id: string): Promise<Profile> {
    const res = await api.get(`/profiles/${id}`);
    return res.data as Profile;
}

export async function getMyProfile(): Promise<Profile> {
    const res = await api.get("/profiles/me");
    return res.data as Profile;
}

export async function updateMyProfile(data: {
    full_name?: string;
    headline?: string | null;
    about?: string | null;
    location?: string | null;
    contact?: string | null;
}): Promise<Profile> {
    const res = await api.patch("/profiles/me", data);
    return res.data as Profile;
}

export async function updateMyVisibility(data: Partial<VisibilityMap>): Promise<{ visibility: VisibilityMap }> {
    const res = await api.put("/profiles/me/visibility", data);
    return res.data as { visibility: VisibilityMap };
}

export async function setMySkills(skills: string[]): Promise<{ skills: string[] }> {
    const res = await api.put("/profiles/me/skills", { skills });
    return res.data as { skills: string[] };
}

export async function createExperience(data: {
    company: string;
    role: string;
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
}): Promise<Experience> {
    const res = await api.post("/profiles/me/experiences", data);
    return res.data as Experience;
}

export async function updateExperience(id: string, data: Partial<Omit<Experience, "id">>): Promise<Experience> {
    const res = await api.patch(`/profiles/me/experiences/${id}`, data);
    return res.data as Experience;
}

export async function deleteExperience(id: string): Promise<void> {
    await api.delete(`/profiles/me/experiences/${id}`);
}

export async function createProject(data: {
    title: string;
    description?: string | null;
    link?: string | null;
}): Promise<Project> {
    const res = await api.post("/profiles/me/projects", data);
    return res.data as Project;
}

export async function updateProject(id: string, data: Partial<Omit<Project, "id">>): Promise<Project> {
    const res = await api.patch(`/profiles/me/projects/${id}`, data);
    return res.data as Project;
}

export async function deleteProject(id: string): Promise<void> {
    await api.delete(`/profiles/me/projects/${id}`);
}
