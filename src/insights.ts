import { toCents } from './ledger';
import { categoryLabel } from './transactions';
import type { Transaction } from './transactions';

export interface CategorySpend {
  category: string;
  netCents: number;
}

export interface SpendingInsights {
  categories: CategorySpend[];
  totalCents: number;
  count: number;
}

/** Net spend per category for a 'YYYY-MM' month (literal date prefix match); refunds (negative amounts) reduce net and total but still count. */
export function spendingInsights(txs: readonly Transaction[], month: string): SpendingInsights {
  const byCategory = new Map<string, number>();
  let totalCents = 0;
  let count = 0;
  for (const t of txs) {
    if (t.date.slice(0, 7) !== month) continue;
    const cents = toCents(t.amount);
    const label = categoryLabel(t);
    byCategory.set(label, (byCategory.get(label) ?? 0) + cents);
    totalCents += cents;
    count += 1;
  }
  const categories = [...byCategory].map(([category, netCents]) => ({ category, netCents }));
  categories.sort((a, b) => b.netCents - a.netCents || a.category.localeCompare(b.category));
  return { categories, totalCents, count };
}
