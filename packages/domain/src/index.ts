import type { CompensationModel, Dossier } from "@dossier-immo/schema";

/**
 * Catalogue français des valeurs métier persistées.
 *
 * Les `satisfies Record<…>` rendent chaque catalogue exhaustif vis-à-vis du
 * schéma, sans dupliquer ses unions de types et sans dépendance à une UI.
 */
export const personRoleLabels = {
  borrower: "Principal",
  "co-borrower": "Co-emprunteur",
  dependent: "Personne à charge",
  other: "Autre rôle",
} as const satisfies Readonly<Record<Dossier["household"]["people"][number]["role"], string>>;

export const documentStageLabels = {
  draft: "Brouillon",
  review: "En relecture",
  "ready-for-submission": "Prêt à transmettre",
  submitted: "Transmis",
  archived: "Archivé",
} as const satisfies Readonly<Record<Dossier["metadata"]["documentStage"], string>>;

export const relationshipStatusLabels = {
  single: "Célibataire",
  married: "Marié(e)",
  "civil-union": "Pacsé(e)",
  cohabiting: "En concubinage",
  separated: "Séparé(e)",
  other: "Autre situation",
} as const satisfies Readonly<Record<Dossier["household"]["relationshipStatus"], string>>;

type MatrimonialRegime = NonNullable<Dossier["household"]["matrimonialRegime"]>;
export const matrimonialRegimeLabels = {
  community: "Communauté de biens",
  "separation-of-property": "Séparation de biens",
  participation: "Participation aux acquêts",
  "not-applicable": "Non applicable",
  other: "Autre régime",
} as const satisfies Readonly<Record<MatrimonialRegime, string>>;

export const housingStatusLabels = {
  tenant: "Locataire",
  owner: "Propriétaire",
  hosted: "Hébergé(e) à titre gratuit",
  other: "Autre situation de logement",
} as const satisfies Readonly<Record<Dossier["household"]["housingStatus"], string>>;

export const householdEventImpactLabels = {
  income: "Revenus",
  expense: "Dépenses",
  housing: "Logement",
  household: "Composition du foyer",
  professional: "Situation professionnelle",
  other: "Autre impact",
} as const satisfies Readonly<Record<Dossier["household"]["plannedHouseholdEvents"][number]["impact"], string>>;

export const professionalStatusLabels = {
  permanent: "Salarié(e) en CDI",
  "fixed-term": "Salarié(e) en CDD",
  "civil-servant": "Fonctionnaire",
  "self-employed": "Travailleur indépendant",
  "company-director": "Dirigeant(e) d’entreprise",
  liberal: "Profession libérale",
  other: "Autre statut professionnel",
} as const satisfies Readonly<Record<Dossier["professionalActivities"][number]["status"], string>>;

export const professionalEngagementLabels = {
  employee: "Salariat",
  "civil-service": "Fonction publique",
  contractor: "Prestation en régie ou au forfait",
  "independent-practice": "Exercice libéral indépendant",
  "business-owner": "Direction d’entreprise",
  other: "Autre modalité d’exercice",
} as const satisfies Readonly<Record<Dossier["professionalActivities"][number]["engagementType"], string>>;

export const professionalHistoryKindLabels = {
  education: "Formation",
  employment: "Emploi salarié",
  assignment: "Mission",
  practice: "Exercice professionnel",
  business: "Création ou direction d’entreprise",
  "career-break": "Interruption de carrière",
  other: "Autre étape professionnelle",
} as const satisfies Readonly<Record<Dossier["professionalActivities"][number]["entries"][number]["kind"], string>>;

export const compensationModelLabels = {
  salary: "Rémunération salariée",
  "day-rate": "Facturation au taux journalier",
  consultation: "Facturation à la consultation",
  turnover: "Chiffre d’affaires",
  hourly: "Facturation horaire",
  commission: "Rémunération à la commission",
  other: "Autre modèle de rémunération",
} as const satisfies Readonly<Record<CompensationModel["kind"], string>>;

