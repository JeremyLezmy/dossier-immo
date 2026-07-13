import type { Dossier, FinancingScenario } from "@dossier-immo/schema";

export interface MetricProvenance {
  readonly formula: string;
  readonly sourceIds: readonly string[];
  readonly scenarioId?: string;
  readonly observedAt?: string;
}

export interface FinancingScenarioResult {
  readonly id: string;
  readonly label: string;
  readonly netSellerPriceCents: number;
  readonly acquisitionFeesCents: number;
  readonly totalProjectCostCents: number;
  readonly principalCents: number;
  readonly standardPrincipalCents: number;
  readonly additionalPrincipalCents: number;
  readonly monthlyPaymentExcludingInsuranceCents: number;
  readonly monthlyInsuranceCents: number;
  readonly monthlyPaymentIncludingInsuranceCents: number;
  readonly existingDebtAtPurchaseCents: number;
  readonly effortRateCentralBasisPoints: number;
  readonly effortRatePrudentBasisPoints: number;
  readonly remainingPrincipalByYearCents: Readonly<Record<string, number>>;
}

export interface DerivedDossier {
  readonly incomeCentralCents: number;
  readonly incomePrudentCents: number;
  readonly totalAssetsCents: number;
  readonly liquidAssetsCents: number;
  readonly contributionLiquidityCents: number;
  readonly projectedLiquidityAtPurchaseCents: number;
  readonly reserveAfterPurchaseCents: number;
  readonly existingMonthlyDebtNowCents: number;
  readonly existingMonthlyDebtAtPurchaseCents: number;
  readonly budgetTotalsCents: Readonly<Record<string, number>>;
  readonly budgetIncomeCents: Readonly<Record<string, number>>;
  readonly budgetFinancingPaymentCents: Readonly<Record<string, number>>;
  readonly residualSavingsCents: Readonly<Record<string, number>>;
  readonly financingScenarios: readonly FinancingScenarioResult[];
  readonly highlightedScenarioId: string;
  readonly provenance: Readonly<Record<string, MetricProvenance>>;
}

const roundCents = (value: number): number => Math.round(value);

function monthlyPaymentExactCents(principalCents: number, annualRateBasisPoints: number, durationMonths: number): number {
  if (principalCents <= 0) return 0;
  if (durationMonths <= 0) throw new RangeError("La durée doit être strictement positive.");
  const monthlyRate = annualRateBasisPoints / 10_000 / 12;
  if (monthlyRate === 0) return principalCents / durationMonths;
  return (principalCents * monthlyRate) / (1 - (1 + monthlyRate) ** -durationMonths);
}

export function monthlyPaymentCents(principalCents: number, annualRateBasisPoints: number, durationMonths: number): number {
  return roundCents(monthlyPaymentExactCents(principalCents, annualRateBasisPoints, durationMonths));
}

export function remainingPrincipalCents(
  principalCents: number,
  annualRateBasisPoints: number,
  durationMonths: number,
  elapsedMonths: number,
): number {
  if (principalCents <= 0 || elapsedMonths >= durationMonths) return 0;
  if (elapsedMonths <= 0) return principalCents;
  const payment = monthlyPaymentExactCents(principalCents, annualRateBasisPoints, durationMonths);
  const monthlyRate = annualRateBasisPoints / 10_000 / 12;
  if (monthlyRate === 0) return Math.max(0, roundCents(principalCents - payment * elapsedMonths));
  const factor = (1 + monthlyRate) ** elapsedMonths;
  return Math.max(0, roundCents(principalCents * factor - payment * ((factor - 1) / monthlyRate)));
}

export function monthsBetween(startDate: string, endDate: string): number {
  const [startYear = 0, startMonth = 1] = startDate.split("-").map(Number);
  const [endYear = 0, endMonth = 1] = endDate.split("-").map(Number);
  return (endYear - startYear) * 12 + endMonth - startMonth;
}

function debtAtDate(dossier: Dossier, date: string): number {
  return dossier.liabilities
    .filter((liability) => liability.includedInEffortRate)
    .filter((liability) => !liability.endDate || liability.endDate >= date)
    .reduce((total, liability) => total + liability.monthlyPaymentCents, 0);
}

