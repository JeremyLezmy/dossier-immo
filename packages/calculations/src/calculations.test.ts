import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { calculateDossier, monthlyPaymentCents, remainingPrincipalCents } from "./index";

describe("moteur de calcul", () => {
  it("calcule les invariants du dossier complet", () => {
    const result = calculateDossier(completeDemoDossier);
    expect(result.incomeCentralCents).toBe(550_000);
    expect(result.incomePrudentCents).toBe(515_000);
    expect(result.totalAssetsCents).toBe(7_700_000);
    expect(result.contributionLiquidityCents).toBe(3_500_000);
    expect(result.projectedLiquidityAtPurchaseCents).toBe(6_100_000);
    expect(result.reserveAfterPurchaseCents).toBe(2_200_000);
    expect(result.existingMonthlyDebtNowCents).toBe(19_000);
    expect(result.budgetTotalsCents["central-budget"]).toBe(157_700);
    expect(result.budgetTotalsCents["stress-budget"]).toBe(191_500);
    expect(result.highlightedScenarioId).toBe("central-reference");
  });

  it("compose une seule fois mensualité, assurance et dette existante", () => {
    const result = calculateDossier(completeDemoDossier);
    const central = result.financingScenarios.find((scenario) => scenario.id === "central-reference");
    expect(central).toBeDefined();
    expect(central!.principalCents).toBe(23_760_000);
    expect(central!.monthlyInsuranceCents).toBe(3_168);
    expect(central!.monthlyPaymentIncludingInsuranceCents).toBe(
      central!.monthlyPaymentExcludingInsuranceCents + central!.monthlyInsuranceCents,
    );
    expect(central!.effortRateCentralBasisPoints).toBe(
      Math.round((central!.monthlyPaymentIncludingInsuranceCents + 19_000) / 550_000 * 10_000),
    );
  });

  it("gère les prêts à taux zéro et le capital restant dû", () => {
    expect(monthlyPaymentCents(12_000_000, 0, 240)).toBe(50_000);
    expect(remainingPrincipalCents(12_000_000, 0, 240, 120)).toBe(6_000_000);
    expect(remainingPrincipalCents(12_000_000, 0, 240, 240)).toBe(0);
  });

  it("calcule le capital restant dû de chaque prêt avec son taux, sa durée et son différé", () => {
    const dossier = structuredClone(completeDemoDossier);
    const central = dossier.financingScenarios.find((scenario) => scenario.id === "central-reference")!;
    central.additionalLoanComponents = [{
      id: "zero-rate-deferred",
      label: "Prêt à taux zéro différé",
      amountCents: 3_000_000,
      annualRateBasisPoints: 0,
      durationMonths: 240,
      deferredMonths: 60,
    }];

    const result = calculateDossier(dossier).financingScenarios.find((scenario) => scenario.id === central.id)!;
    const standardAtYear6 = remainingPrincipalCents(
      result.standardPrincipalCents,
      central.annualRateBasisPoints,
      central.durationMonths,
      72,
    );
    const componentAtYear6 = remainingPrincipalCents(3_000_000, 0, 240, 12);
    expect(result.remainingPrincipalByYearCents["6"]).toBe(standardAtYear6 + componentAtYear6);
  });

  it("expose la provenance des agrégats critiques", () => {
    const result = calculateDossier(completeDemoDossier);
    expect(result.provenance.incomeCentralCents?.sourceIds).toHaveLength(2);
    expect(result.provenance.reserveAfterPurchaseCents?.formula).toContain("apport");
  });

  it("applique au stress son revenu, son financement et ses charges propres", () => {
    const dossier = structuredClone(completeDemoDossier);
    const centralBudget = dossier.budgetScenarios.find((budget) => budget.kind === "central");
    const stressBudget = dossier.budgetScenarios.find((budget) => budget.kind === "stress");
    expect(centralBudget).toBeDefined();
    expect(stressBudget).toBeDefined();

    centralBudget!.assumptions.afterTaxIncomeCents = 724_000;
    centralBudget!.assumptions.financingScenarioId = "central-reference";
    stressBudget!.assumptions.afterTaxIncomeCents = 600_000;
    stressBudget!.assumptions.financingScenarioId = "central-stress";
    stressBudget!.items[0]!.amountCents += 50_000;

    const result = calculateDossier(dossier);
    const centralPayment = result.financingScenarios.find((scenario) => scenario.id === "central-reference")!.monthlyPaymentIncludingInsuranceCents;
    const stressPayment = result.financingScenarios.find((scenario) => scenario.id === "central-stress")!.monthlyPaymentIncludingInsuranceCents;

    expect(result.budgetIncomeCents[centralBudget!.id]).toBe(724_000);
    expect(result.budgetIncomeCents[stressBudget!.id]).toBe(600_000);
    expect(result.budgetFinancingPaymentCents[centralBudget!.id]).toBe(centralPayment);
    expect(result.budgetFinancingPaymentCents[stressBudget!.id]).toBe(stressPayment);
    expect(stressPayment).not.toBe(centralPayment);
    expect(result.budgetTotalsCents[stressBudget!.id]).not.toBe(result.budgetTotalsCents[centralBudget!.id]);
    expect(result.residualSavingsCents[stressBudget!.id]).toBe(
      600_000
        - result.budgetTotalsCents[stressBudget!.id]!
        - result.existingMonthlyDebtAtPurchaseCents
        - stressPayment,
    );
    expect(result.residualSavingsCents[stressBudget!.id]).not.toBe(result.residualSavingsCents[centralBudget!.id]);
    expect(result.provenance[`residualSavingsCents.${stressBudget!.id}`]?.scenarioId).toBe("central-stress");
  });

  it("ne remplace jamais silencieusement un financement explicite introuvable", () => {
    const dossier = structuredClone(completeDemoDossier);
    const stressBudget = dossier.budgetScenarios.find((budget) => budget.kind === "stress");
    expect(stressBudget).toBeDefined();
    stressBudget!.assumptions.financingScenarioId = "scenario-absent";

    expect(() => calculateDossier(dossier)).toThrow(/scenario-absent/);
  });

  it("documente et applique les replis globaux uniquement en l'absence d'hypothèse", () => {
    const dossier = structuredClone(completeDemoDossier);
    const stressBudget = dossier.budgetScenarios.find((budget) => budget.kind === "stress");
    expect(stressBudget).toBeDefined();
    delete stressBudget!.assumptions.afterTaxIncomeCents;
    delete stressBudget!.assumptions.financingScenarioId;

    const result = calculateDossier(dossier);
    const highlightedPayment = result.financingScenarios.find((scenario) => scenario.id === result.highlightedScenarioId)!.monthlyPaymentIncludingInsuranceCents;
    expect(result.budgetIncomeCents[stressBudget!.id]).toBe(dossier.estimatedHouseholdAfterTaxIncomeCents);
    expect(result.budgetFinancingPaymentCents[stressBudget!.id]).toBe(highlightedPayment);
    expect(result.provenance[`budgetIncomeCents.${stressBudget!.id}`]?.formula).toContain("repli explicite");
    expect(result.provenance[`budgetFinancingPaymentCents.${stressBudget!.id}`]?.formula).toContain("repli explicite");
  });

  it("respecte les invariants de mensualité sur un large domaine", () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 200_000_000 }),
      fc.integer({ min: 0, max: 2_000 }),
      fc.integer({ min: 12, max: 480 }),
      (principal, rate, months) => {
        const payment = monthlyPaymentCents(principal, rate, months);
        expect(payment).toBeGreaterThanOrEqual(0);
        if (principal / months >= 0.5) {
          expect(payment).toBeGreaterThan(0);
        }
        expect(remainingPrincipalCents(principal, rate, months, 0)).toBe(principal);
        expect(remainingPrincipalCents(principal, rate, months, months)).toBe(0);
      },
    ), { numRuns: 500 });
  });
});
