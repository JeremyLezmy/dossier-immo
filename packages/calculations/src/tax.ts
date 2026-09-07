import type { Dossier } from "@dossier-immo/schema";
import type { IncomePeriodResult } from "./planning";

/** Barème 2026 (revenus 2025), utilisé comme référence, jamais comme barème futur annoncé. */
export function incomeTaxAt2026Scale(taxableCents: number, parts: 1 | 2) {
  const quotient = Math.max(0, taxableCents) / parts;
  const brackets = [
    [1_160_000, 0],
    [2_957_900, 1100],
    [8_457_700, 3000],
    [18_191_700, 4100],
    [Infinity, 4500],
  ] as const;
  let previous = 0;
  let tax = 0;
  for (const [ceiling, rate] of brackets) {
    tax +=
      (Math.max(0, Math.min(quotient, ceiling) - previous) * rate) / 10_000;
    previous = ceiling;
  }
  return Math.round((tax * parts) / 100) * 100;
}

export function calculateTaxProjections(
  dossier: Dossier,
  results: readonly IncomePeriodResult[],
) {
  return dossier.budgetScenarios.flatMap((budget) => {
    const input = budget.assumptions.taxProjection;
    if (!input) return [];
    const periods = (dossier.incomePeriods ?? []).filter((period) =>
      input.incomePeriodIds.includes(period.id),
    );
    const professionalTaxableCents = [
      ...new Set(periods.map((period) => period.incomeStreamId)),
    ].reduce((sum, streamId) => {
      const related = periods.filter(
        (period) => period.incomeStreamId === streamId,
      );
      const revenue = related.reduce(
        (sum, period) =>
          sum +
          (results.find((result) => result.id === period.id)?.revenueCents ??
            0),
        0,
      );
      const proportionalAllowance = related.reduce(
        (sum, period) =>
          sum +
          Math.round(
            ((results.find((result) => result.id === period.id)?.revenueCents ??
              0) *
              (period.taxAllowanceBasisPoints ?? 0)) /
              10_000,
          ),
        0,
      );
      const minimumBncAllowance = related.every(
        (period) => period.taxAllowanceBasisPoints === 3400,
      )
        ? 30_500
        : 0;
      return (
        sum +
        Math.max(
          0,
          revenue - Math.max(minimumBncAllowance, proportionalAllowance),
        )
      );
    }, 0);
    // Hypothèse simple : frais salariaux forfaitaires de 10 %, bornes 2026, un salaire.
    const salaryDeductionCents = Math.min(
      input.annualSalaryNetTaxableCents,
      Math.max(
        50_900,
        Math.min(
          1_455_500,
          Math.round(input.annualSalaryNetTaxableCents * 0.1),
        ),
      ),
    );
    const taxableCents =
      professionalTaxableCents +
      input.annualSalaryNetTaxableCents -
      salaryDeductionCents +
      input.annualOtherTaxableCents;
    const annualTaxCents = incomeTaxAt2026Scale(taxableCents, input.parts);
    return [
      {
        budgetId: budget.id,
        label: budget.label,
        parts: input.parts,
        professionalTaxableCents,
        salaryDeductionCents,
        taxableCents,
        annualTaxCents,
        monthlyTaxCents: Math.round(annualTaxCents / 12),
        note: input.note,
      },
    ];
  });
}

export type TaxProjectionResult = ReturnType<
  typeof calculateTaxProjections
>[number];
