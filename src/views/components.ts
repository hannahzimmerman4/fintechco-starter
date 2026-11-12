import { ACCOUNT_TYPE_LABEL, type Account } from '../accounts';
import { categoryColor } from '../categories';
import { dateGroupLabel, formatDate, formatUsd } from '../format';
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

/** A dollar figure. Every amount uses `.money` so the privacy toggle can blur it. Credits get a + and the emerald pill. */
export const money = (dollars: number, credit = false): SafeHtml =>
  credit ? html`<span class="money credit">+${formatUsd(dollars)}</span>` : html`<span class="money">${formatUsd(dollars)}</span>`;

/** Hero balance: whole dollars at full size, cents smaller and dimmer. */
export function heroMoney(dollars: number): SafeHtml {
  const text = formatUsd(dollars);
  const dot = text.lastIndexOf('.');
  return html`<span class="money hero">${text.slice(0, dot)}<span class="cents">${text.slice(dot)}</span></span>`;
}

export const categoryTag = (label: string): SafeHtml =>
  html`<span class="cat-tag" style="--c:${categoryColor(label)}"><span class="dot"></span>${label}</span>`;

/** A tappable transaction row. Spending shows as a negative amount; refunds show as a positive credit. */
export function transactionRow(t: Transaction, accountName: string): SafeHtml {
  const refund = t.amount < 0;
  const label = categoryLabel(t);
  const initial = [...t.merchant.trim()][0]?.toUpperCase() ?? '?';
  return html`<div class="collapsible tx-item" data-category="${label}"><div class="collapsible-inner"><button type="button" class="tx-row" data-tx="${t.id}" aria-haspopup="dialog"><span class="tx-icon" style="--c:${categoryColor(label)}" aria-hidden="true">${initial}</span><span class="tx-main"><strong>${t.merchant}</strong><small>${label} · ${accountName}${refund ? ' · Refund' : ''}</small></span>${money(Math.abs(t.amount) * (refund ? 1 : -1), refund)}</button></div></div>`;
}

/** Rows grouped under sticky day headers, in the order given (callers sort newest first). */
export function transactionList(txs: readonly Transaction[], name: (accountId: string) => string, today: string): SafeHtml {
  const days = new Map<string, Transaction[]>();
  for (const t of txs) days.set(t.date, [...(days.get(t.date) ?? []), t]);
  const groups = [...days].map(([date, items]) =>
    html`<section class="collapsible tx-group"><div class="collapsible-inner"><h3 class="date-header"><time datetime="${date}">${dateGroupLabel(date, today)}</time></h3><div class="rows">${items.map(t => transactionRow(t, name(t.accountId)))}</div></div></section>`);
  return html`<div class="tx-list">${groups}</div>`;
}

/** Drawer body for one transaction. Location, time of day and receipts aren't in the demo data, so they aren't shown. */
export function transactionDetail(t: Transaction, account: Account | undefined): SafeHtml {
  const refund = t.amount < 0;
  const accountText = account ? `${account.name} •• ${account.mask}` : 'Unknown account';
  return html`<div class="drawer-body"><div class="drawer-head"><div><div class="eyebrow">${refund ? 'REFUND' : 'PURCHASE'}</div><h2 id="drawer-title">${t.merchant}</h2></div><form method="dialog"><button class="icon-button" aria-label="Close">✕</button></form></div>
  <div class="drawer-amount">${money(Math.abs(t.amount) * (refund ? 1 : -1), refund)}</div>
  <dl class="details"><div><dt>Date</dt><dd><time datetime="${t.date}">${formatDate(t.date)}</time></dd></div><div><dt>Account</dt><dd>${accountText}</dd></div><div><dt>Category</dt><dd>${categoryTag(categoryLabel(t))}</dd></div></dl></div>`;
}

export function accountCard(a: Account, txs: readonly Transaction[]): SafeHtml {
  const label = a.type === 'credit' ? 'Balance owed' : 'Available balance';
  return html`<a class="account-card" href="${routeHref('transactions', { account: a.id })}"><div class="eyebrow">${ACCOUNT_TYPE_LABEL[a.type].toUpperCase()} •• ${a.mask}</div><strong>${a.name}</strong><div class="amount">${money(accountBalance(a, txs))}</div><small>${label}</small></a>`;
}

const EYE = html`<svg class="eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="eye-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;

/** Eye button that blurs every `.money` figure; main.ts keeps aria-pressed in sync. */
export const privacyToggle = (): SafeHtml =>
  html`<button type="button" class="icon-button privacy-toggle" aria-pressed="false" aria-label="Hide amounts">${EYE}</button>`;
