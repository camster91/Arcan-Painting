import { createHash, randomBytes } from "crypto";

export const CUSTOMER_PORTAL_TOKEN_BYTES = 32;
export const CUSTOMER_PORTAL_MAX_DAYS = 90;

export function createCustomerPortalToken() {
  return randomBytes(CUSTOMER_PORTAL_TOKEN_BYTES).toString("base64url");
}

export function isCustomerPortalToken(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function hashCustomerPortalToken(value) {
  if (!isCustomerPortalToken(value)) throw new Error("Invalid portal token");
  return createHash("sha256").update(value).digest("hex");
}

export function normalizePortalExpiryDays(value) {
  const days = Number(value ?? 30);
  if (!Number.isInteger(days) || days < 1 || days > CUSTOMER_PORTAL_MAX_DAYS) {
    throw new Error(`Expiry must be between 1 and ${CUSTOMER_PORTAL_MAX_DAYS} days`);
  }
  return days;
}

export function canCustomerApproveEstimate(status) {
  return status === "sent";
}

export function canCustomerSignContract(status) {
  return ["sent", "viewed"].includes(status);
}

export function canCustomerDecideChangeOrder(status) {
  return status === "sent";
}
