import { afterEach, describe, expect, test } from "vitest";
import { getStripeWebhookSecret } from "@/app/api/stripe-webhook/route";

const originalCanonical = process.env.ARCAN_STRIPE_WEBHOOK_SECRET;
const originalLegacy = process.env.STRIPE_WEBHOOK_SECRET;

afterEach(() => {
  if (originalCanonical === undefined) delete process.env.ARCAN_STRIPE_WEBHOOK_SECRET;
  else process.env.ARCAN_STRIPE_WEBHOOK_SECRET = originalCanonical;
  if (originalLegacy === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = originalLegacy;
});

describe("Stripe webhook configuration", () => {
  test("uses the canonical secret and supports the documented legacy key during migration", () => {
    process.env.ARCAN_STRIPE_WEBHOOK_SECRET = "canonical-secret";
    process.env.STRIPE_WEBHOOK_SECRET = "legacy-secret";
    expect(getStripeWebhookSecret()).toBe("canonical-secret");

    delete process.env.ARCAN_STRIPE_WEBHOOK_SECRET;
    expect(getStripeWebhookSecret()).toBe("legacy-secret");
  });
});
