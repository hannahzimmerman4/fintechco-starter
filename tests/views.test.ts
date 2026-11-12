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

describe('renderInsights month selector', () => {
  const octDefault = renderInsights(accounts, transactions, TODAY).value;
  it('shows October when no month is given, the same as asking for October', () => {
    expect(renderInsights(accounts, transactions, TODAY, null).value).toBe(octDefault);
    expect(renderInsights(accounts, transactions, TODAY, '2026-10').value).toBe(octDefault);
    expect(octDefault).not.toContain('class="notice"');
  });
  it('lists every month with data and marks the one shown', () => {
    expect(octDefault).toContain('<nav class="month-picker" aria-label="Choose month">');
    expect(octDefault).toContain('<a class="month-chip" href="#/insights?month=2026-08">Aug 2026</a>');
    expect(octDefault).toContain('<a class="month-chip" href="#/insights?month=2026-11">Nov 2026</a>');
    expect(octDefault).toContain('<a class="month-chip active" href="#/insights" aria-current="page">Oct 2026</a>');
    expect(octDefault.match(/class="month-chip/g)).toHaveLength(4);
  });
  it('follows a valid month throughout the page', () => {
    const sep = renderInsights(accounts, transactions, TODAY, '2026-09').value;
    expect(sep).toContain('Net spend by category for September 2026.');
    expect(sep).toContain('<div class="balance"><span class="money">$2,507.11</span></div><p>11 transactions in September 2026.</p>');
    expect(sep).toContain('<h2>September transactions</h2><span class="result-count" aria-live="polite">11 transactions</span>');
    expect(sep).toContain('Aug avg <span class="money">$1,850.00</span>');
    expect(sep).not.toContain('Jul');
    expect(sep).toContain('<a class="month-chip active" href="#/insights?month=2026-09" aria-current="page">Sep 2026</a>');
    expect(sep).not.toContain('October');
  });
  it('compares only with months the data covers', () => {
    const aug = renderInsights(accounts, transactions, TODAY, '2026-08').value;
    expect(aug).toContain('No earlier months to compare');
    expect(aug).not.toContain(' avg ');
    expect(aug).not.toContain('micro-avg');
  });
  it('keeps the Sep 30 / Oct 1 boundary', () => {
    const sep = renderInsights(accounts, transactions, TODAY, '2026-09').value;
    expect(sep).toContain('data-tx="tx-30"');
    expect(sep).not.toContain('data-tx="tx-31"');
    expect(octDefault).toContain('data-tx="tx-31"');
    expect(octDefault).not.toContain('data-tx="tx-30"');
  });
  it('rejects an unsupported month visibly and shows October', () => {
    for (const bad of ['2026-13', '2026-1', 'abc', '2026-07']) {
      const out = renderInsights(accounts, transactions, TODAY, bad).value;
      expect(out).toContain(`<p class="notice" role="status">${bad} isn’t available. Showing October 2026.</p>`);
      expect(out).toContain('13 transactions in October 2026.');
    }
  });
  it('escapes the rejected value', () => {
    const out = renderInsights(accounts, transactions, TODAY, '<img src=x onerror=alert(1)>').value;
    expect(out).not.toContain('<img src=x');
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt; isn’t available.');
  });
  it('hides the selector when there is at most one month', () => {
    expect(renderInsights(accounts, [], TODAY).value).not.toContain('month-picker');
  });
});
