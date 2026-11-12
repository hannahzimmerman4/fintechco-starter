import { formatUsd, pluralize } from '../format';
import { html, type SafeHtml } from '../html';
import { spendingInsights } from '../insights';
import type { Transaction } from '../transactions';
import { pageHeader } from './components';

export const INSIGHTS_MONTH = '2026-10';

export function renderInsights(txs: readonly Transaction[]): SafeHtml {
  const { categories, totalCents, count } = spendingInsights(txs, INSIGHTS_MONTH);
  const header = pageHeader('Spending insights', 'Net spend by category for October 2026. Refunds reduce their category.', pluralize(count, 'transaction'));
  if (count === 0) {
    return html`${header}<section class="activity"><p class="empty">No transactions in October 2026.</p></section>`;
  }
  const rows = categories.map(c => c.netCents < 0
    ? html`<div class="tx"><div><strong>${c.category}</strong><small>Net refund</small></div><b class="credit">+${formatUsd(-c.netCents / 100)}</b></div>`
    : html`<div class="tx"><div><strong>${c.category}</strong></div><b>${formatUsd(c.netCents / 100)}</b></div>`);
  const total = html`<section class="stat"><div><div class="eyebrow">TOTAL NET SPEND</div><div class="balance">${formatUsd(totalCents / 100)}</div><p>${pluralize(count, 'transaction')} in October 2026.</p></div></section>`;
  return html`${header}${total}<section class="activity" aria-label="Spending by category"><div class="rows">${rows}</div></section>`;
}
