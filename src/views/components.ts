import { ACCOUNT_TYPE_LABEL, type Account } from '../accounts';
import { formatDate, formatUsd } from '../format';
import { html, type SafeHtml } from '../html';
import { accountBalance } from '../ledger';
import { routeHref } from '../router';
import { categoryLabel, type Transaction } from '../transactions';

export const pageHeader = (title: string, subtitle: string, pill: string): SafeHtml =>
  html`<div class="eyebrow">FINTECHCO / DIGITAL BANKING</div><header><div><h1>${title}</h1><p>${subtitle}</p></div><span class="pill">${pill}</span></header>`;

export const accountNameLookup = (accounts: readonly Account[]) => {
  const names = new Map(accounts.map(a => [a.id, a.name]));
  return (id: string): string => names.get(id) ?? 'Unknown account';
};

/** Spending shows as a negative amount; refunds show as a positive credit. */
export function transactionRow(t: Transaction, accountName: string): SafeHtml {
  const refund = t.amount < 0;
  const amount = refund ? `+${formatUsd(-t.amount)}` : formatUsd(-t.amount);
  return html`<div class="tx"><div><strong>${t.merchant}</strong><small>${formatDate(t.date)} · ${categoryLabel(t)} · ${accountName}${refund ? ' · Refund' : ''}</small></div><b class="${refund ? 'credit' : ''}">${amount}</b></div>`;
}

export function accountCard(a: Account, txs: readonly Transaction[]): SafeHtml {
  const label = a.type === 'credit' ? 'Balance owed' : 'Available balance';
  return html`<a class="account-card" href="${routeHref('transactions', { account: a.id })}"><div class="eyebrow">${ACCOUNT_TYPE_LABEL[a.type].toUpperCase()} •• ${a.mask}</div><strong>${a.name}</strong><div class="amount">${formatUsd(accountBalance(a, txs))}</div><small>${label}</small></a>`;
}
