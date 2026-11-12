import type { Account } from '../accounts';
import { html, type SafeHtml } from '../html';
import { netPosition } from '../ledger';
import { routeHref } from '../router';
import { filterTransactions } from '../transactionSearch';
import type { Transaction } from '../transactions';
import { accountCard, accountNameLookup, heroMoney, pageHeader, privacyToggle, transactionList } from './components';

const RECENT_COUNT = 6;

export function renderOverview(accounts: readonly Account[], txs: readonly Transaction[], today: string): SafeHtml {
  const name = accountNameLookup(accounts);
  const recent = filterTransactions(txs).slice(0, RECENT_COUNT);
  return html`${pageHeader('Account overview', "Welcome back. Here's a summary of your accounts.", 'Sample account')}
  <section class="stat"><div><div class="eyebrow">NET POSITION</div><div class="balance-row"><div class="balance">${heroMoney(netPosition(accounts, txs))}</div>${privacyToggle()}</div><p>Deposits minus credit card balance. Balances are simulated for this demo.</p></div><div class="graphic" aria-hidden="true">↗</div></section>
  <section class="account-grid" aria-label="Accounts">${accounts.map(a => accountCard(a, txs))}</section>
  <section class="activity"><div class="heading"><h2>Recent transactions</h2><a href="${routeHref('transactions')}">View all</a></div>${transactionList(recent, name, today)}</section>`;
}
