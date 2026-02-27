import pg from "pg";
const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

async function sql(strings, ...values) {
  let text = "";
  let paramCount = 1;
  const params = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += "$" + (paramCount++);
      params.push(values[i]);
    }
  }
  const result = await getPool().query(text, params);
  return result.rows;
}

sql.transaction = async (queries) => {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const results = [];
    for (const query of queries) {
      const result = await client.query(query.text, query.values);
      results.push(result.rows);
    }
    await client.query("COMMIT");
    return results;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export default sql;
