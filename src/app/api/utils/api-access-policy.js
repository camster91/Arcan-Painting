// Company-wide financial, contractual, audit, and gallery-management records
// are not painter-scoped. Keep the policy at the route-registration boundary
// so every method and nested resource receives the same role protection.
const ADMIN_ONLY_PREFIXES = [
  // Every route in this namespace is an administrative control or exposes
  // company-wide data. Enforce the role gate before its own handler runs.
  "/admin",
  "/contract-templates",
  "/contracts",
  "/customers",
  "/invoices",
  "/payments",
];

export function requiresAdminApiAccess(pathname) {
  const path = pathname.startsWith("/api/") ? pathname.slice(4) : pathname;
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
