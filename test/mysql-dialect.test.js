import { describe, it, expect } from 'vitest';
import { compileMysql } from '../src/app/api/utils/mysql-dialect.js';
describe('MariaDB SQL compilation', () => {
  it('binds repeated/reordered parameters without rewriting literals', () => {
    expect(compileMysql("SELECT '$1 ::jsonb ON CONFLICT' AS literal, $2, $1, $2", ['a', 'b'])).toEqual({text:"SELECT '$1 ::jsonb ON CONFLICT' AS literal, ?, ?, ?", values:['b','a','b'], conflict:null});
  });
  it('preserves JSON strings and array parameters', () => {
    expect(compileMysql('SELECT $1::jsonb, $2', [{note:"it's $1"}, ['one','two']]).values).toEqual(['{"note":"it\'s $1"}', '["one","two"]']);
  });
  it('only removes equivalent nullable partial unique indexes', () => {
    expect(compileMysql('CREATE UNIQUE INDEX IF NOT EXISTS idx ON ledger(session) WHERE session IS NOT NULL').text).toBe('CREATE UNIQUE INDEX IF NOT EXISTS idx ON ledger(session)');
    expect(() => compileMysql("CREATE UNIQUE INDEX idx ON ledger(session) WHERE active = true")).toThrow();
  });
  it('retains duplicate target instead of using INSERT IGNORE', () => {
    const c=compileMysql('INSERT INTO ledger (session) VALUES ($1) ON CONFLICT (session) WHERE session IS NOT NULL DO NOTHING RETURNING id',['s']);
    expect(c.conflict).toEqual({column:'session',ignore:true});
    expect(c.text).not.toMatch(/IGNORE|CONFLICT/);
  });
  it('keeps precision, microseconds and JSON array defaults', () => {
    const {text}=compileMysql("CREATE TABLE IF NOT EXISTS demo (id SERIAL PRIMARY KEY, amount NUMERIC, stamp TIMESTAMP, tags TEXT[] DEFAULT '{}')");
    expect(text).toContain('DECIMAL(38,10)'); expect(text).toContain('DATETIME(6)');expect(text).toContain("JSON DEFAULT '[]'");
  });
  it('rejects unsupported syntax and missing parameters', () => {
    expect(() => compileMysql('SELECT $2', ['only one'])).toThrow();
    expect(() => compileMysql('SELECT data::unsupported FROM demo')).toThrow();
  });
});

import { timestampParams } from '../src/app/api/utils/mysql-dialect.js';
it('normalizes only timestamp-bound parameters, including multi-row inserts', () => {
  const value='2026-09-24T01:02:03.123456Z';
  const columns=new Set(['demo.expires_at']);
  expect(timestampParams('INSERT INTO demo (notes,expires_at) VALUES ($1,$2),($3,$4)', [value,value,value,value],columns)).toEqual([value,'2026-09-24 01:02:03.123456',value,'2026-09-24 01:02:03.123456']);
  expect(timestampParams('UPDATE demo SET notes=$1 WHERE expires_at >= $2',[value,value],columns)).toEqual([value,'2026-09-24 01:02:03.123456']);
});
