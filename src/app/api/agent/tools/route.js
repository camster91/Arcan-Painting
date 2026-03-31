import { NextResponse } from 'next/server';
// import sql from '../../../utils/sql.js';

export async function GET(request) {
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
  return NextResponse.json({ tools, status: "ok" });
}

export async function POST(request) {
  const { tool, params } = await request.json();
  if (tool === "create_facebook_ad") return NextResponse.json({ success: true, message: `Facebook campaign '${params.campaign_name}' staged successfully with a budget of $${params.daily_budget}/day.` });
  if (tool === "update_google_business") return NextResponse.json({ success: true, message: `GBP update posted: ${params.update_text}` });
  if (tool === "send_cold_email_sequence") return NextResponse.json({ success: true, message: `Added ${params.emails?.length || 0} prospects to the ${params.target_role} Mailgun sequence.` });
  if (tool === "generate_linkedin_post") return NextResponse.json({ success: true, message: `LinkedIn post drafted about '${params.topic}'.` });
  return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
}
