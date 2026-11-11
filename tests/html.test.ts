import { describe, expect, it } from 'vitest';
import { formatDate, formatUsd, pluralize } from '../src/format';
import { escapeHtml, html } from '../src/html';

describe('html template', () => {
  it('escapes interpolated strings', () => {
    expect(html`<b>${'<img src=x onerror="alert(1)">'}</b>`.value).toBe('<b>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</b>');
    expect(html`<a title="${"O'Neil & Co"}">`.value).toBe('<a title="O&#39;Neil &amp; Co">');
  });
  it('does not double-escape nested html results and joins arrays', () => {
    const items = ['a<b', 'c'].map(s => html`<li>${s}</li>`);
    expect(html`<ul>${items}</ul>`.value).toBe('<ul><li>a&lt;b</li><li>c</li></ul>');
  });
  it('renders null, undefined and false as nothing, and numbers as text', () => {
    expect(html`${null}${undefined}${false}${0}`.value).toBe('0');
  });
  it('escapeHtml covers all five special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

describe('format helpers', () => {
  it('formats USD with two decimals and a sign for negatives', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
    expect(formatUsd(-5)).toBe('-$5.00');
  });
  it('formats ISO dates without timezone rollover at month boundaries', () => {
    expect(formatDate('2026-10-31')).toBe('Oct 31, 2026');
    expect(formatDate('2026-11-01')).toBe('Nov 1, 2026');
  });
  it('pluralizes', () => {
    expect(pluralize(1, 'transaction')).toBe('1 transaction');
    expect(pluralize(0, 'transaction')).toBe('0 transactions');
  });
});
