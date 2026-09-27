import { redirect } from "react-router";
import { requireAdmin, getCurrentUser } from "../api/utils/auth.js";

export async function protectAdminRoute(request) {
  if (await requireAdmin(request)) {
    return null;
  }

  const url = new URL(request.url);
  const callbackUrl = `${url.pathname}${url.search}`;
  return redirect(`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

// The crew view is open to any signed-in account (painters, supervisors, owner).
export async function protectCrewRoute(request) {
  if (await getCurrentUser(request)) {
    return null;
  }

  const url = new URL(request.url);
  return redirect(`/account/signin?callbackUrl=${encodeURIComponent(url.pathname)}`);
}
