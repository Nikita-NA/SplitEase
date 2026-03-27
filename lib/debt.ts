export type SimplifyInput = { userId: string; balance: number };

export type SimplifyOutput = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

/**
 * Simplifies debts by greedily matching largest creditors with largest debtors.
 * - balance > 0 means the user is owed money (creditor)
 * - balance < 0 means the user owes money (debtor)
 */
export function simplifyDebts(members: SimplifyInput[]): SimplifyOutput[] {
  const EPS = 1e-9;

  const creditors = members
    .filter((m) => m.balance > EPS)
    .map((m) => ({ userId: m.userId, balance: m.balance }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = members
    .filter((m) => m.balance < -EPS)
    .map((m) => ({ userId: m.userId, balance: m.balance }))
    // most negative first (largest absolute debt)
    .sort((a, b) => a.balance - b.balance);

  const result: SimplifyOutput[] = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j]; // debtor.balance is negative

    const creditorRemaining = creditor.balance;
    const debtorRemaining = -debtor.balance;

    const amount = Math.min(creditorRemaining, debtorRemaining);
    if (amount > EPS) {
      // debtor owes creditor
      result.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
      });
    }

    creditor.balance -= amount;
    debtor.balance += amount; // since debtor.balance is negative

    if (creditor.balance <= EPS) i++;
    if (debtors[j] && debtors[j].balance >= -EPS) j++;
  }

  return result;
}

// Unit test cases (expected results):
//
// 1) Simple one-creditor, two-debtors
// simplifyDebts([
//   { userId: "A", balance: 10 },
//   { userId: "B", balance: -5 },
//   { userId: "C", balance: -5 },
// ])
// Expected:
// [
//   { fromUserId: "B", toUserId: "A", amount: 5 },
//   { fromUserId: "C", toUserId: "A", amount: 5 },
// ]
//
// 2) One-debtor, two-creditors
// simplifyDebts([
//   { userId: "A", balance: 5 },
//   { userId: "B", balance: 5 },
//   { userId: "C", balance: -10 },
// ])
// Expected:
// [
//   { fromUserId: "C", toUserId: "A", amount: 5 },
//   { fromUserId: "C", toUserId: "B", amount: 5 },
// ]
//
// 3) Exact match
// simplifyDebts([
//   { userId: "A", balance: 7 },
//   { userId: "B", balance: -7 },
// ])
// Expected:
// [
//   { fromUserId: "B", toUserId: "A", amount: 7 },
// ]

