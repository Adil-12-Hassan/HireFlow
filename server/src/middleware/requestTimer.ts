import type { NextFunction, Request, Response } from "express";

// Keep only the last 1000 requests, so memory does not grow forever.
const durations: number[] = [];
const MAX_SAMPLES = 1000;

export type LatencyMetrics = {
    count: number;
    avgMs: number;
    p95Ms: number;
};

export function getLatencyMetrics(): LatencyMetrics {
    if (durations.length === 0) {
        return { count: 0, avgMs: 0, p95Ms: 0 };
    }
    const sorted = [...durations].sort((a, b) => a - b);
    const sum = durations.reduce((total, value) => total + value, 0);
    const avg = sum / durations.length;
    const p95Index = Math.max(0, Math.ceil(0.95 * sorted.length) - 1);
    return {
        count: durations.length,
        avgMs: Math.round(avg * 100) / 100,
        p95Ms: Math.round(sorted[p95Index] * 100) / 100,
    };
}

export function requestTimer(_req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        res.locals.durationMs = durationMs;
        durations.push(durationMs);
        if (durations.length > MAX_SAMPLES) {
            durations.shift();
        }
    });

    next();
}
