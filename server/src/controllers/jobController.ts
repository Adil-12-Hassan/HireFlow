import type { Request, Response } from "express";
import * as jobService from "../services/jobService.js";
import { parsePagination } from "../utils/pagination.js";
import { unauthorized } from "../utils/errors.js";

function requireUserId(req: Request): string {
    if (!req.user) {
        throw unauthorized();
    }
    return req.user.id;
}

// In Express 5, req.params.id is typed string | string[].
// This helper takes the first value, so TypeScript is happy
// and a repeated ?id= in the URL cannot slip through as an array.
function getParamId(req: Request): string {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
}

// POST /jobs -> 201, signed in only
export async function createJob(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const job = await jobService.createJob(userId, req.body);
    res.status(201).json(job);
}

// GET /jobs -> 200, public, open jobs only
export async function listJobs(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await jobService.listOpenJobs({ page, limit, search });
    res.status(200).json(result);
}

// GET /jobs/mine -> 200, signed in only, all my jobs including drafts
export async function listMyJobs(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const { page, limit } = parsePagination(req.query);
    const result = await jobService.listMyJobs(userId, { page, limit });
    res.status(200).json(result);
}

// GET /jobs/:id -> 200, public if open, owner only if draft or closed
export async function getJob(req: Request, res: Response): Promise<void> {
    const job = await jobService.getJobById(req.user?.id, getParamId(req));
    res.status(200).json(job);
}

// PATCH /jobs/:id -> 200, owner only
export async function updateJob(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const job = await jobService.updateJob(userId, getParamId(req), req.body);
    res.status(200).json(job);
}
