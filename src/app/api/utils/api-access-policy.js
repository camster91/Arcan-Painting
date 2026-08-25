// Company-wide financial, contractual, audit, and gallery-management records
// are not painter-scoped. Keep the policy at the route-registration boundary
// so every method and nested resource receives the same role protection.
const ADMIN_ONLY_PREFIXES = [
  "/admin/audit-logs",
  "/admin/gallery",
  "/contract-templates",
  "/contracts",
  "/invoices",
  "/payments",
];

export function requiresAdminApiAccess(pathname) {
  const path = pathname.startsWith("/api/") ? pathname.slice(4) : pathname;
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
