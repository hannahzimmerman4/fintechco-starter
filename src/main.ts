import './style.css';
import { accounts } from './accounts';
import type { SafeHtml } from './html';
import { parseRoute, routeHref, type Route } from './router';
import { transactions } from './transactions';
import { renderAccounts } from './views/accounts';
import { renderShell } from './views/layout';
import { renderOverview } from './views/overview';
import { renderTransactionResults, renderTransactions, resolveFilter } from './views/transactions';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App element missing');

function renderView(route: Route): SafeHtml {
  switch (route.name) {
    case 'accounts':
      return renderAccounts(accounts, transactions);
    case 'transactions':
      return renderTransactions(accounts, transactions, resolveFilter(route.params.get('q'), route.params.get('account'), accounts));
    case 'overview':
      return renderOverview(accounts, transactions);
  }
}

/** Live filtering: re-render only the results so the search box keeps focus, and keep the URL shareable. */
function bindTransactionFilters(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('form.filters');
  const results = root.querySelector<HTMLElement>('#tx-results');
  if (!form || !results) return;
  const update = () => {
    const data = new FormData(form);
    const filter = resolveFilter(String(data.get('q') ?? ''), String(data.get('account') ?? ''), accounts);
    results.innerHTML = renderTransactionResults(accounts, transactions, filter).value;
    history.replaceState(null, '', routeHref('transactions', { q: filter.query, account: filter.accountId }));
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', e => { e.preventDefault(); update(); });
}

function render(): void {
  const route = parseRoute(location.hash);
  app!.innerHTML = renderShell(route.name, renderView(route)).value;
  if (route.name === 'transactions') bindTransactionFilters(app!);
}

window.addEventListener('hashchange', render);
render();
