import { describe, expect, it } from 'vitest';
import { transactions } from '../src/transactions';

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
});
