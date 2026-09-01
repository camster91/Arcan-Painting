import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

describe("sensitive operation audit coverage", () => {
  test.each([
    [
      "src/app/api/estimates/route.js",
      ["estimate.create", "estimate.update", "estimate.delete"],
    ],
    [
      "src/app/api/contracts/route.js",
      ["contract.create", "contract.update", "contract.delete"],
    ],
    [
      "src/app/api/contract-templates/route.js",
      [
        "contract_template.create",
        "contract_template.update",
        "contract_template.delete",
      ],
    ],
    ["src/app/api/settings/route.js", ["settings.create", "settings.update"]],
    [
      "src/app/api/team-members/route.js",
      ["team_member.create", "team_member.update"],
    ],
    ["src/app/api/team-invites/route.js", ["team_invite.create"]],
    ["src/app/api/financial-report/route.js", ["finance.export"]],
    ["src/app/api/sales-marketing-report/route.js", ["marketing.export"]],
    [
      "src/app/api/follow-ups/route.js",
      ["follow_up.create", "follow_up.update", "follow_up.delete"],
    ],
    [
      "src/app/api/estimates/[id]/duplicate/route.js",
      ["estimate.duplicate"],
    ],
    [
      "src/app/api/availability/route.js",
      [
        "availability_slot.create",
        "availability_slot.status_update",
        "availability_slot.delete",
      ],
    ],
    [
      "src/app/api/availability/bulk/route.js",
      ["availability_slot.bulk_create"],
    ],
    [
      "src/app/api/onboarding/route.js",
      [
        "onboarding.business_info_update",
        "onboarding.step_update",
        "onboarding.complete",
        "onboarding.google_prompted",
      ],
    ],
    [
      "src/app/api/team-availability/route.js",
      [
        "team_availability.create",
        "team_availability.update",
        "team_availability.delete",
      ],
    ],
  ])("retains required audit actions in %s", (path, actions) => {
    const source = read(path);
    expect(source).toContain("auditLog");
    for (const action of actions)
      expect(source).toContain(`action: "${action}"`);
  });
});
