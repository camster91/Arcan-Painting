import { expect, it } from 'vitest';
import { expenseCents, validateJobExpense, sumJobExpenses } from '@/app/api/utils/job-expenses';

const now = new Date('2026-10-07T02:00:00Z'); // Still Oct 6 in Toronto.
const input = overrides => ({ project_id: 3, category: 'material', description: 'Paint purchase', amount: '720.00', tax_amount: '93.60', incurred_on: '2026-10-06', ...overrides });
const expense = overrides => validateJobExpense(input(overrides), { now });

it('separates pre-tax operating cost from tax and payment total', () => {
  const entries = [expense(), expense({ category: 'travel', amount: '80.00', tax_amount: '0' })];
  expect(sumJobExpenses(entries)).toMatchObject({ operatingCents: 80000, taxCents: 9360, totalCents: 89360, byCategory: { material: 72000, travel: 8000 } });
});
it('adds small decimals exactly without float drift', () => {
  expect(sumJobExpenses([expense({ amount: '0.10', tax_amount: '0.01' }), expense({ amount: '0.20', tax_amount: '0.02' })])).toMatchObject({ operatingCents: 30, taxCents: 3, totalCents: 33 });
});
it.each(['1.005', '1e3', '-1', '', 'NaN', 'Infinity', '1,000', null, false, [], {}, '1000000.01', 0.1 + 0.2])('rejects invalid or ambiguous amount %j', value => {
  expect(() => expenseCents(value)).toThrow();
});
it('allows explicit zero tax, rejects zero cost and preserves maximum amount', () => {
  expect(expenseCents('1000000')).toBe(100000000);
  expect(expenseCents('0.00', { allowZero: true })).toBe(0);
  expect(() => expenseCents('0')).toThrow();
  expect(() => expense({ tax_amount: null })).toThrow();
});
it.each(['2026-02-30', '2026-13-01', '2026-10-07', '2026-1-01'])('rejects invalid or future Toronto date %s', day => {
  expect(() => expense({ incurred_on: day })).toThrow();
});
it('retains entered metadata and rejects public receipts pending private ownership verification', () => {
  expect(expense({ vendor: ' Shop ', notes: ' Keep receipt ', receipt_id: '7' })).toMatchObject({ vendor: 'Shop', notes: 'Keep receipt', receiptId: 7 });
  expect(() => expense({ receipt_url: 'https://example.test/receipt.jpg' })).toThrow();
  expect(() => expense({ vendor: 7 })).toThrow();
  expect(() => expense({ project_id: '3abc' })).toThrow();
  expect(() => expense({ category: 'unknown' })).toThrow();
  expect(() => expense({ currency: 'USD' })).toThrow();
});
it('fails closed on corrupt canonical amounts or mixed currency', () => {
  for (const override of [{ amountCents: NaN }, { taxCents: -1 }, { amountCents: 1.5 }, { currency: 'USD' }]) {
    expect(() => sumJobExpenses([{ ...expense(), ...override }])).toThrow();
  }
});
it('represents an empty expense list as zero, without invented entries', () => {
  expect(sumJobExpenses([])).toMatchObject({ operatingCents: 0, taxCents: 0, totalCents: 0 });
});
