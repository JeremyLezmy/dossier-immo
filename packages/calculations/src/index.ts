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
  readonly loanComponents: readonly FinancingLoanComponentResult[];
  readonly initialMonthlyPaymentExcludingInsuranceCents: number;
  readonly initialMonthlyPaymentIncludingInsuranceCents: number;
  readonly maximumMonthlyPaymentExcludingInsuranceCents: number;
  readonly maximumMonthlyPaymentIncludingInsuranceCents: number;
  readonly maximumPaymentStartMonth: number;
  readonly monthlyInsuranceCents: number;
  readonly existingDebtAtPurchaseCents: number;
  readonly effortRateCentralBasisPoints: number;
  readonly effortRatePrudentBasisPoints: number;
  readonly remainingPrincipalByYearCents: Readonly<Record<string, number>>;
}

export interface FinancingLoanComponentResult {
  readonly id: string;
  readonly label: string;
  readonly kind: "principal" | "additional";
  readonly principalCents: number;
  readonly annualRateBasisPoints: number;
  readonly durationMonths: number;
  readonly deferredMonths: number;
  readonly totalDurationMonths: number;
  readonly deferredMonthlyPaymentExcludingInsuranceCents: number;
  readonly amortizingMonthlyPaymentExcludingInsuranceCents: number;
  readonly initialMonthlyPaymentExcludingInsuranceCents: number;
  readonly maximumMonthlyPaymentExcludingInsuranceCents: number;
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

function deferredMonthlyPaymentCents(principalCents: number, annualRateBasisPoints: number): number {
  return roundCents(principalCents * annualRateBasisPoints / 10_000 / 12);
}

export function deferredLoanPaymentCents(
  principalCents: number,
  annualRateBasisPoints: number,
  durationMonths: number,
  deferredMonths: number,
  month: number,
): number {
  if (month <= 0 || month > deferredMonths + durationMonths || principalCents <= 0) return 0;
  if (month <= deferredMonths) return deferredMonthlyPaymentCents(principalCents, annualRateBasisPoints);
  return monthlyPaymentCents(principalCents, annualRateBasisPoints, durationMonths);
}

export function remainingPrincipalAfterDefermentCents(
  principalCents: number,
  annualRateBasisPoints: number,
  durationMonths: number,
  deferredMonths: number,
  elapsedMonths: number,
): number {
  if (principalCents <= 0) return 0;
  if (elapsedMonths <= deferredMonths) return principalCents;
  return remainingPrincipalCents(principalCents, annualRateBasisPoints, durationMonths, elapsedMonths - deferredMonths);
}

function loanComponentResult(input: {
  readonly id: string;
  readonly label: string;
  readonly kind: "principal" | "additional";
  readonly principalCents: number;
  readonly annualRateBasisPoints: number;
  readonly durationMonths: number;
  readonly deferredMonths: number;
}): FinancingLoanComponentResult {
  const deferredPayment = deferredMonthlyPaymentCents(input.principalCents, input.annualRateBasisPoints);
  const amortizingPayment = monthlyPaymentCents(input.principalCents, input.annualRateBasisPoints, input.durationMonths);
  return {
    ...input,
    totalDurationMonths: input.deferredMonths + input.durationMonths,
    deferredMonthlyPaymentExcludingInsuranceCents: deferredPayment,
    amortizingMonthlyPaymentExcludingInsuranceCents: amortizingPayment,
    initialMonthlyPaymentExcludingInsuranceCents: input.deferredMonths > 0 ? deferredPayment : amortizingPayment,
    maximumMonthlyPaymentExcludingInsuranceCents: amortizingPayment,
  };
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
  const loanComponents: readonly FinancingLoanComponentResult[] = [
    loanComponentResult({
      id: `${scenario.id}-principal`,
      label: "Prêt principal",
      kind: "principal",
      principalCents: standardPrincipalCents,
      annualRateBasisPoints: scenario.annualRateBasisPoints,
      durationMonths: scenario.durationMonths,
      deferredMonths: 0,
    }),
    ...scenario.additionalLoanComponents.map((component) => loanComponentResult({
      id: component.id,
      label: component.label,
      kind: "additional",
      principalCents: component.amountCents,
      annualRateBasisPoints: component.annualRateBasisPoints,
      durationMonths: component.durationMonths,
      deferredMonths: component.deferredMonths,
    })),
  ];
  const activeComponents = loanComponents.filter((component) => component.principalCents > 0);
  const maximumCalendarDurationMonths = activeComponents.reduce(
    (maximum, component) => Math.max(maximum, component.totalDurationMonths),
    0,
  );
  const monthlyTimeline = Array.from({ length: maximumCalendarDurationMonths }, (_, index) => {
    const month = index + 1;
    return {
      month,
      paymentExcludingInsuranceCents: activeComponents.reduce(
        (total, component) => total + deferredLoanPaymentCents(
          component.principalCents,
          component.annualRateBasisPoints,
          component.durationMonths,
          component.deferredMonths,
          month,
        ),
        0,
      ),
    };
  });
  const initialMonthlyPaymentExcludingInsuranceCents = monthlyTimeline[0]?.paymentExcludingInsuranceCents ?? 0;
  const maximumPaymentPoint = monthlyTimeline.reduce(
    (maximum, point) => point.paymentExcludingInsuranceCents > maximum.paymentExcludingInsuranceCents ? point : maximum,
    { month: 1, paymentExcludingInsuranceCents: 0 },
  );
  const maximumMonthlyPaymentExcludingInsuranceCents = maximumPaymentPoint.paymentExcludingInsuranceCents;
  const monthlyInsuranceCents = roundCents(principalCents * scenario.insuranceAnnualBasisPoints / 10_000 / 12);
  const initialMonthlyPaymentIncludingInsuranceCents = initialMonthlyPaymentExcludingInsuranceCents + monthlyInsuranceCents;
  const maximumMonthlyPaymentIncludingInsuranceCents = maximumMonthlyPaymentExcludingInsuranceCents + monthlyInsuranceCents;
  const totalCreditCharges = maximumMonthlyPaymentIncludingInsuranceCents + existingDebtAtPurchaseCents;

  const remainingPrincipalByYearCents = Object.fromEntries(
    [6, 8, 15, 17, 20, 25]
      .filter((year) => year * 12 <= maximumCalendarDurationMonths)
      .map((year) => {
        const elapsedMonths = year * 12;
        return [
          String(year),
          activeComponents.reduce(
            (total, component) => total + remainingPrincipalAfterDefermentCents(
              component.principalCents,
              component.annualRateBasisPoints,
              component.durationMonths,
              component.deferredMonths,
              elapsedMonths,
            ),
            0,
          ),
        ];
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
    loanComponents,
    initialMonthlyPaymentExcludingInsuranceCents,
    initialMonthlyPaymentIncludingInsuranceCents,
    maximumMonthlyPaymentExcludingInsuranceCents,
    maximumMonthlyPaymentIncludingInsuranceCents,
    maximumPaymentStartMonth: maximumPaymentPoint.month,
    monthlyInsuranceCents,
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
    budgetScenarioResults.map(({ budget, financingScenario }) => [budget.id, financingScenario.maximumMonthlyPaymentIncludingInsuranceCents]),
  );
  const residualSavingsCents = Object.fromEntries(
    budgetScenarioResults.map(({ budget, incomeCents, financingScenario }) => [
      budget.id,
      incomeCents
        - (budgetTotalsCents[budget.id] ?? 0)
        - existingMonthlyDebtAtPurchaseCents
        - financingScenario.maximumMonthlyPaymentIncludingInsuranceCents,
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
        ? "mensualité maximale avec assurance du scénario de financement affecté au budget"
        : "mensualité maximale avec assurance du scénario mis en avant (repli explicite)",
      sourceIds: [financingScenario.id],
      scenarioId: financingScenario.id,
    };
    budgetProvenance[`residualSavingsCents.${budget.id}`] = {
      formula: "revenu du budget - postes du budget - dette existante à l'achat - mensualité maximale avec assurance affectée au budget",
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
