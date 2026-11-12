import './style.css';
import { accounts } from './accounts';
import { isoDay } from './format';
import type { SafeHtml } from './html';
import { bindCategoryFilter, bindDrawer, bindPrivacy, syncPrivacy } from './interactions';
import { parseRoute, routeHref, type Route } from './router';
import { transactions } from './transactions';
import { renderAccounts } from './views/accounts';
import { renderInsights } from './views/insights';
import { renderShell } from './views/layout';
import { renderOverview } from './views/overview';
import { renderTransactionResults, renderTransactions, resolveFilter } from './views/transactions';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App element missing');

/** The viewer's calendar day, for Today / Yesterday headers. `npm run demo` pins it so rehearsals look identical. */
const today = import.meta.env.VITE_DEMO_TODAY || isoDay(new Date());

function renderView(route: Route): SafeHtml {
  switch (route.name) {
    case 'accounts':
      return renderAccounts(accounts, transactions);
    case 'transactions':
      return renderTransactions(accounts, transactions, resolveFilter(route.params.get('q'), route.params.get('account'), accounts), today);
    case 'insights':
      return renderInsights(accounts, transactions, today, route.params.get('month'));
    case 'overview':
      return renderOverview(accounts, transactions, today);
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
    results.innerHTML = renderTransactionResults(accounts, transactions, filter, today).value;
    history.replaceState(null, '', routeHref('transactions', { q: filter.query, account: filter.accountId }));
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', e => { e.preventDefault(); update(); });
}

function render(): void {
  const route = parseRoute(location.hash);
  app!.innerHTML = renderShell(route.name, renderView(route), import.meta.env.VITE_BUILD_SHA || undefined).value;
  app!.querySelector<HTMLElement>('.navitem.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  syncPrivacy(app!);
  if (route.name === 'transactions') bindTransactionFilters(app!);
  if (route.name === 'insights') bindCategoryFilter(app!);
}

bindPrivacy(app);
bindDrawer(app, accounts, transactions);
window.addEventListener('hashchange', render);
render();
