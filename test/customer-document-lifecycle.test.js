import { describe, expect, test } from "vitest";
import { customerDocumentSendError } from "@/app/api/utils/customer-document-domain";

describe("customer document send lifecycle", () => {
  test.each(["estimate", "contract", "invoice"])(
    "allows draft and sent %s delivery",
    (kind) => {
      expect(customerDocumentSendError(kind, "draft")).toBeNull();
      expect(customerDocumentSendError(kind, "sent")).toBeNull();
    },
  );

  test.each([
    ["estimate", "approved"],
    ["estimate", "rejected"],
    ["contract", "signed"],
    ["contract", "completed"],
    ["invoice", "void"],
    ["invoice", "cancelled"],
  ])("blocks sending a %s in %s state", (kind, status) => {
    expect(customerDocumentSendError(kind, status)).toMatch(/cannot be sent/);
  });
});
