const SAFE = Symbol('SafeHtml');

/** HTML produced by the `html` template, with every interpolated value already escaped. */
export interface SafeHtml {
  readonly [SAFE]: true;
  readonly value: string;
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, c => ESCAPES[c]);

const isSafe = (v: unknown): v is SafeHtml => typeof v === 'object' && v !== null && SAFE in v;

const renderValue = (v: unknown): string => {
  if (v === null || v === undefined || v === false) return '';
  if (Array.isArray(v)) return v.map(renderValue).join('');
  if (isSafe(v)) return v.value;
  return escapeHtml(String(v));
};

/**
 * Tagged template for building markup. Interpolated values are HTML-escaped unless they are
 * themselves `html` results, so data can never inject markup. Arrays are joined; null,
 * undefined and false render as nothing.
 *
 *   html`<li>${merchant}</li>`          // merchant is escaped
 *   html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += renderValue(values[i]) + strings[i + 1];
  return { [SAFE]: true, value: out };
}
