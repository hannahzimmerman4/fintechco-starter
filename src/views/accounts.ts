import { ACCOUNT_TYPE_LABEL, type Account } from '../accounts';
import { formatDate, pluralize } from '../format';
import { html, type SafeHtml } from '../html';
import { accountBalance } from '../ledger';
import { routeHref } from '../router';
import type { Transaction } from '../transactions';
import { money, pageHeader } from './components';

function accountRow(a: Account, txs: readonly Transaction[]): SafeHtml {
  const count = txs.filter(t => t.accountId === a.id).length;
  const label = a.type === 'credit' ? 'Balance owed' : 'Available';
  return html`<div class="tx account-row"><div><strong>${a.name}</strong><small>${ACCOUNT_TYPE_LABEL[a.type]} •• ${a.mask} · Opening balance ${money(a.openingBalance)} on ${formatDate(a.openingDate)} · ${pluralize(count, 'transaction')}</small></div><div class="account-row-side"><small>${label}</small><b>${money(accountBalance(a, txs))}</b><a href="${routeHref('transactions', { account: a.id })}">View transactions</a></div></div>`;
}

export function renderAccounts(accounts: readonly Account[], txs: readonly Transaction[]): SafeHtml {
  return html`${pageHeader('Accounts', 'Balances are calculated from each opening balance and every posted transaction.', pluralize(accounts.length, 'account'))}
  <section class="activity"><div class="rows">${accounts.map(a => accountRow(a, txs))}</div></section>`;
}