function calculateScenario(
  dossier: Dossier,
  scenario: FinancingScenario,
  incomeCentralCents: number,
  incomePrudentCents: number,
  existingDebtAtPurchaseCents: number,
): FinancingScenarioResult {
  const negotiationMultiplier = 1 - scenario.negotiationBasisPoints / 10_000;
  const scenarioPriceCents = scenario.priceOverrideCents ?? dossier.project.targetPriceCents;
  const scenarioContributionCents = scenario.contributionOverrideCents ?? dossier.project.contributionCents;
  const netSellerPriceCents = roundCents(scenarioPriceCents * negotiationMultiplier);
  const acquisitionFeesCents = roundCents(netSellerPriceCents * dossier.project.acquisitionFeeBasisPoints / 10_000);
  const totalProjectCostCents = netSellerPriceCents + acquisitionFeesCents + dossier.project.renovationCents;
  const principalCents = Math.max(0, totalProjectCostCents - scenarioContributionCents);
  const additionalPrincipalCents = Math.min(
    principalCents,
    scenario.additionalLoanComponents.reduce((total, component) => total + component.amountCents, 0),
  );
  const standardPrincipalCents = principalCents - additionalPrincipalCents;
  const standardPayment = monthlyPaymentCents(standardPrincipalCents, scenario.annualRateBasisPoints, scenario.durationMonths);
  const componentPayments = scenario.additionalLoanComponents.reduce(
    (total, component) => total + monthlyPaymentCents(component.amountCents, component.annualRateBasisPoints, component.durationMonths),
    0,
  );
  const monthlyPaymentExcludingInsuranceCents = standardPayment + componentPayments;
  const monthlyInsuranceCents = roundCents(principalCents * scenario.insuranceAnnualBasisPoints / 10_000 / 12);
  const monthlyPaymentIncludingInsuranceCents = monthlyPaymentExcludingInsuranceCents + monthlyInsuranceCents;
  const totalCreditCharges = monthlyPaymentIncludingInsuranceCents + existingDebtAtPurchaseCents;

  const remainingPrincipalByYearCents = Object.fromEntries(
    [6, 8, 15, 17, 20, 25]
      .filter((year) => year * 12 <= scenario.durationMonths)
      .map((year) => {
        const elapsedMonths = year * 12;
        const standardRemaining = remainingPrincipalCents(
          standardPrincipalCents,
          scenario.annualRateBasisPoints,
          scenario.durationMonths,
          elapsedMonths,
        );
        const componentsRemaining = scenario.additionalLoanComponents.reduce((total, component) => {
          const elapsedRepaymentMonths = Math.max(0, elapsedMonths - component.deferredMonths);
          return total + remainingPrincipalCents(
            component.amountCents,
            component.annualRateBasisPoints,
            component.durationMonths,
            elapsedRepaymentMonths,
          );
        }, 0);
        return [String(year), standardRemaining + componentsRemaining];
      }),
  );

  return {
    id: scenario.id,
    label: scenario.label,
    netSellerPriceCents,
    acquisitionFeesCents,
    totalProjectCostCents,
    principalCents,
    standardPrincipalCents,
    additionalPrincipalCents,
    monthlyPaymentExcludingInsuranceCents,
    monthlyInsuranceCents,
    monthlyPaymentIncludingInsuranceCents,
    existingDebtAtPurchaseCents,
    effortRateCentralBasisPoints: incomeCentralCents > 0 ? roundCents(totalCreditCharges / incomeCentralCents * 10_000) : 0,
    effortRatePrudentBasisPoints: incomePrudentCents > 0 ? roundCents(totalCreditCharges / incomePrudentCents * 10_000) : 0,
    remainingPrincipalByYearCents,
  };
}

