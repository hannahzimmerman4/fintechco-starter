import { describe, expect, it } from 'vitest';
import { summarizeMonth, type MonthlyInsights } from '../src/insights';
import { bindViewSwitcher, renderInsightsView } from '../src/insightsView';
import { escapeHtml } from '../src/format';
import { transactions } from '../src/transactions';

const summary = (categories: MonthlyInsights['categories']): MonthlyInsights => ({
  month: '2026-10',
  categories,
  total: categories.reduce((s, c) => s + Math.round(c.total * 100), 0) / 100,
  transactionCount: categories.reduce((s, c) => s + c.transactionCount, 0)
});

const widths = (html: string) => [...html.matchAll(/class="bar" style="width:([^%]+)%"/g)].map(m => Number(m[1]));

describe('renderInsightsView — starter data (October 2026)', () => {
  const html = renderInsightsView(summarizeMonth(transactions, '2026-10'), 'October 2026');

  it('shows the net total and transaction count', () => {
    expect(html).toContain('<div class="balance">$223.09</div>');
    expect(html).toContain('<div class="balance">7</div>');
    expect(html).toContain('NET SPEND · OCTOBER 2026');
  });

  it('shows each category with its amount and count, in order', () => {
    const rows = [...html.matchAll(/<strong>([^<]+)<\/strong><small>([^<]+)<\/small>.*?<b>([^<]+)<\/b>/g)].map(m => [m[1], m[2], m[3]]);
    expect(rows).toEqual([
      ['Groceries', '2 transactions', '$133.99'],
      ['Transport', '2 transactions', '$49.00'],
      ['Dining', '2 transactions', '$23.90'],
      ['Uncategorized', '1 transaction', '$16.20']
    ]);
  });

  it('scales bars relative to the largest category', () => {
    const w = widths(html);
    expect(w).toHaveLength(4);
    expect(w[0]).toBe(100);
    expect(w[1]).toBeCloseTo((49 / 133.99) * 100, 6);
    expect(w[2]).toBeCloseTo((23.9 / 133.99) * 100, 6);
    expect(w[3]).toBeCloseTo((16.2 / 133.99) * 100, 6);
  });

  it('is hidden by default and exposes the panel hook used by the view switcher', () => {
    expect(html.startsWith('<main data-view-panel="insights" hidden>')).toBe(true);
  });
});

describe('renderInsightsView — escaping', () => {
  const evil = `<img src=x onerror="alert('x')"> & Co`;
  const html = renderInsightsView(summary([{ category: evil, total: 10, transactionCount: 1 }]), 'October 2026');

  it('escapes category names in text and in the title attribute', () => {
    expect(html).not.toContain('<img');
    expect(html).toContain(`<strong>${escapeHtml(evil)}</strong>`);
    expect(html).toContain(`title="${escapeHtml(evil)}: $10.00`);
    expect(escapeHtml(evil)).toBe('&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; Co');
  });

  it('escapes the month label', () => {
    expect(renderInsightsView(summary([]), '<b>Oct</b>')).not.toContain('<b>Oct</b>');
  });
});

describe('renderInsightsView — zero and negative category totals', () => {
  const html = renderInsightsView(summary([
    { category: 'Dining', total: 20, transactionCount: 1 },
    { category: 'Even', total: 0, transactionCount: 2 },
    { category: 'Returns', total: -4.5, transactionCount: 1 }
  ]), 'October 2026');

  it('renders 0% bars for zero and negative totals, never negative widths', () => {
    expect(widths(html)).toEqual([100, 0, 0]);
    expect(html).not.toMatch(/width:-|width:NaN|width:Infinity/);
  });

  it('shows the negative amount and labels it as a net refund', () => {
    expect(html).toContain('<b>-$4.50</b>');
    expect(html).toContain('1 transaction · net refund');
    expect(html).not.toContain('2 transactions · net refund');
  });

  it('renders 0% bars when every category is zero or negative', () => {
    const allNegative = renderInsightsView(summary([{ category: 'Returns', total: -10, transactionCount: 1 }]), 'October 2026');
    expect(widths(allNegative)).toEqual([0]);
    expect(allNegative).toContain('<div class="balance">-$10.00</div>');
  });
});

