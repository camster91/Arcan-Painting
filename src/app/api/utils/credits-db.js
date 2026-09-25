import sql from "./sql.js";

let schemaReady = null;

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS credits (
          user_id VARCHAR(255) PRIMARY KEY,
          balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS credit_transactions (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          amount INTEGER NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          stripe_session_id VARCHAR(255),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      // Stripe can deliver the same completed-checkout event more than once.
      // The unique key makes the ledger idempotent without preventing
      // non-Stripe adjustments, whose session id is null.
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session
        ON credit_transactions(stripe_session_id)
        WHERE stripe_session_id IS NOT NULL
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
        ON credit_transactions(user_id, created_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function assertPositiveInteger(amount, label = "amount") {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
}

export async function getBalance(userId) {
  await ensureSchema();
  const rows = await sql`SELECT balance FROM credits WHERE user_id = ${String(userId)}`;
  return Number(rows[0]?.balance || 0);
}

export async function addCredits(userId, amount, type, description, stripeSessionId = null) {
  assertPositiveInteger(amount);
  await ensureSchema();
  const accountId = String(userId);

  return sql.transaction(async (tx) => {
    if (stripeSessionId) {
      const transaction = await tx`
        INSERT INTO credit_transactions (user_id, amount, type, description, stripe_session_id)
        VALUES (${accountId}, ${amount}, ${type}, ${description}, ${stripeSessionId})
        ON CONFLICT (stripe_session_id) WHERE stripe_session_id IS NOT NULL DO NOTHING
        RETURNING id
      `;

      if (!transaction.length) {
        const existing = await tx`SELECT balance FROM credits WHERE user_id = ${accountId}`;
        return Number(existing[0]?.balance || 0);
      }
    }

    const balanceRows = await tx`
      INSERT INTO credits (user_id, balance, updated_at)
      VALUES (${accountId}, ${amount}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        balance = credits.balance + EXCLUDED.balance,
        updated_at = CURRENT_TIMESTAMP
      RETURNING balance
    `;

    if (!stripeSessionId) {
      await tx`
        INSERT INTO credit_transactions (user_id, amount, type, description)
        VALUES (${accountId}, ${amount}, ${type}, ${description})
      `;
    }

    return Number(balanceRows[0].balance);
  });
}

export async function deductCredits(userId, amount, description) {
  assertPositiveInteger(amount);
  await ensureSchema();
  const accountId = String(userId);

  return sql.transaction(async (tx) => {
    const rows = await tx`
      UPDATE credits
      SET balance = balance - ${amount}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${accountId} AND balance >= ${amount}
      RETURNING balance
    `;
    if (!rows.length) {
      const current = await tx`SELECT balance FROM credits WHERE user_id = ${accountId}`;
      throw new Error(`Insufficient credits: have ${Number(current[0]?.balance || 0)}, need ${amount}`);
    }

    await tx`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES (${accountId}, ${-amount}, ${"deduction"}, ${description})
    `;
    return Number(rows[0].balance);
  });
}

export async function getTransactions(userId, limit = 50) {
  await ensureSchema();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  return sql`
    SELECT id, user_id, amount, type, description, stripe_session_id, created_at
    FROM credit_transactions
    WHERE user_id = ${String(userId)}
    ORDER BY created_at DESC, id DESC
    LIMIT ${safeLimit}
  `;
}
