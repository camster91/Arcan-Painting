import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const runbook = readFileSync(
  join(process.cwd(), "OPERATIONS-RUNBOOK.md"),
  "utf8",
);

describe("operations handoff runbook", () => {
  test.each([
    "## Daily operator checks",
    "## Staging validation",
    "## Release gate",
    "## Rollback",
    "## Backup and restore",
    "## Privacy and retention",
    "## Incident response",
    "## Integration ownership",
    "## Handoff evidence template",
  ])("publishes %s", (heading) => {
    expect(runbook).toContain(heading);
  });

  test("requires exact-artifact approval and provider ownership", () => {
    expect(runbook).toContain("approve the exact application SHA");
    expect(runbook).toContain("secret-manager reference");
    expect(runbook).toMatch(/Never copy production\s+credentials/);
  });
});
