import { z } from "zod";

const visibilityLevel = z.enum(["only_me", "connections", "members", "public"]);
const visibilitySection = z.enum(["about", "skills", "experience", "projects", "contact"]);

const nullableText = (max: number) =>
    z.string().trim().max(max).nullable().optional();

const dateText = z
    .string()
    .date("Use a valid date in YYYY-MM-DD format")
    .nullable()
    .optional();

// PATCH /profiles/me
// All fields optional, send only what you want to change.
// Use null to clear headline, about, location, or contact.
export const updateProfileSchema = z
    .object({
        full_name: z.string().trim().min(1, "Full name is required").max(100).optional(),
        headline: nullableText(150),
        about: nullableText(2000),
        location: nullableText(100),
        contact: nullableText(200),
    })
    .strict();

// PUT /profiles/me/visibility
// Send a map like { "about": "members", "contact": "only_me" }.
// Send only the sections you want to change.
export const updateVisibilitySchema = z
    .object({
        about: visibilityLevel.optional(),
        skills: visibilityLevel.optional(),
        experience: visibilityLevel.optional(),
        projects: visibilityLevel.optional(),
        contact: visibilityLevel.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Provide at least one visibility setting",
    });

export const visibilitySettingSchema = z
    .object({
        section: visibilitySection,
        level: visibilityLevel,
    })
    .strict();

// PUT /profiles/me/skills
// Send names, not ids. The service finds or creates each skill
// case-insensitively, so "React" and "react" become one skill.
export const setSkillsSchema = z
    .object({
        skills: z
            .array(z.string().trim().min(1).max(50))
            .max(30, "You can list at most 30 skills"),
    })
    .strict();

// POST /profiles/me/experiences
const experienceBase = z.object({
    company: z.string().trim().min(1, "Company is required").max(100),
    role: z.string().trim().min(1, "Role is required").max(100),
    start_date: dateText,
    end_date: dateText,
    description: nullableText(1000),
});

export const createExperienceSchema = experienceBase
    .strict()
    .refine(
        (data) => !data.start_date || !data.end_date || data.end_date >= data.start_date,
        { message: "End date must be on or after start date", path: ["end_date"] },
    );

// PATCH /profiles/me/experiences/:id
export const updateExperienceSchema = experienceBase
    .partial()
    .strict()
    .refine(
        (data) => !data.start_date || !data.end_date || data.end_date >= data.start_date,
        { message: "End date must be on or after start date", path: ["end_date"] },
    );

// POST /profiles/me/projects
// Link must be http or https only. No javascript: links, no data: links.
const httpUrl = z
    .string()
    .trim()
    .url("Link must be a valid URL")
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
        message: "Link must start with http:// or https://",
    });

export const createProjectSchema = z
    .object({
        title: z.string().trim().min(1, "Title is required").max(100),
        description: nullableText(1000),
        link: httpUrl.nullable().optional(),
    })
    .strict();

// PATCH /profiles/me/projects/:id
export const updateProjectSchema = z
    .object({
        title: z.string().trim().min(1).max(100).optional(),
        description: nullableText(1000),
        link: httpUrl.nullable().optional(),
    })
    .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateVisibilityInput = z.infer<typeof updateVisibilitySchema>;
export type SetSkillsInput = z.infer<typeof setSkillsSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
