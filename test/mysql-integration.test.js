import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import sql from '../src/app/api/utils/sql.js';
import { closeMysql } from '../src/app/api/utils/mysql.js';
import { addCredits, deductCredits, getBalance } from '../src/app/api/utils/credits-db.js';

const enabled = process.env.MYSQL_INTEGRATION_TEST === '1' && process.env.DATABASE_URL?.startsWith('mysql:');
const table = 'migration_test_' + randomUUID().replaceAll('-', '').slice(0,12);
const account = 'migration-test-' + randomUUID();
describe.runIf(enabled)('MariaDB integration (isolated migration database only)', () => {
  beforeAll(async () => {
    await sql(`CREATE TABLE ${table} (id SERIAL PRIMARY KEY, token VARCHAR(255) UNIQUE, balance INTEGER CHECK(balance >= 0), data JSONB, active BOOLEAN, expires_at TIMESTAMP, notes TEXT)`);
  }, 30000);
  afterAll(async () => {
    await sql(`DROP TABLE IF EXISTS ${table}`);
    await sql`DELETE FROM credit_transactions WHERE user_id=${account}`;
    await sql`DELETE FROM credits WHERE user_id=${account}`;
    await closeMysql();
  }, 30000);
  it('round-trips JSON, boolean and timestamps without changing free text', async () => {
    const stamp='2026-09-24T12:34:56.123Z';
    const [row]=await sql(`INSERT INTO ${table}(token,balance,data,active,expires_at,notes) VALUES($1,$2,$3::jsonb,$4,$5,$6) RETURNING *`,['fixture',10,{quote:"a'b", value:'$1'},true,stamp,stamp]);
    expect(row.data).toEqual({quote:"a'b",value:'$1'});expect(row.active).toBe(true);
    expect(row.expires_at.toISOString()).toBe(stamp);expect(row.notes).toBe(stamp);
    const [updated]=await sql(`UPDATE ${table} SET balance=balance-$1 WHERE id=$2 AND balance >= $1 RETURNING *`,[3,row.id]);
    expect(updated.balance).toBe(7);
    const [simultaneous]=await sql(`UPDATE ${table} SET balance=balance+1, active=balance >= 8 WHERE id=$1 RETURNING balance, active`,[row.id]);
    expect(simultaneous).toMatchObject({balance:8,active:false});
    await sql(`UPDATE ${table} SET balance=7 WHERE id=$1`,[row.id]);
    await expect(sql.transaction(async tx=> {await tx(`UPDATE ${table} SET balance=$1 WHERE id=$2`,[2,row.id]);throw new Error('rollback fixture')})).rejects.toThrow('rollback fixture');
    expect((await sql(`SELECT balance FROM ${table} WHERE id=$1`,[row.id]))[0].balance).toBe(7);
    expect(await sql(`INSERT INTO ${table}(token,balance) VALUES($1,$2) ON CONFLICT(token) DO NOTHING RETURNING id`,['fixture',10])).toEqual([]);
    await expect(sql(`INSERT INTO ${table}(token,balance) VALUES($1,$2) ON CONFLICT(token) DO NOTHING RETURNING id`,['bad',-1])).rejects.toThrow();
    expect((await sql(`DELETE FROM ${table} WHERE id=$1 RETURNING id`,[row.id]))[0].id).toBe(row.id);
  },30000);
  it('does not double-credit repeated Stripe events or allow concurrent overspending', async () => {
    const session='migration-session-'+randomUUID();
    await Promise.all([addCredits(account,10,'purchase','fixture',session), addCredits(account,10,'purchase','fixture',session)]);
    expect(await getBalance(account)).toBe(10);
    const results=await Promise.allSettled([deductCredits(account,7,'fixture'),deductCredits(account,7,'fixture')]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(await getBalance(account)).toBe(3);
  },30000);
  it('serializes advisory locks and releases them after rollback', async () => {
    const events=[];
    const lock=async(name,fail=false)=>sql.transaction(async tx=>{
      await tx`SELECT pg_advisory_xact_lock(hashtext(${account}))`;
      events.push(name+' start');
      await new Promise(resolve=>setTimeout(resolve,40));
      events.push(name+' end');
      if(fail)throw new Error('fixture rollback');
    });
    await Promise.allSettled([lock('a',true),lock('b')]);
    expect(events[0].split(' ')[0]).toBe(events[1].split(' ')[0]);
    expect(events[2].split(' ')[0]).toBe(events[3].split(' ')[0]);
    await expect(lock('c')).resolves.toBeUndefined();
  },30000);
});
