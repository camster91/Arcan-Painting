const categories = new Set(['material', 'supplies', 'rental', 'subcontractor', 'travel', 'disposal', 'other']);
const MAX_CENTS = 100_000_000;

/** Parse CAD decimal input exactly; never round malformed or sub-cent values. */
export function expenseCents(value, { allowZero = false } = {}) {
  if (!['string', 'number'].includes(typeof value)) throw new Error('Amount must be a decimal value');
  const decimal = String(value).trim();
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(decimal)) throw new Error('Amount must have at most two decimal places');
  const [whole, fraction = ''] = decimal.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents > MAX_CENTS || cents < (allowZero ? 0 : 1)) throw new Error('Amount is outside the supported range');
  return cents;
}

const optionalText = (value, max, label) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.trim().length > max) throw new Error(`${label} is invalid`);
  return value.trim() || null;
};
const positiveId = value => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
const torontoDay = now => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);

/** Pure input contract; receipt IDs still require ownership checks in the API. */
export function validateJobExpense(input, { now = new Date() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expense is invalid');
  if (!positiveId(input.project_id)) throw new Error('Job id is invalid');
  if (input.currency !== undefined && input.currency !== 'CAD') throw new Error('Expense currency must be CAD');
  if (!categories.has(input.category)) throw new Error('Expense category is invalid');
  if (typeof input.description !== 'string' || input.description.trim().length < 3 || input.description.trim().length > 500) throw new Error('Description must be between 3 and 500 characters');
  const amountCents = expenseCents(input.amount);
  const taxCents = expenseCents(input.tax_amount === undefined ? '0' : input.tax_amount, { allowZero: true });
  const day = input.incurred_on;
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Incurred date is invalid');
  const date = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day || day > torontoDay(now)) throw new Error('Incurred date is invalid');
  if (input.receipt_url !== undefined) throw new Error('Receipts require a private uploaded asset id');
  if (input.receipt_id !== undefined && input.receipt_id !== null && !positiveId(input.receipt_id)) throw new Error('Receipt id is invalid');
  return {
    projectId: Number(input.project_id), category: input.category, description: input.description.trim(),
    vendor: optionalText(input.vendor, 255, 'Vendor'), notes: optionalText(input.notes, 2000, 'Notes'),
    amountCents, taxCents, totalCents: amountCents + taxCents, currency: 'CAD', incurredOn: day,
    receiptId: input.receipt_id == null ? null : Number(input.receipt_id),
  };
}

/** Operates on canonical normalized entries. Tax is reported separately, never in cost. */
export function sumJobExpenses(entries) {
  let operatingCents = 0;
  let taxCents = 0;
  const byCategory = Object.fromEntries([...categories].map(category => [category, 0]));
  for (const entry of entries) {
    if (!categories.has(entry.category) || !Number.isSafeInteger(entry.amountCents) || entry.amountCents <= 0 || entry.amountCents > MAX_CENTS || !Number.isSafeInteger(entry.taxCents) || entry.taxCents < 0 || entry.taxCents > MAX_CENTS || entry.currency !== 'CAD') throw new Error('Expense entry is invalid');
    operatingCents += entry.amountCents;
    taxCents += entry.taxCents;
    byCategory[entry.category] += entry.amountCents;
    if (!Number.isSafeInteger(operatingCents + taxCents)) throw new Error('Expense aggregate exceeds the supported range');
  }
  return { operatingCents, taxCents, totalCents: operatingCents + taxCents, byCategory };
}
