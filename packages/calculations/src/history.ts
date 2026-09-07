import type { Dossier } from "@dossier-immo/schema";
import { calculateIncomePeriod } from "./planning";

/** Actual collections take priority; forecasts use collection dates, never run rates. */
export function calculateTurnoverHistory(dossier: Dossier) {
  return dossier.incomeStreams.flatMap((stream) => {
    const entries = dossier.revenueHistory.filter(
      (item) =>
        item.incomeStreamId === stream.id &&
        item.observed &&
        /^\d{4}-\d{2}$/.test(item.period) &&
        item.collectedCents !== undefined,
    );
    if (!entries.length) return [];
    const observedYears = [
      ...new Set(entries.map((item) => item.period.slice(0, 4))),
    ]
      .sort()
      .slice(-2);
    const lastYear = Number(observedYears.at(-1));
    const forecasts = (dossier.incomePeriods ?? []).filter(
      (period) =>
        period.incomeStreamId === stream.id &&
        ["forecast", "invoiced"].includes(period.status) &&
        period.collectionDate &&
        Number(period.collectionDate.slice(0, 4)) <= lastYear + 1 &&
        Number(period.collectionDate.slice(0, 4)) >= Number(observedYears[0]),
    );
    const years = [
      ...new Set([
        ...observedYears,
        ...forecasts.map((period) => period.collectionDate!.slice(0, 4)),
      ]),
    ].sort();
    const series = years.map((year) => {
      const values = Array.from(
        { length: 12 },
        (_, index) =>
          entries.find(
            (item) =>
              item.period === `${year}-${String(index + 1).padStart(2, "0")}`,
          )?.collectedCents,
      );
      const forecastValues = values.map((actual, index) => {
        if (actual !== undefined) return undefined;
        const month = `${year}-${String(index + 1).padStart(2, "0")}`;
        const periods = forecasts.filter((period) =>
          period.collectionDate!.startsWith(month),
        );
        return periods.length
          ? periods.reduce(
              (sum, period) =>
                sum + calculateIncomePeriod(dossier, period).revenueCents,
              0,
            )
          : undefined;
      });
      return { year, values, forecastValues };
    });
    const observedSeries = series.filter((item) =>
      observedYears.includes(item.year),
    );
    const commonMonths = Array.from({ length: 12 }, (_, index) => index).filter(
      (index) =>
        observedSeries.every((item) => item.values[index] !== undefined),
    );
    const comparableTotals = observedSeries.map((item) => ({
      year: item.year,
      cents: commonMonths.reduce(
        (sum, month) => sum + (item.values[month] ?? 0),
        0,
      ),
    }));
    return [
      {
        streamId: stream.id,
        label: `${dossier.household.people.find((person) => person.id === stream.personId)?.displayName ?? ""} — ${stream.label}`,
        growthBasisPoints:
          comparableTotals.length === 2 && comparableTotals[0]!.cents > 0
            ? Math.round(
                (comparableTotals[1]!.cents / comparableTotals[0]!.cents - 1) *
                  10_000,
              )
            : undefined,
        series,
        commonMonthCount: commonMonths.length,
        comparableTotals,
      },
    ];
  });
}
export type TurnoverHistory = ReturnType<typeof calculateTurnoverHistory>;
