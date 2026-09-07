import { expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { validateDossier, type Dossier } from "@dossier-immo/schema";
import { calculateDossier } from "./index";

function example(): Dossier {
  const dossier = structuredClone(completeDemoDossier);
  const independent = dossier.incomeStreams.find((s) =>
    ["liberal", "self-employed"].includes(s.kind),
  )!;
  independent.bankingBasis = {
    referenceYear: 2026,
    allowanceBasisPoints: 3400,
  };
  independent.monthlyBankCents = 0;
  independent.monthlyPrudentCents = 0;
  dossier.incomePeriods = [2025, 2026].map((year) => ({
    id: `reference-${year}`,
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
  dossier.project.bankIncomeReferenceDate = dossier.metadata.observationDate;
  return dossier;
}

it("actualise les deux conventions et le financement quand le CA change", () => {
  const dossier = example();
  expect(validateDossier(dossier).success).toBe(true);
  const initial = calculateDossier(dossier);
  const row = initial.incomePresentation.rows.find(
    (r) => r.id === dossier.incomePeriods![0]!.incomeStreamId,
  )!;
  expect(row.bankCents).toBe(495_000);
  expect(row.prudentCents).toBe(412_500);
  dossier.incomePeriods![1]!.amountCents! += 1_200_000;
  const updated = calculateDossier(dossier);
  expect(updated.incomeCentralCents - initial.incomeCentralCents).toBe(66_000);
  expect(updated.incomePrudentCents - initial.incomePrudentCents).toBe(33_000);
  expect(
    updated.financingScenarios[0]!.effortRateCentralBasisPoints,
  ).toBeLessThan(initial.financingScenarios[0]!.effortRateCentralBasisPoints);
});

it("date le CDD sans faire passer automatiquement les prévisions en réalisé", () => {
  const dossier = example();
  const salary = dossier.incomeStreams.find((s) => s.kind === "salary")!;
  salary.endDate = "2027-03-26";
  const before = calculateDossier(dossier);
  expect(before.incomePresentation.bankCents - before.incomeCentralCents).toBe(
    salary.monthlyBankCents,
  );
  expect(
    before.incomePresentation.prudentCents - before.incomePrudentCents,
  ).toBe(salary.monthlyPrudentCents);
  dossier.project.bankIncomeReferenceDate = "2027-04-01";
  const after = calculateDossier(dossier);
  expect(after.incomePresentation.bankCents).toBe(after.incomeCentralCents);
  expect(after.incomePresentation.prudentCents).toBe(after.incomePrudentCents);
  expect(after.incomePresentation.hasBankForecast).toBe(true);
  expect(after.incomePresentation.primaryLabel).toBe("Base 2026");
  dossier.metadata.observationDate = "2027-04-01";
  dossier.incomePeriods![1]!.status = "observed";
  expect(calculateDossier(dossier).incomePresentation.hasBankForecast).toBe(
    false,
  );
});

it("affecte le CA à l’année d’encaissement, sans mélanger la facturation", () => {
  const dossier = example();
  const annual = dossier.incomePeriods![1]!;
  annual.startDate = "2026-02-01";
  annual.amountCents = 8_000_000;
  dossier.incomePeriods!.push({
    ...annual,
    id: "received-january",
    startDate: "2025-11-01",
    endDate: "2025-11-30",
    collectionDate: "2026-01-31",
    amountCents: 1_000_000,
  });
  expect(validateDossier(dossier).success).toBe(true);
  expect(
    calculateDossier(dossier).incomePresentation.rows.find(
      (r) => r.id === annual.incomeStreamId,
    )!.bankCents,
  ).toBe(495_000);
});

it("refuse un exercice manquant, un doublon ou des montants manuels concurrents", () => {
  const missing = example();
  missing.incomePeriods!.pop();
  expect(validateDossier(missing).success).toBe(false);
  const duplicate = example();
  duplicate.incomePeriods!.push({
    ...duplicate.incomePeriods![1]!,
    id: "duplicate-year",
  });
  expect(validateDossier(duplicate).success).toBe(false);
  const manual = example();
  manual.incomeStreams.find((s) => s.bankingBasis)!.monthlyBankCents = 500_000;
  expect(validateDossier(manual).success).toBe(false);
});
