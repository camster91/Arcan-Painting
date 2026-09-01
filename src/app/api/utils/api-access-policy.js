// Company-wide financial, contractual, audit, and gallery-management records
// are not painter-scoped. Keep the policy at the route-registration boundary
// so every method and nested resource receives the same role protection.
const ADMIN_ONLY_PREFIXES = [
  // Every route in this namespace is an administrative control or exposes
  // company-wide data. Enforce the role gate before its own handler runs.
  "/admin",
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

function normalizePath(pathname) {
  return pathname.startsWith("/api/") ? pathname.slice(4) : pathname;
}

function isUnsafe(method) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

/**
 * Returns the permission required at the shared API boundary. A null result
 * means the route is not governed by this boundary; individual handlers still
 * own authorization for those routes. Sensitive admin routes default to an
 * owner-only permission instead of becoming visible when a new route is added.
 */
export function requiredApiPermission(pathname, method = "GET") {
  const path = normalizePath(pathname);
  const write = isUnsafe(method);

  if (path === "/contracts" || path.startsWith("/contracts/")) {
    return write ? "contracts.write" : "contracts.read";
  }
  if (path === "/contract-templates" || path.startsWith("/contract-templates/")) {
    return write ? "contracts.write" : "contracts.read";
  }
  if (path === "/invoices" || path.startsWith("/invoices/")) {
    return write ? "finance.write" : "finance.read";
  }
  if (path === "/payments" || path.startsWith("/payments/")) {
    return write ? "finance.write" : "finance.read";
  }
  if (path === "/admin/dashboard") return "dashboard.read";
  if (path === "/admin/customer-portal-links") {
    return write ? "customers.write" : "customers.read";
  }
  if (path === "/admin/project-crew" || path.startsWith("/admin/project-crew/")) {
    return write ? "projects.write" : "projects.read";
  }
  if (path === "/admin/gallery" || path.startsWith("/admin/gallery/")) {
    return write ? "marketing.manage" : "marketing.read";
  }
  if (path === "/admin" || path.startsWith("/admin/")) return "owner.only";
  return null;
}
