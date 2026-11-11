import { describe, expect, it } from 'vitest';
import { accounts } from '../src/accounts';
import { toCents } from '../src/ledger';
import { categoryLabel, transactions, UNCATEGORIZED } from '../src/transactions';

describe('starter transaction data', () => {
  it('contains uniquely identified transactions', () => {
    expect(new Set(transactions.map(t => t.id)).size).toBe(transactions.length);
  });
  it('uses well-formed ISO dates', () => {
    expect(transactions.every(t => /^\d{4}-\d{2}-\d{2}$/.test(t.date))).toBe(true);
  });
  it('includes an uncategorized transaction and a refund for feature edge cases', () => {
    expect(transactions.some(t => !t.category)).toBe(true);
    expect(transactions.some(t => t.amount < 0)).toBe(true);
  });
  it('includes transactions on both sides of the October/November boundary', () => {
    expect(transactions.some(t => t.date === '2026-10-31')).toBe(true);
    expect(transactions.some(t => t.date === '2026-11-01')).toBe(true);
  });
  it('links every transaction to a known account', () => {
    const ids = new Set(accounts.map(a => a.id));
    expect(transactions.filter(t => !ids.has(t.accountId))).toEqual([]);
  });
  it('stores every amount in whole cents', () => {
    expect(() => transactions.forEach(t => toCents(t.amount))).not.toThrow();
    expect(() => accounts.forEach(a => toCents(a.openingBalance))).not.toThrow();
  });
});

describe('starter account data', () => {
  it('has unique ids, one account of each type, and four-digit masks only', () => {
    expect(new Set(accounts.map(a => a.id)).size).toBe(accounts.length);
    expect(accounts.map(a => a.type).sort()).toEqual(['checking', 'credit', 'savings']);
    expect(accounts.every(a => /^\d{4}$/.test(a.mask))).toBe(true);
  });
});

describe('categoryLabel', () => {
  const base = { id: 't', accountId: 'cc', date: '2026-10-01', merchant: 'M', amount: 1 };
  it('falls back to Uncategorized for missing or blank categories', () => {
    expect(categoryLabel(base)).toBe(UNCATEGORIZED);
    expect(categoryLabel({ ...base, category: '   ' })).toBe(UNCATEGORIZED);
  });
  it('trims real categories', () => {
    expect(categoryLabel({ ...base, category: ' Dining ' })).toBe('Dining');
  });
});
