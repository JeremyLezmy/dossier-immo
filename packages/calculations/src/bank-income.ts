import type { Dossier } from "@dossier-immo/schema";
import type { IncomePeriodResult } from "./planning";

/** Annual collected turnover; forecast status is retained until explicitly updated. */
export function calculateBankIncome(
  dossier: Dossier,
  results: readonly IncomePeriodResult[],
) {
  return Object.fromEntries(
    dossier.incomeStreams.map((stream) => {
      const basis = stream.bankingBasis;
      if (!basis)
        return [
          stream.id,
          {
            primaryCents: stream.monthlyBankCents,
            prudentCents: stream.monthlyPrudentCents,
            label:
              stream.bankingConvention ??
              stream.note ??
              "Montants mensuels déclarés.",
            projected: false,
          },
        ];
      const annual = (year: number) => {
        const periods = (dossier.incomePeriods ?? []).filter(
          (p) =>
            p.incomeStreamId === stream.id &&
            p.status !== "run-rate" &&
            Number((p.collectionDate ?? p.endDate).slice(0, 4)) === year,
        );
        return {
          revenue: periods.reduce(
            (sum, p) =>
              sum + (results.find((r) => r.id === p.id)?.revenueCents ?? 0),
            0,
          ),
          projected: periods.some((p) => p.status !== "observed"),
        };
      };
      const current = annual(basis.referenceYear);
      const previous = annual(basis.referenceYear - 1);
      const retained = 1 - basis.allowanceBasisPoints / 10_000;
      return [
        stream.id,
        {
          primaryCents: Math.round((current.revenue * retained) / 12),
          prudentCents: Math.round(
            ((current.revenue + previous.revenue) * retained) / 24,
          ),
          label: `Base : CA encaissé ${basis.referenceYear}, après abattement de ${basis.allowanceBasisPoints / 100} %, / 12. Sensibilité : moyenne ${basis.referenceYear - 1}–${basis.referenceYear}, même abattement. ${current.projected || previous.projected ? "Prévisions incluses ; à remplacer par le réalisé." : "Exercices déclarés réalisés."}`,
          projected: current.projected || previous.projected,
        },
      ];
    }),
  );
}
