import { describe, expect, it } from 'vitest';
import { accounts, type Account } from '../src/accounts';
import { html } from '../src/html';
import { transactions, type Transaction } from '../src/transactions';
import { renderAccounts } from '../src/views/accounts';
import { renderShell } from '../src/views/layout';
import { renderOverview } from '../src/views/overview';
import { renderTransactions, resolveFilter } from '../src/views/transactions';

const evil: Transaction = { id: 'x1', accountId: 'cc', date: '2026-11-10', merchant: '<script>alert(1)</script>', category: '<b>c</b>', amount: 1 };
const evilAccount: Account = { ...accounts[2], name: '"><img src=x onerror=alert(1)>' };

describe('renderShell', () => {
  it('marks only the active route and keeps Insights as coming soon', () => {
    const out = renderShell('accounts', html`<p>body</p>`).value;
    expect(out).toContain('<a class="navitem active" href="#/accounts" aria-current="page">Accounts</a>');
    expect(out.match(/aria-current/g)).toHaveLength(1);
    expect(out).toContain('Insights · coming soon');
    expect(out).toContain('<p>body</p>');
  });
});

describe('renderOverview', () => {
  const out = renderOverview(accounts, transactions).value;
  it('shows calculated balances rather than a hard-coded figure', () => {
    expect(out).not.toContain('$12,840.32');
    expect(out).toContain('NET POSITION');
    expect(out.match(/class="account-card"/g)).toHaveLength(accounts.length);
  });
  it('lists the six most recent transactions, newest first', () => {
    expect(out.match(/class="tx"/g)).toHaveLength(6);
    expect(out.indexOf('Greenleaf Market')).toBeLessThan(out.indexOf('Skyway Air'));
  });
  it('shows refunds as credits', () => {
    expect(out).toContain('<b class="credit">+$120.00</b>');
  });
  it('escapes merchant, category and account names', () => {
    const unsafe = renderOverview([accounts[0], accounts[1], evilAccount], [evil]).value;
    expect(unsafe).not.toContain('<script>');
    expect(unsafe).not.toContain('<img');
    expect(unsafe).toContain('&lt;script&gt;');
  });
});

describe('renderAccounts', () => {
  it('lists each account with a link to its transactions', () => {
    const out = renderAccounts(accounts, transactions).value;
    for (const a of accounts) expect(out).toContain(`href="#/transactions?account=${a.id}"`);
    expect(out).toContain('Balance owed');
  });
});

describe('renderTransactions', () => {
  it('renders every transaction by default with a count', () => {
    const out = renderTransactions(accounts, transactions, {}).value;
    expect(out).toContain(`${transactions.length} transactions`);
  });
  it('preselects the filtered account and escapes the search value', () => {
    const out = renderTransactions(accounts, transactions, { accountId: 'sav', query: '"><x' }).value;
    expect(out).toContain('<option value="sav" selected>');
    expect(out).toContain('value="&quot;&gt;&lt;x"');
    expect(out).toContain('No transactions match your search.');
  });
});

describe('resolveFilter', () => {
  it('drops unknown accounts and blank queries', () => {
    expect(resolveFilter('  ', 'nope', accounts)).toEqual({ query: undefined, accountId: undefined });
    expect(resolveFilter(' metro ', 'cc', accounts)).toEqual({ query: 'metro', accountId: 'cc' });
  });
});
