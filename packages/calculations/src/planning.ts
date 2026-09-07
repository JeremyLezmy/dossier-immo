import type { Dossier, IncomePeriod } from "@dossier-immo/schema";

export interface IncomePeriodResult {
  readonly id: string;
  readonly revenueCents: number;
  readonly socialContributionsCents: number;
  readonly professionalExpensesCents: number;
  readonly economicIncomeCents: number;
  readonly taxableIncomeCents: number | undefined;
  readonly monthlyEconomicIncomeCents: number;
  readonly months: number;
  readonly unitAmountCents: number;
}

export function calculateIncomePeriod(
  dossier: Dossier,
  period: IncomePeriod,
): IncomePeriodResult {
  const stream = dossier.incomeStreams.find(
    (item) => item.id === period.incomeStreamId,
  );
  const model = dossier.professionalActivities.find(
    (item) => item.id === stream?.activityId,
  )?.compensationModel;
  const projected =
    model &&
    "projection" in model &&
    model.projection &&
    model.projection.effectiveDate <= period.startDate
      ? model.projection.amountCents
      : undefined;
  const rate =
    period.unitAmountCents ??
    projected ??
    (model?.kind === "day-rate"
      ? model.dailyRateCents
      : model?.kind === "consultation"
        ? model.consultationFeeCents
        : undefined) ??
    0;
  const revenueCents =
    period.basis === "amount"
      ? (period.amountCents ?? 0)
      : Math.round((period.units ?? 0) * rate);
  const socialContributionsCents =
    period.socialContributionsPaidCents ??
    Math.round(
      (revenueCents *
        (period.socialRateBasisPoints + period.trainingRateBasisPoints)) /
        10_000,
    );
  const professionalExpensesCents =
    period.professionalExpensesCents +
    Math.round((revenueCents * (period.expenseRateBasisPoints ?? 0)) / 10_000);
  const economicIncomeCents =
    revenueCents - socialContributionsCents - professionalExpensesCents;
  const start = period.startDate.split("-").map(Number);
  const end = period.endDate.split("-").map(Number);
  const months =
    ((end[0] ?? 0) - (start[0] ?? 0)) * 12 +
    (end[1] ?? 1) -
    (start[1] ?? 1) +
    1;
  return {
    id: period.id,
    revenueCents,
    socialContributionsCents,
    professionalExpensesCents,
    economicIncomeCents,
    taxableIncomeCents:
      period.taxAllowanceBasisPoints === undefined
        ? undefined
        : Math.max(
            0,
            revenueCents -
              Math.round(
                (revenueCents * period.taxAllowanceBasisPoints) / 10_000,
              ),
          ),
    monthlyEconomicIncomeCents: Math.round(
      economicIncomeCents / Math.max(1, months),
    ),
    months,
    unitAmountCents: rate,
  };
}

export interface CashFlowResult {
  readonly id: string;
  readonly date: string;
  readonly amountCents: number;
  readonly balanceCents: number;
}

export interface IncomeSummary {
  readonly method: "cash" | "normalized";
  readonly incomeStreamId: string;
  readonly label: string;
  readonly sourceIds: readonly string[];
  readonly revenueCents: number;
  readonly socialContributionsCents: number;
  readonly professionalExpensesCents: number;
  readonly economicIncomeCents: number;
  readonly taxableIncomeCents: number | undefined;
}

