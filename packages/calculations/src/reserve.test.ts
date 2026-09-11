import { expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { calculateReserve } from "./reserve";
import { calculateDossier } from "./index";
import { validateDossier } from "@dossier-immo/schema";

it("inclut l’installation dans l’objectif sans la rendre disponible pour d’autres dépenses", () => {
  const dossier = structuredClone(completeDemoDossier);
  dossier.project.installationCents = 800_000;
  dossier.reservePolicy = {
    minimumCents: 3_500_000,
    targetCents: 4_000_000,
    includesInstallation: true,
    allocations: [],
  };
  dossier.cashFlowPlan = {
    entries: [],
    note: "Enveloppe fiscale fictive",
    reservedTaxCents: 1_000_000,
  };
  const included = calculateReserve(dossier, 13_000_000, 8_000_000);
  expect(included.reserveForObjectiveCents).toBe(4_000_000);
  expect(included.freeReserveAfterPurchaseCents).toBe(3_200_000);
  expect(included.reserveShortfallCents).toBe(0);
  dossier.reservePolicy.includesInstallation = false;
  const separate = calculateReserve(dossier, 13_000_000, 8_000_000);
  expect(separate.reserveForObjectiveCents).toBe(3_200_000);
  expect(separate.reserveShortfallCents).toBe(300_000);
  expect(separate.freeReserveAfterPurchaseCents).toBe(
    included.freeReserveAfterPurchaseCents,
  );
});

it("conserve la convention à l’import et la répercute dans les variantes d’apport", () => {
  const dossier = structuredClone(completeDemoDossier);
  dossier.reservePolicy.includesInstallation = true;
  expect(validateDossier(dossier).success).toBe(true);
  const result = calculateDossier(dossier);
  for (const scenario of result.financingScenarios) {
    expect(scenario.reserveForObjectiveCents).toBe(
      scenario.freeReserveAfterPurchaseCents +
        dossier.project.installationCents,
    );
  }
  expect(result.reserveForObjectiveCents).toBe(
    result.freeReserveAfterPurchaseCents + dossier.project.installationCents,
  );
  expect(result.bankReview.freeReserveMarginCents).toBe(
    result.reserveForObjectiveCents - dossier.reservePolicy.minimumCents,
  );
});
