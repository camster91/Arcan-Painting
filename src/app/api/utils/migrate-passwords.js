/**
 * One-time migration script: hash all plain-text passwords in auth_users.
 * Run manually: node src/app/api/utils/migrate-passwords.js
 * Or call migratePasswords() from your startup/migration flow.
 *
 * Safe to re-run — already-hashed passwords are skipped.
 */
import { hash } from "argon2";
import sql from "./sql.js";

export async function migratePasswords() {
  console.log("[migrate-passwords] Starting password migration...");

  // Ensure column exists
  await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS password_is_hashed BOOLEAN DEFAULT FALSE`;

  // Find all users with plain-text passwords
  const users = await sql`
    SELECT id, username, password
    FROM auth_users
    WHERE password_is_hashed = FALSE OR password_is_hashed IS NULL
  `;

  if (users.length === 0) {
    console.log("[migrate-passwords] No plain-text passwords found. Done.");
    return { migrated: 0, skipped: 0 };
  }

  console.log(`[migrate-passwords] Found ${users.length} users to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      // Skip if password looks like an argon2 hash already
      if (user.password && user.password.startsWith("$argon2")) {
        await sql`UPDATE auth_users SET password_is_hashed = TRUE WHERE id = ${user.id}`;
        skipped++;
        continue;
      }

      // Hash the plain-text password
      const hashed = await hash(user.password);
      await sql`
        UPDATE auth_users
        SET password = ${hashed}, password_is_hashed = TRUE
        WHERE id = ${user.id}
      `;
      migrated++;
      console.log(`[migrate-passwords] Migrated user: ${user.username}`);
    } catch (err) {
      console.error(`[migrate-passwords] Failed for user ${user.username}:`, err.message);
    }
  }

  console.log(`[migrate-passwords] Done. Migrated: ${migrated}, Skipped: ${skipped}`);
  return { migrated, skipped };
}

// Run as a script
if (process.argv[1] && process.argv[1].includes("migrate-passwords")) {
  migratePasswords()
    .then((result) => {
      console.log("[migrate-passwords] Result:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[migrate-passwords] Fatal error:", err);
      process.exit(1);
    });
}
