/**
 * POST /api/admin/migrate-passwords
 * One-time migration endpoint to hash all plain-text passwords.
 * Admin-only. Can be called once after deployment.
 */
import { getCurrentUser } from "@/app/api/utils/auth";
import { migratePasswords } from "@/app/api/utils/migrate-passwords";
import { auditLog } from "@/app/api/utils/audit";

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await migratePasswords();

    await auditLog({
      request,
      action: "admin.migrate-passwords",
      userId: user.id,
      username: user.username,
      changes: result,
      status: "success",
    });

    return Response.json({
      success: true,
      message: `Migration complete. Migrated: ${result.migrated}, Skipped: ${result.skipped}`,
      ...result,
    });
  } catch (error) {
    console.error("Password migration error:", error);
    return Response.json({ error: "Migration failed", details: error.message }, { status: 500 });
  }
}
