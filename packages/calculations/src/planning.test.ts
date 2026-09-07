import { describe, expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import {
  validateDossier,
  type Dossier,
  type IncomePeriod,
} from "@dossier-immo/schema";
import { calculateDossier, calculateIncomePeriod } from "./index";

function period(overrides: Partial<IncomePeriod> = {}): IncomePeriod {
  return {
    id: "practice-year",
    incomeStreamId: completeDemoDossier.incomeStreams[0]!.id,
    label: "Exercice de référence fictif",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    status: "observed",
    basis: "amount",
    amountCents: 6_000_000,
    socialRateBasisPoints: 2_300,
    trainingRateBasisPoints: 20,
    professionalExpensesCents: 240_000,
    taxAllowanceBasisPoints: 3_400,
    sourceDocumentIds: [],
    ...overrides,
  };
}

function example(): Dossier {
  const dossier = structuredClone(completeDemoDossier);
  dossier.incomePeriods = [period()];
  return dossier;
}

describe("revenus datés et épargne", () => {
  it("sépare CA, revenu économique et base fiscale sans double déduction", () => {
    const result = calculateIncomePeriod(example(), period());
    expect(result.socialContributionsCents).toBe(1_392_000);
    expect(result.economicIncomeCents).toBe(4_368_000);
    expect(result.taxableIncomeCents).toBe(3_960_000);
    expect(result.monthlyEconomicIncomeCents).toBe(364_000);
    expect(
      calculateIncomePeriod(
        example(),
        period({ socialContributionsPaidCents: 700_000 }),
      ).economicIncomeCents,
    ).toBe(5_060_000);
  });

  it("n'applique pas un minimum annuel d'abattement à chaque mois", () => {
    expect(
      calculateIncomePeriod(
        example(),
        period({
          amountCents: 50_000,
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).taxableIncomeCents,
    ).toBe(33_000);
  });

  it("applique le changement daté de tarif sans confondre facturation et encaissement", () => {
    const dossier = example();
    const stream = dossier.incomeStreams[0]!;
    dossier.professionalActivities.find(
      (activity) => activity.id === stream.activityId,
    )!.compensationModel = {
      kind: "day-rate",
      dailyRateCents: 50_000,
      projection: { effectiveDate: "2027-01-01", amountCents: 52_000 },
    };
    const before = period({
      basis: "days",
      amountCents: undefined,
      units: 20,
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      collectionDate: "2027-02-15",
      status: "forecast",
    });
    expect(calculateIncomePeriod(dossier, before).revenueCents).toBe(1_000_000);
    expect(
      calculateIncomePeriod(dossier, {
        ...before,
        startDate: "2027-01-01",
        endDate: "2027-01-31",
      }).revenueCents,
    ).toBe(1_040_000);
  });

  it("projette la trésorerie nette une seule fois et rejette un second encaissement de la même période", () => {
    const dossier = example();
    delete dossier.project.expectedLiquidityAtPurchaseCents;
    delete dossier.project.monthlySavingsProjectionCents;
    dossier.project.contributionCents = 5_000_000;
    dossier.financingScenarios.forEach((scenario) => {
      delete scenario.contributionOverrideCents;
    });
    dossier.incomePeriods = [
      period({
        id: "invoice",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        collectionDate: "2026-09-01",
        status: "invoiced",
      }),
    ];
    dossier.cashFlowPlan = {
      note: "Exemple fictif",
      entries: [
        {
          id: "receipt",
          date: "2026-09-01",
          label: "Facture à encaisser",
          direction: "income",
          category: "income",
          incomePeriodId: "invoice",
        },
        {
          id: "tax",
          date: "2026-09-15",
          label: "Solde fiscal",
          direction: "expense",
          category: "income-tax",
          amountCents: 200_000,
        },
      ],
    };
    expect(validateDossier(dossier).success).toBe(true);
    const result = calculateDossier(dossier);
    expect(result.projectedLiquidityAtPurchaseCents).toBe(
      result.contributionLiquidityCents + 4_368_000 - 200_000,
    );
    dossier.cashFlowPlan.entries.push({
      ...dossier.cashFlowPlan.entries[0]!,
      id: "duplicate",
    });
    expect(validateDossier(dossier).success).toBe(false);
  });

  it("calcule le budget depuis les périodes et interdit deux moyennes du même revenu", () => {
    const dossier = example();
    const budget = dossier.budgetScenarios.find(
      (item) => item.kind === "central",
    )!;
    budget.assumptions = {
      incomePeriodIds: ["practice-year"],
      monthlyIncomeTaxCents: 40_000,
      note: "Hypothèse fiscale fictive",
    };
    expect(validateDossier(dossier).success).toBe(true);
    expect(calculateDossier(dossier).budgetIncomeCents[budget.id]).toBe(
      324_000,
    );
    dossier.incomePeriods!.push(period({ id: "second-year" }));
    budget.assumptions.incomePeriodIds!.push("second-year");
    expect(validateDossier(dossier).success).toBe(false);
  });

  it("exclut un CDD échu avant l'achat de la capacité bancaire", () => {
    const dossier = example();
    const baseline = calculateDossier(dossier).incomeCentralCents;
    const stream = dossier.incomeStreams.find(
      (item) => item.includedInBorrowingCapacity,
    )!;
    stream.endDate = "2027-03-26";
    expect(calculateDossier(dossier).incomeCentralCents).toBe(
      baseline - stream.monthlyBankCents,
    );
  });

  it("ne déduit aucun futur prêt du budget actuel et compte une dette liée une seule fois", () => {
    const dossier = example();
    const budget = dossier.budgetScenarios.find(
      (item) => item.kind === "current",
    )!;
    budget.assumptions = { afterTaxIncomeCents: 500_000, note: "Fictif" };
    dossier.liabilities = [
      {
        id: "temporary-auto",
        label: "Auto fictive",
        category: "auto",
        borrowerIds: [dossier.household.people[0]!.id],
        monthlyPaymentCents: 20_000,
        outstandingCents: 300_000,
        includedInEffortRate: true,
        endDate: "2028-05-10",
      },
    ];
    budget.items = [
      {
        id: "living",
        label: "Vie courante",
        amountCents: 150_000,
        group: "living",
        showInSankey: true,
        adjustable: true,
      },
      {
        id: "auto",
        liabilityId: "temporary-auto",
        label: "Auto",
        amountCents: 20_000,
        group: "transport",
        showInSankey: true,
        adjustable: false,
      },
    ];
    const result = calculateDossier(dossier);
    expect(result.budgetFinancingPaymentCents[budget.id]).toBe(0);
    expect(result.residualSavingsCents[budget.id]).toBe(330_000);
    const central = dossier.budgetScenarios.find(
      (item) => item.kind === "central",
    )!;
    const phases = result.budgetSavingsPhases[central.id]!;
    const before = phases.find((item) => item.debtCents === 20_000)!;
    const after = phases.find((item) => item.debtCents === 0)!;
    expect(after.savingsCents - before.savingsCents).toBe(20_000);
  });

  it("ne cumule pas le pic futur du prêt différé avec une dette déjà éteinte", () => {
    const dossier = example();
    dossier.liabilities = [
      {
        id: "auto",
        label: "Auto",
        category: "auto",
        borrowerIds: [dossier.household.people[0]!.id],
        monthlyPaymentCents: 10_000,
        outstandingCents: 300_000,
        includedInEffortRate: true,
        endDate: "2028-05-10",
      },
    ];
    const result = calculateDossier(dossier);
    const scenario = result.financingScenarios.find(
      (item) => item.id === result.highlightedScenarioId,
    )!;
    expect(scenario.effortRateCentralBasisPoints).toBe(
      Math.round(
        (scenario.maximumMonthlyPaymentIncludingInsuranceCents /
          result.incomeCentralCents) *
          10_000,
      ),
    );
    expect(scenario.maximumCombinedMonthlyCreditCents).toBe(
      scenario.maximumMonthlyPaymentIncludingInsuranceCents,
    );
  });

  it("contrôle aussi la réserve d'un scénario d'apport alternatif", () => {
    const dossier = example();
    dossier.financingScenarios[0]!.contributionOverrideCents =
      dossier.project.expectedLiquidityAtPurchaseCents!;
    expect(validateDossier(dossier).success).toBe(false);
  });
});
