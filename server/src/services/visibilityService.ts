import { supabaseAdmin } from "../config/supabase.js";
import { internalError } from "../utils/errors.js";

export type VisibilityLevel = "only_me" | "connections" | "members" | "public";
export type VisibilitySection = "about" | "skills" | "experience" | "projects" | "contact";
export type VisibilityMap = Record<VisibilitySection, VisibilityLevel>;

export const VISIBILITY_SECTIONS: VisibilitySection[] = [
    "about",
    "skills",
    "experience",
    "projects",
    "contact",
];

export function defaultVisibility(): VisibilityMap {
    return {
        about: "members",
        skills: "members",
        experience: "members",
        projects: "members",
        contact: "members",
    };
}

// The one rule for every section, used for detail pages and discovery.
export function canViewSection(
    viewerId: string | undefined,
    ownerId: string,
    level: VisibilityLevel,
): boolean {
    if (viewerId === ownerId) {
        return true;
    }
    if (level === "public") {
        return true;
    }
    if (level === "members") {
        return !!viewerId;
    }
    // only_me and connections are owner-only until connections exist.
    return false;
}

export async function getVisibilityMap(profileId: string): Promise<VisibilityMap> {
    const { data, error } = await supabaseAdmin
        .from("visibility_settings")
        .select("section, level")
        .eq("profile_id", profileId);

    if (error) {
        throw internalError("Could not load visibility settings");
    }

    const map = defaultVisibility();
    for (const row of data ?? []) {
        const section = (row as { section: string }).section as VisibilitySection;
        const level = (row as { level: string }).level as VisibilityLevel;
        if (VISIBILITY_SECTIONS.includes(section)) {
            map[section] = level;
        }
    }
    return map;
}

// One batched lookup for discovery, so 20 profiles do not cause 20 queries.
// This is the no-N+1 rule: one query, then a Map keyed by profile id.
export async function getVisibilityMaps(profileIds: string[]): Promise<Map<string, VisibilityMap>> {
    const result = new Map<string, VisibilityMap>();
    for (const id of profileIds) {
        result.set(id, defaultVisibility());
    }
    if (profileIds.length === 0) {
        return result;
    }

    const { data, error } = await supabaseAdmin
        .from("visibility_settings")
        .select("profile_id, section, level")
        .in("profile_id", profileIds);

    if (error) {
        throw internalError("Could not load visibility settings");
    }

    for (const row of data ?? []) {
        const profileId = (row as { profile_id: string }).profile_id;
        const section = (row as { section: string }).section as VisibilitySection;
        const level = (row as { level: string }).level as VisibilityLevel;
        const map = result.get(profileId);
        if (map && VISIBILITY_SECTIONS.includes(section)) {
            map[section] = level;
        }
    }
    return result;
}

export type ProfileRow = {
    id: string;
    full_name: string;
    headline: string | null;
    about: string | null;
    location: string | null;
    contact: string | null;
    created_at?: string;
    updated_at?: string;
};

// Public identity fields are always shown: id, full_name, headline, location.
// about and contact live on the same row, but they are removed here
// if the viewer is not allowed to see that section.
export function filterProfileForViewer(
    profile: ProfileRow,
    visibility: VisibilityMap,
    viewerId: string | undefined,
): Record<string, unknown> {
    const isOwner = viewerId === profile.id;
    const out: Record<string, unknown> = {
        id: profile.id,
        full_name: profile.full_name,
        headline: profile.headline,
        location: profile.location,
    };

    if (isOwner || canViewSection(viewerId, profile.id, visibility.about)) {
        out.about = profile.about;
    }
    if (isOwner || canViewSection(viewerId, profile.id, visibility.contact)) {
        out.contact = profile.contact;
    }
    if (isOwner) {
        out.created_at = profile.created_at;
        out.updated_at = profile.updated_at;
    }
    return out;
}
