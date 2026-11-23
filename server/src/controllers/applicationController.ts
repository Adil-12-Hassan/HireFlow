import type { Request, Response } from "express";
import * as applicationService from "../services/applicationService.js";
import { parsePagination } from "../utils/pagination.js";
import { unauthorized } from "../utils/errors.js";

function requireUserId(req: Request): string {
    if (!req.user) {
        throw unauthorized();
    }
    return req.user.id;
}

// In Express 5, req.params.id is typed string | string[].
function getParamId(req: Request): string {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
}

// POST /jobs/:id/applications -> 201, signed in only
export async function applyToJob(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const application = await applicationService.applyToJob(userId, getParamId(req), req.body);
    res.status(201).json(application);
}

// GET /applications/me -> 200, signed in only, my own applications
export async function listMyApplications(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const { page, limit } = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await applicationService.listMyApplications(userId, { page, limit, search });
    res.status(200).json(result);
}

// GET /jobs/:id/applications -> 200, job owner only
export async function listJobApplications(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const { page, limit } = parsePagination(req.query);
    const result = await applicationService.listJobApplications(userId, getParamId(req), { page, limit });
    res.status(200).json(result);
}

// PATCH /applications/:id/status -> 200, owner or applicant
export async function changeApplicationStatus(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const application = await applicationService.changeStatus(userId, getParamId(req), req.body);
    res.status(200).json(application);
}

// GET /applications/:id/history -> 200, applicant and job owner only
export async function getApplicationHistory(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const history = await applicationService.getApplicationHistory(userId, getParamId(req));
    res.status(200).json(history);
}
