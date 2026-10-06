import assert from 'node:assert/strict';
import sql from '../src/app/api/utils/sql.js';
import { ensureCustomerActivitySchema } from '../src/migrations/002-customer-activity.js';
import { saveCustomerNote, appendLeadStatusChange } from '../src/app/api/utils/customer-activity.js';

// Only fresh, disposable local CI databases. Never point this fixture at client data.
const url = new URL(process.env.DATABASE_URL || 'http://missing');
assert(['postgresql:', 'mysql:'].includes(url.protocol), 'A test DATABASE_URL is required');
assert(['127.0.0.1', 'localhost'].includes(url.hostname), 'Local service containers only');
assert.equal(url.pathname, '/arcan_activity_ci', 'Dedicated disposable database required');
assert.equal(process.env.ARCAN_DISPOSABLE_DB, '1', 'Explicit disposable database opt-in required');

const user = { id: 7, username: 'fixture@example.test' };
const note = (key, text = 'Synthetic internal note', leadId = 1, actor = user) =>
  saveCustomerNote(sql, { leadId, key, text, user: actor });
const count = async () => Number((await sql('SELECT COUNT(*) AS count FROM customer_activity_events'))[0].count);

try {
  // The production lead key type/soft-delete columns, without unrelated app fixtures.
  await sql('CREATE TABLE leads (id SERIAL PRIMARY KEY, status VARCHAR(50), deleted_at TIMESTAMP)');
  await sql("INSERT INTO leads (id, status) VALUES (1, 'new'), (2, 'new')");
  await sql("INSERT INTO leads (id, status, deleted_at) VALUES (3, 'new', CURRENT_TIMESTAMP)");
  await ensureCustomerActivitySchema(sql);
  await ensureCustomerActivitySchema(sql);
  assert.equal(await count(), 0);
  console.log('PASS additive migration runs twice');

  // Independent pooled connections contend on the same lead-row lock.
  const concurrent = await Promise.all(Array.from({ length: 12 }, () => note('concurrent-save-key')));
  assert.equal(new Set(concurrent.map(result => Number(result.id))).size, 1);
  assert.equal(concurrent.filter(result => !result.replayed).length, 1);
  assert.equal(await count(), 1);
  assert.equal((await note('concurrent-save-key', 'Different content')).status, 409);
  assert.equal(await count(), 1);
  await note('concurrent-save-key', 'Other author', 1, { id: 8, username: 'other@example.test' });
  await note('concurrent-save-key', 'Other lead', 2);
  assert.equal(await count(), 3);
  const [event] = await sql('SELECT * FROM customer_activity_events ORDER BY id LIMIT 1');
  assert.equal(event.visibility, 'internal');
  assert.equal(event.actor_name, user.username);
  assert(event.created_at);
  console.log('PASS concurrent replay, conflict, actor/lead isolation and attribution');

  assert.equal((await note('missing-save-key', 'Missing', 99)).status, 404);
  assert.equal((await note('deleted-save-key', 'Deleted', 3)).status, 404);
  await assert.rejects(sql`INSERT INTO customer_activity_events (event_key, content_hash, lead_id, event_type, summary) VALUES (${'f'.repeat(64)}, ${'a'.repeat(64)}, ${99}, 'staff_note', 'Invalid foreign key')`);
  assert.equal(await count(), 3);
  console.log('PASS deleted/missing leads and foreign-key enforcement');

  await assert.rejects(sql.transaction(async tx => {
    const [lead] = await tx`SELECT id, status FROM leads WHERE id = ${1} FOR UPDATE`;
    await tx`UPDATE leads SET status = ${'won'} WHERE id = ${1}`;
    await appendLeadStatusChange(tx, { leadId: 1, previousStatus: lead.status, status: 'won', user });
    throw new Error('Injected failure after both writes');
  }), /Injected failure/);
  assert.equal((await sql`SELECT status FROM leads WHERE id = ${1}`)[0].status, 'new');
  assert.equal(await count(), 3);
  // Actual insert error after an update must also roll the update back.
  await assert.rejects(sql.transaction(async tx => {
    await tx`SELECT id FROM leads WHERE id = ${1} FOR UPDATE`;
    await tx`UPDATE leads SET status = ${'won'} WHERE id = ${1}`;
    await appendLeadStatusChange(tx, { leadId: 99, previousStatus: 'new', status: 'won', user });
  }));
  assert.equal((await sql`SELECT status FROM leads WHERE id = ${1}`)[0].status, 'new');
  assert.equal(await count(), 3);
  await sql.transaction(async tx => {
    const [lead] = await tx`SELECT id, status FROM leads WHERE id = ${1} FOR UPDATE`;
    await tx`UPDATE leads SET status = ${'won'} WHERE id = ${1}`;
    await appendLeadStatusChange(tx, { leadId: 1, previousStatus: lead.status, status: 'won', user });
    await appendLeadStatusChange(tx, { leadId: 1, previousStatus: 'won', status: 'won', user });
  });
  assert.equal((await sql`SELECT status FROM leads WHERE id = ${1}`)[0].status, 'won');
  assert.equal(await count(), 4);
  await ensureCustomerActivitySchema(sql);
  assert.equal(await count(), 4);
  console.log('PASS transaction rollback, commit, unchanged status and history preservation');
  process.exit(0); // The app's shared pools otherwise keep the standalone fixture alive.
} catch (error) {
  console.error('Customer activity database verification failed:', error.message);
  process.exit(1);
}
