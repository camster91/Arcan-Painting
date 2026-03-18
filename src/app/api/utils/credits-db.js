import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.CREDITS_DB_PATH || path.join(process.cwd(), 'data', 'credits.db');

let db = null;
let dbReady = null;

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function getDb() {
  if (db) return db;
  if (dbReady) return dbReady;

  dbReady = (async () => {
    const SQL = await initSqlJs();
    ensureDir();

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS credits (
        user_id TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        stripe_session_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    persist();
    return db;
  })();

  return dbReady;
}

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  ensureDir();
  fs.writeFileSync(DB_PATH, buffer);
}

export async function getBalance(userId) {
  const d = await getDb();
  const result = d.exec('SELECT balance FROM credits WHERE user_id = ?', [userId]);
  if (result.length === 0 || result[0].values.length === 0) return 0;
  return result[0].values[0][0];
}

export async function addCredits(userId, amount, type, description, stripeSessionId = null) {
  const d = await getDb();
  d.run(`
    INSERT INTO credits (user_id, balance, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      balance = balance + ?,
      updated_at = datetime('now')
  `, [userId, amount, amount]);
  d.run(`
    INSERT INTO credit_transactions (user_id, amount, type, description, stripe_session_id)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, amount, type, description, stripeSessionId]);
  persist();
  return getBalance(userId);
}

export async function deductCredits(userId, amount, description) {
  const balance = await getBalance(userId);
  if (balance < amount) {
    throw new Error(`Insufficient credits: have ${balance}, need ${amount}`);
  }
  const d = await getDb();
  d.run("UPDATE credits SET balance = balance - ?, updated_at = datetime('now') WHERE user_id = ?", [amount, userId]);
  d.run('INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)', [userId, -amount, 'deduction', description]);
  persist();
  return getBalance(userId);
}

export async function getTransactions(userId, limit = 50) {
  const d = await getDb();
  const result = d.exec('SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}
