import type { Account } from '../accounts';
import { categoryColor } from '../categories';
import { formatMonth, pluralize } from '../format';
import { html, type SafeHtml } from '../html';
import { categoryAverages, previousMonths, spendingInsights, type CategorySpend } from '../insights';
import { filterTransactions } from '../transactionSearch';
import type { Transaction } from '../transactions';
import { accountNameLookup, money, pageHeader, transactionList } from './components';

export const INSIGHTS_MONTH = '2026-10';
/** How many earlier months make up the "historical average". */
export const HISTORY_MONTHS = 2;

const pct = (part: number, whole: number): number => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function spendBar(spending: readonly CategorySpend[], spendCents: number): SafeHtml {
  const summary = spending.map(c => `${c.category} ${pct(c.netCents, spendCents)}%`).join(', ');
  const segments = spending.map(c =>
    html`<span class="seg" data-category="${c.category}" style="flex-grow:${c.netCents};--c:${categoryColor(c.category)}"></span>`);
  return html`<div class="spend-bar" role="img" aria-label="${`Share of spend: ${summary}`}">${segments}</div>`;
}

function categoryCard(c: CategorySpend, avgCents: number, spendCents: number, historyLabel: string): SafeHtml {
  const refund = c.netCents < 0;
  const scale = Math.max(c.netCents, avgCents, 1);
  const fill = refund ? 0 : pct(c.netCents, scale);
  const marker = avgCents > 0 ? html`<span class="micro-avg" style="left:${pct(avgCents, scale)}%"></span>` : null;
  const share = refund ? 'Net refund' : `${pct(c.netCents, spendCents)}%`;
  const avgText = avgCents > 0 ? html`${historyLabel} avg ${money(avgCents / 100)}` : html`No net spend in ${historyLabel}`;
  return html`<button type="button" class="cat-card" data-category="${c.category}" aria-pressed="false" style="--c:${categoryColor(c.category)}">
  <span class="cat-top"><span class="dot"></span><strong>${c.category}</strong><span class="pct">${share}</span></span>
  ${money(Math.abs(c.netCents) / 100, refund)}
  <span class="micro" aria-hidden="true"><span class="micro-fill" style="width:${fill}%"></span>${marker}</span>
  <small>${avgText}</small></button>`;
}

export function renderInsights(accounts: readonly Account[], txs: readonly Transaction[], today: string): SafeHtml {
  const { categories, totalCents, count } = spendingInsights(txs, INSIGHTS_MONTH);
  const header = pageHeader('Spending insights', 'Net spend by category for October 2026. Refunds reduce their category.', pluralize(count, 'transaction'));
  if (count === 0) {
    return html`${header}<section class="activity"><p class="empty">No transactions in October 2026.</p></section>`;
  }
  const history = previousMonths(INSIGHTS_MONTH, HISTORY_MONTHS);
  const historyLabel = `${formatMonth(history[0])}–${formatMonth(history[history.length - 1])}`;
  const averages = categoryAverages(txs, history);
  const spending = categories.filter(c => c.netCents > 0);
  const spendCents = spending.reduce((sum, c) => sum + c.netCents, 0);
  const monthTxs = filterTransactions(txs).filter(t => t.date.slice(0, 7) === INSIGHTS_MONTH);

  const total = html`<section class="stat"><div><div class="eyebrow">TOTAL NET SPEND</div><div class="balance">${money(totalCents / 100)}</div><p>${pluralize(count, 'transaction')} in October 2026.</p></div></section>`;
  const byCategory = html`<section class="activity" id="spend-categories" aria-label="Spending by category"><div class="heading"><h2>By category</h2><button type="button" class="link-button clear-filter" hidden>Show all</button></div>
  ${spendBar(spending, spendCents)}
  <div class="cat-grid">${categories.map(c => categoryCard(c, averages.get(c.category) ?? 0, spendCents, historyLabel))}</div></section>`;
  const list = html`<section class="activity" id="spend-transactions"><div class="heading"><h2>October transactions</h2><span class="result-count" aria-live="polite">${pluralize(monthTxs.length, 'transaction')}</span></div>
  ${transactionList(monthTxs, accountNameLookup(accounts), today)}</section>`;
  return html`${header}${total}${byCategory}${list}`;
}

