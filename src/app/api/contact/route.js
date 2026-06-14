import { sendGmailEmail } from "@/lib/google.js";
import { notifyGerardo, formatLeadNotification } from "../utils/telegram.js";
import { generalLimiter } from "../utils/rate-limit.js";
import { auditLog } from "../utils/audit.js";
import { sendLeadEvent } from "../utils/meta-capi.js";
import { insertLead } from "../utils/insert-lead.js";

// Spawn lead qualifier agent in background (fire-and-forget, non-blocking)
async function spawnLeadQualifierAsync(leadData, baseUrl) {
  try {
    await fetch(`${baseUrl}/api/agents/lead-qualifier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
  } catch (err) {
    console.error('Lead qualifier spawn failed (non-fatal):', err.message);
  }
}

export async function POST(request) {
  const limitado = generalLimiter(request);
  if (limitado) return limitado;

  // Parse the body. Accept both application/json (the API default) AND
  // application/x-www-form-urlencoded / multipart/form-data (what HTML
  // <form> elements POST by default). If the Content-Type isn't one of
  // those we recognize, return a clear 415 — do NOT swallow the parse
  // error in a generic 502 with the misleading "your info was received"
  // message, which lied to the user and lost their submission.
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  let body;
  try {
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else if (contentType === "") {
      // Some browsers + the curl-without-Content-Type case: try JSON first,
      // then form-encoded as a fallback. This keeps the API forgiving for
      // unauthenticated site visitors hitting /api/contact.
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    } else {
      return Response.json(
        {
          error: `Unsupported Content-Type: ${contentType || "(none)"}. Use application/json, application/x-www-form-urlencoded, or multipart/form-data.`,
        },
        { status: 415 },
      );
    }
  } catch (parseError) {
    console.error("[contact] failed to parse body:", parseError?.message);
    return Response.json(
      {
        error: `Could not parse request body as ${contentType || "JSON"}. ${parseError?.message || ""}`.trim(),
      },
      { status: 400 },
    );
  }


    // Validate required minimal fields
    const requiredFields = ["name", "serviceType"]; // email/phone collected conditionally
    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return Response.json(
          { error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    // Require at least one contact method
    const hasEmail = !!(body.email && String(body.email).trim() !== "");
    const hasPhone = !!(body.phone && String(body.phone).trim() !== "");
    if (!hasEmail && !hasPhone) {
      return Response.json(
        { error: "Either email or phone is required" },
        { status: 400 },
      );
    }

    // If preferredContact provided, ensure that method exists
    const preferredContact =
      body.preferredContact || (hasEmail ? "email" : "phone");
    if (preferredContact === "email" && !hasEmail) {
      return Response.json(
        { error: "Email is required when preferred contact is email" },
        { status: 400 },
      );
    }
    if (preferredContact === "phone" && !hasPhone) {
      return Response.json(
        { error: "Phone is required when preferred contact is phone" },
        { status: 400 },
      );
    }

    // Validate formats only for the provided values
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (hasEmail && !emailRegex.test(body.email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (hasPhone && !phoneRegex.test(body.phone)) {
      return Response.json(
        { error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    let leadId = null;
    let leadSaved = false;

    // Save the lead directly via the shared insertLead helper — the
    // previous implementation POSTed to /api/leads as an internal fetch,
    // which both (a) hit a second rate-limit bucket and (b) bypassed CSRF
    // because this server-to-server call has no cookies. Inlining the
    // INSERT removes both problems.
    try {
      leadId = await insertLead({
        name: body.name,
        email: body.email,
        phone: body.phone,
        serviceType: body.serviceType,
        projectDescription: body.projectDescription,
        preferredContact: preferredContact,
        address: body.address,
        leadSource: body.leadSource || "website",
      });
      leadSaved = leadId != null;

      if (leadSaved) {
        // Fire-and-forget: spawn AI lead qualifier in background
        const baseUrl = request.url.split("/api/")[0];
        spawnLeadQualifierAsync(
          {
            leadId,
            name: body.name,
            email: body.email,
            phone: body.phone,
            serviceType: body.serviceType,
            projectDescription: body.projectDescription,
            address: body.address,
            preferredContact,
          },
          baseUrl,
        );

        // Fire-and-forget: Meta CAPI server-side Lead event for attribution
        sendLeadEvent({
          leadId,
          email: body.email,
          phone: body.phone,
          name: body.name,
          source: "website_contact",
          serviceType: body.serviceType,
          request,
        });
      }
    } catch (dbError) {
      console.error("Database error (continuing with email):", dbError);
    }

    // Send notification + confirmation emails via Gmail
    const adminEmail = process.env.GOOGLE_EMAIL || "info@arcanpainting.ca";
    try {
      // Notify the business
      await sendGmailEmail({
        to: adminEmail,
        subject: `New Lead: ${body.name} — ${body.serviceType}`,
        replyTo: hasEmail ? body.email : undefined,
        body: `<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${body.name}</p>
${hasEmail ? `<p><strong>Email:</strong> ${body.email}</p>` : ""}
${hasPhone ? `<p><strong>Phone:</strong> ${body.phone}</p>` : ""}
<p><strong>Service:</strong> ${body.serviceType}</p>
<p><strong>Preferred Contact:</strong> ${preferredContact}</p>
${body.address ? `<p><strong>Address:</strong> ${body.address}</p>` : ""}
${body.projectDescription ? `<p><strong>Description:</strong> ${body.projectDescription}</p>` : ""}`,
      });

      // Send confirmation to customer if they provided email
      if (hasEmail) {
        await sendGmailEmail({
          to: body.email,
          subject: "We received your request — Arcan Painting",
          body: `<p>Hi ${body.name},</p>
<p>Thank you for reaching out to Arcan Painting! We received your inquiry about <strong>${body.serviceType}</strong> and will contact you within 24 hours to schedule your free estimate.</p>
<p>Best regards,<br>The Arcan Painting Team</p>`,
        });
      }
    } catch (emailError) {
      console.error("Failed to send Gmail emails:", emailError);
      // Don't fail the request if emails fail
    }

    // Notify Gerardo via Telegram
    try {
      await notifyGerardo(formatLeadNotification(body));
    } catch (tgError) {
      console.error("Telegram notification failed:", tgError.message);
    }

    return Response.json({
      success: true,
      message:
        "Thank you! We will contact you within 24 hours to schedule your free estimate.",
      lead_saved: leadSaved,
      lead_id: leadId,
    });
}
