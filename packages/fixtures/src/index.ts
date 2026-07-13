import { DossierSchema, type Dossier } from "@dossier-immo/schema";
import completeDemoJson from "./complete-demo.json";

/** Rich, entirely fictional example used by the editor, document and tests. */
export const completeDemoDossier: Dossier = DossierSchema.parse(completeDemoJson);

function singleBorrowerFixture(): Dossier {
  const dossier = structuredClone(completeDemoDossier);
  dossier.metadata.dossierId = "demo-personne-seule-independante";
  dossier.metadata.title = "Dossier fictif — personne seule indépendante";
  dossier.household.relationshipStatus = "single";
  dossier.household.matrimonialRegime = "not-applicable";
  dossier.household.dependents = 0;
  delete dossier.household.relationshipSince;
  dossier.household.people = dossier.household.people.filter((person) => person.id === "nora-leclerc");
  dossier.household.plannedHouseholdEvents = dossier.household.plannedHouseholdEvents.filter((event) => event.impact !== "household");
  dossier.professionalActivities = dossier.professionalActivities.filter((activity) => activity.personId === "nora-leclerc");
  dossier.incomeStreams = dossier.incomeStreams.filter((income) => income.personId === "nora-leclerc");
  const incomeIds = new Set(dossier.incomeStreams.map((income) => income.id));
  dossier.revenueHistory = dossier.revenueHistory.filter((history) => incomeIds.has(history.incomeStreamId));
  dossier.assets = dossier.assets
    .filter((asset) => asset.ownerIds.includes("nora-leclerc"))
    .map((asset) => ({ ...asset, ownerIds: ["nora-leclerc"] }));
  dossier.liabilities = dossier.liabilities.map((liability) => ({ ...liability, borrowerIds: ["nora-leclerc"] }));
  const assetIds = new Set(dossier.assets.map((asset) => asset.id));
  dossier.monthlySnapshots = dossier.monthlySnapshots.map((snapshot) => ({
    ...snapshot,
    assetAmountsCents: Object.fromEntries(Object.entries(snapshot.assetAmountsCents).filter(([assetId]) => assetIds.has(assetId))),
    incomeAmountsCents: Object.fromEntries(Object.entries(snapshot.incomeAmountsCents).filter(([incomeId]) => incomeIds.has(incomeId))),
  }));
  dossier.supportingDocuments = dossier.supportingDocuments.filter((document) => (
    document.id !== "civil-union" && (!document.ownerId || document.ownerId === "nora-leclerc")
  ));
  dossier.estimatedHouseholdAfterTaxIncomeCents = 250_000;
  dossier.editorial.householdSummary = "Personne seule fictive préparant l'acquisition de sa résidence principale avec une activité commerciale documentée.";
  return dossier;
}

function subsidizedLoanFixture(): Dossier {
  const dossier = structuredClone(completeDemoDossier);
  dossier.metadata.dossierId = "demo-pret-bonifie";
  const central = dossier.financingScenarios.find((scenario) => scenario.highlighted);
  if (!central) throw new Error("Fixture centrale absente.");
  central.additionalLoanComponents = [{
    id: "employer-loan",
    label: "Prêt employeur",
    amountCents: 15_000_00,
    annualRateBasisPoints: 0,
    durationMonths: 240,
    deferredMonths: 0,
  }];
  return dossier;
}

function projectedSavingsFixture(): Dossier {
  const dossier = structuredClone(completeDemoDossier);
  dossier.metadata.dossierId = "demo-liquidites-projetees";
  delete dossier.project.expectedLiquidityAtPurchaseCents;
  dossier.project.monthlySavingsProjectionCents = 150_000;
  return dossier;
}

export const conformityFixtures = {
  complete: completeDemoDossier,
  singleBorrower: singleBorrowerFixture(),
  subsidizedLoan: subsidizedLoanFixture(),
  projectedSavings: projectedSavingsFixture(),
} as const satisfies Readonly<Record<string, Dossier>>;

export function createBlankDossier(today = new Date().toISOString().slice(0, 10)): Dossier {
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
    people: [{ id: "emprunteur-1", displayName: "Emprunteur 1", role: "borrower" }],
    relationshipStatus: "single",
    matrimonialRegime: "not-applicable",
    dependents: 0,
    housingStatus: "tenant",
    currentMonthlyRentCents: 0,
    plannedHouseholdEvents: [],
  };
  dossier.professionalActivities = [];
  dossier.incomeStreams = [{
    id: "revenu-a-renseigner",
    personId: "emprunteur-1",
    kind: "other",
    label: "Revenu à renseigner",
    monthlyBankCents: 0,
    monthlyPrudentCents: 0,
    recurring: true,
    includedInBorrowingCapacity: true,
    note: "Remplacez ce poste par le revenu réel du foyer.",
  }];
  dossier.revenueHistory = [];
  dossier.assets = [{
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
  }];
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
    criteria: { propertyType: "À préciser", preferredAreas: [], excludedFeatures: [], additionalCriteria: [] },
  };
  dossier.financingScenarios = [{
    id: "central",
    label: "Central",
    annualRateBasisPoints: 0,
    durationMonths: 300,
    insuranceAnnualBasisPoints: 0,
    negotiationBasisPoints: 0,
    additionalLoanComponents: [],
    highlighted: true,
    displayInMainTable: true,
  }];
  dossier.budgetScenarios = [
    {
      id: "central-budget",
      label: "Budget central",
      kind: "central",
      assumptions: { afterTaxIncomeCents: 0, financingScenarioId: "central", note: "Hypothèses centrales à renseigner." },
      items: [{
        id: "depenses-a-renseigner",
        label: "Dépenses à renseigner",
        group: "other",
        amountCents: 0,
        sankeyLabel: "Dépenses à renseigner",
        showInSankey: true,
        adjustable: true,
      }],
    },
    {
      id: "stress-budget",
      label: "Budget stress",
      kind: "stress",
      assumptions: { afterTaxIncomeCents: 0, financingScenarioId: "central", note: "Copie alignée du budget central ; ajustez les montants du stress test." },
      items: [{
        id: "depenses-a-renseigner-stress",
        sourceItemId: "depenses-a-renseigner",
        label: "Dépenses à renseigner",
        group: "other",
        amountCents: 0,
        sankeyLabel: "Dépenses à renseigner",
        showInSankey: true,
        adjustable: true,
      }],
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
