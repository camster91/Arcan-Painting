import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/app/api/internal-tasks/route.js"),
  "utf8",
);

describe("internal task domain", () => {
  test("constrains operational states and priorities", () => {
    expect(source).toContain('"todo", "in_progress", "blocked", "done"');
    expect(source).toContain('"low", "medium", "high", "urgent"');
    expect(source).toContain("Invalid task status");
    expect(source).toContain("Invalid task priority");
  });

  test("audits task creation, changes, and deletion", () => {
    for (const action of [
      "internal_task.create",
      "internal_task.update",
      "internal_task.delete",
    ]) {
      expect(source).toContain(`action: "${action}"`);
    }
  });
});
