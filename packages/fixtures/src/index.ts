import type { Dossier } from "@dossier-immo/schema";
import {
  mixedIncomeFamilyDemo,
  retiredRentalInvestorDemo,
  salariedFirstBuyerDemo,
} from "./demo-dossiers";

export {
  demoDossierCatalog,
  mixedIncomeFamilyDemo,
  retiredRentalInvestorDemo,
  salariedFirstBuyerDemo,
  type DemoDossierDescriptor,
} from "./demo-dossiers";

/** Rich, entirely fictional example used by the editor, document and tests. */
export const completeDemoDossier: Dossier = mixedIncomeFamilyDemo;

function subsidizedLoanFixture(): Dossier {
  const dossier = structuredClone(salariedFirstBuyerDemo);
  dossier.metadata.dossierId = "demo-pret-complementaire";
  return dossier;
}

function projectedSavingsFixture(): Dossier {
  const dossier = structuredClone(completeDemoDossier);
  dossier.metadata.dossierId = "demo-liquidites-projetees";
  delete dossier.project.expectedLiquidityAtPurchaseCents;
  dossier.project.monthlySavingsProjectionCents = 200_000;
  return dossier;
}

export const conformityFixtures = {
  complete: completeDemoDossier,
  singleBorrower: salariedFirstBuyerDemo,
  mixedIncomeFamily: mixedIncomeFamilyDemo,
  retiredRentalInvestor: retiredRentalInvestorDemo,
  subsidizedLoan: subsidizedLoanFixture(),
  projectedSavings: projectedSavingsFixture(),
} as const satisfies Readonly<Record<string, Dossier>>;

export function createBlankDossier(
  today = new Date().toISOString().slice(0, 10),
): Dossier {
  const dossier = structuredClone(completeDemoDossier);
  dossier.metadata = {
    ...dossier.metadata,
    dossierId: `nouveau-dossier-${today.replaceAll("-", "")}`,
    title: "Nouveau dossier immobilier",
    createdAt: today,
    updatedAt: today,
    observationDate: today,
    documentStage: "draft",
  };
  dossier.household = {
    people: [
      { id: "emprunteur-1", displayName: "Emprunteur 1", role: "borrower" },
    ],
    relationshipStatus: "single",
    matrimonialRegime: "not-applicable",
    dependents: 0,
    housingStatus: "tenant",
    currentMonthlyRentCents: 0,
    plannedHouseholdEvents: [],
  };
  dossier.professionalActivities = [];
  dossier.incomeStreams = [
    {
      id: "revenu-a-renseigner",
      personId: "emprunteur-1",
      kind: "other",
      label: "Revenu à renseigner",
      monthlyBankCents: 0,
      monthlyPrudentCents: 0,
      recurring: true,
      includedInBorrowingCapacity: true,
      note: "Remplacez ce poste par le revenu réel du foyer.",
    },
  ];
  dossier.revenueHistory = [];
  dossier.assets = [
    {
      id: "epargne-a-renseigner",
      ownerIds: ["emprunteur-1"],
      label: "Épargne à renseigner",
      category: "current-account",
      amountCents: 0,
      observedAt: today,
      liquid: true,
      availableForContribution: true,
      contributionPriority: "available",
      note: "Remplacez ce poste par les avoirs réellement détenus.",
    },
  ];
  dossier.liabilities = [];
  dossier.monthlySnapshots = [];
  dossier.project = {
    ...dossier.project,
    targetPurchaseDate: today,
    targetPriceCents: 1,
    minimumPriceCents: 1,
    comfortableMaximumPriceCents: 1,
    maximumPriceCents: 1,
    contributionCents: 0,
    installationCents: 0,
    renovationCents: 0,
    expectedLiquidityAtPurchaseCents: 0,
    monthlySavingsProjectionCents: 0,
    criteria: {
      propertyType: "À préciser",
      preferredAreas: [],
      excludedFeatures: [],
      additionalCriteria: [],
    },
  };
  dossier.financingScenarios = [
    {
      id: "central",
      label: "Central",
      annualRateBasisPoints: 0,
      durationMonths: 300,
      insuranceAnnualBasisPoints: 0,
      negotiationBasisPoints: 0,
      additionalLoanComponents: [],
      highlighted: true,
      displayInMainTable: true,
    },
  ];
  dossier.budgetScenarios = [
    {
      id: "central-budget",
      label: "Budget central",
      kind: "central",
      assumptions: {
        afterTaxIncomeCents: 0,
        financingScenarioId: "central",
        note: "Hypothèses centrales à renseigner.",
      },
      items: [
        {
          id: "depenses-a-renseigner",
          label: "Dépenses à renseigner",
          group: "other",
          amountCents: 0,
          sankeyLabel: "Dépenses à renseigner",
          showInSankey: true,
          adjustable: true,
        },
      ],
    },
    {
      id: "stress-budget",
      label: "Budget stress",
      kind: "stress",
      assumptions: {
        afterTaxIncomeCents: 0,
        financingScenarioId: "central",
        note: "Copie alignée du budget central ; ajustez les montants du stress test.",
      },
      items: [
        {
          id: "depenses-a-renseigner-stress",
          sourceItemId: "depenses-a-renseigner",
          label: "Dépenses à renseigner",
          group: "other",
          amountCents: 0,
          sankeyLabel: "Dépenses à renseigner",
          showInSankey: true,
          adjustable: true,
        },
      ],
    },
  ];
  dossier.stressCases = [];
  dossier.reservePolicy = { minimumCents: 0, targetCents: 0, allocations: [] };
  dossier.estimatedHouseholdAfterTaxIncomeCents = 0;
  dossier.supportingDocuments = [];
  dossier.editorial = {
    presentationLetter: "",
    householdSummary: "",
    professionalStabilityItems: [],
    projectSummary: "",
    reserveStrategy: "",
    independentIncomeIntroduction: "",
    finalDisclaimer: completeDemoDossier.editorial.finalDisclaimer,
    sectionSlots: {},
  };
  return dossier;
}
