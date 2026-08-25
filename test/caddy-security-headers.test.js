import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const caddyfilePath = resolve(process.cwd(), "infra/caddy/Caddyfile");

describe("Arcan Caddy security headers", () => {
  it("protects public pages and API responses with baseline browser headers", async () => {
    const caddyfile = await readFile(caddyfilePath, "utf8");
    const arcanBlock = caddyfile.match(
      /arcanpainting\.ca, www\.arcanpainting\.ca \{([\s\S]*?)\n\}/,
    )?.[1];

    expect(arcanBlock).toBeDefined();
    expect(arcanBlock).toContain("encode gzip zstd");
    expect(arcanBlock).toContain(
      'Strict-Transport-Security "max-age=31536000; includeSubDomains"',
    );
    expect(arcanBlock).toContain('X-Frame-Options "SAMEORIGIN"');
    expect(arcanBlock).toContain('X-Content-Type-Options "nosniff"');
    expect(arcanBlock).toContain(
      'Referrer-Policy "strict-origin-when-cross-origin"',
    );
    expect(arcanBlock).toContain(
      'Permissions-Policy "camera=(), geolocation=(), microphone=()"',
    );
  });
});
