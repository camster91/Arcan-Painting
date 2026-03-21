// Re-export all auth utilities from the canonical auth module.
// This file exists so imports from "auth-middleware" work as documented.
export {
  generateSecureToken,
  parseCookies,
  getCurrentUser,
  requireAuth,
  requireAdmin,
  unauthorizedResponse,
} from "./auth.js";
