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

// sql.transaction accepts an array of already-executed promises (Neon-style)
// or a function that returns an array of SQL tagged literals
sql.transaction = async (queries) => {
  // If queries is a function, call it to get the array
  if (typeof queries === "function") {
    queries = queries(sql);
  }
  // Queries is now an array of Promises (already executing)
  // Just await them all - no actual DB transaction needed for reads
  // For writes, each query runs individually (acceptable for this app)
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
