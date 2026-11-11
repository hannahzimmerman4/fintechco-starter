import { describe, expect, it } from 'vitest';
import { filterTransactions } from '../src/transactionSearch';
import type { Transaction } from '../src/transactions';

const txs: Transaction[] = [
  { id: 'a', accountId: 'cc', date: '2026-10-02', merchant: 'Metro Grocer', category: 'Groceries', amount: 10 },
  { id: 'b', accountId: 'chk', date: '2026-10-05', merchant: 'Cafe Olive', category: 'Dining', amount: 5 },
  { id: 'c', accountId: 'cc', date: '2026-10-05', merchant: 'Mystery Merchant', amount: 3 },
  { id: 'd', accountId: 'cc', date: '2026-09-30', merchant: 'Greenleaf Market', category: 'Groceries', amount: -2 },
];
const ids = (list: Transaction[]) => list.map(t => t.id);

describe('filterTransactions', () => {
  it('returns everything newest first, breaking date ties by id', () => {
    expect(ids(filterTransactions(txs))).toEqual(['c', 'b', 'a', 'd']);
  });
  it('matches merchant or category, case-insensitively and trimmed', () => {
    expect(ids(filterTransactions(txs, { query: '  GROCER ' }))).toEqual(['a', 'd']);
    expect(ids(filterTransactions(txs, { query: 'olive' }))).toEqual(['b']);
  });
  it('matches the Uncategorized label for missing categories', () => {
    expect(ids(filterTransactions(txs, { query: 'uncategorized' }))).toEqual(['c']);
  });
  it('filters by account and combines with the query', () => {
    expect(ids(filterTransactions(txs, { accountId: 'chk' }))).toEqual(['b']);
    expect(ids(filterTransactions(txs, { accountId: 'cc', query: 'groceries' }))).toEqual(['a', 'd']);
  });
  it('returns an empty list when nothing matches', () => {
    expect(filterTransactions(txs, { query: 'nope' })).toEqual([]);
  });
  it('does not mutate the input', () => {
    const copy = [...txs];
    filterTransactions(txs);
    expect(txs).toEqual(copy);
  });
});
