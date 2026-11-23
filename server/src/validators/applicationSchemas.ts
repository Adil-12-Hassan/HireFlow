import { z } from "zod";

// All statuses in the database. applied is the starting status
// when someone applies, it is never set again by an update.
export const applicationStatusSchema = z.enum([
    "applied",
    "in_review",
    "shortlisted",
    "interview",
    "offer",
    "hired",
    "rejected",
    "withdrawn",
]);

// Statuses an update can set. applied is left out on purpose,
// you cannot go back to applied after a decision has started.
export const updateApplicationStatusSchema = z.enum([
    "in_review",
    "shortlisted",
    "interview",
    "offer",
    "hired",
    "rejected",
    "withdrawn",
]);

// Statuses only the job owner can set.
// The applicant can only set withdrawn, the service checks this.
export const ownerApplicationStatusSchema = z.enum([
    "in_review",
    "shortlisted",
    "interview",
    "offer",
    "hired",
    "rejected",
]);

// POST /jobs/:id/applications
// job_id comes from the URL, applicant_id comes from the
// logged-in cookie. Neither is in the body, so a user cannot
// apply as someone else or for a different job than the URL says.
// cover_note is optional, and can be null to send no note.
export const applyToJobSchema = z
    .object({
        cover_note: z
            .string()
            .trim()
            .max(2000, "Cover note must be at most 2000 characters")
            .nullable()
            .optional(),
    })
    .strict();

// PATCH /applications/:id/status
// Only the new status is sent. Who is allowed to set which
// status is checked in the service, because only the service
// knows if you are the job owner or the applicant.
export const changeApplicationStatusSchema = z
    .object({
        status: updateApplicationStatusSchema,
    })
    .strict();

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;
export type ChangeApplicationStatusInput = z.infer<
    typeof changeApplicationStatusSchema
>;
