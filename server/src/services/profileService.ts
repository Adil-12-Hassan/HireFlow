import { supabaseAdmin } from "../config/supabase.js";
import { badRequest, forbidden, internalError, notFound } from "../utils/errors.js";
import { paginationMeta, supabaseRange } from "../utils/pagination.js";
import {
    canViewSection,
    filterProfileForViewer,
    getVisibilityMap,
    getVisibilityMaps,
    type ProfileRow,
    type VisibilityMap,
} from "./visibilityService.js";
import type {
    CreateExperienceInput,
    CreateProjectInput,
    SetSkillsInput,
    UpdateExperienceInput,
    UpdateProfileInput,
    UpdateProjectInput,
    UpdateVisibilityInput,
} from "../validators/profileSchemas.js";

function clean<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
            out[key] = value;
        }
    }
    return out;
}

async function getProfileRow(profileId: string): Promise<ProfileRow> {
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, headline, about, location, contact, created_at, updated_at")
        .eq("id", profileId)
        .single();
    if (error || !data) {
        throw notFound("Profile not found");
    }
    return data as unknown as ProfileRow;
}

// GET /profiles/:id
export async function getProfileById(viewerId: string | undefined, profileId: string) {
    const profile = await getProfileRow(profileId);
    const visibility = await getVisibilityMap(profileId);
    const isOwner = viewerId === profileId;
    const filtered = filterProfileForViewer(profile, visibility, viewerId);

    const skills: string[] = [];
    if (isOwner || canViewSection(viewerId, profileId, visibility.skills)) {
        const { data, error } = await supabaseAdmin
            .from("profile_skills")
            .select("skills(name)")
            .eq("profile_id", profileId);
        if (error) throw internalError("Could not load skills");
        for (const row of data ?? []) {
            const raw = (row as unknown as { skills: { name: string } | { name: string }[] | null }).skills;
            const name = Array.isArray(raw) ? raw[0]?.name : raw?.name;
            if (name) skills.push(name);
        }

        skills.sort((a, b) => a.localeCompare(b));
    }

    let experiences: unknown[] = [];
    if (isOwner || canViewSection(viewerId, profileId, visibility.experience)) {
        const { data, error } = await supabaseAdmin
            .from("experiences")
            .select("id, company, role, start_date, end_date, description")
            .eq("profile_id", profileId)
            .order("start_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });
        if (error) throw internalError("Could not load experiences");
        experiences = data ?? [];
    }

    let projects: unknown[] = [];
    if (isOwner || canViewSection(viewerId, profileId, visibility.projects)) {
        const { data, error } = await supabaseAdmin
            .from("projects")
            .select("id, title, description, link")
            .eq("profile_id", profileId)
            .order("created_at", { ascending: false });
        if (error) throw internalError("Could not load projects");
        projects = data ?? [];
    }

    return {
        ...filtered,
        skills,
        experiences,
        projects,
        ...(isOwner ? { visibility } : {}),
    };
}

// GET /profiles
export async function listProfiles(
    viewerId: string | undefined,
    query: { page: number; limit: number; search?: string },
) {
    const { page, limit, search } = query;
    const { from, to } = supabaseRange(page, limit);

    let builder = supabaseAdmin
        .from("profiles")
        .select("id, full_name, headline, about, location, contact, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);

    if (search) {
        const term = search.replace(/[%_]/g, "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        builder = builder.or(`full_name.ilike."%${term}%",headline.ilike."%${term}%"`);
    }

    const { data, error, count } = await builder;
    if (error) throw internalError("Could not load profiles");
    const rows = (data ?? []) as unknown as ProfileRow[];
    const total = count ?? 0;

    // One batched visibility lookup and one batched skills lookup for all rows.
    const ids = rows.map((r) => r.id);
    const visibilityMaps = await getVisibilityMaps(ids);

    const skillsByProfile = new Map<string, string[]>();
    for (const id of ids) skillsByProfile.set(id, []);
    if (ids.length > 0) {
        const { data: skillRows, error: skillError } = await supabaseAdmin
            .from("profile_skills")
            .select("profile_id, skills(name)")
            .in("profile_id", ids);
        if (skillError) throw internalError("Could not load skills");
        for (const row of skillRows ?? []) {
            const r = row as unknown as { profile_id: string; skills: { name: string } | { name: string }[] | null };
            const name = Array.isArray(r.skills) ? r.skills[0]?.name : r.skills?.name;
            if (name) skillsByProfile.get(r.profile_id)?.push(name);
        }

    }

    const items = rows.map((profile) => {
        const visibility: VisibilityMap =
            visibilityMaps.get(profile.id) ??
            ({ about: "members", skills: "members", experience: "members", projects: "members", contact: "members" } as VisibilityMap);
        const filtered = filterProfileForViewer(profile, visibility, viewerId);
        const skills = canViewSection(viewerId, profile.id, visibility.skills)
            ? (skillsByProfile.get(profile.id) ?? []).sort((a, b) => a.localeCompare(b))
            : [];
        return { ...filtered, skills };
    });

    return { data: items, meta: paginationMeta(total, page, limit) };
}

// PATCH /profiles/me
export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
    const updates = clean(input);
    if (Object.keys(updates).length === 0) {
        throw badRequest("Provide at least one field to update");
    }
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select("id, full_name, headline, about, location, contact, created_at, updated_at")
        .single();
    if (error || !data) {
        throw internalError("Could not update profile");
    }
    const visibility = await getVisibilityMap(userId);
    return { ...filterProfileForViewer(data as unknown as ProfileRow, visibility, userId), visibility };
}

// PUT /profiles/me/visibility
export async function updateMyVisibility(userId: string, input: UpdateVisibilityInput) {
    const rows = Object.entries(input).map(([section, level]) => ({
        profile_id: userId,
        section,
        level,
    }));
    const { error } = await supabaseAdmin
        .from("visibility_settings")
        .upsert(rows, { onConflict: "profile_id,section" });
    if (error) throw internalError("Could not update visibility");
    return getVisibilityMap(userId);
}

// PUT /profiles/me/skills
export async function setMySkills(userId: string, input: SetSkillsInput) {
    // Deduplicate case-insensitively, keep the first spelling the user typed.
    const byLower = new Map<string, string>();
    for (const name of input.skills) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        const lower = trimmed.toLowerCase();
        if (!byLower.has(lower)) byLower.set(lower, trimmed);
    }

    const skillIds: string[] = [];
    for (const name of byLower.values()) {
        const pattern = name.replace(/[\\%_]/g, "\\$&");
        const { data: found, error: lookupError } = await supabaseAdmin
            .from("skills")
            .select("id")
            .ilike("name", pattern)
            .limit(1)
            .maybeSingle();
        if (lookupError) throw internalError("Could not load skills");
        if (found) {
            skillIds.push((found as { id: string }).id);
            continue;
        }
        const { data: created, error: createError } = await supabaseAdmin
            .from("skills")
            .insert({ name })
            .select("id")
            .single();
        if (createError || !created) {
            // Another request may have created it at the same time, try once more.
            const { data: retry } = await supabaseAdmin
                .from("skills")
                .select("id")
                .ilike("name", pattern)
                .limit(1)
                .maybeSingle();
            if (!retry) throw internalError("Could not save skills");
            skillIds.push((retry as { id: string }).id);
        } else {
            skillIds.push((created as { id: string }).id);
        }
    }

    const { error: deleteError } = await supabaseAdmin
        .from("profile_skills")
        .delete()
        .eq("profile_id", userId);
    if (deleteError) throw internalError("Could not save skills");

    if (skillIds.length > 0) {
        const { error: insertError } = await supabaseAdmin
            .from("profile_skills")
            .insert(skillIds.map((skill_id) => ({ profile_id: userId, skill_id })));
        if (insertError) throw internalError("Could not save skills");
    }

    return [...byLower.values()].sort((a, b) => a.localeCompare(b));
}

async function requireOwnedExperience(userId: string, experienceId: string) {
    const { data, error } = await supabaseAdmin
        .from("experiences")
        .select("id, profile_id")
        .eq("id", experienceId)
        .single();
    if (error || !data) throw notFound("Experience not found");
    if ((data as { profile_id: string }).profile_id !== userId) {
        throw forbidden("You can only edit your own experience");
    }
    return data as { id: string; profile_id: string };
}

export async function createExperience(userId: string, input: CreateExperienceInput) {
    const { data, error } = await supabaseAdmin
        .from("experiences")
        .insert({ profile_id: userId, ...clean(input) })
        .select("id, company, role, start_date, end_date, description")
        .single();
    if (error || !data) throw internalError("Could not create experience");
    return data;
}

export async function updateExperience(userId: string, experienceId: string, input: UpdateExperienceInput) {
    await requireOwnedExperience(userId, experienceId);
    const updates = clean(input);
    if (Object.keys(updates).length === 0) throw badRequest("Provide at least one field to update");
    const { data, error } = await supabaseAdmin
        .from("experiences")
        .update(updates)
        .eq("id", experienceId)
        .select("id, company, role, start_date, end_date, description")
        .single();
    if (error || !data) throw internalError("Could not update experience");
    return data;
}

export async function deleteExperience(userId: string, experienceId: string): Promise<void> {
    await requireOwnedExperience(userId, experienceId);
    const { error } = await supabaseAdmin.from("experiences").delete().eq("id", experienceId);
    if (error) throw internalError("Could not delete experience");
}

async function requireOwnedProject(userId: string, projectId: string) {
    const { data, error } = await supabaseAdmin
        .from("projects")
        .select("id, profile_id")
        .eq("id", projectId)
        .single();
    if (error || !data) throw notFound("Project not found");
    if ((data as { profile_id: string }).profile_id !== userId) {
        throw forbidden("You can only edit your own project");
    }
    return data as { id: string; profile_id: string };
}

export async function createProject(userId: string, input: CreateProjectInput) {
    const { data, error } = await supabaseAdmin
        .from("projects")
        .insert({ profile_id: userId, ...clean(input) })
        .select("id, title, description, link")
        .single();
    if (error || !data) throw internalError("Could not create project");
    return data;
}

export async function updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
    await requireOwnedProject(userId, projectId);
    const updates = clean(input);
    if (Object.keys(updates).length === 0) throw badRequest("Provide at least one field to update");
    const { data, error } = await supabaseAdmin
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select("id, title, description, link")
        .single();
    if (error || !data) throw internalError("Could not update project");
    return data;
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
    await requireOwnedProject(userId, projectId);
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", projectId);
    if (error) throw internalError("Could not delete project");
}
