import { sendTemplatedEmail } from "../utils/send-email.js";
import { triggerWorkflow } from "../email-workflows/route.js";

export async function POST(request) {
  try {
    const body = await request.json();

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

    // Try saving the lead only when both email and phone are present (DB currently requires both)
    try {
      if (hasEmail && hasPhone) {
        const leadResponse = await fetch(
          `${request.url.split("/api/")[0]}/api/leads`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: body.name,
              email: body.email,
              phone: body.phone,
              serviceType: body.serviceType,
              projectDescription: body.projectDescription,
              preferredContact: preferredContact,
              address: body.address,
            }),
          },
        );

        if (leadResponse.ok) {
          const leadData = await leadResponse.json();
          leadId = leadData.lead?.id;
          console.log("Lead saved successfully:", leadData.lead);
          leadSaved = true;
        } else {
          const leadError = await leadResponse.json();
          console.error("Failed to save lead:", leadError.error);
        }
      }
    } catch (dbError) {
      console.error("Database error (continuing with email):", dbError);
    }

    // UPDATED: support both RESEND_API_KEY and RESEND
    const hasResendKey = !!(process.env.RESEND_API_KEY || process.env.RESEND);

    // Send automated email workflows if Resend is configured
    if (hasResendKey) {
      try {
        // Trigger automated email workflows
        await triggerWorkflow("new_lead", {
          customer_name: body.name,
          customer_email: body.email,
          customer_phone: body.phone,
          service_type: body.serviceType,
          project_description:
            body.projectDescription || "No description provided",
          preferred_contact: preferredContact,
          address: body.address,
          app_url: process.env.APP_URL,
          related_type: "lead",
          related_id: leadId,
          admin_email: "info@arcanpainting.ca",
        });
      } catch (emailError) {
        console.error("Failed to send automated emails:", emailError);
        // Don't fail the request if emails fail
      }
    } else {
      console.warn("RESEND not configured; skipping automated emails");
    }

    return Response.json({
      success: true,
      message:
        "Thank you! We will contact you within 24 hours to schedule your free estimate.",
      lead_saved: leadSaved,
      lead_id: leadId,
    });
  } catch (error) {
    console.error("Error processing contact form:", error?.message || error);
    // Return a graceful error instead of a generic 500 to avoid dead ends in the UI
    return Response.json(
      {
        error:
          "We couldn't complete your request right now, but your info was received. Please expect a follow-up soon or call us directly at (555) PAINT-US.",
      },
      { status: 502 },
    );
  }
}
