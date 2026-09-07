import { calculateBankIncome } from "./bank-income";
import type { Dossier } from "@dossier-immo/schema";
import type { IncomePeriodResult } from "./planning";

export function calculateIncomePresentation(
  dossier: Dossier,
  periods: readonly IncomePeriodResult[],
  beforeTaxCents: number,
  afterTaxCents: number,
) {
  const bankIncome = calculateBankIncome(dossier, periods);
  const referenceYears = [
    ...new Set(
      dossier.incomeStreams
        .filter((s) => s.includedInBorrowingCapacity && s.bankingBasis)
        .map((s) => s.bankingBasis!.referenceYear),
    ),
  ];
  const automatic = referenceYears.length > 0;
  const primaryLabel =
    referenceYears.length === 1 ? `Base ${referenceYears[0]}` : "Base proposée";
  const prudentLabel =
    referenceYears.length === 1
      ? `Moyenne ${referenceYears[0]! - 1}–${referenceYears[0]}`
      : "Sensibilité historique";
  const budget = dossier.budgetScenarios.find(
    (item) => item.kind === "central",
  )!;
  const sourceIds = budget.assumptions.incomePeriodIds ?? [];
  const sources = (dossier.incomePeriods ?? []).filter((period) =>
    sourceIds.includes(period.id),
  );
  const date =
    dossier.project.bankIncomeReferenceDate ??
    dossier.project.targetPurchaseDate;
  const isActive = (stream: Dossier["incomeStreams"][number]) =>
    (!stream.startDate || stream.startDate <= date) &&
    (!stream.endDate || stream.endDate >= date);
  const rows = dossier.incomeStreams.map((stream) => {
    const selected = sources.find(
      (period) => period.incomeStreamId === stream.id,
    );
    const result = periods.find((period) => period.id === selected?.id);
    const included = stream.includedInBorrowingCapacity && isActive(stream);
    return {
      id: stream.id,
      personId: stream.personId,
      economicCents: sourceIds.length
        ? result?.monthlyEconomicIncomeCents
        : (!stream.startDate ||
              stream.startDate <= dossier.project.targetPurchaseDate) &&
            (!stream.endDate ||
              stream.endDate >= dossier.project.targetPurchaseDate)
          ? stream.monthlyEconomicCents
          : undefined,
      fiscalCents:
        result?.taxableIncomeCents === undefined
          ? undefined
          : Math.round(result.taxableIncomeCents / result.months),
      periodLabel: selected?.label,
      bankCents: included ? bankIncome[stream.id]!.primaryCents : 0,
      bankingLabel: bankIncome[stream.id]!.label,
      prudentCents: included ? bankIncome[stream.id]!.prudentCents : 0,
      included,
    };
  });
  const people = Object.fromEntries(
    dossier.household.people.map((person) => {
      const related = rows.filter((row) => row.personId === person.id);
      return [
        person.id,
        {
          economicCents: related.some((row) => row.economicCents !== undefined)
            ? related.reduce((sum, row) => sum + (row.economicCents ?? 0), 0)
            : undefined,
          bankCents: related.reduce((sum, row) => sum + row.bankCents, 0),
          prudentCents: related.reduce((sum, row) => sum + row.prudentCents, 0),
        },
      ];
    }),
  );
  const bankCents = rows.reduce((sum, row) => sum + row.bankCents, 0);
  const prudentCents = rows.reduce((sum, row) => sum + row.prudentCents, 0);
  const hasEconomicBasis =
    sourceIds.length > 0 ||
    budget.assumptions.beforeTaxIncomeCents !== undefined ||
    dossier.incomeStreams
      .filter(isActive)
      .every((stream) => stream.monthlyEconomicCents !== undefined);
  const projected = sources.some((period) => period.status !== "observed");
  const economicLabel = projected
    ? "Revenu économique projeté"
    : "Revenu économique de référence";
  const cards = [
    {
      id: "economic",
      label: hasEconomicBasis ? economicLabel : "Budget après IR",
      valueCents: hasEconomicBasis ? beforeTaxCents : afterTaxCents,
      explanation: hasEconomicBasis
        ? "Après cotisations et frais, avant IR. Période précisée ci-dessous."
        : "Hypothèse de revenu disponible du budget central, distincte de la convention bancaire.",
    },
    {
      id: "bank",
      label: automatic ? primaryLabel + " — étude" : "Base bancaire proposée",
      valueCents: bankCents,
      explanation:
        "Convention proposée pour l’étude du prêt. Méthode ci-dessous.",
    },
    {
      id: "prudent",
      label: automatic
        ? prudentLabel + " — étude"
        : "Variante bancaire de référence",
      valueCents: prudentCents,
      explanation: "Base documentaire alternative. Méthode ci-dessous.",
    },
  ].sort((a, b) => b.valueCents - a.valueCents);
  const atDate = (target: string, variant: boolean) =>
    dossier.incomeStreams
      .filter(
        (s) =>
          s.includedInBorrowingCapacity &&
          (!s.startDate || s.startDate <= target) &&
          (!s.endDate || s.endDate >= target),
      )
      .reduce(
        (sum, s) =>
          sum +
          (variant
            ? bankIncome[s.id]!.prudentCents
            : bankIncome[s.id]!.primaryCents),
        0,
      );
  return {
    automatic,
    primaryLabel,
    prudentLabel,
    hasBankForecast: Object.values(bankIncome).some((b) => b.projected),
    prudentAtPurchaseCents: atDate(dossier.project.targetPurchaseDate, true),
    rows,
    bankCents,
    prudentCents,
    bankReferenceDate: date,
    bankAtPurchaseCents: dossier.incomeStreams
      .filter(
        (stream) =>
          stream.includedInBorrowingCapacity &&
          (!stream.startDate ||
            stream.startDate <= dossier.project.targetPurchaseDate) &&
          (!stream.endDate ||
            stream.endDate >= dossier.project.targetPurchaseDate),
      )
      .reduce((sum, stream) => sum + bankIncome[stream.id]!.primaryCents, 0),
    bankNowCents: dossier.incomeStreams
      .filter(
        (stream) =>
          stream.includedInBorrowingCapacity &&
          (!stream.startDate || stream.startDate <= date) &&
          (!stream.endDate || stream.endDate >= date),
      )
      .reduce((sum, stream) => sum + bankIncome[stream.id]!.primaryCents, 0),
    people,
    cards,
    hasEconomicBasis,
    projected,
    economicLabel,
    beforeTaxCents,
    afterTaxCents,
    taxProvisionCents: Math.max(0, beforeTaxCents - afterTaxCents),
    fiscalCents:
      sources.length &&
      rows
        .filter((row) => row.periodLabel)
        .every((row) => row.fiscalCents !== undefined)
        ? rows.reduce((sum, row) => sum + (row.fiscalCents ?? 0), 0)
        : undefined,
  };
}

export type IncomePresentation = ReturnType<typeof calculateIncomePresentation>;
