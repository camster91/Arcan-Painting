import { redirect } from "react-router";
import { requireAdmin } from "../api/utils/auth.js";

export async function protectAdminRoute(request) {
  if (await requireAdmin(request)) {
    return null;
  }

  const url = new URL(request.url);
  const callbackUrl = `${url.pathname}${url.search}`;
  return redirect(`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
