
import { requireAdmin } from "../../utils/auth.js";
import { requireCsrf } from "../../utils/csrf.js";

export async function GET(request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tools = [
    {
      name: "create_facebook_ad",
      description: "Launch a new Facebook or Instagram ad campaign for Arcan Painting.",
      parameters: { type: "object", properties: { campaign_name: { type: "string" }, daily_budget: { type: "number" }, headline: { type: "string" }, primary_text: { type: "string" } }, required: ["campaign_name", "daily_budget", "headline", "primary_text"] }
    },
    {
      name: "update_google_business",
      description: "Post a new update or before/after photo to the Arcan Painting Google Business Profile.",
      parameters: { type: "object", properties: { update_text: { type: "string" }, image_url: { type: "string" } }, required: ["update_text"] }
    },
    {
      name: "send_cold_email_sequence",
      description: "Add a list of property manager or real estate agent emails to the Mailgun cold outreach drip sequence.",
      parameters: { type: "object", properties: { target_role: { type: "string", enum: ["property_manager", "real_estate_agent", "hoa_manager"] }, emails: { type: "array", items: { type: "string" } } }, required: ["target_role", "emails"] }
    },
    {
      name: "generate_linkedin_post",
      description: "Draft and schedule a B2B LinkedIn post for commercial painting lead generation.",
      parameters: { type: "object", properties: { topic: { type: "string" }, scheduled_time: { type: "string" } }, required: ["topic"] }
    }
  ];
  return Response.json({ tools, status: "ok" });
}

export async function POST(request) {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tool, params } = await request.json();
  if (tool === "create_facebook_ad") return Response.json({ success: true, status: "staged", message: `Facebook campaign '${params.campaign_name}' was staged locally with a budget of $${params.daily_budget}/day. No external campaign was launched.` });
  if (tool === "update_google_business") return Response.json({ success: true, status: "staged", message: `Google Business Profile update was staged locally. No external post was published.` });
  if (tool === "send_cold_email_sequence") return Response.json({ success: true, status: "staged", message: `${params.emails?.length || 0} prospects were staged for the ${params.target_role} sequence. No email was sent.` });
  if (tool === "generate_linkedin_post") return Response.json({ success: true, status: "staged", message: `LinkedIn post draft was staged about '${params.topic}'. No post was scheduled or published.` });
  return Response.json({ error: "Unknown tool" }, { status: 400 });
}