export function calculateDossier(dossier: Dossier): DerivedDossier {
  const includedIncomes = dossier.incomeStreams.filter((income) => income.includedInBorrowingCapacity);
  const incomeCentralCents = includedIncomes.reduce((total, income) => total + income.monthlyBankCents, 0);
  const incomePrudentCents = includedIncomes.reduce((total, income) => total + income.monthlyPrudentCents, 0);
  const totalAssetsCents = dossier.assets.reduce((total, asset) => total + asset.amountCents, 0);
  const liquidAssetsCents = dossier.assets.filter((asset) => asset.liquid).reduce((total, asset) => total + asset.amountCents, 0);
  const contributionAssets = dossier.assets.filter((asset) => asset.availableForContribution);
  const contributionLiquidityCents = contributionAssets.reduce((total, asset) => total + (asset.contributionAmountCents ?? asset.amountCents), 0);
  const projectionMonths = Math.max(0, monthsBetween(dossier.metadata.observationDate, dossier.project.targetPurchaseDate));
  const projectedLiquidityAtPurchaseCents = dossier.project.expectedLiquidityAtPurchaseCents
    ?? contributionLiquidityCents + (dossier.project.monthlySavingsProjectionCents ?? 0) * projectionMonths;
  const reserveAfterPurchaseCents = projectedLiquidityAtPurchaseCents - dossier.project.contributionCents - dossier.project.installationCents;
  const existingMonthlyDebtNowCents = debtAtDate(dossier, dossier.metadata.observationDate);
  const existingMonthlyDebtAtPurchaseCents = debtAtDate(dossier, dossier.project.targetPurchaseDate);
  const budgetTotalsCents = Object.fromEntries(
    dossier.budgetScenarios.map((budget) => [budget.id, budget.items.reduce((total, item) => total + item.amountCents, 0)]),
  );
  const highlighted = dossier.financingScenarios.find((scenario) => scenario.highlighted) ?? dossier.financingScenarios[0];
  if (!highlighted) throw new Error("Au moins un scénario de financement est requis.");
  const financingScenarios = dossier.financingScenarios.map((scenario) => calculateScenario(
    dossier,
    scenario,
    incomeCentralCents,
    incomePrudentCents,
    existingMonthlyDebtAtPurchaseCents,
  ));
  const highlightedResult = financingScenarios.find((scenario) => scenario.id === highlighted.id);
  if (!highlightedResult) throw new Error("Le scénario mis en avant est introuvable.");

  const budgetScenarioResults = dossier.budgetScenarios.map((budget) => {
    const financingScenarioId = budget.assumptions.financingScenarioId ?? highlighted.id;
    const financingScenario = financingScenarios.find((scenario) => scenario.id === financingScenarioId);
    if (!financingScenario) {
      throw new Error(`Le budget « ${budget.label} » référence un scénario de financement introuvable : ${financingScenarioId}.`);
    }
    return {
      budget,
      incomeCents: budget.assumptions.afterTaxIncomeCents ?? dossier.estimatedHouseholdAfterTaxIncomeCents,
      financingScenario,
    };
  });
  const budgetIncomeCents = Object.fromEntries(
    budgetScenarioResults.map(({ budget, incomeCents }) => [budget.id, incomeCents]),
  );
  const budgetFinancingPaymentCents = Object.fromEntries(
    budgetScenarioResults.map(({ budget, financingScenario }) => [budget.id, financingScenario.monthlyPaymentIncludingInsuranceCents]),
  );
  const residualSavingsCents = Object.fromEntries(
    budgetScenarioResults.map(({ budget, incomeCents, financingScenario }) => [
      budget.id,
      incomeCents
        - (budgetTotalsCents[budget.id] ?? 0)
        - existingMonthlyDebtAtPurchaseCents
        - financingScenario.monthlyPaymentIncludingInsuranceCents,
    ]),
  );

  const budgetProvenance: Record<string, MetricProvenance> = {};
  for (const { budget, financingScenario } of budgetScenarioResults) {
    const usesExplicitIncome = budget.assumptions.afterTaxIncomeCents !== undefined;
    const usesExplicitFinancing = budget.assumptions.financingScenarioId !== undefined;
    budgetProvenance[`budgetTotalsCents.${budget.id}`] = {
      formula: "Σ postes du budget",
      sourceIds: budget.items.map((item) => item.id),
    };
    budgetProvenance[`budgetIncomeCents.${budget.id}`] = {
      formula: usesExplicitIncome
        ? "hypothèse de revenu net après impôt du budget"
        : "revenu net après impôt global (repli explicite)",
      sourceIds: [budget.id],
    };
    budgetProvenance[`budgetFinancingPaymentCents.${budget.id}`] = {
      formula: usesExplicitFinancing
        ? "mensualité avec assurance du scénario de financement affecté au budget"
        : "mensualité avec assurance du scénario mis en avant (repli explicite)",
      sourceIds: [financingScenario.id],
      scenarioId: financingScenario.id,
    };
    budgetProvenance[`residualSavingsCents.${budget.id}`] = {
      formula: "revenu du budget - postes du budget - dette existante à l'achat - mensualité avec assurance affectée au budget",
      sourceIds: [budget.id, ...budget.items.map((item) => item.id), financingScenario.id],
      scenarioId: financingScenario.id,
      observedAt: dossier.project.targetPurchaseDate,
    };
  }

  return {
    incomeCentralCents,
    incomePrudentCents,
    totalAssetsCents,
    liquidAssetsCents,
    contributionLiquidityCents,
    projectedLiquidityAtPurchaseCents,
    reserveAfterPurchaseCents,
    existingMonthlyDebtNowCents,
    existingMonthlyDebtAtPurchaseCents,
    budgetTotalsCents,
    budgetIncomeCents,
    budgetFinancingPaymentCents,
    residualSavingsCents,
    financingScenarios,
    highlightedScenarioId: highlighted.id,
    provenance: {
      incomeCentralCents: { formula: "Σ revenus bancaires inclus", sourceIds: includedIncomes.map((income) => income.id), observedAt: dossier.metadata.observationDate },
      incomePrudentCents: { formula: "Σ revenus prudents inclus", sourceIds: includedIncomes.map((income) => income.id), observedAt: dossier.metadata.observationDate },
      totalAssetsCents: { formula: "Σ actifs déclarés", sourceIds: dossier.assets.map((asset) => asset.id), observedAt: dossier.metadata.observationDate },
      contributionLiquidityCents: { formula: "Σ actifs mobilisables", sourceIds: contributionAssets.map((asset) => asset.id), observedAt: dossier.metadata.observationDate },
      projectedLiquidityAtPurchaseCents: { formula: "liquidités mobilisables + épargne mensuelle × mois jusqu'à l'achat, sauf hypothèse explicite", sourceIds: contributionAssets.map((asset) => asset.id), observedAt: dossier.project.targetPurchaseDate },
      reserveAfterPurchaseCents: { formula: "liquidités à l'achat - apport - installation", sourceIds: [dossier.project.id], observedAt: dossier.project.targetPurchaseDate },
      ...budgetProvenance,
    },
  };
}
