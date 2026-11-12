import { UNCATEGORIZED } from './transactions';

/** One saturated hue per category, tuned to read on the light surface. */
const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#4f46e5',
  Groceries: '#0d9488',
  Transport: '#0284c7',
  Dining: '#ea580c',
  Utilities: '#ca8a04',
  Subscriptions: '#9333ea',
  Shopping: '#db2777',
  Health: '#dc2626',
  Travel: '#2563eb',
  [UNCATEGORIZED]: '#64748b',
};

const FALLBACK_COLOR = '#64748b';

/** Color for a category label (use `categoryLabel` first); unknown categories get the neutral slate. */
export const categoryColor = (label: string): string => CATEGORY_COLORS[label] ?? FALLBACK_COLOR;
