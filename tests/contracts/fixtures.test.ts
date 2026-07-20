import { describe, expect, it } from "vitest";
import { calculateDossier } from "@dossier-immo/calculations";
import { conformityFixtures } from "@dossier-immo/fixtures";
import { validateDossier } from "@dossier-immo/schema";

describe("corpus de conformité", () => {
  for (const [name, fixture] of Object.entries(conformityFixtures)) {
    it(`${name} est valide et calculable`, () => {
      expect(validateDossier(fixture).success).toBe(true);
      expect(() => calculateDossier(fixture)).not.toThrow();
    });
  }

  it("retire les dettes échues du taux d'effort à la date d'achat", () => {
    const fixture = structuredClone(conformityFixtures.complete);
    fixture.project.targetPurchaseDate = "2038-03-01";
    fixture.project.expectedLiquidityAtPurchaseCents = 20_000_000;
    const result = calculateDossier(fixture);
    expect(result.existingMonthlyDebtAtPurchaseCents).toBe(0);
  });

  it("sépare le prêt bonifié du prêt principal", () => {
    const result = calculateDossier(conformityFixtures.subsidizedLoan);
    const central = result.financingScenarios.find(
      (scenario) => scenario.id === "ines-central",
    );
    expect(central?.additionalPrincipalCents).toBe(1_200_000);
    expect(central?.standardPrincipalCents).toBe(
      (central?.principalCents ?? 0) - 1_200_000,
    );
  });

  it("projette les liquidités sans stocker un total dérivé", () => {
    const result = calculateDossier(conformityFixtures.projectedSavings);
    expect(result.projectedLiquidityAtPurchaseCents).toBeGreaterThan(
      result.contributionLiquidityCents,
    );
  });
});