/** Libellés des modalités de rémunération représentées par le modèle actuel. */
export const professionalCompensationLabels = {
  contractualGrossAnnualCents: "Salaire brut annuel contractuel",
  variableGrossAnnualCents: "Rémunération variable brute annuelle",
  workTimeBasisPoints: "Quotité de travail",
  dailyRateCents: "Taux journalier",
  billableDaysPerYear: "Jours facturables par an",
  consultationFeeCents: "Tarif par consultation",
  consultationsPerWeek: "Consultations par semaine",
  annualTurnoverCents: "Chiffre d’affaires annuel",
  hourlyRateCents: "Taux horaire",
  hoursPerWeek: "Heures par semaine",
  workingWeeksPerYear: "Semaines travaillées par an",
  referenceAnnualCommissionCents: "Commission annuelle de référence",
  collectionDelayDays: "Délai d’encaissement",
  projection: "Projection de rémunération",
} as const;

export const incomeKindLabels = {
  salary: "Salaire",
  "public-service": "Traitement de la fonction publique",
  "self-employed": "Revenu d’activité indépendante",
  liberal: "Revenu de profession libérale",
  rental: "Revenu locatif",
  pension: "Pension ou retraite",
  benefit: "Allocation ou prestation",
  commission: "Commission",
  other: "Autre revenu",
} as const satisfies Readonly<Record<Dossier["incomeStreams"][number]["kind"], string>>;

export const assetCategoryLabels = {
  "current-account": "Compte courant",
  "regulated-savings": "Épargne réglementée",
  securities: "Valeurs mobilières",
  "life-insurance": "Assurance-vie",
  retirement: "Épargne retraite",
  crypto: "Cryptoactifs",
  "real-estate": "Bien immobilier",
  vehicle: "Véhicule",
  "company-shares": "Parts de société",
  other: "Autre actif",
} as const satisfies Readonly<Record<Dossier["assets"][number]["category"], string>>;

export const contributionPriorityLabels = {
  preferred: "À mobiliser en priorité",
  available: "Mobilisable si nécessaire",
  avoid: "À préserver de préférence",
  excluded: "Exclu de l’apport",
} as const satisfies Readonly<Record<Dossier["assets"][number]["contributionPriority"], string>>;

export const liabilityCategoryLabels = {
  mortgage: "Crédit immobilier",
  auto: "Crédit automobile",
  consumer: "Crédit à la consommation",
  student: "Prêt étudiant",
  professional: "Crédit professionnel",
  alimony: "Pension alimentaire",
  bridge: "Prêt relais",
  other: "Autre passif",
} as const satisfies Readonly<Record<Dossier["liabilities"][number]["category"], string>>;

export const projectTypeLabels = {
  "primary-residence": "Résidence principale",
  "rental-investment": "Investissement locatif",
  "new-build": "Logement neuf",
  construction: "Construction",
  other: "Autre projet immobilier",
} as const satisfies Readonly<Record<Dossier["project"]["projectType"], string>>;

export const criterionImportanceLabels = {
  required: "Indispensable",
  preferred: "Souhaité",
  optional: "Optionnel",
  excluded: "Exclu",
} as const satisfies Readonly<Record<Dossier["project"]["criteria"]["additionalCriteria"][number]["importance"], string>>;

export const budgetGroupLabels = {
  housing: "Logement",
  living: "Vie quotidienne",
  transport: "Transport",
  family: "Famille",
  leisure: "Loisirs",
  tax: "Impôts et taxes",
  savings: "Épargne",
  other: "Autres dépenses",
} as const satisfies Readonly<Record<Dossier["budgetScenarios"][number]["items"][number]["group"], string>>;

export const budgetKindLabels = {
  current: "Budget actuel",
  central: "Budget central",
  stress: "Budget de stress",
  custom: "Budget personnalisé",
} as const satisfies Readonly<Record<Dossier["budgetScenarios"][number]["kind"], string>>;

export const documentCategoryLabels = {
  identity: "Identité",
  household: "Foyer et situation familiale",
  income: "Revenus",
  tax: "Fiscalité",
  asset: "Patrimoine et actifs",
  liability: "Crédits et passifs",
  project: "Projet immobilier",
  professional: "Activité professionnelle",
  other: "Autre pièce",
} as const satisfies Readonly<Record<Dossier["supportingDocuments"][number]["category"], string>>;

