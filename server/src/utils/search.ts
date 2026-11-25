// Build a PostgREST .or() filter for a case-insensitive text search.
// The term is quoted and escaped, so characters like , ( ) " can not break
// the filter or add extra conditions. Returns null when nothing is left to
// search for, so the caller can skip the filter.
export function ilikeOr(columns: string[], raw: string): string | null {
    const term = raw
        .replace(/[%_*]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .trim();
    if (!term) return null;
    return columns.map((column) => `${column}.ilike."%${term}%"`).join(",");
}
