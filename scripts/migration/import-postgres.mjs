/** Import the private snapshot from export-postgres.py into an EMPTY database.
 * Usage: MYSQL_CREDENTIALS=/private/mysql.json node ... /private/snapshot.json
 * Credentials are read from a private file, never argv or logs.
 */
import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { createHash } from 'node:crypto';

const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const credentials = JSON.parse(fs.readFileSync(process.env.MYSQL_CREDENTIALS, 'utf8'));
if (process.env.MYSQL_TUNNEL_PORT) credentials.port = Number(process.env.MYSQL_TUNNEL_PORT);
const db = await mysql.createConnection({ ...credentials, dateStrings: true, charset: 'utf8mb4_bin' });
const ident = s => { if (!/^[a-z_][a-z_0-9]*$/.test(s)) throw new Error('Invalid identifier'); return '`' + s + '`'; };
const columns = snapshot.find(s => s.kind === 'columns').data;
const constraints = snapshot.find(s => s.kind === 'constraints').data;
const indexes = snapshot.find(s => s.kind === 'indexes').data;
const tables = snapshot.filter(s => s.kind === 'rows');
function type(c) {
  switch (c.data_type) {
    case 'integer': return 'INT';
    case 'text': return 'LONGTEXT';
    case 'character varying': return `VARCHAR(${c.character_maximum_length})`;
    case 'boolean': return 'BOOLEAN';
    case 'jsonb': case 'ARRAY': return 'JSON';
    case 'date': return 'DATE';
    case 'timestamp without time zone': return 'DATETIME(6)';
    case 'time without time zone': return 'TIME(6)';
    case 'numeric': return `DECIMAL(${c.numeric_precision || 38},${c.numeric_scale ?? 10})`;
    default: throw new Error('Unsupported source type');
  }
}
function defaultValue(c) {
  const d = c.column_default;
  if (!d) return '';
  if (d.startsWith('nextval(')) return ' AUTO_INCREMENT';
  if (c.data_type === 'ARRAY' && d === "'{}'::text[]") return " DEFAULT '[]'";
  const value = d.replace(/::(?:character varying|jsonb)$/, '');
  if (!/^(?:'(?:''|[^'])*'|CURRENT_TIMESTAMP|true|false|\d+(?:\.\d+)?)$/.test(value)) throw new Error('Unsupported source default');
  return ' DEFAULT ' + value;
}
function canonical(value, c) {
  if (value === null) return null;
  if (c.data_type === 'jsonb' || c.data_type === 'ARRAY') {
    const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
    return JSON.stringify(stable(typeof value === 'string' ? JSON.parse(value) : value));
  }
  if (c.data_type === 'boolean') return value === 'true' || value === true || value === 1 || value === '1' ? 'true' : 'false';
  if (c.data_type === 'numeric') return String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  if (/^(timestamp|time) /.test(c.data_type)) return String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return String(value);
}
try {
  await db.query("SET time_zone = '+00:00'");
  await db.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_BACKSLASH_ESCAPES'");
  const [existing] = await db.query('SHOW TABLES');
  if (existing.length && !process.env.VERIFY_ONLY) throw new Error('Target must be empty; refusing to overwrite');
  if (!process.env.VERIFY_ONLY) {
    for (const { table } of tables) {
      const defs = columns.filter(c => c.table_name === table).map(c => `${ident(c.column_name)} ${type(c)}${c.is_nullable === 'NO' ? ' NOT NULL' : ' NULL'}${defaultValue(c)}`);
      for (const c of constraints.filter(c => c.table_name === table && ['p','u','c'].includes(c.contype))) {
        const def = c.contype === 'c' && table === 'blog_posts' ? "CHECK (status IN ('draft','published'))" : c.definition;
        if (c.contype === 'c' && table !== 'blog_posts') throw new Error('Unmapped source check constraint');
        defs.push(`CONSTRAINT ${ident(c.conname)} ${def}`);
      }
      await db.query(`CREATE TABLE ${ident(table)} (${defs.join(',')}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`);
    }
    await db.beginTransaction();
    for (const { table, data } of tables) {
      const cs = columns.filter(c => c.table_name === table);
      for (const row of data) await db.execute(`INSERT INTO ${ident(table)} (${cs.map(c => ident(c.column_name)).join(',')}) VALUES (${cs.map(() => '?').join(',')})`, cs.map(c => c.data_type === 'boolean' && row[c.column_name] != null ? row[c.column_name] === 'true' ? 1 : 0 : row[c.column_name]));
    }
    await db.commit();
    for (const c of constraints.filter(c => c.contype === 'f')) await db.query(`ALTER TABLE ${ident(c.table_name)} ADD CONSTRAINT ${ident(c.conname)} ${c.definition}`);
    for (const i of indexes.filter(i => !constraints.some(c => c.conname === i.indexname))) {
      let def = i.indexdef.replace(/public\./g, '').replace(/ USING btree /, ' ');
      if (/ WHERE /.test(def)) {
        if (/^CREATE UNIQUE/.test(def) && !/WHERE \(\w+ IS NOT NULL\)$/.test(def)) throw new Error('Unmapped partial unique index');
        def = def.replace(/ WHERE [\s\S]*$/, '');
      }
      await db.query(def);
    }
    for (const seq of snapshot.find(s => s.kind === 'sequences').data) {
      const c = columns.find(c => c.column_default?.includes(`'${seq.sequencename}'`));
      if (c && seq.last_value != null) await db.query(`ALTER TABLE ${ident(c.table_name)} AUTO_INCREMENT = ${Number(seq.last_value) + Number(seq.increment_by)}`);
    }
  }
  let count = 0;
  const digest = createHash('sha256');
  for (const { table, data } of tables) {
    const cs = columns.filter(c => c.table_name === table);
    const [rows] = await db.query(`SELECT * FROM ${ident(table)}`);
    const normalize = rows => rows.map(row => JSON.stringify(cs.map(c => canonical(row[c.column_name], c)))).sort();
    const source = normalize(data), target = normalize(rows);
    if (JSON.stringify(source) !== JSON.stringify(target)) throw new Error(`Verification mismatch in ${table}`);
    digest.update(table + JSON.stringify(target)); count += rows.length;
  }
  console.log(JSON.stringify({ verifiedTables: tables.length, verifiedRows: count, contentSha256: digest.digest('hex') }));
} catch (e) {
  await db.rollback().catch(() => {});
  console.error(JSON.stringify({ error: e.code || e.message })); process.exitCode = 1;
} finally { await db.end(); }
