import { getCurrentUser } from "@/app/api/utils/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Ensure onboarding columns exist
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_name TEXT`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_phone TEXT`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_email TEXT`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_address TEXT`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_tagline TEXT`;
    await sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS google_prompted_at TIMESTAMP`;

    // Check if Google is connected
    const googleConn = await sql`
      SELECT id, account_email, account_name
      FROM marketing_connections
      WHERE platform = 'google' AND is_active = true
      LIMIT 1
    `;

    // Check onboarding status from app_settings
    const settings = await sql`
      SELECT onboarding_completed, onboarding_step, company_name, company_phone, company_email, company_address, company_tagline, google_prompted_at
      FROM app_settings
      ORDER BY id DESC LIMIT 1
    `;

    const googleConnected = googleConn.length > 0;
    const onboardingCompleted = settings[0]?.onboarding_completed || false;

    return Response.json({
      success: true,
      completed: onboardingCompleted,
      needsOnboarding: !onboardingCompleted,
      onboardingStep: settings[0]?.onboarding_step || 1,
      googleConnected,
      onboardingCompleted,
      companyName: settings[0]?.company_name || null,
      companyPhone: settings[0]?.company_phone || null,
      companyEmail: settings[0]?.company_email || null,
      companyAddress: settings[0]?.company_address || null,
      companyTagline: settings[0]?.company_tagline || null,
      googleAccount: googleConnected
        ? {
            email: googleConn[0].account_email,
            name: googleConn[0].account_name,
          }
        : null,
    });
  } catch (err) {
    console.error("[onboarding] GET error:", err);
    return Response.json(
      { error: "Failed to check onboarding status" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = body;

    const existing = await sql`
      SELECT id FROM app_settings ORDER BY id DESC LIMIT 1
    `;
    const settingsId = existing[0]?.id;

    if (action === "save_business_info") {
      const { company_name, company_phone, company_email, company_address, company_tagline } = body;
      if (settingsId) {
        await sql`
          UPDATE app_settings
          SET company_name = ${company_name || null}, company_phone = ${company_phone || null},
              company_email = ${company_email || null}, company_address = ${company_address || null},
              company_tagline = ${company_tagline || null}, onboarding_step = 3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${settingsId}
        `;
      } else {
        await sql`
          INSERT INTO app_settings (company_name, company_phone, company_email, company_address, company_tagline, onboarding_step)
          VALUES (${company_name || null}, ${company_phone || null}, ${company_email || null}, ${company_address || null}, ${company_tagline || null}, 3)
        `;
      }
      return Response.json({ success: true });
    }

    if (action === "set_step") {
      const { step } = body;
      if (settingsId) {
        await sql`
          UPDATE app_settings SET onboarding_step = ${step}, updated_at = CURRENT_TIMESTAMP WHERE id = ${settingsId}
        `;
      } else {
        await sql`INSERT INTO app_settings (onboarding_step) VALUES (${step})`;
      }
      return Response.json({ success: true });
    }

    if (action === "complete") {
      if (settingsId) {
        await sql`
          UPDATE app_settings
          SET onboarding_completed = true, onboarding_step = 4, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${settingsId}
        `;
      } else {
        await sql`
          INSERT INTO app_settings (onboarding_completed, onboarding_step) VALUES (true, 4)
        `;
      }
      return Response.json({ success: true, onboardingCompleted: true });
    }

    if (action === "prompted") {
      if (settingsId) {
        await sql`
          UPDATE app_settings
          SET google_prompted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${settingsId}
        `;
      } else {
        await sql`
          INSERT INTO app_settings (google_prompted_at) VALUES (CURRENT_TIMESTAMP)
        `;
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[onboarding] POST error:", err);
    return Response.json(
      { error: "Failed to update onboarding" },
      { status: 500 },
    );
  }
}
