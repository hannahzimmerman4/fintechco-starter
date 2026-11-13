import { describe, expect, it } from 'vitest';
import { availableMonths, categoryAverages, DEFAULT_MONTH, previousMonths, resolveMonth, spendingInsights } from '../src/insights';
import { transactions } from '../src/transactions';
import type { Transaction } from '../src/transactions';

let n = 0;
const tx = (date: string, amount: number, category?: string): Transaction => ({
  id: `t${++n}`,
  accountId: 'chk',
  date,
  merchant: 'M',
  amount,
  ...(category === undefined ? {} : { category }),
});

describe('spendingInsights', () => {
  it('includes Oct 1 and Oct 31 and excludes Sep 30 and Nov 1', () => {
    const r = spendingInsights(
      [tx('2026-09-30', 10, 'A'), tx('2026-10-01', 10, 'A'), tx('2026-10-31', 10, 'A'), tx('2026-11-01', 10, 'A')],
      '2026-10',
    );
    expect(r.count).toBe(2);
    expect(r.totalCents).toBe(2000);
  });

  it('matches the whole month, not a shorter prefix', () => {
    const fixtures = [tx('2026-09-30', 10, 'A'), tx('2026-10-01', 10, 'A'), tx('2026-10-31', 10, 'A'), tx('2026-11-01', 10, 'A')];
    expect(spendingInsights(fixtures, '2026-1').count).toBe(0);
  });

  it('subtracts refunds from the category and the total but counts them', () => {
    const r = spendingInsights([tx('2026-10-02', 28.9, 'Dining'), tx('2026-10-03', -5, 'Dining')], '2026-10');
    expect(r.categories).toContainEqual({ category: 'Dining', netCents: 2390 });
    expect(r.totalCents).toBe(2390);
    expect(r.count).toBe(2);
  });

  it('keeps categories whose refunds cancel or exceed spending', () => {
    const r = spendingInsights(
      [tx('2026-10-02', 50, 'Travel'), tx('2026-10-03', -50, 'Travel'), tx('2026-10-04', -12, 'Books')],
      '2026-10',
    );
    expect(r.categories).toContainEqual({ category: 'Travel', netCents: 0 });
    expect(r.categories).toContainEqual({ category: 'Books', netCents: -1200 });
    expect(r.categories).toHaveLength(2);
  });

  it('groups missing and blank categories as Uncategorized', () => {
    const r = spendingInsights([tx('2026-10-02', 1), tx('2026-10-03', 2, ''), tx('2026-10-04', 3, '  ')], '2026-10');
    expect(r.categories).toEqual([{ category: 'Uncategorized', netCents: 600 }]);
  });

  it('sorts by net descending and breaks ties by category name', () => {
    const r = spendingInsights(
      [tx('2026-10-02', 49, 'Transport'), tx('2026-10-03', 49, 'Health'), tx('2026-10-04', 1850, 'Housing')],
      '2026-10',
    );
    expect(r.categories.map((c) => c.category)).toEqual(['Housing', 'Health', 'Transport']);
  });

  it('does not mutate its input', () => {
    const input = [tx('2026-10-02', 5, 'A'), tx('2026-10-03', -1)];
    const copy = structuredClone(input);
    input.forEach((t) => Object.freeze(t));
    Object.freeze(input);
    expect(() => spendingInsights(input, '2026-10')).not.toThrow();
    expect(input).toEqual(copy);
  });

  it('summarizes the October 2026 data', () => {
    const r = spendingInsights(transactions, '2026-10');
    expect(r.count).toBe(13);
    expect(r.totalCents).toBe(233948);
    expect(r.categories).toEqual([
      { category: 'Housing', netCents: 185000 },
      { category: 'Groceries', netCents: 17259 },
      { category: 'Utilities', netCents: 16280 },
      { category: 'Health', netCents: 4900 },
      { category: 'Transport', netCents: 4900 },
      { category: 'Dining', netCents: 2390 },
      { category: 'Uncategorized', netCents: 1620 },
      { category: 'Subscriptions', netCents: 1599 },
    ]);
  });
});

describe('previousMonths', () => {
  it('lists earlier months oldest first, across a year boundary', () => {
    expect(previousMonths('2026-10', 2)).toEqual(['2026-08', '2026-09']);
    expect(previousMonths('2026-01', 2)).toEqual(['2025-11', '2025-12']);
  });
});

describe('categoryAverages', () => {
  const tx = (id: string, date: string, category: string | undefined, amount: number) => ({ id, accountId: 'cc', date, merchant: 'M', category, amount });
  it('averages net cents per month, counting empty months as zero', () => {
    const avg = categoryAverages([
      tx('a', '2026-08-02', 'Dining', 10.01),
      tx('b', '2026-09-02', 'Groceries', 20),
      tx('c', '2026-08-03', 'Groceries', 10),
      tx('d', '2026-10-01', 'Groceries', 999),
      tx('e', '2026-09-04', undefined, 3),
    ], ['2026-08', '2026-09']);
    expect(avg.get('Groceries')).toBe(1500);
    expect(avg.get('Dining')).toBe(501); // 1001 / 2 rounded
    expect(avg.get('Uncategorized')).toBe(150);
  });
  it('lets refunds cancel spend', () => {
    const avg = categoryAverages([tx('a', '2026-08-02', 'Shopping', 42.75), tx('b', '2026-09-02', 'Shopping', -42.75)], ['2026-08', '2026-09']);
    expect(avg.get('Shopping')).toBe(0);
  });
});

describe('availableMonths', () => {
  it('lists each month with transactions once, oldest first', () => {
    expect(availableMonths([tx('2026-10-02', 1), tx('2026-08-31', 1), tx('2026-10-09', 1)])).toEqual(['2026-08', '2026-10']);
  });
  it('lists the months in the data', () => {
    expect(availableMonths(transactions)).toEqual(['2026-08', '2026-09', '2026-10', '2026-11']);
  });
  it('is empty with no transactions', () => {
    expect(availableMonths([])).toEqual([]);
  });
});

describe('resolveMonth', () => {
  const available = ['2026-08', '2026-09', '2026-10', '2026-11'];
  it('accepts a month that has data', () => {
    expect(resolveMonth('2026-09', available)).toEqual({ month: '2026-09', unavailable: false });
  });
  it('defaults to October with no notice when the param is omitted', () => {
    expect(DEFAULT_MONTH).toBe('2026-10');
    expect(resolveMonth(null, available)).toEqual({ month: '2026-10', unavailable: false });
    expect(resolveMonth('2026-10', available)).toEqual({ month: '2026-10', unavailable: false });
  });
  it.each([
    ['empty', ''],
    ['not YYYY-MM', 'abc'],
    ['impossible month', '2026-13'],
    ['month zero', '2026-00'],
    ['partial value', '2026-1'],
    ['full date', '2026-10-01'],
    ['padded', ' 2026-09'],
    ['month with no transactions', '2025-01'],
    ['hostile markup', '<img src=x onerror=alert(1)>'],
  ])('falls back to October with a notice for %s', (_kind, raw) => {
    expect(resolveMonth(raw, available)).toEqual({ month: '2026-10', unavailable: true });
  });
});

describe('month boundary', () => {
  const edge = [tx('2026-09-30', 10, 'Dining'), tx('2026-10-01', 20, 'Dining')];
  it('puts Sep 30 in September and Oct 1 in October', () => {
    expect(spendingInsights(edge, '2026-09')).toMatchObject({ totalCents: 1000, count: 1 });
    expect(spendingInsights(edge, '2026-10')).toMatchObject({ totalCents: 2000, count: 1 });
  });
});
