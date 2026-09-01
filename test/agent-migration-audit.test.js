import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const migrationRoute = readFileSync(
  join(process.cwd(), "src/app/api/agents/migrate/route.js"),
  "utf8",
);
const agentRootRoute = readFileSync(
  join(process.cwd(), "src/app/api/agents/route.js"),
  "utf8",
);

describe("agent migration control trail", () => {
  test("records both successful and failed migration runs in the central audit log", () => {
    expect(migrationRoute).toContain("action: 'agent_migration.run'");
    expect(migrationRoute).toContain("status: errors.length === 0 ? 'success' : 'failure'");
    expect(migrationRoute).toContain("status: 'failure'");
  });

  test("keeps database mutation in the dedicated authenticated migration route", () => {
    expect(agentRootRoute).not.toContain("migrateAgentFields");
    expect(agentRootRoute).toContain("Use POST /api/agents/migrate");
  });
});
