import { describe, expect, it } from 'vitest';
import type { Account } from '../src/accounts';
import { accountBalance, netPosition, toCents } from '../src/ledger';
import type { Transaction } from '../src/transactions';

const checking: Account = { id: 'chk', name: 'Checking', type: 'checking', mask: '0001', openingBalance: 100, openingDate: '2026-08-01' };
const savings: Account = { id: 'sav', name: 'Savings', type: 'savings', mask: '0002', openingBalance: 500, openingDate: '2026-08-01' };
const card: Account = { id: 'cc', name: 'Card', type: 'credit', mask: '0003', openingBalance: 20, openingDate: '2026-08-01' };

let n = 0;
const tx = (accountId: string, amount: number): Transaction => ({ id: `t${++n}`, accountId, date: '2026-10-01', merchant: 'M', amount });

describe('toCents', () => {
  it('converts whole-cent amounts exactly', () => {
    expect(toCents(87.24)).toBe(8724);
    expect(toCents(-5)).toBe(-500);
    expect(toCents(0.3)).toBe(30);
  });
  it('rejects fractional cents and non-finite values', () => {
    expect(() => toCents(10.005)).toThrow(/whole cents/);
    expect(() => toCents(NaN)).toThrow();
    expect(() => toCents(Infinity)).toThrow();
  });
});

describe('accountBalance', () => {
  it('subtracts spending and adds refunds for deposit accounts', () => {
    expect(accountBalance(checking, [tx('chk', 30.1), tx('chk', -5.05)])).toBe(74.95);
  });
  it('adds spending and subtracts refunds for credit cards (amount owed)', () => {
    expect(accountBalance(card, [tx('cc', 30.1), tx('cc', -5.05)])).toBe(45.05);
  });
  it('ignores other accounts', () => {
    expect(accountBalance(savings, [tx('chk', 30), tx('cc', 10)])).toBe(500);
  });
  it('avoids floating-point drift across many small amounts', () => {
    const txs = Array.from({ length: 10 }, () => tx('chk', 0.1));
    expect(accountBalance(checking, txs)).toBe(99);
  });
});

describe('netPosition', () => {
  it('is deposit balances minus credit balances owed', () => {
    const txs = [tx('chk', 10), tx('cc', 15)];
    expect(netPosition([checking, savings, card], txs)).toBe(90 + 500 - 35);
  });
  it('is zero with no accounts', () => {
    expect(netPosition([], [])).toBe(0);
  });
});
