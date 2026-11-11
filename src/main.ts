import './style.css';
import { transactions } from './transactions';

const fmt = (n: number) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(n);
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App element missing');
app.innerHTML = `
  <div class="shell"><aside class="nav"><div class="logo">F<span>•</span></div><div class="navitem active">Overview</div><div class="navitem">Transactions</div><div class="navitem muted">Insights · coming soon</div><div class="foot">DEMO ACCOUNT<br/>Synthetic transactions only</div></aside>
  <main><div class="eyebrow">FINTECHCO / DIGITAL BANKING</div><header><div><h1>Account overview</h1><p>Welcome back. Here's your recent activity.</p></div><span class="pill">Sample account</span></header>
  <section class="stat"><div><div class="eyebrow">AVAILABLE BALANCE</div><div class="balance">$12,840.32</div><p>Your balances are simulated for this demo.</p></div><div class="graphic">↗</div></section>
  <section class="activity"><div class="heading"><h2>Recent transactions</h2><span>October 2026</span></div><div class="rows">${transactions.filter(t=>t.date.startsWith('2026-10')).map(t => `<div class="tx"><div><strong>${t.merchant}</strong><small>${t.date} · ${t.category ?? 'Uncategorized'}</small></div><b>${fmt(t.amount)}</b></div>`).join('')}</div></section>
  </main></div>`;
