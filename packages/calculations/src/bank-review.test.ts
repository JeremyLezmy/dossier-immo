import { expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { calculateBankReview } from "./bank-review";
import { calculateIncomePeriod, summarizeIncomePeriods } from "./planning";
import type { IncomePeriod } from "@dossier-immo/schema";

it("inclut le prêt immobilier dans une interruption de revenu et protège la réserve fiscale", () => {
  const dossier = structuredClone(completeDemoDossier);
  const central = dossier.budgetScenarios.find(
    (item) => item.kind === "central",
  )!.id;
  const stress = dossier.budgetScenarios.find(
    (item) => item.kind === "stress",
  )!.id;
  dossier.project.contributionCents = 8_000_000;
  dossier.project.installationCents = 800_000;
  dossier.cashFlowPlan = {
    note: "Provision fictive",
    reservedTaxCents: 1_000_000,
    entries: [],
  };
  const result = calculateBankReview(
    dossier,
    13_000_000,
    11_000_000,
    8,
    { [central]: 800_000, [stress]: 640_000 },
    { [central]: 260_000, [stress]: 312_000 },
    { [central]: 20_000 },
    { [central]: 180_000 },
    { [central]: [{ label: "Emprunteur fictif", value: 600_000 }] },
  );
  expect(result.interruption).toEqual({
    person: "Emprunteur fictif",
    months: 3,
    monthlyShortfallCents: 260_000,
    reserveAfterCents: 2_420_000,
  });
  expect(result.stressIncomeChangeBasisPoints).toBe(-2000);
  expect(result.stressExpenseChangeBasisPoints).toBe(2000);
  expect(result.monthlyCashGrowthCents).toBe(250_000);
});

it("conserve les charges payées dans le réalisé mais normalise toute la projection annuelle", () => {
  const dossier = structuredClone(completeDemoDossier);
  const observed: IncomePeriod = {
    id: "observed",
    incomeStreamId: dossier.incomeStreams[0]!.id,
    label: "Historique fictif",
    startDate: "2026-01-01",
    endDate: "2026-08-31",
    status: "observed",
    basis: "amount",
    amountCents: 4_000_000,
    socialRateBasisPoints: 2500,
    trainingRateBasisPoints: 20,
    socialContributionsPaidCents: 400_000,
    professionalExpensesCents: 80_000,
    sourceDocumentIds: [],
  };
  dossier.incomePeriods = [
    observed,
    {
      ...observed,
      id: "forecast",
      startDate: "2026-09-01",
      endDate: "2026-12-31",
      status: "forecast",
      amountCents: 2_000_000,
      socialContributionsPaidCents: undefined,
      professionalExpensesCents: 40_000,
    },
  ];
  const summaries = summarizeIncomePeriods(
    dossier,
    dossier.incomePeriods.map((period) =>
      calculateIncomePeriod(dossier, period),
    ),
  );
  expect(summaries[0]!.method).toBe("cash");
  expect(summaries[0]!.socialContributionsCents).toBe(400_000);
  expect(summaries[1]!.method).toBe("normalized");
  expect(summaries[1]!.socialContributionsCents).toBe(1_512_000);
  expect(summaries[1]!.economicIncomeCents).toBe(4_368_000);
});
