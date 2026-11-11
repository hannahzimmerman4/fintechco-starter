export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  merchant: string;
  category?: string;
  amount: number; // positive expenses, negative refunds
}

export const transactions: Transaction[] = [
  { id: 'tx-01', date: '2026-10-02', merchant: 'Metro Grocer', category: 'Groceries', amount: 87.24 },
  { id: 'tx-02', date: '2026-10-04', merchant: 'Blue Line Transit', category: 'Transport', amount: 24.50 },
  { id: 'tx-03', date: '2026-10-07', merchant: 'Cafe Olive', category: 'Dining', amount: 28.90 },
  { id: 'tx-04', date: '2026-10-09', merchant: 'Metro Grocer', category: 'Groceries', amount: 46.75 },
  { id: 'tx-05', date: '2026-10-15', merchant: 'Mystery Merchant', amount: 16.20 },
  { id: 'tx-06', date: '2026-10-20', merchant: 'Blue Line Transit', category: 'Transport', amount: 24.50 },
  { id: 'tx-07', date: '2026-10-25', merchant: 'Cafe Olive', category: 'Dining', amount: -5.00 },
  { id: 'tx-08', date: '2026-11-01', merchant: 'Metro Grocer', category: 'Groceries', amount: 52.10 }
];
