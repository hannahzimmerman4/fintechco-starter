import { describe, expect, it } from 'vitest';
import { barWidthPercent, isValidIsoDate, summarizeMonth, UNCATEGORIZED } from '../src/insights';
import { transactions, type Transaction } from '../src/transactions';

let seq = 0;
const tx = (date: string, amount: number, category?: string): Transaction => ({
  id: `t-${++seq}`, date, merchant: 'Test Merchant', category, amount
});

describe('summarizeMonth — starter data', () => {
  it('produces the October 2026 acceptance totals', () => {
    const s = summarizeMonth(transactions, '2026-10');
    expect(s.categories).toEqual([
      { category: 'Groceries', total: 133.99, transactionCount: 2 },
      { category: 'Transport', total: 49, transactionCount: 2 },
      { category: 'Dining', total: 23.9, transactionCount: 2 },
      { category: UNCATEGORIZED, total: 16.2, transactionCount: 1 }
    ]);
    expect(s.total).toBe(223.09);
    expect(s.transactionCount).toBe(7);
    expect(s.month).toBe('2026-10');
  });
});

describe('summarizeMonth — month boundaries', () => {
  it('includes only dates whose literal YYYY-MM matches', () => {
    const s = summarizeMonth([
      tx('2026-09-30', 1, 'A'), tx('2026-10-01', 2, 'A'), tx('2026-10-31', 3, 'A'), tx('2026-11-01', 4, 'A')
    ], '2026-10');
    expect(s.total).toBe(5);
    expect(s.transactionCount).toBe(2);
  });

  it('does not parse dates, so timezone cannot shift a boundary transaction', () => {
    // new Date('2026-11-01') is UTC midnight, which is Oct 31 in US timezones; literal matching avoids that.
    expect(summarizeMonth([tx('2026-11-01', 10, 'A')], '2026-10').transactionCount).toBe(0);
    expect(summarizeMonth([tx('2026-10-01', 10, 'A')], '2026-09').transactionCount).toBe(0);
  });

  it('distinguishes the same month in different years', () => {
    expect(summarizeMonth([tx('2025-10-15', 10, 'A')], '2026-10').transactionCount).toBe(0);
  });
});

describe('summarizeMonth — categories', () => {
  it('groups undefined, empty, and whitespace-only categories as Uncategorized', () => {
    const s = summarizeMonth([
      tx('2026-10-01', 1), tx('2026-10-02', 2, ''), tx('2026-10-03', 3, '   ')
    ], '2026-10');
    expect(s.categories).toEqual([{ category: UNCATEGORIZED, total: 6, transactionCount: 3 }]);
  });

  it('trims whitespace but keeps case-distinct names separate', () => {
    const s = summarizeMonth([
      tx('2026-10-01', 1, ' Groceries '), tx('2026-10-02', 2, 'Groceries'), tx('2026-10-03', 4, 'groceries')
    ], '2026-10');
    expect(s.categories.map(c => [c.category, c.total])).toEqual([['groceries', 4], ['Groceries', 3]]);
  });

  it('sorts by total descending, then by name for ties', () => {
    const s = summarizeMonth([
      tx('2026-10-01', 5, 'Beta'), tx('2026-10-02', 5, 'Alpha'), tx('2026-10-03', 9, 'Zeta')
    ], '2026-10');
    expect(s.categories.map(c => c.category)).toEqual(['Zeta', 'Alpha', 'Beta']);
  });
});

describe('summarizeMonth — refunds', () => {
  it('subtracts refunds from category and month totals and counts them', () => {
    const s = summarizeMonth([tx('2026-10-01', 28.9, 'Dining'), tx('2026-10-05', -5, 'Dining')], '2026-10');
    expect(s.categories).toEqual([{ category: 'Dining', total: 23.9, transactionCount: 2 }]);
    expect(s.total).toBe(23.9);
    expect(s.transactionCount).toBe(2);
  });

  it('keeps a refund-only category with a negative net total', () => {
    const s = summarizeMonth([tx('2026-10-01', 10, 'A'), tx('2026-10-02', -4, 'B')], '2026-10');
    expect(s.categories).toEqual([
      { category: 'A', total: 10, transactionCount: 1 },
      { category: 'B', total: -4, transactionCount: 1 }
    ]);
    expect(s.total).toBe(6);
  });

  it('keeps a fully refunded category at exactly zero', () => {
    const s = summarizeMonth([tx('2026-10-01', 19.99, 'A'), tx('2026-10-02', -19.99, 'A')], '2026-10');
    expect(s.categories).toEqual([{ category: 'A', total: 0, transactionCount: 2 }]);
    expect(Object.is(s.total, 0)).toBe(true);
  });

  it('allows a negative month total when refunds exceed spending', () => {
    expect(summarizeMonth([tx('2026-10-01', 5, 'A'), tx('2026-10-02', -12.5, 'A')], '2026-10').total).toBe(-7.5);
  });

  it('attributes a refund to the month it occurs, not the original purchase month', () => {
    const data = [tx('2026-10-28', 60, 'Dining'), tx('2026-11-03', -60, 'Dining')];
    expect(summarizeMonth(data, '2026-10').categories).toEqual([{ category: 'Dining', total: 60, transactionCount: 1 }]);
    expect(summarizeMonth(data, '2026-11').categories).toEqual([{ category: 'Dining', total: -60, transactionCount: 1 }]);
  });
});

