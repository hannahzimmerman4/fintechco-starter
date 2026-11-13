import { describe, expect, it } from 'vitest';
import { accounts, type Account } from '../src/accounts';
import { html } from '../src/html';
import { transactions, type Transaction } from '../src/transactions';
import { renderAccounts } from '../src/views/accounts';
import { transactionDetail } from '../src/views/components';
import { renderInsights } from '../src/views/insights';
import { renderShell } from '../src/views/layout';
import { renderOverview } from '../src/views/overview';
import { renderTransactions, resolveFilter } from '../src/views/transactions';

const TODAY = '2026-11-11';
const evil: Transaction = { id: 'x1', accountId: 'cc', date: '2026-11-10', merchant: '<script>alert(1)</script>', category: '<b>c</b>', amount: 1 };
const evilAccount: Account = { ...accounts[2], name: '"><img src=x onerror=alert(1)>' };

describe('renderShell', () => {
  it('shows the build it was deployed from, or "local"', () => {
    expect(renderShell('overview', html``, '043ce85a9b').value).toContain('<span class="build">Build 043ce85</span>');
    expect(renderShell('overview', html``).value).toContain('<span class="build">Build local</span>');
    expect(renderShell('overview', html``, '<b>x</b>').value).not.toContain('<b>');
  });
  it('marks only the active route and links Insights', () => {
    const out = renderShell('accounts', html`<p>body</p>`).value;
    expect(out).toContain('<a class="navitem active" href="#/accounts" aria-current="page">Accounts</a>');
    expect(out.match(/aria-current/g)).toHaveLength(1);
    expect(out).toContain('<a class="navitem" href="#/insights">Insights</a>');
    expect(out).not.toContain('coming soon');
    expect(out).toContain('<p>body</p>');
  });
});

describe('renderInsights', () => {
  it('shows October totals by category', () => {
    const out = renderInsights(accounts, transactions, TODAY).value;
    expect(out).toContain('Spending insights');
    expect(out).toContain('13 transactions');
    expect(out).toContain('$2,339.48');
    expect(out).toContain('Uncategorized');
    expect(out).toContain('$1,850.00');
    expect(out.indexOf('Housing')).toBeLessThan(out.indexOf('Subscriptions'));
  });
  it('escapes category names', () => {
    const out = renderInsights(accounts, [{ ...evil, date: '2026-10-05' }], TODAY).value;
    expect(out).not.toContain('<b>c</b>');
    expect(out).toContain('&lt;b&gt;c&lt;/b&gt;');
  });
  it('shows an empty state when the month has no transactions', () => {
    const out = renderInsights(accounts, [], TODAY).value;
    expect(out).toContain('No transactions in October 2026.');
    expect(out).not.toContain('TOTAL NET SPEND');
    expect(out).not.toContain('class="stat"');
  });
  it('shows the monthly total in its own stat block', () => {
    const out = renderInsights(accounts, transactions, TODAY).value;
    expect(out).toContain('<div class="eyebrow">TOTAL NET SPEND</div><div class="balance"><span class="money">$2,339.48</span></div>');
  });
  it('shows a category that nets to a refund as a credit', () => {
    const out = renderInsights(accounts, [{ id: 'r1', accountId: 'cc', date: '2026-10-05', merchant: 'M', category: 'Books', amount: -12 }], TODAY).value;
    expect(out).toContain('<span class="money credit">+$12.00</span>');
    expect(out).toContain('Net refund');
  });
});

