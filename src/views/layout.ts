import { html, type SafeHtml } from '../html';
import { routeHref, type RouteName } from '../router';

const NAV: readonly { name: RouteName; label: string }[] = [
  { name: 'overview', label: 'Overview' },
  { name: 'accounts', label: 'Accounts' },
  { name: 'transactions', label: 'Transactions' },
];

/** App frame: navigation (sidebar on desktop, top bar on mobile) around the active view. */
export function renderShell(active: RouteName, content: SafeHtml): SafeHtml {
  const links = NAV.map(n =>
    n.name === active
      ? html`<a class="navitem active" href="${routeHref(n.name)}" aria-current="page">${n.label}</a>`
      : html`<a class="navitem" href="${routeHref(n.name)}">${n.label}</a>`,
  );
  return html`<div class="shell"><nav class="nav" aria-label="Main"><div class="logo">F<span>•</span></div>${links}<span class="navitem muted" aria-disabled="true">Insights · coming soon</span><div class="foot">DEMO ACCOUNT<br/>Synthetic transactions only</div></nav>
  <main>${content}</main></div>`;
}
