import type { Context } from "hono";
import { getHTMLForErrorPage } from "./get-html-for-error-page";

/** Keep error details in server-side observability, never in client responses. */
export function getSafeErrorResponse(c: Context) {
  if (c.req.method === "GET") {
    return c.html(getHTMLForErrorPage(), 500);
  }

  return c.json({ error: "An unexpected error occurred" }, 500);
}
