import { describe, expect, test } from "vitest";
import { canTransitionProject } from "@/app/api/projects/route";

describe("project lifecycle", () => {
  test.each([
    ["scheduled", "in_progress"],
    ["in_progress", "paused"],
    ["paused", "in_progress"],
    ["in_progress", "completed"],
    ["scheduled", "cancelled"],
    ["completed", "completed"],
  ])("allows %s to %s", (from, to) => expect(canTransitionProject(from, to)).toBe(true));

  test.each([
    ["scheduled", "completed"],
    ["completed", "in_progress"],
    ["cancelled", "scheduled"],
    ["unknown", "in_progress"],
  ])("rejects %s to %s", (from, to) => expect(canTransitionProject(from, to)).toBe(false));
});
