import { describe, expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { calculateDossier } from "./index";

describe("lecture économique et bancaire des revenus", () => {
  it("nomme le salaire ajouté aux CA et conserve les exercices qui expliquent les bases", () => {
    const dossier = structuredClone(completeDemoDossier);
    const independent = dossier.incomeStreams.find((stream) =>
      ["liberal", "self-employed"].includes(stream.kind),
    )!;
    const salary = dossier.incomeStreams.find(
      (stream) => stream.kind === "salary",
    )!;
    salary.label = "Salaire du CDD de Camille";
    salary.endDate = "2027-03-31";
    salary.monthlyBankCents = salary.monthlyPrudentCents = 100_000;
    dossier.project.bankIncomeReferenceDate = "2026-09-01";
    dossier.incomeStreams.forEach((stream) => {
      stream.includedInBorrowingCapacity = [independent.id, salary.id].includes(
        stream.id,
      );
    });
    independent.bankingBasis = {
      referenceYear: 2026,
      allowanceBasisPoints: 3400,
    };
    dossier.incomePeriods = [2025, 2026].map((year) => ({
      id: `example-${year}`,
      incomeStreamId: independent.id,
      label: `Exercice fictif ${year}`,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      status: year === 2025 ? "observed" : "forecast",
      basis: "amount",
      amountCents: year === 2025 ? 6_000_000 : 9_000_000,
      socialRateBasisPoints: 2500,
      trainingRateBasisPoints: 0,
      professionalExpensesCents: 0,
      sourceDocumentIds: [],
    }));
    const reading = calculateDossier(dossier).incomePresentation;
    expect(reading.bankCents).toBe(595_000);
    expect(reading.prudentCents).toBe(512_500);
    expect(reading.rows.find((row) => row.id === independent.id)).toMatchObject(
      {
        referenceRevenueCents: 9_000_000,
        previousRevenueCents: 6_000_000,
      },
    );
    for (const card of reading.cards.filter((card) => card.id !== "economic")) {
      expect(card.explanation).toContain("+ Salaire du CDD de Camille");
      expect(card.explanation).not.toContain("autres revenus");
    }
    dossier.project.bankIncomeReferenceDate = "2027-05-01";
    const atPurchase = calculateDossier(dossier).incomePresentation;
    expect(atPurchase.bankCents).toBe(495_000);
    expect(
      atPurchase.cards.find((card) => card.id === "bank")!.explanation,
    ).not.toContain(salary.label);
  });

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
      "Revenu net avant impôt — après achat",
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
