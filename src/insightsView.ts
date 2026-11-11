import { barWidthPercent, type CategoryTotal, type MonthlyInsights } from './insights';
import { escapeHtml as esc, formatUsd as fmt } from './format';

const plural = (n: number) => `${n} transaction${n === 1 ? '' : 's'}`;

const categoryRow = (c: CategoryTotal, maxPositive: number) => {
  const width = barWidthPercent(c.total, maxPositive);
  const note = c.total < 0 ? ' · net refund' : '';
  return `<div class="cat" title="${esc(c.category)}: ${fmt(c.total)} · ${plural(c.transactionCount)}"><div class="cat-label"><strong>${esc(c.category)}</strong><small>${plural(c.transactionCount)}${note}</small></div><div class="bar-track" aria-hidden="true"><div class="bar" style="width:${width}%"></div></div><b>${fmt(c.total)}</b></div>`;
};

/** HTML for the Spending insights panel. Hidden by default; bindViewSwitcher shows it. */
export function renderInsightsView(summary: MonthlyInsights, label: string): string {
  const maxPositive = Math.max(0, ...summary.categories.map(c => c.total));
  const rows = summary.categories.length
    ? summary.categories.map(c => categoryRow(c, maxPositive)).join('')
    : `<p class="empty">No transactions in ${esc(label)}.</p>`;
  return `<main data-view-panel="insights" hidden><div class="eyebrow">FINTECHCO / DIGITAL BANKING</div><header><div><h1>Spending insights</h1><p>Net spending by category. Refunds are subtracted from the category they belong to.</p></div><span class="pill">${esc(label)}</span></header>
  <section class="stat"><div><div class="eyebrow">NET SPEND · ${esc(label.toUpperCase())}</div><div class="balance">${fmt(summary.total)}</div><p>Expenses minus refunds.</p></div><div class="stat-side"><div class="eyebrow">TRANSACTIONS</div><div class="balance">${summary.transactionCount}</div><p>Refunds included.</p></div></section>
  <section class="activity"><div class="heading"><h2>Spending by category</h2><span>${esc(label)}</span></div><div class="rows">${rows}</div></section>
  </main>`;
}

/**
 * Wire nav buttons (`button[data-view]`) to panels (`[data-view-panel]`).
 * Returns the function that switches views, for programmatic use.
 */
export function bindViewSwitcher(root: ParentNode): (view: string) => void {
  const showView = (view: string) => {
    root.querySelectorAll<HTMLElement>('[data-view-panel]').forEach(p => { p.hidden = p.dataset.viewPanel !== view; });
    root.querySelectorAll<HTMLButtonElement>('button[data-view]').forEach(b => {
      const on = b.dataset.view === view;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  };
  root.querySelectorAll<HTMLButtonElement>('button[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view ?? 'overview')));
  return showView;
}
