import type { Account } from './accounts';
import type { Transaction } from './transactions';

/** Dollars → integer cents. Throws on non-finite amounts or amounts that aren't whole cents (e.g. 10.005). */
export function toCents(amount: number): number {
  const cents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(cents) || cents / 100 !== amount) {
    throw new Error(`Amount must be a finite number of whole cents, got: ${amount}`);
  }
  return cents;
}

function balanceCents(account: Account, txs: readonly Transaction[]): number {
  const netSpend = txs.reduce((sum, t) => (t.accountId === account.id ? sum + toCents(t.amount) : sum), 0);
  const opening = toCents(account.openingBalance);
  return account.type === 'credit' ? opening + netSpend : opening - netSpend;
}

/**
 * Current balance in dollars, calculated in integer cents.
 * - Checking/savings: money available = opening balance − spending + refunds.
 * - Credit card: amount owed = opening balance owed + spending − refunds.
 */
export const accountBalance = (account: Account, txs: readonly Transaction[]): number =>
  balanceCents(account, txs) / 100;

/** Total deposit balances minus total credit card balances owed, in dollars. */
export function netPosition(accounts: readonly Account[], txs: readonly Transaction[]): number {
  const cents = accounts.reduce((sum, a) => {
    const b = balanceCents(a, txs);
    return a.type === 'credit' ? sum - b : sum + b;
  }, 0);
  return cents / 100;
}
