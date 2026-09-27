import sql from "@/app/api/utils/sql";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { isPublicToken } from "@/app/api/utils/public-links";
import { publicInvoice } from "@/app/api/utils/public-documents";

// GET ?token=… — the customer's view of an invoice (no login).
export async function GET(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const token = new URL(request.url).searchParams.get("token");
  const invoice = isPublicToken(token) ? await publicInvoice(sql, token) : null;
  if (!invoice) return Response.json({ error: "This invoice link is not valid." }, { status: 404 });
  const { id: _id, ...visible } = invoice;
  return Response.json({ invoice: visible });
}
