import pg from "pg";
const { Pool } = pg;

// Tagged template literal SQL helper — drop-in replacement for neon()
// Works with any standard PostgreSQL DATABASE_URL

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    pool.on("error", (err) => {
      console.error("pg pool error:", err.message);
    });
  }
  return pool;
}

async function sql(strings, ...values) {
  // If called with a single string (not a template literal), execute directly
  if (typeof strings === "string") {
    const result = await getPool().query(strings, values[0] || []);
    return result.rows;
  }
  let text = "";
  let paramCount = 1;
  const params = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += "$" + paramCount++;
      params.push(values[i]);
    }
  }
  const result = await getPool().query(text, params);
  return result.rows;
}

/**
 * Real PostgreSQL transaction using BEGIN/COMMIT/ROLLBACK.
 *
 * Usage — pass a callback that receives a `txSql` function (same API as `sql`):
 *   const [payment, invoice] = await sql.transaction(async (txSql) => {
 *     const [p] = await txSql`INSERT INTO payments ... RETURNING *`;
 *     await txSql`UPDATE invoices SET ... WHERE id = ${invoiceId}`;
 *     return [p];
 *   });
 *
 * Legacy usage (array of already-running Promises) is preserved for
 * backward-compat but DOES NOT provide atomicity — prefer the callback form.
 */
sql.transaction = async (queriesOrFn) => {
  // ── New: callback form ──────────────────────────────────────────────────
  if (typeof queriesOrFn === "function") {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");

      // Build a sql-tagged-template that uses this client (not the pool)
      const txSql = async (strings, ...values) => {
        if (typeof strings === "string") {
          const result = await client.query(strings, values[0] || []);
          return result.rows;
        }
        let text = "";
        let paramCount = 1;
        const params = [];
        for (let i = 0; i < strings.length; i++) {
          text += strings[i];
          if (i < values.length) {
            text += "$" + paramCount++;
            params.push(values[i]);
          }
        }
        const result = await client.query(text, params);
        return result.rows;
      };

      const result = await queriesOrFn(txSql);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Legacy: array of already-running Promises (no real atomicity) ───────
  // Kept for backward-compat with existing call-sites that pass Promise arrays.
  // Migrate these to the callback form for true atomicity.
  console.warn(
    "[sql.transaction] Legacy array mode — no real DB transaction. " +
    "Migrate to callback form: sql.transaction(async (txSql) => { ... })"
  );
  const queries = queriesOrFn;
  try {
    const results = await Promise.all(
      queries.map((q) => (q instanceof Promise ? q : Promise.resolve(q)))
    );
    return results;
  } catch (err) {
    throw err;
  }
};

export default sql;
