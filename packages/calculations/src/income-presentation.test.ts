import { describe, expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { calculateDossier } from "./index";

describe("lecture économique et bancaire des revenus", () => {
  it("présente les montants par ordre décroissant et sépare l'IR du revenu économique", () => {
    const dossier = structuredClone(completeDemoDossier);
    const budget = dossier.budgetScenarios.find(
      (item) => item.kind === "central",
    )!;
    const stream = dossier.incomeStreams[0]!;
    dossier.incomePeriods = [
      {
        id: "projected-year",
        incomeStreamId: stream.id,
        label: "Rythme annuel projeté fictif",
        startDate: "2027-01-01",
        endDate: "2027-12-31",
        status: "run-rate",
        basis: "amount",
        amountCents: 12_000_000,
        socialRateBasisPoints: 2_500,
        trainingRateBasisPoints: 0,
        professionalExpensesCents: 0,
        taxAllowanceBasisPoints: 3_400,
        sourceDocumentIds: [],
      },
    ];
    budget.assumptions = {
      incomePeriodIds: ["projected-year"],
      monthlyIncomeTaxCents: 100_000,
      note: "Exemple fictif",
    };
    const result = calculateDossier(dossier);
    expect(
      result.incomePresentation.cards.map((card) => card.valueCents),
    ).toEqual([750_000, 642_000, 617_000]);
    expect(result.incomePresentation.cards[0]!.label).toBe(
      "Revenu économique projeté",
    );
    expect(result.incomePresentation.afterTaxCents).toBe(650_000);
    expect(result.incomePresentation.fiscalCents).toBe(660_000);
    expect(
      result.incomePresentation.people[stream.personId]!.economicCents,
    ).toBe(750_000);
    expect(result.incomeCentralCents).toBe(642_000);
  });

  it("ne conserve pas le CDD échu dans la synthèse individuelle ou les tableaux bancaires", () => {
    const dossier = structuredClone(completeDemoDossier);
    const stream = dossier.incomeStreams.find(
      (item) => item.kind === "salary",
    )!;
    stream.endDate = "2027-03-26";
    const result = calculateDossier(dossier);
    const row = result.incomePresentation.rows.find(
      (item) => item.id === stream.id,
    )!;
    expect(row.included).toBe(false);
    expect(row.bankCents).toBe(0);
    expect(row.prudentCents).toBe(0);
    expect(
      Object.values(result.incomePresentation.people).reduce(
        (sum, person) => sum + person.bankCents,
        0,
      ),
    ).toBe(result.incomeCentralCents);
    expect(
      Object.values(result.incomePresentation.people).reduce(
        (sum, person) => sum + person.prudentCents,
        0,
      ),
    ).toBe(result.incomePrudentCents);
  });

  it("ne renomme pas une base bancaire héritée en revenu économique réel", () => {
    const result = calculateDossier(completeDemoDossier);
    expect(result.incomePresentation.hasEconomicBasis).toBe(false);
    expect(
      result.incomePresentation.cards.find((card) => card.id === "economic")!
        .label,
    ).toBe("Budget après IR");
    const amounts = result.incomePresentation.cards.map(
      (card) => card.valueCents,
    );
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });
});
