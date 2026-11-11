import { describe, expect, it } from 'vitest';
import { parseRoute, routeHref } from '../src/router';

describe('parseRoute', () => {
  it('defaults to overview for empty or unknown hashes', () => {
    expect(parseRoute('').name).toBe('overview');
    expect(parseRoute('#/').name).toBe('overview');
    expect(parseRoute('#/payments').name).toBe('overview');
  });
  it('reads the route name and query params', () => {
    const r = parseRoute('#/transactions?account=cc&q=cafe%20olive');
    expect(r.name).toBe('transactions');
    expect(r.params.get('account')).toBe('cc');
    expect(r.params.get('q')).toBe('cafe olive');
  });
  it('accepts hashes without the leading slash', () => {
    expect(parseRoute('#accounts').name).toBe('accounts');
  });
});

describe('routeHref', () => {
  it('omits empty params', () => {
    expect(routeHref('overview')).toBe('#/overview');
    expect(routeHref('transactions', { q: '', account: undefined })).toBe('#/transactions');
  });
  it('encodes params and round-trips through parseRoute', () => {
    const href = routeHref('transactions', { q: 'a&b <c>', account: 'cc' });
    const r = parseRoute(href);
    expect(r.params.get('q')).toBe('a&b <c>');
    expect(r.params.get('account')).toBe('cc');
  });
});
