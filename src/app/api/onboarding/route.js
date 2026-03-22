import { getCurrentUser } from "@/app/api/utils/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if Google is connected
    const googleConn = await sql`
      SELECT id, account_email, account_name
      FROM marketing_connections
      WHERE platform = 'google' AND is_active = true
      LIMIT 1
    `;

    // Check onboarding status from app_settings
    const settings = await sql`
      SELECT onboarding_completed, google_prompted_at
      FROM app_settings
      ORDER BY id DESC LIMIT 1
    `;

    const googleConnected = googleConn.length > 0;
    const onboardingCompleted = settings[0]?.onboarding_completed || false;

    return Response.json({
      success: true,
      needsOnboarding: !onboardingCompleted && !googleConnected,
      googleConnected,
      onboardingCompleted,
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

    if (action === "complete") {
      // Mark onboarding as complete
      const existing = await sql`
        SELECT id FROM app_settings ORDER BY id DESC LIMIT 1
      `;

      if (existing.length) {
        await sql`
          UPDATE app_settings
          SET onboarding_completed = true, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO app_settings (onboarding_completed) VALUES (true)
        `;
      }

      return Response.json({ success: true, onboardingCompleted: true });
    }

    if (action === "prompted") {
      // Record that Google prompt was shown
      const existing = await sql`
        SELECT id FROM app_settings ORDER BY id DESC LIMIT 1
      `;

      if (existing.length) {
        await sql`
          UPDATE app_settings
          SET google_prompted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing[0].id}
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