export const documentStatusLabels = {
  missing: "À fournir",
  requested: "Demandée",
  available: "Disponible",
  verified: "Vérifiée",
  "not-applicable": "Non applicable",
} as const satisfies Readonly<Record<Dossier["supportingDocuments"][number]["status"], string>>;

type DeliveryChannel = NonNullable<Dossier["supportingDocuments"][number]["deliveryChannel"]>;
export const documentDeliveryChannelLabels = {
  "secure-portal": "Portail sécurisé",
  "encrypted-email": "Courriel chiffré",
  "in-person": "Remise en main propre",
  postal: "Courrier postal",
  other: "Autre canal",
} as const satisfies Readonly<Record<DeliveryChannel, string>>;

export const editorialSectionLabels = {
  cover: "Page 1 · Couverture",
  presentationLetter: "Page 2 · Lettre de présentation",
  household: "Page 3 · Synthèse du foyer",
  income: "Page 4 · Revenus retenus",
  riskManagement: "Page 5 · Solidité et gestion des risques",
  assets: "Page 6 · Patrimoine et liquidités",
  cashReserve: "Page 7 · Apport et trésorerie conservée",
  project: "Page 8 · Projet immobilier",
  financing: "Page 9 · Scénarios de financement",
  sankey: "Page 10 · Flux budgétaires",
  postPurchaseBudget: "Page 11 · Budget post-achat",
  supportingDocuments: "Page 12 · Pièces justificatives",
  independentIncomeAnnex: "Page 13 · Annexe des revenus indépendants",
} as const satisfies Readonly<Record<keyof Dossier["editorial"]["sectionSlots"], string>>;

type EditorialSlotPosition = keyof NonNullable<Dossier["editorial"]["sectionSlots"][keyof Dossier["editorial"]["sectionSlots"]]>;
export const editorialSlotPositionLabels = {
  introduction: "Introduction de la section",
  callout: "Encadré de mise en avant",
  conclusion: "Conclusion de la section",
} as const satisfies Readonly<Record<EditorialSlotPosition, string>>;

type StressAssumption = Dossier["stressCases"][number]["assumptions"][number];
export const stressOperationLabels = {
  set: "Remplacer par",
  add: "Ajouter",
  subtract: "Soustraire",
  multiply: "Multiplier par",
} as const satisfies Readonly<Record<StressAssumption["operation"], string>>;

export const stressUnitLabels = {
  cents: "Montant monétaire",
  "basis-points": "Points de base",
  days: "Jours",
  count: "Nombre",
  ratio: "Coefficient",
  other: "Autre unité",
} as const satisfies Readonly<Record<StressAssumption["unit"], string>>;

export const domainLabels = {
  documentStage: documentStageLabels,
  personRole: personRoleLabels,
  relationshipStatus: relationshipStatusLabels,
  matrimonialRegime: matrimonialRegimeLabels,
  housingStatus: housingStatusLabels,
  householdEventImpact: householdEventImpactLabels,
  professionalStatus: professionalStatusLabels,
  professionalEngagement: professionalEngagementLabels,
  professionalHistoryKind: professionalHistoryKindLabels,
  compensationModel: compensationModelLabels,
  professionalCompensation: professionalCompensationLabels,
  incomeKind: incomeKindLabels,
  assetCategory: assetCategoryLabels,
  contributionPriority: contributionPriorityLabels,
  liabilityCategory: liabilityCategoryLabels,
  projectType: projectTypeLabels,
  criterionImportance: criterionImportanceLabels,
  budgetGroup: budgetGroupLabels,
  budgetKind: budgetKindLabels,
  documentCategory: documentCategoryLabels,
  documentStatus: documentStatusLabels,
  documentDeliveryChannel: documentDeliveryChannelLabels,
  editorialSection: editorialSectionLabels,
  editorialSlotPosition: editorialSlotPositionLabels,
  stressOperation: stressOperationLabels,
  stressUnit: stressUnitLabels,
} as const;

export function domainLabel<const Catalog extends Readonly<Record<PropertyKey, string>>>(
  catalog: Catalog,
  value: keyof Catalog,
): Catalog[keyof Catalog] {
  return catalog[value];
}
