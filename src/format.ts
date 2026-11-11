const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const formatUsd = (n: number): string => usd.format(n);

/** 'YYYY-MM-DD' → 'Oct 31, 2026'. Formatted in UTC so the viewer's timezone can't shift the day. */
export const formatDate = (iso: string): string => shortDate.format(new Date(`${iso}T00:00:00Z`));

export const pluralize = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;
