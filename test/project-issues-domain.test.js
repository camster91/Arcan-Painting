import { describe, expect, test } from "vitest";
import { canTransitionProjectIssue, validateProjectIssueInput } from "@/app/api/utils/project-issues-domain";

describe("project issue lifecycle", () => {
  test("allows operational resolution and owner-only voiding", () => {
    expect(canTransitionProjectIssue("open", "in_progress")).toBe(true);
    expect(canTransitionProjectIssue("in_progress", "resolved")).toBe(true);
    expect(canTransitionProjectIssue("resolved", "open")).toBe(true);
    expect(canTransitionProjectIssue("open", "void", { owner: false })).toBe(false);
    expect(canTransitionProjectIssue("open", "void", { owner: true })).toBe(true);
    expect(canTransitionProjectIssue("void", "open", { owner: true })).toBe(false);
  });

  test("validates bounded contractor issue fields", () => {
    expect(validateProjectIssueInput({ issue_type: "damage", severity: "high", title: "Wall damage", description: "Drywall damage found behind wallpaper." })).toMatchObject({ type: "damage", severity: "high" });
    expect(() => validateProjectIssueInput({ issue_type: "unknown", title: "Bad", description: "Bad" })).toThrow("type");
    expect(() => validateProjectIssueInput({ severity: "urgent", title: "Bad", description: "Bad" })).toThrow("Severity");
    expect(() => validateProjectIssueInput({ title: "x", description: "Valid description" })).toThrow("title");
  });
});
