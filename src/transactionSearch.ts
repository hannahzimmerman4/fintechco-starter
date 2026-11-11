import { categoryLabel, type Transaction } from './transactions';

export interface TransactionFilter {
  query?: string; // case-insensitive match on merchant or category label
  accountId?: string;
}

/** Newest first; ties broken by id so ordering is deterministic. */
export const newestFirst = (a: Transaction, b: Transaction): number =>
  b.date.localeCompare(a.date) || b.id.localeCompare(a.id);

/** Matching transactions, newest first. Never mutates the input. */
export function filterTransactions(txs: readonly Transaction[], filter: TransactionFilter = {}): Transaction[] {
  const q = filter.query?.trim().toLowerCase() ?? '';
  return txs
    .filter(t => !filter.accountId || t.accountId === filter.accountId)
    .filter(t => !q || t.merchant.toLowerCase().includes(q) || categoryLabel(t).toLowerCase().includes(q))
    .sort(newestFirst);
}
