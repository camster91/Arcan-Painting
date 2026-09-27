import mysql from 'mysql2/promise';
import { createHash } from 'node:crypto';
import { compileMysql, protectSql, timestampParams } from './mysql-dialect.js';

let pool;
let metadata;
async function getMetadata(conn) {
  if (!metadata) metadata = (async () => {
    const [columns] = await conn.query("SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND DATA_TYPE IN ('datetime','timestamp')");
    const [checks] = await conn.query("SELECT TABLE_NAME, CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CHECK_CLAUSE LIKE 'json_valid(%'");
    return {
      timestamps: new Set(columns.map(c => `${c.TABLE_NAME}.${c.COLUMN_NAME}`)),
      json: new Set(checks.map(c => `${c.TABLE_NAME}.${c.CHECK_CLAUSE.match(/json_valid\(`([^`]+)`\)/i)?.[1]}`)),
    };
  })().catch(e => { metadata = null; throw e; });
  return metadata;
}
function getPool() {
  if (!pool) {
    const url = new URL(process.env.DATABASE_URL);
    pool = mysql.createPool({
      host: url.hostname, port: Number(url.port || 3306),
      user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
      database: url.pathname.slice(1), connectionLimit: 10, connectTimeout: 5000,
      timezone: 'Z', dateStrings: ['DATE'], charset: 'utf8mb4_bin',
      ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: true } : undefined,
      typeCast(field, next) {
        if (field.type === 'TINY' && field.length === 1) { const v = field.string(); return v === null ? null : v === '1'; }
        return next();
      },
    });
  }
  return pool;
}

async function query(conn, text, params) {
  const ddl = /^\s*(CREATE|ALTER|DROP)\b/i.test(text);
  const schema = ddl ? null : await getMetadata(conn);
  const compiled = compileMysql(text, schema ? timestampParams(text, params, schema.timestamps) : params);
  try {
    const [rows, fields] = await conn.execute(compiled.text, compiled.values);
    if (ddl) metadata = null;
    if (!Array.isArray(rows)) return [];
    // MariaDB exposes JSON aliases as text; the protocol carries JSON format
    // metadata in newer versions, but mysql2 does not decode that metadata.
    const jsonColumns = schema?.json || new Set();
    for (const row of rows) for (const f of fields) {
      if (jsonColumns.has(`${f.orgTable}.${f.orgName}`) && typeof row[f.name] === 'string') row[f.name] = JSON.parse(row[f.name]);
    }
    return rows;
  } catch (error) {
    if (compiled.conflict?.ignore && error.code === 'ER_DUP_ENTRY') {
      const table = protectSql(text).code.match(/^\s*INSERT INTO\s+(\w+)/i)?.[1];
      const [indexes] = await conn.query('SHOW INDEX FROM ??', [table]);
      const key = error.sqlMessage?.match(/for key '([^']+)'/)?.[1];
      const index = indexes.filter(i => i.Key_name === key);
      if (index.length === 1 && index[0].Column_name === compiled.conflict.column && !index[0].Non_unique) return [];
    }
    // Driver errors include SQL and bound data. Never propagate those to logs.
    throw Object.assign(new Error(`Database query failed (${error.code || 'UNKNOWN'})`), { code: error.code });
  }
}

async function run(conn, text, params, locks) {
  const protectedText = protectSql(text);
  const code = protectedText.code.trim().replace(/;\s*$/, '');
  if (/^SELECT pg_advisory_xact_lock\(hashtext\(\$1\)\)$/i.test(code)) {
    const name = 'arcan:' + createHash('sha256').update(String(params[0])).digest('hex').slice(0, 48);
    if (locks.has(name)) return [];
    const [rows] = await conn.query('SELECT GET_LOCK(?, 10) AS acquired', [name]);
    if (rows[0].acquired !== 1) throw new Error('Database lock timeout');
    locks.add(name);
    return [];
  }
  const update = code.match(/^UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+?)\s+RETURNING\s+(\*|[\w,\s]+)$/i);
  if (update) {
    const [, table, set, predicate, returning] = update;
    const pk = table === 'credits' ? 'user_id' : 'id';
    if (new RegExp(`(?:^|,)\\s*${pk}\\s*=`, 'i').test(set)) throw new Error('Cannot update primary key with RETURNING');
    const selected = await query(conn, protectedText.restore(`SELECT ${pk} FROM ${table} WHERE ${predicate} FOR UPDATE`), params);
    if (!selected.length) return [];
    await query(conn, protectedText.restore(`UPDATE ${table} SET ${set} WHERE ${predicate}`), params);
    const ids = selected.map(r => r[pk]);
    return query(conn, `SELECT ${returning} FROM ${table} WHERE ${pk} IN (${ids.map((_, i) => '$' + (i + 1)).join(',')})`, ids);
  }
  if (/^UPDATE\b[\s\S]*\bRETURNING\b/i.test(code)) throw new Error('Unsupported UPDATE RETURNING shape');
  return query(conn, text, params);
}

export async function mysqlTransaction(fn) {
  const conn = await getPool().getConnection();
  const locks = new Set();
  try {
    await conn.query("SET time_zone = '+00:00'");
    await conn.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_BACKSLASH_ESCAPES,SIMULTANEOUS_ASSIGNMENT'");
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.beginTransaction();
    const result = await fn((text, params) => run(conn, text, params, locks));
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    try { for (const name of locks) await conn.query('DO RELEASE_LOCK(?)', [name]); }
    catch { conn.destroy(); }
    conn.release();
  }
}

export const mysqlQuery = (text, params) => mysqlTransaction(run => run(text, params));
export async function closeMysql() { if (pool) { await pool.end(); pool = null; } }
