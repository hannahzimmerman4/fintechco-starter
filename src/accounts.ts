import data from '../data/accounts.json';

export type AccountType = 'checking' | 'savings' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  mask: string; // last four digits only
  openingBalance: number; // dollars; for credit accounts this is the amount owed
  openingDate: string; // ISO YYYY-MM-DD
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit card',
};

/** Synthetic demo accounts shared with other tooling via data/accounts.json. */
export const accounts: readonly Account[] = data as Account[];