describe('renderInsightsView — empty state', () => {
  it('shows a message and no bars when the month has no transactions', () => {
    const html = renderInsightsView(summarizeMonth(transactions, '2026-03'), 'March 2026');
    expect(html).toContain('<p class="empty">No transactions in March 2026.</p>');
    expect(html).toContain('<div class="balance">$0.00</div>');
    expect(html).toContain('<div class="balance">0</div>');
    expect(widths(html)).toEqual([]);
  });
});

// Minimal stand-ins for the DOM members bindViewSwitcher uses. No DOM library required.
class FakeElement {
  hidden = false;
  private classes: Set<string>;
  private attrs = new Map<string, string>();
  private listeners: Array<() => void> = [];
  classList = {
    toggle: (c: string, force?: boolean) => { const on = force ?? !this.classes.has(c); if (on) this.classes.add(c); else this.classes.delete(c); return on; },
    contains: (c: string) => this.classes.has(c)
  };
  constructor(public dataset: Record<string, string>, classes: string[] = [], hidden = false) {
    this.classes = new Set(classes);
    this.hidden = hidden;
  }
  setAttribute(k: string, v: string) { this.attrs.set(k, v); }
  removeAttribute(k: string) { this.attrs.delete(k); }
  getAttribute(k: string) { return this.attrs.get(k) ?? null; }
  addEventListener(type: string, fn: () => void) { if (type === 'click') this.listeners.push(fn); }
  click() { this.listeners.forEach(fn => fn()); }
}

const setup = () => {
  const overviewBtn = new FakeElement({ view: 'overview' }, ['navitem', 'active']);
  overviewBtn.setAttribute('aria-current', 'page');
  const insightsBtn = new FakeElement({ view: 'insights' }, ['navitem']);
  const overview = new FakeElement({ viewPanel: 'overview' });
  const insights = new FakeElement({ viewPanel: 'insights' }, [], true);
  const root = {
    querySelectorAll: (sel: string) =>
      sel === '[data-view-panel]' ? [overview, insights] : sel === 'button[data-view]' ? [overviewBtn, insightsBtn] : []
  } as unknown as ParentNode;
  bindViewSwitcher(root);
  return { overviewBtn, insightsBtn, overview, insights };
};

describe('bindViewSwitcher', () => {
  it('starts on Overview with Insights hidden (markup default, untouched by binding)', () => {
    const { overview, insights, overviewBtn } = setup();
    expect(overview.hidden).toBe(false);
    expect(insights.hidden).toBe(true);
    expect(overviewBtn.getAttribute('aria-current')).toBe('page');
  });

  it('clicking Spending insights shows Insights, hides Overview, and moves the active state', () => {
    const { overview, insights, overviewBtn, insightsBtn } = setup();
    insightsBtn.click();
    expect(insights.hidden).toBe(false);
    expect(overview.hidden).toBe(true);
    expect(insightsBtn.classList.contains('active')).toBe(true);
    expect(insightsBtn.getAttribute('aria-current')).toBe('page');
    expect(overviewBtn.classList.contains('active')).toBe(false);
    expect(overviewBtn.getAttribute('aria-current')).toBeNull();
  });

  it('clicking Overview switches back', () => {
    const { overview, insights, overviewBtn, insightsBtn } = setup();
    insightsBtn.click();
    overviewBtn.click();
    expect(overview.hidden).toBe(false);
    expect(insights.hidden).toBe(true);
    expect(overviewBtn.classList.contains('active')).toBe(true);
    expect(overviewBtn.getAttribute('aria-current')).toBe('page');
    expect(insightsBtn.classList.contains('active')).toBe(false);
    expect(insightsBtn.getAttribute('aria-current')).toBeNull();
  });
});
