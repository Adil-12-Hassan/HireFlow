import type { Request, Response } from "express";
import * as profileService from "../services/profileService.js";
import { parsePagination } from "../utils/pagination.js";
import { unauthorized } from "../utils/errors.js";

function requireUserId(req: Request): string {
    if (!req.user) {
        throw unauthorized();
    }
    return req.user.id;
}

function getParamId(req: Request): string {
    const id = req.params.id;
    return Array.isArray(id) ? (id[0] ?? "") : id;
}

// GET /profiles -> 200, public with search and pagination
export async function listProfiles(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await profileService.listProfiles(req.user?.id, { page, limit, search });
    res.status(200).json(result);
}

// GET /profiles/me -> 200, signed in only, full own profile
export async function getMyProfile(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const profile = await profileService.getProfileById(userId, userId);
    res.status(200).json(profile);
}

// GET /profiles/:id -> 200, filtered by visibility
export async function getProfile(req: Request, res: Response): Promise<void> {
    const profile = await profileService.getProfileById(req.user?.id, getParamId(req));
    res.status(200).json(profile);
}

// PATCH /profiles/me -> 200
export async function updateMyProfile(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const profile = await profileService.updateMyProfile(userId, req.body);
    res.status(200).json(profile);
}

// PUT /profiles/me/visibility -> 200
export async function updateMyVisibility(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const visibility = await profileService.updateMyVisibility(userId, req.body);
    res.status(200).json({ visibility });
}

// PUT /profiles/me/skills -> 200
export async function setMySkills(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const skills = await profileService.setMySkills(userId, req.body);
    res.status(200).json({ skills });
}

// POST /profiles/me/experiences -> 201
export async function createExperience(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const experience = await profileService.createExperience(userId, req.body);
    res.status(201).json(experience);
}

// PATCH /profiles/me/experiences/:id -> 200
export async function updateExperience(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const experience = await profileService.updateExperience(userId, getParamId(req), req.body);
    res.status(200).json(experience);
}

// DELETE /profiles/me/experiences/:id -> 204, no body
export async function deleteExperience(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    await profileService.deleteExperience(userId, getParamId(req));
    res.status(204).send();
}

// POST /profiles/me/projects -> 201
export async function createProject(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const project = await profileService.createProject(userId, req.body);
    res.status(201).json(project);
}

// PATCH /profiles/me/projects/:id -> 200
export async function updateProject(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const project = await profileService.updateProject(userId, getParamId(req), req.body);
    res.status(200).json(project);
}

// DELETE /profiles/me/projects/:id -> 204, no body
export async function deleteProject(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    await profileService.deleteProject(userId, getParamId(req));
    res.status(204).send();
}