describe('renderOverview', () => {
  const out = renderOverview(accounts, transactions, TODAY).value;
  it('shows calculated balances rather than a hard-coded figure', () => {
    expect(out).not.toContain('$12,840.32');
    expect(out).toContain('NET POSITION');
    expect(out.match(/class="account-card"/g)).toHaveLength(accounts.length);
  });
  it('lists the six most recent transactions, newest first', () => {
    expect(out.match(/class="tx-row"/g)).toHaveLength(6);
    expect(out.indexOf('Greenleaf Market')).toBeLessThan(out.indexOf('Skyway Air'));
  });
  it('shows refunds as credits', () => {
    expect(out).toContain('<span class="money credit">+$120.00</span>');
    expect(out).toContain('<span class="money">-$12.40</span>');
  });
  it('escapes merchant, category and account names', () => {
    const unsafe = renderOverview([accounts[0], accounts[1], evilAccount], [evil], TODAY).value;
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
    const out = renderTransactions(accounts, transactions, {}, TODAY).value;
    expect(out).toContain(`${transactions.length} transactions`);
  });
  it('preselects the filtered account and escapes the search value', () => {
    const out = renderTransactions(accounts, transactions, { accountId: 'sav', query: '"><x' }, TODAY).value;
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

describe('transaction list polish', () => {
  const out = renderOverview(accounts, transactions, TODAY).value;
  it('groups rows under Today / Yesterday / date headers', () => {
    expect(out).toContain('<time datetime="2026-11-10">Yesterday</time>');
    expect(out).toContain('<time datetime="2026-11-09">Nov 9</time>');
    expect(renderOverview(accounts, transactions, '2026-11-10').value).toContain('<time datetime="2026-11-10">Today</time>');
    expect(out.match(/class="date-header"/g)).toHaveLength(6); // Nov 10, 9, 7, 5, 3, 1
  });
  it('tints each merchant icon with its category color', () => {
    expect(out).toContain('<span class="tx-icon" style="--c:#0d9488" aria-hidden="true">G</span>');
  });
  it('makes each row a button that opens its detail drawer', () => {
    expect(out).toContain('<button type="button" class="tx-row" data-tx="tx-42" aria-haspopup="dialog">');
    expect(renderShell('overview', html``).value).toContain('<dialog class="drawer" id="tx-drawer"');
  });
  it('splits hero cents and offers the privacy toggle', () => {
    expect(out).toMatch(/<span class="money hero">\$[\d,]+<span class="cents">\.\d\d<\/span><\/span>/);
    expect(out).toContain('class="icon-button privacy-toggle" aria-pressed="false"');
  });
});

describe('transactionDetail', () => {
  it('shows date, account and category, escaped', () => {
    const out = transactionDetail(evil, evilAccount).value;
    expect(out).toContain('Nov 10, 2026');
    expect(out).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt; •• 1094');
    expect(out).toContain('&lt;b&gt;c&lt;/b&gt;');
    expect(out).not.toContain('<script>');
    expect(out).toContain('PURCHASE');
  });
  it('marks refunds and handles an unknown account', () => {
    const out = transactionDetail({ ...evil, amount: -5, category: undefined }, undefined).value;
    expect(out).toContain('REFUND');
    expect(out).toContain('<span class="money credit">+$5.00</span>');
    expect(out).toContain('Unknown account');
    expect(out).toContain('Uncategorized');
  });
});

describe('renderInsights polish', () => {
  const out = renderInsights(accounts, transactions, TODAY).value;
  it('draws a segment per spending category, largest first', () => {
    expect(out.match(/class="seg"/g)).toHaveLength(8);
    expect(out).toContain('<span class="seg" data-category="Housing" style="flex-grow:185000;--c:#4f46e5"></span>');
    expect(out).toMatch(/aria-label="Share of spend: Housing \d+%/);
  });
  it('compares each category with its Aug–Sep average', () => {
    expect(out).toContain('Aug–Sep avg <span class="money">$146.28</span>');
    expect(out).toContain('Aug–Sep avg <span class="money">$1,850.00</span>');
    expect(out).toContain('data-category="Uncategorized" aria-pressed="false"');
    expect(out).toContain('No net spend in Aug–Sep');
  });
  it('lists October transactions below for filtering', () => {
    expect(out).toContain('<h2>October transactions</h2><span class="result-count" aria-live="polite">13 transactions</span>');
    expect(out.match(/class="tx-row"/g)).toHaveLength(13);
    expect(out).not.toContain('data-tx="tx-08"'); // Nov 1
  });
  it('leaves net-refund categories out of the bar', () => {
    const refundOnly = renderInsights(accounts, [{ id: 'r1', accountId: 'cc', date: '2026-10-05', merchant: 'M', category: 'Books', amount: -12 }], TODAY).value;
    expect(refundOnly).not.toContain('class="seg"');
  });
  it('escapes category names in data attributes', () => {
    const unsafe = renderInsights(accounts, [{ ...evil, date: '2026-10-05', category: '"><i>' }], TODAY).value;
    expect(unsafe).not.toContain('<i>');
    expect(unsafe).toContain('data-category="&quot;&gt;&lt;i&gt;"');
  });
});
