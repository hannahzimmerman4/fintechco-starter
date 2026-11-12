const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const shortMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

export const formatUsd = (n: number): string => usd.format(n);

const utcDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** 'YYYY-MM-DD' → 'Oct 31, 2026'. Formatted in UTC so the viewer's timezone can't shift the day. */
export const formatDate = (iso: string): string => shortDate.format(utcDate(iso));

/** 'YYYY-MM' → 'Oct'. */
export const formatMonth = (month: string): string => shortMonth.format(utcDate(`${month}-01`));

export const pluralize = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** A local Date → 'YYYY-MM-DD' for the viewer's calendar day. */
export const isoDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Header for a day of transactions: 'Today', 'Yesterday', 'Nov 9', or 'Nov 9, 2025' outside today's year. */
export function dateGroupLabel(iso: string, today: string): string {
  if (iso === today) return 'Today';
  const yesterday = new Date(utcDate(today).getTime() - 86_400_000).toISOString().slice(0, 10);
  if (iso === yesterday) return 'Yesterday';
  return iso.slice(0, 4) === today.slice(0, 4) ? monthDay.format(utcDate(iso)) : formatDate(iso);
}
