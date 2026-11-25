import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedOrigin, parseOrigins } from "../src/utils/origins.js";
import { ilikeOr } from "../src/utils/search.js";

test("parseOrigins trims, removes trailing slashes and splits lists", () => {
    assert.deepEqual(parseOrigins("https://a.app/"), ["https://a.app"]);
    assert.deepEqual(parseOrigins(" https://a.app , http://localhost:5173/ "), [
        "https://a.app",
        "http://localhost:5173",
    ]);
});

test("isAllowedOrigin matches exactly", () => {
    const allowed = parseOrigins("https://a.app/");
    assert.equal(isAllowedOrigin("https://a.app", allowed), true);
    assert.equal(isAllowedOrigin("https://evil.app", allowed), false);
    assert.equal(isAllowedOrigin("https://a.app.evil.com", allowed), false);
});

test("ilikeOr quotes the term so commas and brackets cannot break the filter", () => {
    assert.equal(ilikeOr(["title"], "react"), 'title.ilike."%react%"');
    assert.equal(
        ilikeOr(["title", "description"], 'a,status.eq.draft)'),
        'title.ilike."%a,status.eq.draft)%",description.ilike."%a,status.eq.draft)%"',
    );
    assert.equal(ilikeOr(["title"], 'say "hi"'), 'title.ilike."%say \\"hi\\"%"');
});

test("ilikeOr strips wildcards and returns null for an empty term", () => {
    assert.equal(ilikeOr(["title"], "100%_*"), 'title.ilike."%100%"');
    assert.equal(ilikeOr(["title"], "%%__"), null);
    assert.equal(ilikeOr(["title"], "   "), null);
});

test("token helpers read Bearer header first, then cookie", async () => {
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    const { getAccessToken, getRefreshToken, isTokenClient } = await import("../src/utils/cookies.js");
    type Req = Parameters<typeof getAccessToken>[0];
    const make = (headers: Record<string, string>, cookies: Record<string, string>, body?: unknown) =>
        ({ headers, cookies, body }) as unknown as Req;

    assert.equal(getAccessToken(make({ authorization: "Bearer abc" }, { hireflow_access: "cookie" })), "abc");
    assert.equal(getAccessToken(make({ authorization: "bearer   " }, { hireflow_access: "cookie" })), "cookie");
    assert.equal(getAccessToken(make({}, {})), undefined);

    const mobile = make({ "x-client-type": "mobile" }, {}, { refreshToken: "r1" });
    assert.equal(isTokenClient(mobile), true);
    assert.equal(getRefreshToken(mobile), "r1");
    // A browser can not smuggle a refresh token in the body.
    assert.equal(getRefreshToken(make({}, { hireflow_refresh: "c" }, { refreshToken: "r1" })), "c");
});
