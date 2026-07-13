export type StepId = "overview" | "household" | "income" | "assets" | "liabilities" | "project" | "financing" | "budgets" | "documents" | "presentation" | "help" | "preview";

export const editorSteps: readonly { id: StepId; label: string; shortLabel: string; paths: readonly string[] }[] = [
  { id: "help", label: "Guide d’utilisation", shortLabel: "Guide", paths: [] },
  { id: "overview", label: "Vue d'ensemble", shortLabel: "Synthèse", paths: [] },
  { id: "household", label: "Foyer", shortLabel: "Foyer", paths: ["household"] },
  { id: "income", label: "Activités et revenus", shortLabel: "Revenus", paths: ["professionalActivities", "incomeStreams", "revenueHistory"] },
  { id: "assets", label: "Patrimoine et historique", shortLabel: "Patrimoine", paths: ["assets", "monthlySnapshots"] },
  { id: "liabilities", label: "Crédits et passifs", shortLabel: "Passifs", paths: ["liabilities"] },
  { id: "project", label: "Projet immobilier", shortLabel: "Projet", paths: ["project", "reservePolicy"] },
  { id: "financing", label: "Financement", shortLabel: "Financement", paths: ["financingScenarios"] },
  { id: "budgets", label: "Budgets et stress test", shortLabel: "Budgets", paths: ["budgetScenarios", "stressCases", "estimatedHouseholdAfterTaxIncomeCents"] },
  { id: "documents", label: "Justificatifs", shortLabel: "Pièces", paths: ["supportingDocuments"] },
  { id: "presentation", label: "Textes du dossier", shortLabel: "Textes", paths: ["editorial", "presentation", "metadata.documentStage"] },
  { id: "preview", label: "Aperçu et impression", shortLabel: "Aperçu", paths: [] },
];
