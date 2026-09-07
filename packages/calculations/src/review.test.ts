import { describe, expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { validateDossier } from "@dossier-immo/schema";
import { calculateDossier } from "./index";
import { incomeTaxAt2026Scale } from "./tax";
import { calculateTurnoverHistory } from "./history";

describe("étude préparatoire et hypothèses de financement", () => {
  it("sépare la date de référence bancaire et la fin effective du salaire", () => {
    const dossier = structuredClone(completeDemoDossier);
    const salary = dossier.incomeStreams.find(
      (item) => item.kind === "salary",
    )!;
    salary.endDate = "2027-03-26";
    const future = calculateDossier(dossier);
    dossier.project.bankIncomeReferenceDate = dossier.metadata.observationDate;
    const current = calculateDossier(dossier);
    expect(current.incomeCentralCents).toBe(future.incomeCentralCents);
    expect(current.incomePresentation.bankCents).toBe(
      future.incomeCentralCents + salary.monthlyBankCents,
    );
    expect(current.incomePresentation.prudentCents).toBe(
      future.incomePrudentCents + salary.monthlyPrudentCents,
    );
    expect(
      current.incomePresentation.cards.find((card) => card.id === "bank")!
        .valueCents,
    ).toBe(future.incomeCentralCents + salary.monthlyBankCents);
    expect(current.financingScenarios[0]!.effortRateCentralBasisPoints).toBe(
      future.financingScenarios[0]!.effortRateCentralBasisPoints,
    );
    expect(current.incomePresentation.bankAtPurchaseCents).toBe(
      future.incomeCentralCents,
    );
  });
  it("finance les frais et soustrait le décompte auto de la réserve sans double financement", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.project.financingFeesCents = 300_000;
    const debt = dossier.liabilities[0]!;
    debt.settlementAtPurchaseCents = 200_000;
    debt.endDate = "2029-05-10";
    const result = calculateDossier(dossier);
    const reference = result.financingScenarios.find(
      (item) => item.id === result.highlightedScenarioId,
    )!;
    expect(result.prepaymentComparisons[0]!.reserveCents).toBe(
      reference.reserveAfterPurchaseCents - 200_000,
    );
    expect(result.prepaymentComparisons[0]!.effortBasisPoints).toBeLessThan(
      reference.effortRateCentralBasisPoints,
    );
    dossier.project.financingFeesCents = 0;
    const withoutFees = calculateDossier(dossier).financingScenarios.find(
      (item) => item.id === result.highlightedScenarioId,
    )!;
    expect(reference.principalCents).toBe(withoutFees.principalCents + 300_000);
  });
  it("applique le quotient et les tranches du barème de référence", () => {
    expect(incomeTaxAt2026Scale(2_320_000, 2)).toBe(0);
    expect(incomeTaxAt2026Scale(3_000_000, 1)).toBe(210_400);
    expect(incomeTaxAt2026Scale(10_246_500, 2)).toBe(1_694_700);
  });
  it("calcule la provision à partir du CA et rejette les hypothèses fiscales contradictoires", () => {
    const dossier = structuredClone(completeDemoDossier);
    const stream = dossier.incomeStreams[0]!;
    dossier.incomePeriods = [
      {
        id: "annual-reference",
        incomeStreamId: stream.id,
        label: "Année fictive",
        startDate: "2027-01-01",
        endDate: "2027-12-31",
        status: "run-rate",
        basis: "amount",
        amountCents: 12_000_000,
        socialRateBasisPoints: 2500,
        trainingRateBasisPoints: 0,
        professionalExpensesCents: 0,
        taxAllowanceBasisPoints: 3400,
        sourceDocumentIds: [],
      },
    ];
    const budget = dossier.budgetScenarios.find(
      (item) => item.kind === "central",
    )!;
    budget.assumptions = {
      incomePeriodIds: ["annual-reference"],
      taxProjection: {
        parts: 2,
        incomePeriodIds: ["annual-reference"],
        annualSalaryNetTaxableCents: 0,
        annualOtherTaxableCents: 0,
        note: "Référence annuelle",
      },
      note: "Exemple fictif",
    };
    expect(validateDossier(dossier).success).toBe(true);
    const result = calculateDossier(dossier);
    expect(result.taxProjections[0]!.taxableCents).toBe(7_920_000);
    expect(result.budgetIncomeCents[budget.id]).toBe(
      750_000 - result.taxProjections[0]!.monthlyTaxCents,
    );
    const duplicate = {
      ...dossier.incomePeriods[0]!,
      id: "overlapping-reference",
    };
    dossier.incomePeriods.push(duplicate);
    budget.assumptions.taxProjection!.incomePeriodIds.push(duplicate.id);
    expect(validateDossier(dossier).success).toBe(false);
    budget.assumptions.taxProjection!.incomePeriodIds.pop();
    dossier.incomePeriods.pop();
    budget.assumptions.monthlyIncomeTaxCents = 1;
    expect(validateDossier(dossier).success).toBe(false);
  });
  it("compare les mois communs et conserve les mois futurs absents", () => {
    const dossier = structuredClone(completeDemoDossier);
    const streamId = dossier.incomeStreams[0]!.id;
    dossier.revenueHistory = [
      ["2025-01", 100],
      ["2025-02", 200],
      ["2026-01", 300],
    ].map(([period, cents], index) => ({
      id: `history-${index}`,
      incomeStreamId: streamId,
      period: String(period),
      turnoverCents: Number(cents),
      collectedCents: Number(cents),
      expensesCents: 0,
      resultCents: Number(cents),
      observed: true,
    }));
    const history = calculateTurnoverHistory(dossier)[0]!;
    expect(history.commonMonthCount).toBe(1);
    expect(history.comparableTotals.map((item) => item.cents)).toEqual([
      100, 300,
    ]);
    expect(history.series[1]!.values[1]).toBeUndefined();
  });
  it("hachure les prévisions à encaissement daté sans écraser le réalisé ni ajouter le rythme annuel", () => {
    const dossier = structuredClone(completeDemoDossier);
    const incomeStreamId = dossier.incomeStreams[0]!.id;
    dossier.revenueHistory = [2025, 2026].map((year) => ({
      id: `actual-${year}`,
      incomeStreamId,
      period: `${year}-01`,
      turnoverCents: 10000,
      collectedCents: 10000,
      expensesCents: 0,
      resultCents: 10000,
      observed: true,
    }));
    const period = {
      id: "forecast-cash",
      incomeStreamId,
      label: "Facture fictive",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      collectionDate: "2027-01-15",
      status: "forecast" as const,
      basis: "amount" as const,
      amountCents: 30000,
      socialRateBasisPoints: 0,
      trainingRateBasisPoints: 0,
      professionalExpensesCents: 0,
      sourceDocumentIds: [],
    };
    dossier.incomePeriods = [
      period,
      { ...period, id: "duplicate-observed", collectionDate: "2026-01-15" },
      {
        ...period,
        id: "annual-run",
        status: "run-rate",
        collectionDate: undefined,
      },
    ];
    const history = calculateTurnoverHistory(dossier)[0]!;
    expect(history.series.map((series) => series.year)).toEqual([
      "2025",
      "2026",
      "2027",
    ]);
    expect(history.series[1]!.forecastValues[0]).toBeUndefined();
    expect(history.series[2]!.forecastValues[0]).toBe(30000);
    expect(history.series[2]!.values[0]).toBeUndefined();
    expect(history.comparableTotals.map((item) => item.cents)).toEqual([
      10000, 10000,
    ]);
  });
  it("conserve une enveloppe fiscale dans les liquidités, distincte de la réserve libre", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.cashFlowPlan = {
      note: "Réserve fiscale future",
      entries: [],
      reservedTaxCents: 100000,
    };
    const withReserve = calculateDossier(dossier);
    dossier.cashFlowPlan.reservedTaxCents = 0;
    const withoutReserve = calculateDossier(dossier);
    expect(withReserve.projectedLiquidityAtPurchaseCents).toBe(
      withoutReserve.projectedLiquidityAtPurchaseCents,
    );
    expect(withReserve.reserveAfterPurchaseCents).toBe(
      withoutReserve.reserveAfterPurchaseCents,
    );
    expect(withReserve.freeReserveAfterPurchaseCents).toBe(
      withoutReserve.freeReserveAfterPurchaseCents - 100000,
    );
    expect(
      withReserve.financingScenarios[0]!.freeReserveAfterPurchaseCents,
    ).toBe(
      withReserve.financingScenarios[0]!.reserveAfterPurchaseCents - 100000,
    );
    expect(withReserve.monthlyCashFlow).toHaveLength(0);
  });
  it("sépare les prélèvements fiscaux des provisions sans modifier le disponible", () => {
    const dossier = structuredClone(completeDemoDossier);
    const date = dossier.project.targetPurchaseDate;
    dossier.cashFlowPlan = {
      note: "Hypothèses fictives",
      entries: [
        {
          id: "tax-payment",
          date,
          label: "Acompte",
          direction: "expense",
          category: "income-tax",
          amountCents: 80000,
        },
        {
          id: "tax-saving",
          date,
          label: "Provision",
          direction: "expense",
          category: "income-tax",
          amountCents: 60000,
          isProvision: true,
        },
      ],
    };
    const result = calculateDossier(dossier);
    expect(result.monthlyCashFlow[0]!.incomeTaxCents).toBe(80000);
    expect(result.monthlyCashFlow[0]!.taxProvisionCents).toBe(60000);
    expect(result.projectedLiquidityAtPurchaseCents).toBe(
      result.contributionLiquidityCents - 140000,
    );
  });
});
