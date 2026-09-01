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
  ])("retains required audit actions in %s", (path, actions) => {
    const source = read(path);
    expect(source).toContain("auditLog");
    for (const action of actions)
      expect(source).toContain(`action: "${action}"`);
  });
});
