import { calculateReserve } from "./reserve";
import { calculateBankIncome } from "./bank-income";
import { calculateTurnoverHistory, type TurnoverHistory } from "./history";
import { calculateBankReview } from "./bank-review";
export type { TurnoverHistory } from "./history";
import { calculateTaxProjections, type TaxProjectionResult } from "./tax";
import type { Dossier, FinancingScenario } from "@dossier-immo/schema";
import {
  calculateIncomePresentation,
  type IncomePresentation,
} from "./income-presentation";
import {
  summarizeIncomePeriods,
  summarizeCashFlow,
  type IncomeSummary,
  calculateCashFlow,
  calculateIncomePeriod,
  type IncomePeriodResult,
  type CashFlowResult,
} from "./planning";
export { calculateIncomePeriod } from "./planning";
export type { IncomePeriodResult, CashFlowResult } from "./planning";

export interface MetricProvenance {
  readonly formula: string;
  readonly sourceIds: readonly string[];
  readonly scenarioId?: string;
  readonly observedAt?: string;
}

export interface FinancingScenarioResult {
  readonly contributionCents: number;
  readonly reserveAfterPurchaseCents: number;
  readonly freeReserveAfterPurchaseCents: number;
  readonly reserveForObjectiveCents: number;
  readonly reserveShortfallCents: number;
  readonly maximumCombinedMonthlyCreditCents: number;
  readonly annualCreditChargesCents: readonly number[];
  readonly monthlyTimeline: readonly {
    month: number;
    date: string;
    mortgageCents: number;
    existingDebtCents: number;
  }[];
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
  readonly bankReview: ReturnType<typeof calculateBankReview>;
  readonly incomePresentation: IncomePresentation;
  readonly bankReadingEffortBasisPoints: {
    now: number;
    prudentReference: number;
    atPurchase: number;
    projected: number | undefined;
  };
  readonly turnoverHistory: TurnoverHistory;
  readonly taxProjections: readonly TaxProjectionResult[];
  readonly prepaymentComparisons: readonly {
    liabilityId: string;
    label: string;
    settlementCents: number;
    releasedMonthlyCents: number;
    reserveCents: number;
    freeReserveCents: number;
    reserveForObjectiveCents: number;
    effortBasisPoints: number;
  }[];
  readonly incomeSummaries: readonly IncomeSummary[];
  readonly incomePeriods: readonly IncomePeriodResult[];
  readonly cashFlow: readonly CashFlowResult[];
  readonly monthlyCashFlow: ReturnType<typeof summarizeCashFlow>;
  readonly budgetBeforeTaxIncomeCents: Readonly<Record<string, number>>;
  readonly budgetDebtCents: Readonly<Record<string, number>>;
  readonly budgetPeopleIncomeCents: Readonly<
    Record<string, readonly { label: string; value: number }[]>
  >;
  readonly budgetSavingsPhases: Readonly<
    Record<
      string,
      readonly {
        date: string;
        mortgageCents: number;
        debtCents: number;
        savingsCents: number;
      }[]
    >
  >;
  readonly savingsCapacityCents: Readonly<Record<string, number>>;
  readonly incomeCentralCents: number;
  readonly incomePrudentCents: number;
  readonly totalAssetsCents: number;
  readonly liquidAssetsCents: number;
  readonly contributionLiquidityCents: number;
  readonly projectedLiquidityAtPurchaseCents: number;
  readonly reserveAfterPurchaseCents: number;
  readonly freeReserveAfterPurchaseCents: number;
  readonly reserveForObjectiveCents: number;
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

function monthlyPaymentExactCents(
  principalCents: number,
  annualRateBasisPoints: number,
  durationMonths: number,
): number {
  if (principalCents <= 0) return 0;
  if (durationMonths <= 0)
    throw new RangeError("La durée doit être strictement positive.");
  const monthlyRate = annualRateBasisPoints / 10_000 / 12;
  if (monthlyRate === 0) return principalCents / durationMonths;
  return (
    (principalCents * monthlyRate) / (1 - (1 + monthlyRate) ** -durationMonths)
  );
}

export function monthlyPaymentCents(
  principalCents: number,
  annualRateBasisPoints: number,
  durationMonths: number,
): number {
  return roundCents(
    monthlyPaymentExactCents(
      principalCents,
      annualRateBasisPoints,
      durationMonths,
    ),
  );
}

export function remainingPrincipalCents(
  principalCents: number,
  annualRateBasisPoints: number,
  durationMonths: number,
  elapsedMonths: number,
): number {
  if (principalCents <= 0 || elapsedMonths >= durationMonths) return 0;
  if (elapsedMonths <= 0) return principalCents;
  const payment = monthlyPaymentExactCents(
    principalCents,
    annualRateBasisPoints,
    durationMonths,
  );
  const monthlyRate = annualRateBasisPoints / 10_000 / 12;
  if (monthlyRate === 0)
    return Math.max(0, roundCents(principalCents - payment * elapsedMonths));
  const factor = (1 + monthlyRate) ** elapsedMonths;
  return Math.max(
    0,
    roundCents(
      principalCents * factor - payment * ((factor - 1) / monthlyRate),
    ),
  );
}

function deferredMonthlyPaymentCents(
  principalCents: number,
  annualRateBasisPoints: number,
): number {
  return roundCents((principalCents * annualRateBasisPoints) / 10_000 / 12);
}

export function deferredLoanPaymentCents(
  principalCents: number,
  annualRateBasisPoints: number,
  durationMonths: number,
  deferredMonths: number,
  month: number,
): number {
  if (
    month <= 0 ||
    month > deferredMonths + durationMonths ||
    principalCents <= 0
  )
    return 0;
  if (month <= deferredMonths)
    return deferredMonthlyPaymentCents(principalCents, annualRateBasisPoints);
  return monthlyPaymentCents(
    principalCents,
    annualRateBasisPoints,
    durationMonths,
  );
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
  return remainingPrincipalCents(
    principalCents,
    annualRateBasisPoints,
    durationMonths,
    elapsedMonths - deferredMonths,
  );
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
  const deferredPayment = deferredMonthlyPaymentCents(
    input.principalCents,
    input.annualRateBasisPoints,
  );
  const amortizingPayment = monthlyPaymentCents(
    input.principalCents,
    input.annualRateBasisPoints,
    input.durationMonths,
  );
  return {
    ...input,
    totalDurationMonths: input.deferredMonths + input.durationMonths,
    deferredMonthlyPaymentExcludingInsuranceCents: deferredPayment,
    amortizingMonthlyPaymentExcludingInsuranceCents: amortizingPayment,
    initialMonthlyPaymentExcludingInsuranceCents:
      input.deferredMonths > 0 ? deferredPayment : amortizingPayment,
    maximumMonthlyPaymentExcludingInsuranceCents: amortizingPayment,
  };
}

export function monthsBetween(startDate: string, endDate: string): number {
  const [startYear = 0, startMonth = 1] = startDate.split("-").map(Number);
  const [endYear = 0, endMonth = 1] = endDate.split("-").map(Number);
  return (endYear - startYear) * 12 + endMonth - startMonth;
}

function debtAtDate(dossier: Dossier, date: string, effortOnly = true): number {
  return dossier.liabilities
    .filter((liability) => !effortOnly || liability.includedInEffortRate)
    .filter((liability) => !liability.startDate || liability.startDate <= date)
    .filter((liability) => !liability.endDate || liability.endDate >= date)
    .reduce((total, liability) => total + liability.monthlyPaymentCents, 0);
}

function monthDate(start: string, offset: number): string {
  const [year = 0, month = 1, day = 1] = start.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

function calculateScenario(
  dossier: Dossier,
  scenario: FinancingScenario,
  incomeCentralCents: number,
  incomePrudentCents: number,
  existingDebtAtPurchaseCents: number,
  projectedLiquidityAtPurchaseCents: number,
): FinancingScenarioResult {
  const negotiationMultiplier = 1 - scenario.negotiationBasisPoints / 10_000;
  const scenarioPriceCents =
    scenario.priceOverrideCents ?? dossier.project.targetPriceCents;
  const scenarioContributionCents =
    scenario.contributionOverrideCents ?? dossier.project.contributionCents;
  const netSellerPriceCents = roundCents(
    scenarioPriceCents * negotiationMultiplier,
  );
  const acquisitionFeesCents = roundCents(
    (netSellerPriceCents * dossier.project.acquisitionFeeBasisPoints) / 10_000,
  );
  const totalProjectCostCents =
    netSellerPriceCents +
    acquisitionFeesCents +
    dossier.project.renovationCents +
    (dossier.project.financingFeesCents ?? 0);
  const principalCents = Math.max(
    0,
    totalProjectCostCents - scenarioContributionCents,
  );
  const additionalPrincipalCents = Math.min(
    principalCents,
    scenario.additionalLoanComponents.reduce(
      (total, component) => total + component.amountCents,
      0,
    ),
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
    ...scenario.additionalLoanComponents.map((component) =>
      loanComponentResult({
        id: component.id,
        label: component.label,
        kind: "additional",
        principalCents: component.amountCents,
        annualRateBasisPoints: component.annualRateBasisPoints,
        durationMonths: component.durationMonths,
        deferredMonths: component.deferredMonths,
      }),
    ),
  ];
  const activeComponents = loanComponents.filter(
    (component) => component.principalCents > 0,
  );
  const maximumCalendarDurationMonths = activeComponents.reduce(
    (maximum, component) => Math.max(maximum, component.totalDurationMonths),
    0,
  );
  const monthlyTimeline = Array.from(
    { length: maximumCalendarDurationMonths },
    (_, index) => {
      const month = index + 1;
      return {
        month,
        paymentExcludingInsuranceCents: activeComponents.reduce(
          (total, component) =>
            total +
            deferredLoanPaymentCents(
              component.principalCents,
              component.annualRateBasisPoints,
              component.durationMonths,
              component.deferredMonths,
              month,
            ),
          0,
        ),
      };
    },
  );
  const initialMonthlyPaymentExcludingInsuranceCents =
    monthlyTimeline[0]?.paymentExcludingInsuranceCents ?? 0;
  const maximumPaymentPoint = monthlyTimeline.reduce(
    (maximum, point) =>
      point.paymentExcludingInsuranceCents >
      maximum.paymentExcludingInsuranceCents
        ? point
        : maximum,
    { month: 1, paymentExcludingInsuranceCents: 0 },
  );
  const maximumMonthlyPaymentExcludingInsuranceCents =
    maximumPaymentPoint.paymentExcludingInsuranceCents;
  const monthlyInsuranceCents = roundCents(
    (principalCents * scenario.insuranceAnnualBasisPoints) / 10_000 / 12,
  );
  const initialMonthlyPaymentIncludingInsuranceCents =
    initialMonthlyPaymentExcludingInsuranceCents + monthlyInsuranceCents;
  const maximumMonthlyPaymentIncludingInsuranceCents =
    maximumMonthlyPaymentExcludingInsuranceCents + monthlyInsuranceCents;
  const timeline = monthlyTimeline.map((point) => {
    const date = monthDate(dossier.project.targetPurchaseDate, point.month - 1);
    return {
      month: point.month,
      date,
      mortgageCents:
        point.paymentExcludingInsuranceCents + monthlyInsuranceCents,
      existingDebtCents: debtAtDate(dossier, date, false),
    };
  });
  const annualCreditChargesCents: number[] = [];
  for (const point of timeline) {
    const year = Math.floor((point.month - 1) / 12);
    annualCreditChargesCents[year] =
      (annualCreditChargesCents[year] ?? 0) +
      point.mortgageCents +
      debtAtDate(dossier, point.date);
  }
  const maximumAnnualChargesCents = Math.max(0, ...annualCreditChargesCents);

  const remainingPrincipalByYearCents = Object.fromEntries(
    [6, 8, 15, 17, 20, 25]
      .filter((year) => year * 12 <= maximumCalendarDurationMonths)
      .map((year) => {
        const elapsedMonths = year * 12;
        return [
          String(year),
          activeComponents.reduce(
            (total, component) =>
              total +
              remainingPrincipalAfterDefermentCents(
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
    contributionCents: scenarioContributionCents,
    ...calculateReserve(
      dossier,
      projectedLiquidityAtPurchaseCents,
      scenarioContributionCents,
    ),
    maximumCombinedMonthlyCreditCents: Math.max(
      0,
      ...timeline.map((point) => point.mortgageCents + point.existingDebtCents),
    ),
    annualCreditChargesCents,
    monthlyTimeline: timeline,
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
    effortRateCentralBasisPoints:
      incomeCentralCents > 0
        ? roundCents(
            (maximumAnnualChargesCents / (incomeCentralCents * 12)) * 10_000,
          )
        : 0,
    effortRatePrudentBasisPoints:
      incomePrudentCents > 0
        ? roundCents(
            (maximumAnnualChargesCents / (incomePrudentCents * 12)) * 10_000,
          )
        : 0,
    remainingPrincipalByYearCents,
  };
}

export function calculateDossier(dossier: Dossier): DerivedDossier {
  // Financing always uses contracts active at purchase; the preparatory reading
  // keeps its own reference date in incomePresentation.
  const incomePeriods = (dossier.incomePeriods ?? []).map((period) =>
    calculateIncomePeriod(dossier, period),
  );
  const bankIncome = calculateBankIncome(dossier, incomePeriods);
  const bankDate = dossier.project.targetPurchaseDate;
  const includedIncomes = dossier.incomeStreams.filter(
    (income) =>
      income.includedInBorrowingCapacity &&
      (!income.startDate || income.startDate <= bankDate) &&
      (!income.endDate || income.endDate >= bankDate),
  );
  const incomeCentralCents = includedIncomes.reduce(
    (total, income) => total + bankIncome[income.id]!.primaryCents,
    0,
  );
  const incomePrudentCents = includedIncomes.reduce(
    (total, income) => total + bankIncome[income.id]!.prudentCents,
    0,
  );
  const totalAssetsCents = dossier.assets.reduce(
    (total, asset) => total + asset.amountCents,
    0,
  );
  const liquidAssetsCents = dossier.assets
    .filter((asset) => asset.liquid)
    .reduce((total, asset) => total + asset.amountCents, 0);
  const contributionAssets = dossier.assets.filter(
    (asset) => asset.availableForContribution,
  );
  const contributionLiquidityCents = contributionAssets.reduce(
    (total, asset) =>
      total + (asset.contributionAmountCents ?? asset.amountCents),
    0,
  );
  const projectionMonths = Math.max(
    0,
    monthsBetween(
      dossier.metadata.observationDate,
      dossier.project.targetPurchaseDate,
    ),
  );
  const taxProjections = calculateTaxProjections(dossier, incomePeriods);
  const cashFlow = calculateCashFlow(
    dossier,
    contributionLiquidityCents,
    incomePeriods,
  );
  const projectedLiquidityAtPurchaseCents = dossier.cashFlowPlan
    ? (cashFlow.at(-1)?.balanceCents ?? contributionLiquidityCents)
    : (dossier.project.expectedLiquidityAtPurchaseCents ??
      contributionLiquidityCents +
        (dossier.project.monthlySavingsProjectionCents ?? 0) *
          projectionMonths);
  const existingMonthlyDebtNowCents = debtAtDate(
    dossier,
    dossier.metadata.observationDate,
  );
  const existingMonthlyDebtAtPurchaseCents = debtAtDate(
    dossier,
    dossier.project.targetPurchaseDate,
  );
  const budgetTotalsCents = Object.fromEntries(
    dossier.budgetScenarios.map((budget) => [
      budget.id,
      budget.items
        .filter((item) => !item.liabilityId)
        .reduce((total, item) => total + item.amountCents, 0),
    ]),
  );
  const highlighted =
    dossier.financingScenarios.find((scenario) => scenario.highlighted) ??
    dossier.financingScenarios[0];
  if (!highlighted)
    throw new Error("Au moins un scénario de financement est requis.");
  const financingScenarios = dossier.financingScenarios.map((scenario) =>
    calculateScenario(
      dossier,
      scenario,
      incomeCentralCents,
      incomePrudentCents,
      existingMonthlyDebtAtPurchaseCents,
      projectedLiquidityAtPurchaseCents,
    ),
  );
  const highlightedResult = financingScenarios.find(
    (scenario) => scenario.id === highlighted.id,
  );
  if (!highlightedResult)
    throw new Error("Le scénario mis en avant est introuvable.");

  const budgetScenarioResults = dossier.budgetScenarios.map((budget) => {
    const financingScenarioId =
      budget.assumptions.financingScenarioId ?? highlighted.id;
    const financingScenario = financingScenarios.find(
      (scenario) => scenario.id === financingScenarioId,
    );
    if (!financingScenario) {
      throw new Error(
        `Le budget « ${budget.label} » référence un scénario de financement introuvable : ${financingScenarioId}.`,
      );
    }
    const sources = budget.assumptions.incomePeriodIds ?? [];
    const date =
      budget.kind === "current"
        ? dossier.metadata.observationDate
        : dossier.project.targetPurchaseDate;
    const peopleIncome = dossier.household.people
      .filter((person) => person.role !== "dependent")
      .map((person) => ({
        label: person.displayName.split(/\s+/)[0] ?? person.displayName,
        value: sources.length
          ? (dossier.incomePeriods ?? [])
              .filter(
                (period) =>
                  sources.includes(period.id) &&
                  dossier.incomeStreams.some(
                    (stream) =>
                      stream.id === period.incomeStreamId &&
                      stream.personId === person.id,
                  ),
              )
              .reduce(
                (sum, period) =>
                  sum +
                  (incomePeriods.find((result) => result.id === period.id)
                    ?.monthlyEconomicIncomeCents ?? 0),
                0,
              )
          : dossier.incomeStreams
              .filter(
                (stream) =>
                  stream.personId === person.id &&
                  (!stream.startDate || stream.startDate <= date) &&
                  (!stream.endDate || stream.endDate >= date),
              )
              .reduce(
                (sum, stream) =>
                  sum +
                  (stream.monthlyEconomicCents ??
                    bankIncome[stream.id]!.primaryCents),
                0,
              ),
      }))
      .filter((person) => person.value > 0);
    const beforeTaxIncomeCents = sources.length
      ? peopleIncome.reduce((sum, person) => sum + person.value, 0)
      : (budget.assumptions.beforeTaxIncomeCents ??
        peopleIncome.reduce((sum, person) => sum + person.value, 0));
    const taxProjection = taxProjections.find(
      (item) => item.budgetId === budget.id,
    );
    const incomeCents =
      sources.length || taxProjection
        ? Math.max(
            0,
            beforeTaxIncomeCents -
              (taxProjection?.monthlyTaxCents ??
                budget.assumptions.monthlyIncomeTaxCents ??
                0),
          )
        : (budget.assumptions.afterTaxIncomeCents ??
          dossier.estimatedHouseholdAfterTaxIncomeCents);
    const current = budget.kind === "current";
    const debtCents =
      current && !budget.items.some((item) => item.liabilityId)
        ? 0
        : debtAtDate(dossier, date, false);
    return {
      budget,
      incomeCents,
      beforeTaxIncomeCents,
      peopleIncome:
        beforeTaxIncomeCents ===
        peopleIncome.reduce((sum, item) => sum + item.value, 0)
          ? peopleIncome
          : [{ label: "Foyer", value: beforeTaxIncomeCents }],
      debtCents,
      paymentCents: current
        ? 0
        : financingScenario.initialMonthlyPaymentIncludingInsuranceCents,
      financingScenario,
    };
  });
  const budgetIncomeCents = Object.fromEntries(
    budgetScenarioResults.map(({ budget, incomeCents }) => [
      budget.id,
      incomeCents,
    ]),
  );
  const budgetFinancingPaymentCents = Object.fromEntries(
    budgetScenarioResults.map(({ budget, paymentCents }) => [
      budget.id,
      paymentCents,
    ]),
  );
  const residualSavingsCents = Object.fromEntries(
    budgetScenarioResults.map(
      ({ budget, incomeCents, paymentCents, debtCents }) => [
        budget.id,
        incomeCents -
          (budgetTotalsCents[budget.id] ?? 0) -
          debtCents -
          paymentCents,
      ],
    ),
  );
  const budgetBeforeTaxIncomeCents = Object.fromEntries(
    budgetScenarioResults.map((item) => [
      item.budget.id,
      item.beforeTaxIncomeCents,
    ]),
  );
  const budgetDebtCents = Object.fromEntries(
    budgetScenarioResults.map((item) => [item.budget.id, item.debtCents]),
  );
  const budgetPeopleIncomeCents = Object.fromEntries(
    budgetScenarioResults.map((item) => [item.budget.id, item.peopleIncome]),
  );
  const savingsCapacityCents = Object.fromEntries(
    budgetScenarioResults.map(({ budget }) => [
      budget.id,
      (residualSavingsCents[budget.id] ?? 0) +
        budget.items
          .filter((item) => item.group === "savings" && !item.liabilityId)
          .reduce((sum, item) => sum + item.amountCents, 0),
    ]),
  );
  const budgetSavingsPhases = Object.fromEntries(
    budgetScenarioResults.map(({ budget, financingScenario, incomeCents }) => {
      const phases: {
        date: string;
        mortgageCents: number;
        debtCents: number;
        savingsCents: number;
      }[] = [];
      if (budget.kind !== "current")
        for (const point of financingScenario.monthlyTimeline) {
          const previous = phases.at(-1);
          if (
            !previous ||
            previous.mortgageCents !== point.mortgageCents ||
            previous.debtCents !== point.existingDebtCents
          )
            phases.push({
              date: point.date,
              mortgageCents: point.mortgageCents,
              debtCents: point.existingDebtCents,
              savingsCents:
                incomeCents -
                (budgetTotalsCents[budget.id] ?? 0) -
                point.mortgageCents -
                point.existingDebtCents,
            });
        }
      return [budget.id, phases];
    }),
  );

  const prepaymentComparisons = dossier.liabilities
    .filter(
      (item) =>
        item.settlementAtPurchaseCents !== undefined &&
        (!item.startDate ||
          item.startDate <= dossier.project.targetPurchaseDate) &&
        (!item.endDate || item.endDate >= dossier.project.targetPurchaseDate),
    )
    .map((liability) => {
      const settlementCents = liability.settlementAtPurchaseCents!;
      const comparison = calculateScenario(
        {
          ...dossier,
          liabilities: dossier.liabilities.filter(
            (item) => item.id !== liability.id,
          ),
        },
        highlighted,
        incomeCentralCents,
        incomePrudentCents,
        Math.max(
          0,
          existingMonthlyDebtAtPurchaseCents - liability.monthlyPaymentCents,
        ),
        projectedLiquidityAtPurchaseCents - settlementCents,
      );
      return {
        liabilityId: liability.id,
        label: liability.label,
        settlementCents,
        releasedMonthlyCents: liability.monthlyPaymentCents,
        reserveCents: comparison.reserveAfterPurchaseCents,
        freeReserveCents: comparison.freeReserveAfterPurchaseCents,
        reserveForObjectiveCents: comparison.reserveForObjectiveCents,
        effortBasisPoints: comparison.effortRateCentralBasisPoints,
      };
    });
  const incomePresentation = calculateIncomePresentation(
    dossier,
    incomePeriods,
    budgetBeforeTaxIncomeCents[
      dossier.budgetScenarios.find((budget) => budget.kind === "central")!.id
    ] ?? 0,
    budgetIncomeCents[
      dossier.budgetScenarios.find((budget) => budget.kind === "central")!.id
    ] ?? 0,
  );
  const effortForIncome = (income: number) =>
    income > 0
      ? Math.round(
          (Math.max(...highlightedResult.annualCreditChargesCents) /
            (income * 12)) *
            10_000,
        )
      : 0;
  const bankReadingEffortBasisPoints = {
    now: effortForIncome(incomePresentation.bankNowCents),
    prudentReference: effortForIncome(incomePresentation.prudentCents),
    atPurchase: effortForIncome(incomePresentation.bankAtPurchaseCents),
    projected:
      incomePresentation.fiscalCents === undefined
        ? undefined
        : effortForIncome(incomePresentation.fiscalCents),
  };
  const budgetProvenance: Record<string, MetricProvenance> = {};
  for (const { budget, financingScenario } of budgetScenarioResults) {
    const usesPeriods = Boolean(budget.assumptions.incomePeriodIds?.length);
    const usesExplicitIncome =
      budget.assumptions.afterTaxIncomeCents !== undefined;
    const usesExplicitFinancing =
      budget.assumptions.financingScenarioId !== undefined;
    budgetProvenance[`budgetTotalsCents.${budget.id}`] = {
      formula: "Σ postes du budget",
      sourceIds: budget.items.map((item) => item.id),
    };
    budgetProvenance[`budgetIncomeCents.${budget.id}`] = {
      formula: usesPeriods
        ? "moyennes mensuelles économiques des périodes sélectionnées - IR mensuel estimé"
        : usesExplicitIncome
          ? "hypothèse de revenu net après impôt du budget"
          : "revenu net après impôt global (repli explicite)",
      sourceIds: [budget.id],
    };
    budgetProvenance[`budgetFinancingPaymentCents.${budget.id}`] = {
      formula:
        budget.kind === "current"
          ? "aucune mensualité immobilière future dans le budget actuel"
          : usesExplicitFinancing
            ? "mensualité initiale avec assurance du scénario de financement affecté au budget"
            : "mensualité initiale avec assurance du scénario mis en avant (repli explicite)",
      sourceIds: [financingScenario.id],
      scenarioId: financingScenario.id,
    };
    budgetProvenance[`residualSavingsCents.${budget.id}`] = {
      formula:
        "revenu du budget - postes hors crédits liés - crédits à la date du budget - mensualité immobilière initiale (zéro pour le budget actuel)",
      sourceIds: [
        budget.id,
        ...budget.items.map((item) => item.id),
        financingScenario.id,
      ],
      scenarioId: financingScenario.id,
      observedAt: dossier.project.targetPurchaseDate,
    };
  }

  return {
    incomePresentation,
    bankReview: calculateBankReview(
      dossier,
      projectedLiquidityAtPurchaseCents,
      contributionLiquidityCents,
      summarizeCashFlow(dossier, cashFlow, incomePeriods).length,
      budgetIncomeCents,
      budgetTotalsCents,
      budgetDebtCents,
      budgetFinancingPaymentCents,
      budgetPeopleIncomeCents,
    ),
    bankReadingEffortBasisPoints,
    turnoverHistory: calculateTurnoverHistory(dossier),
    taxProjections,
    prepaymentComparisons,
    incomeSummaries: summarizeIncomePeriods(dossier, incomePeriods),
    incomePeriods,
    cashFlow,
    monthlyCashFlow: summarizeCashFlow(dossier, cashFlow, incomePeriods),
    budgetBeforeTaxIncomeCents,
    budgetDebtCents,
    budgetPeopleIncomeCents,
    budgetSavingsPhases,
    savingsCapacityCents,
    incomeCentralCents,
    incomePrudentCents,
    totalAssetsCents,
    liquidAssetsCents,
    contributionLiquidityCents,
    projectedLiquidityAtPurchaseCents,
    ...calculateReserve(
      dossier,
      projectedLiquidityAtPurchaseCents,
      dossier.project.contributionCents,
    ),
    existingMonthlyDebtNowCents,
    existingMonthlyDebtAtPurchaseCents,
    budgetTotalsCents,
    budgetIncomeCents,
    budgetFinancingPaymentCents,
    residualSavingsCents,
    financingScenarios,
    highlightedScenarioId: highlighted.id,
    provenance: {
      incomeCentralCents: {
        formula: "Σ revenus bancaires des contrats actifs à la date d’achat",
        sourceIds: includedIncomes.map((income) => income.id),
        observedAt: dossier.metadata.observationDate,
      },
      incomePrudentCents: {
        formula: "Σ revenus prudents des contrats actifs à la date d’achat",
        sourceIds: includedIncomes.map((income) => income.id),
        observedAt: dossier.metadata.observationDate,
      },
      totalAssetsCents: {
        formula: "Σ actifs déclarés",
        sourceIds: dossier.assets.map((asset) => asset.id),
        observedAt: dossier.metadata.observationDate,
      },
      contributionLiquidityCents: {
        formula: "Σ actifs mobilisables",
        sourceIds: contributionAssets.map((asset) => asset.id),
        observedAt: dossier.metadata.observationDate,
      },
      projectedLiquidityAtPurchaseCents: {
        formula: dossier.cashFlowPlan
          ? "liquidités mobilisables + encaissements futurs nets de cotisations et frais - dépenses et provisions datées"
          : "liquidités mobilisables + épargne mensuelle × mois jusqu'à l'achat, sauf hypothèse explicite",
        sourceIds: contributionAssets.map((asset) => asset.id),
        observedAt: dossier.project.targetPurchaseDate,
      },
      reserveAfterPurchaseCents: {
        formula: "liquidités à l'achat - apport - installation",
        sourceIds: [dossier.project.id],
        observedAt: dossier.project.targetPurchaseDate,
      },
      ...budgetProvenance,
    },
  };
}
