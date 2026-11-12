import type { Account } from '../accounts';
import { pluralize } from '../format';
import { html, type SafeHtml } from '../html';
import { filterTransactions, type TransactionFilter } from '../transactionSearch';
import type { Transaction } from '../transactions';
import { accountNameLookup, pageHeader, transactionList } from './components';

/** Turn untrusted URL/form values into a filter; unknown account ids are ignored. */
export function resolveFilter(query: string | null, accountId: string | null, accounts: readonly Account[]): TransactionFilter {
  return {
    query: query?.trim() || undefined,
    accountId: accounts.some(a => a.id === accountId) ? (accountId as string) : undefined,
  };
}

export function renderTransactionResults(accounts: readonly Account[], txs: readonly Transaction[], filter: TransactionFilter, today: string): SafeHtml {
  const name = accountNameLookup(accounts);
  const rows = filterTransactions(txs, filter);
  const list = rows.length
    ? transactionList(rows, name, today)
    : html`<p class="empty">No transactions match your search.</p>`;
  return html`<p class="result-count" aria-live="polite">${pluralize(rows.length, 'transaction')}</p>${list}`;
}

export function renderTransactions(accounts: readonly Account[], txs: readonly Transaction[], filter: TransactionFilter, today: string): SafeHtml {
  const options = accounts.map(a =>
    a.id === filter.accountId
      ? html`<option value="${a.id}" selected>${a.name}</option>`
      : html`<option value="${a.id}">${a.name}</option>`,
  );
  return html`${pageHeader('Transactions', 'Search by merchant or category, or filter by account.', 'All activity')}
  <section class="activity"><form class="filters" role="search"><label>Search<input type="search" name="q" value="${filter.query ?? ''}" placeholder="Merchant or category" autocomplete="off"/></label><label>Account<select name="account"><option value="">All accounts</option>${options}</select></label></form>
  <div id="tx-results">${renderTransactionResults(accounts, txs, filter, today)}</div></section>`;
}
