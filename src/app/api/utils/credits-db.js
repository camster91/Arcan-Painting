import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.CREDITS_DB_PATH || path.join(process.cwd(), 'data', 'credits.db');

let db = null;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS credits (
        user_id TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        stripe_session_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  return db;
}

export function getBalance(userId) {
  const row = getDb().prepare('SELECT balance FROM credits WHERE user_id = ?').get(userId);
  return row ? row.balance : 0;
}

export function addCredits(userId, amount, type, description, stripeSessionId = null) {
  const d = getDb();
  const upsert = d.prepare(`
    INSERT INTO credits (user_id, balance, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      balance = balance + ?,
      updated_at = datetime('now')
  `);
  const log = d.prepare(`
    INSERT INTO credit_transactions (user_id, amount, type, description, stripe_session_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const txn = d.transaction(() => {
    upsert.run(userId, amount, amount);
    log.run(userId, amount, type, description, stripeSessionId);
  });
  txn();
  return getBalance(userId);
}

export function deductCredits(userId, amount, description) {
  const balance = getBalance(userId);
  if (balance < amount) {
    throw new Error(`Insufficient credits: have ${balance}, need ${amount}`);
  }
  const d = getDb();
  d.prepare("UPDATE credits SET balance = balance - ?, updated_at = datetime('now') WHERE user_id = ?").run(amount, userId);
  d.prepare('INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(userId, -amount, 'deduction', description);
  return getBalance(userId);
}

export function getTransactions(userId, limit = 50) {
  return getDb().prepare('SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
}
