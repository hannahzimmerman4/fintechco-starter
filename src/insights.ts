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

/** The `n` calendar months before a 'YYYY-MM' month, oldest first: ('2026-01', 2) → ['2025-11', '2025-12']. */
export function previousMonths(month: string, n: number): string[] {
  const [y, m] = month.split('-').map(Number);
  const out: string[] = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

/** Average monthly net spend per category over `months`, in whole cents. Months with no spend count as zero. */
export function categoryAverages(txs: readonly Transaction[], months: readonly string[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const month of months) {
    for (const c of spendingInsights(txs, month).categories) totals.set(c.category, (totals.get(c.category) ?? 0) + c.netCents);
  }
  return new Map([...totals].map(([category, cents]) => [category, Math.round(cents / months.length)]));
}
