import type { Dossier } from "@dossier-immo/schema";

/** Installation can be a use of the reserve, rather than an additional expense. */
export function calculateReserve(
  dossier: Dossier,
  liquidityCents: number,
  contributionCents: number,
) {
  const reserveAfterPurchaseCents =
    liquidityCents - contributionCents - dossier.project.installationCents;
  const freeReserveAfterPurchaseCents =
    reserveAfterPurchaseCents - (dossier.cashFlowPlan?.reservedTaxCents ?? 0);
  const reserveForObjectiveCents =
    freeReserveAfterPurchaseCents +
    (dossier.reservePolicy.includesInstallation
      ? dossier.project.installationCents
      : 0);
  return {
    reserveAfterPurchaseCents,
    freeReserveAfterPurchaseCents,
    reserveForObjectiveCents,
    reserveShortfallCents: Math.max(
      0,
      dossier.reservePolicy.minimumCents - reserveForObjectiveCents,
    ),
  };
}
