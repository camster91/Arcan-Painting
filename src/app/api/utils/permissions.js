export const STAFF_ROLES = new Set(["owner", "office", "estimator", "project_manager", "crew", "finance_readonly", "admin", "painter"]);

const grants = {
  owner: new Set(["*"]),
  office: new Set(["dashboard.read", "customers.read", "customers.write", "estimates.read", "estimates.write", "contracts.read", "contracts.write", "projects.read", "schedule.read", "schedule.write", "finance.read", "finance.write", "communications.manage", "marketing.read", "marketing.manage"]),
  estimator: new Set(["dashboard.read", "customers.read", "customers.write", "estimates.read", "estimates.write", "contracts.read", "contracts.write", "projects.read", "schedule.read"]),
  project_manager: new Set(["dashboard.read", "customers.read", "projects.read", "projects.write", "field.read", "field.write", "schedule.read", "schedule.write", "job_cost.read", "purchasing.write"]),
  crew: new Set(["field.read", "field.write", "projects.assigned"]),
  finance_readonly: new Set(["dashboard.read", "finance.read", "job_cost.read", "reports.read"]),
};

export function normalizeRole(role) {
  if (role === "admin") return "office";
  if (role === "painter") return "crew";
  return role;
}

export function hasPermission(userOrRole, permission) {
  const role = normalizeRole(typeof userOrRole === "string" ? userOrRole : userOrRole?.role);
  const roleGrants = grants[role];
  return Boolean(roleGrants && (roleGrants.has("*") || roleGrants.has(permission)));
}

export function isStaffRole(role) {
  return STAFF_ROLES.has(role);
}
