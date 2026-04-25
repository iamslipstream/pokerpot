// Greedy debt simplification: matches biggest creditor with biggest debtor
// until everyone is at zero. Produces near-minimal number of transactions.

export type Balance = {
  playerId: string;
  name: string;
  net: number; // cents; positive = creditor, negative = debtor
};

export type Transaction = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number; // cents, always positive
};

export function settle(balances: Balance[]): Transaction[] {
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.net - b.net);

  const txns: Transaction[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const amount = Math.min(c.net, -d.net);
    if (amount > 0) {
      txns.push({
        fromId: d.playerId,
        fromName: d.name,
        toId: c.playerId,
        toName: c.name,
        amount,
      });
      c.net -= amount;
      d.net += amount;
    }
    if (c.net === 0) i++;
    if (d.net === 0) j++;
  }
  return txns;
}