/** Observed totals, dated cash forecasts and run rates remain separate. */
export function summarizeIncomePeriods(
  dossier: Dossier,
  results: readonly IncomePeriodResult[],
): readonly IncomeSummary[] {
  const periods = dossier.incomePeriods ?? [];
  const groups: { stream: string; label: string; periods: IncomePeriod[] }[] =
    [];
  for (const stream of dossier.incomeStreams) {
    const related = periods.filter(
      (period) => period.incomeStreamId === stream.id,
    );
    const years = [
      ...new Set(
        related
          .filter((period) => period.status !== "run-rate")
          .map((period) =>
            (period.collectionDate ?? period.endDate).slice(0, 4),
          ),
      ),
    ].sort();
    for (const year of years) {
      const dated = related.filter(
        (period) =>
          period.status !== "run-rate" &&
          (period.collectionDate ?? period.endDate).startsWith(year),
      );
      const observed = dated.filter((period) => period.status === "observed");
      if (observed.length)
        groups.push({
          stream: stream.id,
          label: `${year} · réalisé`,
          periods: observed,
        });
      if (dated.some((period) => period.status !== "observed"))
        groups.push({
          stream: stream.id,
          label: `${year} · ${observed.length ? "réalisé + prévu" : "prévu"}`,
          periods: dated,
        });
    }
    for (const period of related.filter(
      (period) => period.status === "run-rate",
    ))
      groups.push({
        stream: stream.id,
        label: period.label,
        periods: [period],
      });
  }
  return groups.map((group) => {
    const normalized = group.periods.some(
      (period) => period.status !== "observed",
    );
    const values = group.periods.map((period) =>
      normalized
        ? calculateIncomePeriod(dossier, {
            ...period,
            socialContributionsPaidCents: undefined,
          })
        : results.find((result) => result.id === period.id)!,
    );
    const sum = (
      key:
        | "revenueCents"
        | "socialContributionsCents"
        | "professionalExpensesCents"
        | "economicIncomeCents",
    ) => values.reduce((total, value) => total + value[key], 0);
    return {
      method: normalized ? "normalized" : "cash",
      incomeStreamId: group.stream,
      label: group.periods.every((period) => period.status === "run-rate")
        ? group.label
        : (() => {
            const first = group.periods
              .map((period) => period.collectionDate ?? period.startDate)
              .sort()[0]!;
            const last = group.periods
              .map((period) => period.collectionDate ?? period.endDate)
              .sort()
              .at(-1)!;
            const months = [
              "janv.",
              "févr.",
              "mars",
              "avr.",
              "mai",
              "juin",
              "juil.",
              "août",
              "sept.",
              "oct.",
              "nov.",
              "déc.",
            ];
            return first.slice(5, 7) === "01" && last.slice(5, 7) === "12"
              ? group.label
              : `${group.label} (${months[Number(first.slice(5, 7)) - 1]}–${months[Number(last.slice(5, 7)) - 1]})`;
          })(),
      sourceIds: group.periods.map((period) => period.id),
      revenueCents: sum("revenueCents"),
      socialContributionsCents: sum("socialContributionsCents"),
      professionalExpensesCents: sum("professionalExpensesCents"),
      economicIncomeCents: sum("economicIncomeCents"),
      taxableIncomeCents: values.every(
        (value) => value.taxableIncomeCents !== undefined,
      )
        ? values.reduce((total, value) => total + value.taxableIncomeCents!, 0)
        : undefined,
    };
  });
}

export function calculateCashFlow(
  dossier: Dossier,
  openingCents: number,
  periods: readonly IncomePeriodResult[],
): readonly CashFlowResult[] {
  let balance = openingCents;
  return [...(dossier.cashFlowPlan?.entries ?? [])]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((entry) => {
      const amount = entry.incomePeriodId
        ? (periods.find((period) => period.id === entry.incomePeriodId)
            ?.economicIncomeCents ?? 0)
        : (entry.amountCents ?? 0);
      const amountCents = entry.direction === "income" ? amount : -amount;
      balance += amountCents;
      return {
        id: entry.id,
        date: entry.date,
        amountCents,
        balanceCents: balance,
      };
    });
}

/** The same dated ledger drives the reserve and the monthly explanation. */
export function summarizeCashFlow(
  dossier: Dossier,
  results: readonly CashFlowResult[],
  periods: readonly IncomePeriodResult[],
) {
  const months = [
    ...new Set(results.map((item) => item.date.slice(0, 7))),
  ].sort();
  return months.map((month) => {
    const rows = results.filter((item) => item.date.startsWith(month));
    let independentRevenueCents = 0;
    let netIncomeCents = 0;
    let incomeTaxCents = 0;
    let taxProvisionCents = 0;
    let otherOutflowsCents = 0;
    for (const row of rows) {
      const entry = dossier.cashFlowPlan!.entries.find(
        (item) => item.id === row.id,
      )!;
      if (entry.direction === "income") {
        netIncomeCents += row.amountCents;
        const period = dossier.incomePeriods?.find(
          (item) => item.id === entry.incomePeriodId,
        );
        if (
          period &&
          dossier.incomeStreams.some(
            (stream) =>
              stream.id === period.incomeStreamId &&
              ["self-employed", "liberal"].includes(stream.kind),
          )
        )
          independentRevenueCents +=
            periods.find((item) => item.id === period.id)?.revenueCents ?? 0;
      } else if (entry.category === "income-tax") {
        if (entry.isProvision) taxProvisionCents -= row.amountCents;
        else incomeTaxCents -= row.amountCents;
      } else otherOutflowsCents -= row.amountCents;
    }
    return {
      month,
      independentRevenueCents,
      netIncomeCents,
      incomeTaxCents,
      taxProvisionCents,
      otherOutflowsCents,
      closingCents: rows.at(-1)!.balanceCents,
    };
  });
}
