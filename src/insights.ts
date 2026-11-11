import type { Transaction } from './transactions';

export const UNCATEGORIZED = 'Uncategorized';

export interface CategoryTotal {
  category: string;
  total: number; // net dollars (expenses minus refunds), exact to the cent
  transactionCount: number;
}

export interface MonthlyInsights {
  month: string; // 'YYYY-MM'
  categories: CategoryTotal[]; // sorted by total descending, then by name
  total: number; // net spend for the month
  transactionCount: number; // all matched transactions, refunds included
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** True for a real calendar date in strict YYYY-MM-DD form. Pure arithmetic: no Date, no timezone. */
export function isValidIsoDate(date: string): boolean {
  const m = DATE_PATTERN.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  const daysInMonth = [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
  return d <= daysInMonth;
}

/**
 * Convert a dollar amount to integer cents, rejecting anything that is not an exact
 * whole number of cents (e.g. 10.005). `cents / 100 === amount` is exact for valid
 * amounts because both sides are the nearest double to the same two-decimal value.
 */
const toCents = (t: Transaction): number => {
  const cents = Math.round(t.amount * 100);
  if (!Number.isFinite(t.amount) || !Number.isSafeInteger(cents) || cents / 100 !== t.amount) {
    throw new Error(`Invalid transaction amount for ${t.id}: ${t.amount} (must be a finite amount in whole cents)`);
  }
  return cents;
};

const categoryOf = (t: Transaction): string => t.category?.trim() || UNCATEGORIZED;

/**
 * Summarize net spending for one calendar month.
 *
 * Conventions:
 * - Month matching: the literal 'YYYY-MM' prefix of the ISO date string. No Date parsing,
 *   so no timezone rollover.
 * - Validation: every transaction in the input (not only the target month) must have a real
 *   YYYY-MM-DD date and a whole-cent amount; otherwise this throws instead of silently
 *   dropping or rounding the record.
 * - Money: summed in integer cents, returned as dollars.
 * - Refunds: negative amounts reduce net spend for their category and still count as
 *   transactions. A refund is attributed to the month in which it occurs (its own date),
 *   not necessarily the month of the original purchase.
 * - Missing/blank categories are grouped as 'Uncategorized'.
 * The input array is never mutated.
 */
export function summarizeMonth(txs: readonly Transaction[], month: string): MonthlyInsights {
  if (!MONTH_PATTERN.test(month)) throw new Error(`Month must be YYYY-MM, got: ${month}`);

  const byCategory = new Map<string, { cents: number; count: number }>();
  let totalCents = 0;
  let count = 0;

  for (const t of txs) {
    if (!isValidIsoDate(t.date)) {
      throw new Error(`Invalid transaction date for ${t.id}: "${t.date}" (must be a real calendar date in YYYY-MM-DD format)`);
    }
    const cents = toCents(t);
    if (t.date.slice(0, 7) !== month) continue;
    const key = categoryOf(t);
    const entry = byCategory.get(key) ?? { cents: 0, count: 0 };
    entry.cents += cents;
    entry.count += 1;
    byCategory.set(key, entry);
    totalCents += cents;
    count += 1;
  }

  const categories = [...byCategory.entries()]
    .map(([category, { cents, count }]) => ({ category, cents, transactionCount: count }))
    .sort((a, b) => b.cents - a.cents || a.category.localeCompare(b.category))
    .map(({ category, cents, transactionCount }) => ({ category, total: cents / 100, transactionCount }));

  return { month, categories, total: totalCents / 100, transactionCount: count };
}

/**
 * Width (0–100) of a category's bar relative to the largest positive category total.
 * Zero, negative, or non-finite totals render as a 0% bar; never returns NaN or a negative width.
 */
export function barWidthPercent(total: number, maxPositiveTotal: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(maxPositiveTotal)) return 0;
  if (total <= 0 || maxPositiveTotal <= 0) return 0;
  return Math.min(100, (total / maxPositiveTotal) * 100);
}