describe('isValidIsoDate', () => {
  it.each(['2026-10-01', '2026-10-31', '2026-02-28', '2028-02-29', '2000-02-29', '2026-12-31'])('accepts %s', d => {
    expect(isValidIsoDate(d)).toBe(true);
  });

  it.each([
    '2026-10-99', '2026-10-32', '2026-10-00', '2026-09-31', '2026-02-29', '2100-02-29', '2026-13-01', '2026-00-10',
    '2026-10-1', '2026-10', '26-10-01', '2026/10/01', '2026-10-01T00:00:00Z', ' 2026-10-01', ''
  ])('rejects %j', d => {
    expect(isValidIsoDate(d)).toBe(false);
  });
});

describe('summarizeMonth — input validation', () => {
  it('rejects a malformed date in the target month with a descriptive error', () => {
    const bad: Transaction = { id: 'tx-bad', date: '2026-10-99', merchant: 'Test Merchant', category: 'A', amount: 10 };
    expect(() => summarizeMonth([tx('2026-10-01', 5, 'A'), bad], '2026-10'))
      .toThrow('Invalid transaction date for tx-bad: "2026-10-99" (must be a real calendar date in YYYY-MM-DD format)');
  });

  it('rejects malformed dates even when they would not match the target month', () => {
    expect(() => summarizeMonth([tx('2026-9-30', 5, 'A')], '2026-10')).toThrow(/Invalid transaction date/);
    expect(() => summarizeMonth([tx('2026-02-30', 5, 'A')], '2026-10')).toThrow(/Invalid transaction date/);
  });

  it.each([10.005, 0.125, -0.125, 0.001, 87.239])('rejects fractional-cent amount %s instead of rounding', amount => {
    expect(() => summarizeMonth([tx('2026-10-01', amount, 'A')], '2026-10')).toThrow(/whole cents/);
  });

  it('names the offending transaction in the amount error', () => {
    const bad: Transaction = { id: 'tx-frac', date: '2026-10-01', merchant: 'Test Merchant', amount: 1.234 };
    expect(() => summarizeMonth([bad], '2026-10')).toThrow('Invalid transaction amount for tx-frac: 1.234');
  });

  it('accepts whole-cent amounts that are inexact in binary floating point', () => {
    // 0.29 * 100 === 28.999999999999996 in JS; it must still be accepted as 29 cents.
    const s = summarizeMonth([
      tx('2026-10-01', 0.29, 'A'), tx('2026-10-02', 0.07, 'A'), tx('2026-10-03', 1.1, 'A'), tx('2026-10-04', 1000000.01, 'A'), tx('2026-10-05', -0.29, 'A')
    ], '2026-10');
    expect(s.total).toBe(1000001.18);
  });

  it('rejects fractional-cent amounts outside the target month too', () => {
    expect(() => summarizeMonth([tx('2026-09-15', 4.999, 'A')], '2026-10')).toThrow(/whole cents/);
  });
});

describe('summarizeMonth — currency precision', () => {
  it('sums in cents to avoid floating-point drift', () => {
    expect(summarizeMonth([tx('2026-10-01', 0.1, 'A'), tx('2026-10-02', 0.2, 'A')], '2026-10').total).toBe(0.3);
    const many = Array.from({ length: 100 }, (_, i) => tx(`2026-10-${String((i % 28) + 1).padStart(2, '0')}`, 0.01, 'A'));
    expect(summarizeMonth(many, '2026-10').total).toBe(1);
  });
});

describe('summarizeMonth — empty and invalid input', () => {
  it('returns empty results for a month with no transactions', () => {
    expect(summarizeMonth(transactions, '2026-03')).toEqual({ month: '2026-03', categories: [], total: 0, transactionCount: 0 });
    expect(summarizeMonth([], '2026-10').transactionCount).toBe(0);
  });

  it.each(['2026-1', 'October', '2026-13', '2026-00', '2026/10', ''])('rejects malformed month %j', month => {
    expect(() => summarizeMonth(transactions, month)).toThrow(/YYYY-MM/);
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite amount %s', amount => {
    expect(() => summarizeMonth([tx('2026-10-01', amount, 'A')], '2026-10')).toThrow(/Invalid transaction amount/);
  });

  it('does not mutate the input transactions', () => {
    const snapshot = structuredClone(transactions);
    summarizeMonth(transactions, '2026-10');
    expect(transactions).toEqual(snapshot);
  });
});

describe('barWidthPercent', () => {
  it('scales relative to the largest positive total', () => {
    expect(barWidthPercent(50, 100)).toBe(50);
    expect(barWidthPercent(100, 100)).toBe(100);
  });

  it('renders zero and negative totals as 0%', () => {
    expect(barWidthPercent(0, 100)).toBe(0);
    expect(barWidthPercent(-4, 100)).toBe(0);
  });

  it('never returns NaN, negative, or over-100 widths for degenerate inputs', () => {
    for (const [t, m] of [[5, 0], [0, 0], [-5, -10], [5, -10], [NaN, 10], [10, NaN], [Infinity, 10], [200, 100]]) {
      const w = barWidthPercent(t, m);
      expect(Number.isFinite(w)).toBe(true);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(100);
    }
  });
});
