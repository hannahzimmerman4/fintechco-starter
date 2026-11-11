const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatUsd = (n: number): string => usd.format(n);

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, c => HTML_ESCAPES[c]);
