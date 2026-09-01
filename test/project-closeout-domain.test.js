import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CLOSEOUT_STEPS, seedProjectCloseout, validateProjectCloseout } from "@/app/api/utils/project-closeout-domain";

describe("project closeout gate", () => {
  const ready = { completionPercentage: 100, requiredSteps: 4, incompleteRequiredSteps: 0, openIssues: 0, activeTimers: 0 };

  it("requires complete progress, checklist evidence, resolved issues, and stopped timers", () => {
    expect(validateProjectCloseout(ready)).toBeNull();
    expect(validateProjectCloseout({ ...ready, completionPercentage: 90 })).toMatch(/100%/);
    expect(validateProjectCloseout({ ...ready, incompleteRequiredSteps: 1 })).toMatch(/remain incomplete/);
    expect(validateProjectCloseout({ ...ready, openIssues: 1 })).toMatch(/must be resolved/);
    expect(validateProjectCloseout({ ...ready, activeTimers: 1 })).toMatch(/clocked out/);
  });

  it("defines and idempotently seeds painting-specific closeout evidence", async () => {
    expect(DEFAULT_CLOSEOUT_STEPS.map(([title]) => title)).toEqual(expect.arrayContaining(["Final walkthrough completed", "Punch list resolved", "Completion photos uploaded", "Care instructions delivered"]));
    const sql = vi.fn().mockResolvedValue([]);
    await seedProjectCloseout(sql, 12);
    expect(sql).toHaveBeenCalledOnce();
    expect(String(sql.mock.calls[0][0])).toContain("WHERE NOT EXISTS");
  });
});
