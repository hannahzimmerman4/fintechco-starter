import type { Account } from './accounts';
import { pluralize } from './format';
import type { Transaction } from './transactions';
import { transactionDetail } from './views/components';

/**
 * Tapping a transaction row opens the detail drawer; clicking the backdrop closes it.
 * Bound once on the app root; the dialog is looked up per click because each render replaces it.
 */
export function bindDrawer(root: HTMLElement, accounts: readonly Account[], txs: readonly Transaction[]): void {
  root.addEventListener('click', e => {
    const target = e.target as Element;
    if (target instanceof HTMLDialogElement && target.id === 'tx-drawer') {
      target.close();
      return;
    }
    const row = target.closest<HTMLElement>('button.tx-row[data-tx]');
    const t = row && txs.find(x => x.id === row.dataset.tx);
    const dialog = root.querySelector<HTMLDialogElement>('#tx-drawer');
    if (!t || !dialog) return;
    dialog.innerHTML = transactionDetail(t, accounts.find(a => a.id === t.accountId)).value;
    dialog.showModal();
  });
}

/** The eye toggle blurs every `.money` figure. State lives on the app root so it survives route changes, but not reloads. */
export function syncPrivacy(root: HTMLElement): void {
  const on = root.classList.contains('private');
  root.querySelectorAll<HTMLButtonElement>('.privacy-toggle').forEach(b => {
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Show amounts' : 'Hide amounts');
  });
}

export function bindPrivacy(root: HTMLElement): void {
  root.addEventListener('click', e => {
    if (!(e.target as Element).closest('.privacy-toggle')) return;
    root.classList.toggle('private');
    syncPrivacy(root);
  });
}

/** Insights: a category card filters the October list and highlights its bar segment; tapping it again clears. */
export function bindCategoryFilter(root: HTMLElement): void {
  const cats = root.querySelector<HTMLElement>('#spend-categories');
  const list = root.querySelector<HTMLElement>('#spend-transactions');
  if (!cats || !list) return;
  const clear = cats.querySelector<HTMLButtonElement>('.clear-filter');
  const count = list.querySelector<HTMLElement>('.result-count');
  let selected: string | null = null;

  const apply = () => {
    cats.classList.toggle('filtered', selected !== null);
    cats.querySelectorAll<HTMLElement>('.cat-card').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.category === selected)));
    cats.querySelectorAll<HTMLElement>('.seg').forEach(s => s.classList.toggle('active', s.dataset.category === selected));
    let shown = 0;
    list.querySelectorAll<HTMLElement>('.tx-group').forEach(g => {
      let groupShown = 0;
      g.querySelectorAll<HTMLElement>('.tx-item').forEach(item => {
        const visible = selected === null || item.dataset.category === selected;
        item.classList.toggle('is-hidden', !visible);
        item.querySelector('button')!.tabIndex = visible ? 0 : -1;
        if (visible) groupShown++;
      });
      g.classList.toggle('is-hidden', groupShown === 0);
      shown += groupShown;
    });
    if (count) count.textContent = pluralize(shown, 'transaction');
    if (clear) clear.hidden = selected === null;
  };

  cats.addEventListener('click', e => {
    const target = e.target as Element;
    if (target.closest('.clear-filter')) selected = null;
    else {
      const card = target.closest<HTMLElement>('.cat-card');
      if (!card) return;
      selected = card.dataset.category === selected ? null : card.dataset.category ?? null;
    }
    apply();
  });
}
