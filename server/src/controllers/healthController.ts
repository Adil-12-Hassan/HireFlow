import type { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { getLatencyMetrics } from "../middleware/requestTimer.js";
import { serviceUnavailable } from "../utils/errors.js";

// GET /health -> 200
// Simple check that Express is running. No database, no auth.
export async function health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
}

// GET /health/db -> 200 if Supabase answers, 503 if it does not
// We ask for only a count header, no rows, so this check is cheap.
export async function healthDb(_req: Request, res: Response): Promise<void> {
    const { error } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);

    if (error) {
        throw serviceUnavailable("Database is not available");
    }

    res.status(200).json({
        status: "ok",
        db: "connected",
        timestamp: new Date().toISOString(),
    });
}

// GET /health/metrics -> 200
// Average and p95 latency from requestTimer, plus uptime.
// No secrets, no request bodies, and no personal information are returned here.
export async function healthMetrics(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
        status: "ok",
        latency: getLatencyMetrics(),
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
}
