import { calculateReserve } from "./reserve";
import type { Dossier } from "@dossier-immo/schema";

/** Diagnostic sensitivities, not forecasts or a lender's credit decision. */
export function calculateBankReview(
  dossier: Dossier,
  projectedCents: number,
  openingCents: number,
  months: number,
  incomes: Readonly<Record<string, number>>,
  expenses: Readonly<Record<string, number>>,
  debts: Readonly<Record<string, number>>,
  mortgages: Readonly<Record<string, number>>,
  people: Readonly<Record<string, readonly { label: string; value: number }[]>>,
) {
  const central = dossier.budgetScenarios.find(
    (item) => item.kind === "central",
  )!;
  const stress = dossier.budgetScenarios.find(
    (item) => item.kind === "stress",
  )!;
  const ratio = (a: number, b: number) =>
    b > 0 ? Math.round((a / b - 1) * 10_000) : undefined;
  const largest = [...(people[central.id] ?? [])].sort(
    (a, b) => b.value - a.value,
  )[0];
  const monthlyShortfallCents = largest
    ? Math.max(
        0,
        (expenses[central.id] ?? 0) +
          (debts[central.id] ?? 0) +
          (mortgages[central.id] ?? 0) -
          (incomes[central.id] ?? 0) +
          largest.value,
      )
    : 0;
  const reserve = calculateReserve(
    dossier,
    projectedCents,
    dossier.project.contributionCents,
  );
  const freeReserveCents = reserve.freeReserveAfterPurchaseCents;
  return {
    todayAfterContributionCents:
      openingCents - dossier.project.contributionCents,
    purchaseAfterContributionCents:
      projectedCents - dossier.project.contributionCents,
    freeReserveMarginCents:
      reserve.reserveForObjectiveCents - dossier.reservePolicy.minimumCents,
    monthlyCashGrowthCents:
      months > 0
        ? Math.round((projectedCents - openingCents) / months)
        : undefined,
    stressIncomeChangeBasisPoints: ratio(
      incomes[stress.id] ?? 0,
      incomes[central.id] ?? 0,
    ),
    stressExpenseChangeBasisPoints: ratio(
      expenses[stress.id] ?? 0,
      expenses[central.id] ?? 0,
    ),
    interruption: largest
      ? {
          person: largest.label,
          months: 3,
          monthlyShortfallCents,
          reserveAfterCents: freeReserveCents - monthlyShortfallCents * 3,
        }
      : undefined,
  };
}
