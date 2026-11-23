import { z } from "zod";

// Job status in the database: draft, open, closed.
// draft = only the owner can see it
// open = public, anyone can see it and apply
// closed = only the owner can see it, no new applications
export const jobStatusSchema = z.enum(["draft", "open", "closed"]);

// On create, a job can only start as draft or open.
// It cannot be created as closed, because closed means
// it was open before and then closed by the owner.
export const createJobStatusSchema = z.enum(["draft", "open"]);

const titleField = z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters");

const descriptionField = z
    .string()
    .trim()
    .max(5000, "Description must be at most 5000 characters")
    .nullable()
    .optional();

// POST /jobs
// owner_id is not here on purpose. The owner always comes
// from the logged-in cookie in the service, never from the request.
export const createJobSchema = z
    .object({
        title: titleField,
        description: descriptionField,
        status: createJobStatusSchema.optional(),
    })
    .strict();

// PATCH /jobs/:id
// All fields are optional, but at least one must be sent.
// description can be set to null to clear it.
// Status changes like draft -> open or open -> closed are
// checked in the service, because only the service knows
// the current status saved in the database.
export const updateJobSchema = z
    .object({
        title: titleField.optional(),
        description: descriptionField,
        status: jobStatusSchema.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Nothing to update",
    });

export type JobStatus = z.infer<typeof jobStatusSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
