import data from '../data/transactions.json';

export interface Transaction {
  id: string;
  accountId: string; // matches an Account id in data/accounts.json
  date: string; // ISO YYYY-MM-DD
  merchant: string;
  category?: string;
  amount: number; // positive expenses, negative refunds
}

export const UNCATEGORIZED = 'Uncategorized';

/** Display/grouping label for a transaction's category; missing or blank becomes 'Uncategorized'. */
export const categoryLabel = (t: Transaction): string => t.category?.trim() || UNCATEGORIZED;

/** Synthetic demo data shared with other tooling via data/transactions.json. */
export const transactions: readonly Transaction[] = data as Transaction[];
