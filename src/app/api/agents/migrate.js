/**
 * Database migration for AI agent fields
 * Run once to add AI-related columns to existing tables
 * 
 * Usage: import and call migrateAgentFields() or run this file directly
 */

import sql from '../utils/sql.js';

export async function migrateAgentFields() {
  const results = [];

  // leads table additions
  const leadsMigrations = [
    {
      name: 'leads.qualification_score',
      sql: `ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_score INTEGER DEFAULT NULL`,
    },
    {
      name: 'leads.estimated_value',
      sql: `ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(10,2) DEFAULT NULL`,
    },
  ];

  // estimates table additions
  const estimatesMigrations = [
    {
      name: 'estimates.proposal_status',
      sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS proposal_status VARCHAR(50) DEFAULT NULL`,
    },
    {
      name: 'estimates.proposal_url',
      sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS proposal_url TEXT DEFAULT NULL`,
    },
    {
      name: 'estimates.proposal_content',
      sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS proposal_content TEXT DEFAULT NULL`,
    },
  ];

  // notifications table additions (messages page uses notifications)
  const notificationsMigrations = [
    {
      name: 'notifications.ai_category',
      sql: `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ai_category VARCHAR(100) DEFAULT NULL`,
    },
    {
      name: 'notifications.ai_response',
      sql: `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ai_response TEXT DEFAULT NULL`,
    },
  ];

  const allMigrations = [
    ...leadsMigrations,
    ...estimatesMigrations,
    ...notificationsMigrations,
  ];

  for (const migration of allMigrations) {
    try {
      await sql.unsafe(migration.sql);
      results.push({ name: migration.name, status: 'ok' });
      console.log(`✓ Migration: ${migration.name}`);
    } catch (err) {
      // IF NOT EXISTS should prevent errors, but handle gracefully
      const isAlreadyExists = err.message?.includes('already exists') || err.code === '42701';
      if (isAlreadyExists) {
        results.push({ name: migration.name, status: 'skipped (already exists)' });
      } else {
        results.push({ name: migration.name, status: 'error', error: err.message });
        console.error(`✗ Migration failed: ${migration.name}`, err.message);
      }
    }
  }

  return results;
}
