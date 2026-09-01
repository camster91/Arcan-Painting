import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
const dockerIgnore = readFileSync(resolve(process.cwd(), ".dockerignore"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/manifest.json"), "utf8"));

describe("field service worker safety boundary", () => {
  it("does not pre-cache admin pages or authenticated API responses", () => {
    const staticAssets = worker.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/)?.[1] || "";
    expect(staticAssets).not.toContain('"/admin');
    expect(worker).toContain("Authenticated API data is never persisted");
    expect(worker).toContain("fetch(request).catch(() => offlineApiResponse())");
  });

  it("ships an installable worker and field-focused manifest in the runtime image", () => {
    expect(dockerIgnore.split(/\r?\n/)).not.toContain("public/sw.js");
    expect(manifest).toMatchObject({ start_url: "/admin/today", display: "standalone" });
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  });

  it("queues only bounded absolute field updates", () => {
    expect(worker).toContain('["/api/completion-workflows", new Set(["PUT"])]');
    expect(worker).toContain('["/api/project-progress", new Set(["PUT"])]');
    expect(worker).toContain('["/api/projects", new Set(["PUT"])]');
    expect(worker).not.toContain('new Set(["POST"]');
    expect(worker).toContain("MAX_OUTBOX_BODY_BYTES");
  });

  it("persists an IndexedDB outbox, stops bounded retries, and clears local state on logout", () => {
    expect(worker).toContain("indexedDB.open(OUTBOX_DB");
    expect(worker).toContain("MAX_SYNC_ATTEMPTS");
    expect(worker).toContain("handleLogout(request)");
    expect(worker).toContain("handleLogin(request)");
    expect(worker).toContain("clearOfflineState()");
    expect(worker).toContain("credentials: \"include\"");
  });
});
