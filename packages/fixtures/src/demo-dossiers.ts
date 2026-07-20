import { DossierSchema, type Dossier } from "@dossier-immo/schema";

const OBSERVATION_DATE = "2026-07-15";
const FICTION_DISCLAIMER =
  "Toutes les identités, professions, localisations, dates et valeurs de cet exemple sont fictives. Ce document ne constitue ni un conseil financier ni un accord de crédit.";

type BudgetLine = readonly [
  id: string,
  label: string,
  group:
    | "housing"
    | "living"
    | "transport"
    | "family"
    | "leisure"
    | "tax"
    | "savings"
    | "other",
  centralCents: number,
  stressCents: number,
  adjustable: boolean,
];

function budgetScenarios(
  prefix: string,
  financingScenarioId: string,
  currentIncomeCents: number,
  projectedIncomeCents: number,
  lines: readonly BudgetLine[],
  currentHousingCents: number,
  includeCustom = false,
) {
  const sankeyLabel = (label: string) =>
    ({
      "Énergie, assurance et entretien": "Énergie / entretien",
      "Fiscalité et charges non mensualisées": "Fiscalité",
      "Enfants et scolarité": "Enfants",
      "Loisirs et vacances": "Loisirs",
      "Épargne du foyer": "Épargne",
      "Marge de sécurité": "Marge",
    })[label] ?? label;
  const makeItems = (kind: "central" | "stress") =>
    lines.map(([id, label, group, central, stress, adjustable]) => ({
      id: `${prefix}-${id}${kind === "stress" ? "-stress" : ""}`,
      ...(kind === "stress" ? { sourceItemId: `${prefix}-${id}` } : {}),
      label,
      group,
      amountCents: kind === "central" ? central : stress,
      sankeyLabel: sankeyLabel(label),
      showInSankey: true,
      adjustable,
      note:
        kind === "stress"
          ? "Montant majoré dans le scénario prudent."
          : "Hypothèse mensuelle fictive documentée.",
    }));
  const currentItems = [
    ...(currentHousingCents > 0
      ? [
          {
            id: `${prefix}-housing-current`,
            label: "Loyer ou mensualité actuelle",
            group: "housing" as const,
            amountCents: currentHousingCents,
            sankeyLabel: "Logement actuel",
            showInSankey: true,
            adjustable: false,
            note: "Charge mensuelle fictive avant le projet.",
          },
        ]
      : []),
    ...lines.map(([id, label, group, central, , adjustable]) => ({
      id: `${prefix}-${id}-current`,
      label,
      group,
      amountCents: Math.max(0, Math.round(central * 0.92)),
      sankeyLabel: sankeyLabel(label),
      showInSankey: true,
      adjustable,
      note: "Moyenne mensuelle fictive observée avant le projet.",
    })),
  ];
  const scenarios = [
    {
      id: `${prefix}-current-budget`,
      label: "Budget de vie actuel",
      kind: "current",
      assumptions: {
        afterTaxIncomeCents: currentIncomeCents,
        note: "Photographie fictive avant acquisition.",
      },
      items: currentItems,
    },
    {
      id: `${prefix}-central-budget`,
      label: "Budget après acquisition",
      kind: "central",
      assumptions: {
        afterTaxIncomeCents: projectedIncomeCents,
        financingScenarioId,
        note: "Budget cible construit à partir du scénario de financement central.",
      },
      items: makeItems("central"),
    },
    {
      id: `${prefix}-stress-budget`,
      label: "Budget prudent",
      kind: "stress",
      assumptions: {
        afterTaxIncomeCents: Math.round(projectedIncomeCents * 0.88),
        financingScenarioId,
        note: "Revenus minorés et dépenses variables majorées pour tester la marge de sécurité.",
      },
      items: makeItems("stress"),
    },
  ];
  if (includeCustom) {
    scenarios.push({
      id: `${prefix}-custom-budget`,
      label: "Budget année d'installation",
      kind: "custom",
      assumptions: {
        afterTaxIncomeCents: projectedIncomeCents,
        financingScenarioId,
        note: "Variante fictive intégrant les dépenses ponctuelles de la première année.",
      },
      items: lines.map(([id, label, group, central, , adjustable]) => ({
        id: `${prefix}-${id}-custom`,
        label,
        group,
        amountCents: central + (group === "other" ? 20_000 : 0),
        sankeyLabel: sankeyLabel(label),
        showInSankey: true,
        adjustable,
        note: "Variante de démonstration pour la première année.",
      })),
    });
  }
  return scenarios;
}

function financingScenarios(
  prefix: string,
  priceCents: number,
  contributionCents: number,
  rateBasisPoints: number,
  insuranceBasisPoints: number,
  additionalLoanComponents: readonly Record<string, unknown>[] = [],
) {
  const definitions = [
    ["accessible", "Budget accessible", -2_000_000, 0, true],
    ["central", "Projet central", 0, 0, true],
    ["negotiated", "Taux négocié", 0, 20, true],
    ["comfort", "Plafond de confort", 1_500_000, 0, true],
    ["rate-stress", "Stress de taux", 0, -45, false],
  ] as const;
  return definitions.map(([id, label, priceDelta, negotiation, display]) => ({
    id: `${prefix}-${id}`,
    label,
    annualRateBasisPoints: rateBasisPoints + (id === "rate-stress" ? 55 : 0),
    durationMonths: 300,
    insuranceAnnualBasisPoints: insuranceBasisPoints,
    priceOverrideCents: priceCents + priceDelta,
    contributionOverrideCents: contributionCents,
    negotiationBasisPoints: Math.max(0, negotiation),
    additionalLoanComponents: id === "central" ? additionalLoanComponents : [],
    highlighted: id === "central",
    displayInMainTable: display,
    note: "Simulation pédagogique fondée sur des hypothèses fictives, à remplacer par une proposition bancaire réelle.",
  }));
}

function presentation(
  title: string,
  subtitle: string,
  theme: "banking-clean" | "heritage" | "sage",
) {
  return {
    theme,
    density: "comfortable",
    pageSize: "A4",
    title,
    subtitle,
    footer: "Démonstration fictive — aucune donnée personnelle réelle",
    sections: {
      cover: true,
      presentationLetter: true,
      household: true,
      income: true,
      riskManagement: true,
      assets: true,
      cashReserve: true,
      project: true,
      financing: true,
      sankey: true,
      postPurchaseBudget: true,
      supportingDocuments: true,
      independentIncomeAnnex: true,
    },
    colors: {
      navy: "#17324d",
      blue: "#1f77b4",
      green: "#2f855a",
      gold: "#b7791f",
      muted: "#667085",
    },
  };
}

function parseDemo(value: unknown): Dossier {
  return DossierSchema.parse(value);
}

export const salariedFirstBuyerDemo = parseDemo({
  schemaVersion: 3,
  metadata: {
    dossierId: "demo-primo-accedante-salariee",
    title: "Primo-accession — salariée seule",
    createdAt: "2026-07-10",
    updatedAt: OBSERVATION_DATE,
    observationDate: OBSERVATION_DATE,
    currency: "EUR",
    locale: "fr-FR",
    documentStage: "ready-for-submission",
    editionCity: "Tours",
  },
  household: {
    people: [
      {
        id: "ines-moreau",
        displayName: "Inès Moreau",
        birthDate: "1993-04-12",
        role: "borrower",
        email: "ines.moreau@example.invalid",
        phone: "+33 6 00 00 00 01",
        qualificationNote:
          "Cheffe de projet qualité en contrat à durée indéterminée depuis plus de quatre ans.",
      },
    ],
    relationshipStatus: "single",
    matrimonialRegime: "not-applicable",
    dependents: 0,
    housingStatus: "tenant",
    currentMonthlyRentCents: 720_00,
    currentHousingSince: "2022-09-01",
    currentHousingDescription:
      "Deux-pièces de 42 m² loué à Tours, proche du lieu de travail.",
    rentHistoryNote: "Loyer réglé par virement permanent, sans retard déclaré.",
    paymentIncidentsNote:
      "Aucun incident de paiement déclaré dans cet exemple.",
    plannedHouseholdEvents: [
      {
        id: "ines-emmenagement",
        label: "Emménagement dans le logement neuf",
        expectedDate: "2027-12-01",
        impact: "housing",
        note: "Une enveloppe d'installation séparée est conservée.",
      },
      {
        id: "ines-evolution",
        label: "Évolution salariale conventionnelle",
        expectedDate: "2027-03-01",
        impact: "income",
        note: "Non retenue dans la capacité d'emprunt afin de rester prudente.",
      },
    ],
  },
  professionalActivities: [
    {
      id: "ines-industrie",
      personId: "ines-moreau",
      label: "Pilotage qualité dans l'industrie médicale",
      occupation: "Cheffe de projet qualité",
      status: "permanent",
      engagementType: "employee",
      legalRegime: "CDI de droit privé",
      startDate: "2022-02-14",
      trialPeriodEndDate: "2022-06-14",
      compensationModel: {
        kind: "salary",
        contractualGrossAnnualCents: 45_600_00,
        variableGrossAnnualCents: 2_400_00,
        workTimeBasisPoints: 10_000,
        note: "Part variable constatée mais retenue avec décote dans le scénario prudent.",
      },
      entries: [
        {
          id: "ines-master",
          kind: "education",
          label: "Master management de la qualité",
          endDate: "2017-09-30",
          evidenceLabels: ["Diplôme"],
        },
        {
          id: "ines-premier-poste",
          kind: "employment",
          label: "Ingénieure qualité fournisseurs",
          startDate: "2018-01-08",
          endDate: "2022-02-11",
          evidenceLabels: ["Certificat de travail"],
        },
        {
          id: "ines-poste-actuel",
          kind: "employment",
          label: "Cheffe de projet qualité",
          startDate: "2022-02-14",
          evidenceLabels: ["Contrat de travail", "Attestation employeur"],
        },
        {
          id: "ines-mission",
          kind: "assignment",
          label: "Déploiement d'un système qualité multi-sites",
          startDate: "2025-01-01",
          note: "Responsabilité transverse illustrant la progression interne.",
          evidenceLabels: ["Fiche de poste"],
        },
      ],
    },
  ],
  incomeStreams: [
    {
      id: "ines-salary",
      personId: "ines-moreau",
      activityId: "ines-industrie",
      kind: "salary",
      label: "Salaire fixe",
      monthlyBankCents: 2_850_00,
      monthlyPrudentCents: 2_850_00,
      monthlyAfterTaxEstimateCents: 2_520_00,
      recurring: true,
      includedInBorrowingCapacity: true,
      note: "Net mensuel fictif hors prime.",
    },
    {
      id: "ines-variable",
      personId: "ines-moreau",
      activityId: "ines-industrie",
      kind: "commission",
      label: "Prime annuelle lissée",
      monthlyBankCents: 200_00,
      monthlyPrudentCents: 100_00,
      monthlyAfterTaxEstimateCents: 85_00,
      recurring: false,
      includedInBorrowingCapacity: false,
      note: "Présentée pour transparence mais exclue de la capacité centrale.",
    },
  ],
  revenueHistory: [
    {
      id: "ines-variable-2024",
      incomeStreamId: "ines-variable",
      period: "2024",
      turnoverCents: 2_100_00,
      expensesCents: 0,
      resultCents: 2_100_00,
      collectedCents: 2_100_00,
      observed: true,
      sourceLabel: "Bulletin de décembre fictif",
    },
    {
      id: "ines-variable-2025",
      incomeStreamId: "ines-variable",
      period: "2025",
      turnoverCents: 2_350_00,
      expensesCents: 0,
      resultCents: 2_350_00,
      collectedCents: 2_350_00,
      observed: true,
      sourceLabel: "Bulletin de décembre fictif",
    },
  ],
  assets: [
    {
      id: "ines-current",
      ownerIds: ["ines-moreau"],
      label: "Compte courant",
      category: "current-account",
      amountCents: 4_200_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 2_000_00,
      contributionPriority: "available",
      note: "Solde moyen conservant les dépenses courantes.",
    },
    {
      id: "ines-livret",
      ownerIds: ["ines-moreau"],
      label: "Livret réglementé",
      category: "regulated-savings",
      amountCents: 23_800_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 18_000_00,
      contributionPriority: "preferred",
    },
    {
      id: "ines-pea",
      ownerIds: ["ines-moreau"],
      label: "Plan d'épargne en actions",
      category: "securities",
      amountCents: 9_600_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 3_000_00,
      contributionPriority: "avoid",
      note: "Mobilisation limitée pour éviter une cession complète.",
    },
    {
      id: "ines-company-plan",
      ownerIds: ["ines-moreau"],
      label: "Épargne salariale",
      category: "retirement",
      amountCents: 7_400_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: false,
      contributionPriority: "excluded",
      note: "Non retenue dans l'apport.",
    },
    {
      id: "ines-car",
      ownerIds: ["ines-moreau"],
      label: "Véhicule personnel",
      category: "vehicle",
      amountCents: 8_500_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: false,
      contributionPriority: "excluded",
    },
  ],
  liabilities: [
    {
      id: "ines-student-loan",
      borrowerIds: ["ines-moreau"],
      label: "Solde de prêt étudiant",
      category: "student",
      outstandingCents: 2_900_00,
      monthlyPaymentCents: 145_00,
      startDate: "2020-01-05",
      endDate: "2028-02-05",
      annualRateBasisPoints: 160,
      includedInEffortRate: true,
      note: "Maintenu dans le calcul jusqu'à son échéance contractuelle.",
    },
  ],
  monthlySnapshots: [
    {
      id: "ines-snapshot-2026-05",
      month: "2026-05",
      assetAmountsCents: {
        "ines-current": 3_800_00,
        "ines-livret": 22_800_00,
        "ines-pea": 9_200_00,
        "ines-company-plan": 7_100_00,
        "ines-car": 8_500_00,
      },
      incomeAmountsCents: { "ines-salary": 2_850_00, "ines-variable": 0 },
      monthlySavingsCents: 850_00,
      liabilityPaymentsCents: { "ines-student-loan": 145_00 },
      note: "Mois courant fictif hors prime.",
    },
    {
      id: "ines-snapshot-2026-06",
      month: "2026-06",
      assetAmountsCents: {
        "ines-current": 4_000_00,
        "ines-livret": 23_300_00,
        "ines-pea": 9_400_00,
        "ines-company-plan": 7_250_00,
        "ines-car": 8_500_00,
      },
      incomeAmountsCents: { "ines-salary": 2_850_00, "ines-variable": 0 },
      monthlySavingsCents: 850_00,
      liabilityPaymentsCents: { "ines-student-loan": 145_00 },
      note: "Épargne régulière fictive.",
    },
    {
      id: "ines-snapshot-2026-07",
      month: "2026-07",
      assetAmountsCents: {
        "ines-current": 4_200_00,
        "ines-livret": 23_800_00,
        "ines-pea": 9_600_00,
        "ines-company-plan": 7_400_00,
        "ines-car": 8_500_00,
      },
      incomeAmountsCents: { "ines-salary": 2_850_00, "ines-variable": 0 },
      monthlySavingsCents: 850_00,
      liabilityPaymentsCents: { "ines-student-loan": 145_00 },
      note: "Date d'observation du dossier.",
    },
  ],
  project: {
    id: "ines-new-build",
    projectType: "new-build",
    targetPurchaseDate: "2027-12-01",
    targetPriceCents: 205_000_00,
    minimumPriceCents: 190_000_00,
    comfortableMaximumPriceCents: 212_000_00,
    maximumPriceCents: 220_000_00,
    contributionCents: 23_000_00,
    installationCents: 3_500_00,
    renovationCents: 0,
    acquisitionFeeBasisPoints: 300,
    expectedLiquidityAtPurchaseCents: 42_000_00,
    monthlySavingsProjectionCents: 850_00,
    criteria: {
      propertyType: "Appartement neuf ou récent avec balcon",
      minimumSurfaceSquareMeters: 48,
      idealSurfaceLabel: "50 à 58 m²",
      minimumBedrooms: 1,
      office: "Coin bureau séparé du séjour si possible.",
      pool: "Non recherchée.",
      energyRating: "RE2020 ou DPE A/B.",
      works: "Aucun travaux structurel ; aménagement intérieur léger accepté.",
      services: "Commerces, gare ou tram à moins de quinze minutes.",
      commute: "Moins de trente minutes du bassin d'emploi.",
      preferredAreas: ["Tours nord", "Saint-Cyr-sur-Loire", "Joué-lès-Tours"],
      excludedFeatures: [
        "rez-de-chaussée sur rue",
        "absence d'espace extérieur",
        "stationnement non sécurisé",
      ],
      additionalCriteria: [
        {
          id: "ines-balcony",
          label: "Balcon",
          value: "Au moins 6 m²",
          importance: "required",
          note: "Critère de confort prioritaire.",
        },
        {
          id: "ines-bike",
          label: "Local vélo",
          value: "Fermé et accessible",
          importance: "preferred",
        },
        {
          id: "ines-no-pool",
          label: "Piscine collective",
          value: "À éviter pour maîtriser les charges",
          importance: "excluded",
        },
      ],
    },
  },
  financingScenarios: financingScenarios(
    "ines",
    205_000_00,
    23_000_00,
    335,
    18,
    [
      {
        id: "ines-employer-loan",
        label: "Prêt employeur",
        amountCents: 12_000_00,
        annualRateBasisPoints: 100,
        durationMonths: 240,
        deferredMonths: 0,
      },
    ],
  ),
  budgetScenarios: budgetScenarios(
    "ines",
    "ines-central",
    2_605_00,
    2_605_00,
    [
      ["utilities", "Énergie et charges", "housing", 170_00, 205_00, true],
      ["food", "Alimentation", "living", 320_00, 365_00, true],
      ["transport", "Transport", "transport", 210_00, 250_00, true],
      ["family", "Santé et équipement", "family", 90_00, 120_00, true],
      ["leisure", "Loisirs et vacances", "leisure", 190_00, 150_00, true],
      ["tax", "Fiscalité hors prélèvement", "tax", 75_00, 90_00, false],
      ["savings", "Épargne mensuelle", "savings", 300_00, 180_00, true],
      ["other", "Marge non affectée", "other", 120_00, 160_00, true],
    ],
    720_00,
    true,
  ),
  stressCases: [
    {
      id: "ines-variable-excluded",
      label: "Prime non perçue et charges majorées",
      description:
        "Vérifie que le budget reste lisible sans rémunération variable.",
      enabled: true,
      assumptions: [
        {
          id: "ines-zero-variable",
          label: "Prime ramenée à zéro",
          target: "incomeStreams.ines-variable.monthlyPrudentCents",
          operation: "set",
          value: 0,
          unit: "cents",
        },
        {
          id: "ines-expense-rise",
          label: "Dépenses variables majorées",
          target: "budgetScenarios.ines-stress-budget.items",
          operation: "add",
          value: 15_000,
          unit: "cents",
        },
      ],
      note: "La prime est déjà exclue de la capacité centrale.",
    },
  ],
  reservePolicy: {
    minimumCents: 12_000_00,
    targetCents: 15_500_00,
    allocations: [
      {
        id: "ines-emergency",
        label: "Épargne de précaution",
        amountCents: 9_000_00,
      },
      { id: "ines-installation", label: "Installation", amountCents: 3_500_00 },
      {
        id: "ines-building",
        label: "Premières charges de copropriété",
        amountCents: 1_500_00,
      },
      { id: "ines-buffer", label: "Marge libre", amountCents: 1_500_00 },
    ],
  },
  estimatedHouseholdAfterTaxIncomeCents: 2_605_00,
  supportingDocuments: [
    {
      id: "ines-identity",
      ownerId: "ines-moreau",
      label: "Pièce d'identité",
      category: "identity",
      status: "verified",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "secure-portal",
    },
    {
      id: "ines-address",
      ownerId: "ines-moreau",
      label: "Justificatif de domicile",
      category: "household",
      status: "available",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "encrypted-email",
    },
    {
      id: "ines-payslips",
      ownerId: "ines-moreau",
      label: "Trois derniers bulletins de salaire",
      category: "income",
      status: "verified",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "secure-portal",
    },
    {
      id: "ines-employer",
      ownerId: "ines-moreau",
      label: "Contrat et attestation employeur",
      category: "professional",
      status: "available",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "secure-portal",
    },
    {
      id: "ines-tax",
      ownerId: "ines-moreau",
      label: "Deux derniers avis d'imposition",
      category: "tax",
      status: "verified",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "secure-portal",
    },
    {
      id: "ines-assets",
      ownerId: "ines-moreau",
      label: "Relevés d'épargne",
      category: "asset",
      status: "available",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "secure-portal",
    },
    {
      id: "ines-student",
      ownerId: "ines-moreau",
      label: "Tableau d'amortissement du prêt étudiant",
      category: "liability",
      status: "available",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "secure-portal",
    },
    {
      id: "ines-reservation",
      ownerId: "ines-moreau",
      label: "Contrat de réservation du programme neuf",
      category: "project",
      status: "requested",
      sensitive: true,
      responsibleParty: "Promoteur fictif",
      deliveryChannel: "other",
      note: "À ajouter après sélection définitive du lot.",
    },
    {
      id: "ines-no-company",
      ownerId: "ines-moreau",
      label: "Bilans professionnels",
      category: "professional",
      status: "not-applicable",
      sensitive: true,
      responsibleParty: "Inès Moreau",
      deliveryChannel: "other",
      note: "Sans objet pour un emploi salarié.",
    },
  ],
  editorial: {
    presentationLetter: `<p><strong>Objet : demande d’étude de financement pour ma première résidence principale</strong></p>
<p>Madame, Monsieur,</p>
<p>Je souhaite acquérir un appartement neuf de 50 à 58 m² à Tours ou dans sa proche périphérie. Cette première acquisition répond à un projet durable : disposer d’un logement proche des transports, adapté à mon activité et suffisamment dimensionné pour pouvoir y rester plusieurs années.</p>
<p>J’occupe depuis février 2022 un poste d’ingénieure qualité en contrat à durée indéterminée, après un parcours continu dans ce domaine depuis 2018. Le scénario central repose exclusivement sur mon salaire fixe. Ma prime annuelle est documentée mais n’est pas nécessaire à l’équilibre du financement.</p>
<p>Le prix cible est de 205 000 €. Mon épargne permet un apport de 23 000 € et le montage distingue un prêt employeur de 10 000 €, soumis à confirmation. Après l’apport et les frais d’installation, je souhaite conserver <strong>15 500 € de réserve disponible</strong> pour les imprévus, l’ameublement et les premières charges.</p>
<p>Le budget post-acquisition intègre la mensualité projetée, la copropriété, la taxe foncière, les assurances et mes dépenses habituelles. Le prêt étudiant reste comptabilisé jusqu’à son extinction. Même sans prime et avec des dépenses variables majorées, le scénario prudent conserve une capacité d’épargne mensuelle positive.</p>
<p>Le dossier joint présente ma situation, les hypothèses de financement, les budgets et l’inventaire des justificatifs disponibles. Le contrat de réservation et les pièces propres au bien seront ajoutés dès qu’un lot définitif aura été retenu. Je reste disponible pour préciser chaque hypothèse ou transmettre tout complément utile.</p>
<p>Veuillez agréer, Madame, Monsieur, l’expression de mes salutations distinguées.<br><strong>Inès Moreau</strong></p>`,
    householdSummary:
      "Emprunteuse seule et sans personne à charge, Inès est locataire depuis 2022. Le loyer et les charges actuels sont payés régulièrement, aucun incident n’est déclaré et aucun changement familial susceptible d’alourdir le budget n’est prévu avant l’acquisition.",
    professionalStabilityItems: [
      {
        id: "ines-cdi",
        title: "CDI confirmé",
        body: "Le contrat à durée indéterminée est en cours depuis février 2022 et la période d’essai est achevée. Les bulletins de salaire, le contrat et l’attestation employeur permettent de rapprocher rémunération contractuelle et revenus effectivement versés.",
      },
      {
        id: "ines-continuity",
        title: "Parcours continu",
        body: "Le poste actuel prolonge une expérience continue dans la qualité industrielle depuis 2018. Cette cohérence de métier réduit la dépendance à un employeur particulier et documente une employabilité déjà éprouvée.",
      },
      {
        id: "ines-variable-prudent",
        title: "Variable traité prudemment",
        body: "La prime annuelle est recensée et justifiée, mais elle n’entre pas dans la capacité d’emprunt centrale. Elle constitue ainsi une marge de sécurité potentielle plutôt qu’une ressource nécessaire au paiement des charges courantes.",
      },
    ],
    projectSummary:
      "Appartement neuf de 50 à 58 m² avec balcon, proche des transports dans l’agglomération tourangelle. Le prix cible de 205 000 € inclut une marge mesurée sous le plafond retenu et aucun revenu locatif n’est attendu pour équilibrer l’opération.",
    reserveStrategy:
      "Après un apport de 23 000 €, 15 500 € restent immédiatement disponibles : 9 000 € de précaution, 4 000 € pour l’installation et 2 500 € pour les premières charges et ajustements. Cette réserve est exclue du financement et ne suppose ni prime future ni revente d’un actif.",
    independentIncomeIntroduction:
      "Aucun revenu indépendant, chiffre d’affaires ou bénéfice professionnel n’est déclaré pour ce profil exclusivement salarié. L’annexe est conservée afin que le lecteur puisse constater explicitement que la capacité de remboursement repose sur des revenus de travail salarié documentés.",
    finalDisclaimer: FICTION_DISCLAIMER,
    sectionSlots: {
      cover: {
        introduction:
          "Première acquisition d’une résidence principale préparée à partir d’un salaire fixe, d’une épargne constituée progressivement et d’un budget post-achat documenté.",
        callout:
          "<strong>Lecture proposée :</strong> vérifier la stabilité du revenu fixe, le maintien du prêt étudiant dans les charges et la réserve de 15 500 € conservée après l’opération.",
        conclusion:
          "Les montants variables et le futur avantage employeur restent présentés séparément afin de ne pas surévaluer la capacité centrale.",
      },
      presentationLetter: {
        introduction:
          "Courrier complet à la première personne, structuré comme une demande d’étude adressée à un courtier ou à un établissement prêteur.",
      },
      household: {
        introduction:
          "Le foyer se limite à l’emprunteuse ; aucune pension versée, personne à charge ou évolution familiale budgétée n’est déclarée.",
        conclusion:
          "Le passage du loyer actuel à la mensualité projetée est explicité dans le budget post-achat, sans neutraliser les charges de copropriété ni la taxe foncière.",
      },
      income: {
        introduction:
          "Les revenus sont rapprochés du contrat de travail, des bulletins de salaire et de l’avis d’imposition disponibles.",
        callout:
          "<strong>Hypothèse centrale :</strong> seul le salaire fixe est retenu. La prime annuelle reste visible dans l’historique mais n’est pas nécessaire à l’équilibre mensuel.",
      },
      riskManagement: {
        introduction:
          "La prudence du dossier repose sur trois éléments vérifiables : continuité professionnelle, exclusion du variable et réserve non mobilisée.",
        conclusion:
          "Le budget stress augmente les dépenses courantes et conserve le prêt étudiant ; il maintient néanmoins une épargne mensuelle positive.",
      },
      assets: {
        introduction:
          "Le patrimoine est présenté de manière exhaustive pour distinguer les liquidités réellement mobilisées des actifs conservés.",
        conclusion:
          "L’épargne salariale et le véhicule sont recensés mais exclus de l’apport ; aucune cession n’est indispensable à la réalisation du projet.",
      },
      cashReserve: {
        callout:
          "<strong>15 500 € conservés après apport :</strong> 9 000 € de précaution, 4 000 € d’installation et 2 500 € pour les premières charges du logement.",
        conclusion:
          "Cette réserve reste disponible indépendamment du versement de la prime annuelle.",
      },
      project: {
        introduction:
          "Le neuf réduit les travaux immédiats mais impose d’anticiper appels de fonds, calendrier de livraison, charges de copropriété et ameublement.",
        conclusion:
          "Le choix définitif du lot devra rester sous le plafond et respecter les critères de transport, de surface et de charges renseignés.",
      },
      financing: {
        introduction:
          "Les scénarios comparent une durée courte, un montage central et une mensualité allégée sans modifier l’apport disponible.",
        conclusion:
          "Le prêt employeur est présenté comme une tranche distincte du même besoin de financement ; son éligibilité et ses conditions restent à confirmer avant accord.",
      },
      sankey: {
        introduction:
          "Le diagramme rapproche le revenu retenu de l’ensemble des sorties après acquisition, y compris mensualité, dette étudiante, logement, vie courante et épargne.",
      },
      postPurchaseBudget: {
        introduction:
          "Le budget central reprend les dépenses observées et ajoute les charges propres au futur logement sans compter d’économie hypothétique non documentée.",
        conclusion:
          "La prime variable n’est pas nécessaire à l’équilibre courant ; elle peut renforcer l’épargne ou absorber un imprévu sans financer une charge récurrente.",
      },
      supportingDocuments: {
        introduction:
          "L’inventaire permet de distinguer les pièces disponibles, celles demandées au promoteur et les documents sans objet pour une salariée.",
        conclusion:
          "Aucun fichier réel n’est joint : seul l’inventaire fictif est présenté, avec un responsable et un canal de transmission pour chaque pièce.",
      },
      independentIncomeAnnex: {
        callout:
          "<strong>Sans objet :</strong> aucun revenu indépendant n’est retenu. Cette annexe confirme l’absence de chiffre d’affaires professionnel à analyser.",
      },
    },
  },
  presentation: presentation(
    "Dossier de primo-accession",
    "Salariée seule — appartement neuf à Tours",
    "banking-clean",
  ),
});

export const mixedIncomeFamilyDemo = parseDemo({
  ...structuredClone(salariedFirstBuyerDemo),
  metadata: {
    ...salariedFirstBuyerDemo.metadata,
    dossierId: "demo-famille-revenus-mixtes",
    title: "Famille — revenus salarié et libéral",
    documentStage: "review",
    editionCity: "Grenoble",
  },
  household: {
    people: [
      {
        id: "elodie-garnier",
        displayName: "Élodie Garnier",
        birthDate: "1985-08-21",
        role: "borrower",
        email: "elodie.garnier@example.invalid",
        qualificationNote:
          "Kinésithérapeute libérale installée depuis six ans dans un cabinet partagé.",
      },
      {
        id: "mathieu-roux",
        displayName: "Mathieu Roux",
        birthDate: "1983-11-03",
        role: "co-borrower",
        phone: "+33 6 00 00 00 02",
        qualificationNote:
          "Responsable logistique en CDI dans une entreprise industrielle.",
      },
      {
        id: "child-one",
        displayName: "Enfant du foyer — 9 ans",
        role: "dependent",
      },
      {
        id: "child-two",
        displayName: "Enfant du foyer — 5 ans",
        role: "dependent",
      },
    ],
    relationshipStatus: "married",
    matrimonialRegime: "community",
    dependents: 2,
    housingStatus: "owner",
    currentMonthlyRentCents: 0,
    relationshipSince: "2010-06-01",
    marriageDate: "2014-05-17",
    currentHousingSince: "2017-10-01",
    currentHousingDescription:
      "Appartement de 74 m² actuellement occupé, destiné à être vendu avant l'acquisition.",
    rentHistoryNote: "Sans objet : résidence principale détenue depuis 2017.",
    paymentIncidentsNote:
      "Aucun incident déclaré sur le prêt immobilier ou les charges courantes.",
    plannedHouseholdEvents: [
      {
        id: "family-sale",
        label: "Vente de l'appartement actuel",
        expectedDate: "2027-04-01",
        impact: "housing",
        note: "Le scénario central ne retient que le produit net prudent de la vente.",
      },
      {
        id: "family-school",
        label: "Entrée au collège de l'aîné",
        expectedDate: "2027-09-01",
        impact: "household",
        note: "Les frais de transport et d'activités restent intégrés au budget stress.",
      },
      {
        id: "family-cabinet",
        label: "Renouvellement du bail du cabinet",
        expectedDate: "2028-01-01",
        impact: "professional",
        note: "Aucune hausse de revenu liée au renouvellement n'est anticipée.",
      },
    ],
  },
  professionalActivities: [
    {
      id: "elodie-practice",
      personId: "elodie-garnier",
      label: "Cabinet de kinésithérapie",
      occupation: "Masseuse-kinésithérapeute",
      status: "liberal",
      engagementType: "independent-practice",
      legalRegime: "BNC — déclaration contrôlée",
      startDate: "2020-01-06",
      compensationModel: {
        kind: "consultation",
        consultationFeeCents: 18_50,
        consultationsPerWeek: 78,
        workingWeeksPerYear: 44,
        collectionDelayDays: 12,
        projection: {
          amountCents: 3_650_00,
          effectiveDate: "2027-01-01",
          note: "Projection informative, non retenue dans le revenu prudent.",
        },
        note: "Recettes issues de consultations conventionnées, analysées sur trois exercices.",
      },
      entries: [
        {
          id: "elodie-diploma",
          kind: "education",
          label: "Diplôme d'État de masseur-kinésithérapeute",
          endDate: "2009-06-30",
          evidenceLabels: ["Diplôme"],
        },
        {
          id: "elodie-employed",
          kind: "employment",
          label: "Exercice salarié en centre de rééducation",
          startDate: "2009-09-01",
          endDate: "2019-12-20",
          evidenceLabels: ["Certificats de travail"],
        },
        {
          id: "elodie-installation",
          kind: "practice",
          label: "Installation en cabinet partagé",
          startDate: "2020-01-06",
          evidenceLabels: ["Inscription ordinale", "Bail professionnel"],
        },
      ],
    },
    {
      id: "mathieu-logistics",
      personId: "mathieu-roux",
      label: "Direction d'équipe logistique",
      occupation: "Responsable logistique",
      status: "permanent",
      engagementType: "employee",
      legalRegime: "CDI de droit privé",
      startDate: "2016-09-12",
      compensationModel: {
        kind: "salary",
        contractualGrossAnnualCents: 49_200_00,
        variableGrossAnnualCents: 3_000_00,
        workTimeBasisPoints: 10_000,
        note: "La part variable n'est retenue qu'à 50 % dans l'estimation prudente.",
      },
      entries: [
        {
          id: "mathieu-training",
          kind: "education",
          label: "Master logistique et achats",
          endDate: "2008-09-30",
          evidenceLabels: ["Diplôme"],
        },
        {
          id: "mathieu-company",
          kind: "employment",
          label: "Entrée dans l'entreprise actuelle",
          startDate: "2016-09-12",
          evidenceLabels: ["Contrat de travail"],
        },
        {
          id: "mathieu-promotion",
          kind: "assignment",
          label: "Promotion responsable logistique",
          startDate: "2021-03-01",
          evidenceLabels: ["Avenant au contrat"],
        },
      ],
    },
  ],
  incomeStreams: [
    {
      id: "elodie-income",
      personId: "elodie-garnier",
      activityId: "elodie-practice",
      kind: "liberal",
      label: "Bénéfice libéral retenu",
      monthlyBankCents: 3_400_00,
      monthlyPrudentCents: 3_150_00,
      monthlyAfterTaxEstimateCents: 2_800_00,
      recurring: true,
      includedInBorrowingCapacity: true,
      note: "Moyenne pondérée de trois exercices, arrondie à la baisse.",
    },
    {
      id: "mathieu-salary",
      personId: "mathieu-roux",
      activityId: "mathieu-logistics",
      kind: "salary",
      label: "Salaire fixe",
      monthlyBankCents: 3_020_00,
      monthlyPrudentCents: 3_020_00,
      monthlyAfterTaxEstimateCents: 2_650_00,
      recurring: true,
      includedInBorrowingCapacity: true,
    },
    {
      id: "mathieu-variable",
      personId: "mathieu-roux",
      activityId: "mathieu-logistics",
      kind: "commission",
      label: "Prime sur objectifs",
      monthlyBankCents: 250_00,
      monthlyPrudentCents: 125_00,
      monthlyAfterTaxEstimateCents: 105_00,
      recurring: false,
      includedInBorrowingCapacity: false,
      note: "Documentée mais exclue du scénario de capacité central.",
    },
    {
      id: "family-benefit",
      personId: "elodie-garnier",
      kind: "benefit",
      label: "Allocations familiales",
      monthlyBankCents: 150_00,
      monthlyPrudentCents: 0,
      monthlyAfterTaxEstimateCents: 150_00,
      recurring: true,
      includedInBorrowingCapacity: false,
      note: "Recensées dans le budget de vie, jamais dans la capacité d'emprunt.",
    },
  ],
  revenueHistory: [
    {
      id: "elodie-2023",
      incomeStreamId: "elodie-income",
      period: "2023",
      turnoverCents: 78_000_00,
      expensesCents: 38_200_00,
      resultCents: 39_800_00,
      collectedCents: 77_400_00,
      observed: true,
      sourceLabel: "2035 fictive — exercice 2023",
    },
    {
      id: "elodie-2024",
      incomeStreamId: "elodie-income",
      period: "2024",
      turnoverCents: 82_500_00,
      expensesCents: 40_300_00,
      resultCents: 42_200_00,
      collectedCents: 82_100_00,
      observed: true,
      sourceLabel: "2035 fictive — exercice 2024",
    },
    {
      id: "elodie-2025",
      incomeStreamId: "elodie-income",
      period: "2025",
      turnoverCents: 86_800_00,
      expensesCents: 43_100_00,
      resultCents: 43_700_00,
      collectedCents: 86_200_00,
      observed: true,
      sourceLabel: "2035 fictive — exercice 2025",
    },
    {
      id: "mathieu-variable-2025",
      incomeStreamId: "mathieu-variable",
      period: "2025",
      turnoverCents: 2_750_00,
      expensesCents: 0,
      resultCents: 2_750_00,
      collectedCents: 2_750_00,
      observed: true,
      sourceLabel: "Bulletin annuel fictif",
    },
  ],
  assets: [
    {
      id: "family-current",
      ownerIds: ["elodie-garnier", "mathieu-roux"],
      label: "Compte courant commun",
      category: "current-account",
      amountCents: 8_200_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 4_000_00,
      contributionPriority: "available",
    },
    {
      id: "family-savings",
      ownerIds: ["elodie-garnier", "mathieu-roux"],
      label: "Livrets du foyer",
      category: "regulated-savings",
      amountCents: 31_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 22_000_00,
      contributionPriority: "preferred",
    },
    {
      id: "family-life-insurance",
      ownerIds: ["mathieu-roux"],
      label: "Assurance-vie",
      category: "life-insurance",
      amountCents: 18_500_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 5_000_00,
      contributionPriority: "avoid",
      note: "Rachat partiel seulement si nécessaire.",
    },
    {
      id: "family-home",
      ownerIds: ["elodie-garnier", "mathieu-roux"],
      label: "Appartement actuel",
      category: "real-estate",
      amountCents: 238_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: true,
      contributionAmountCents: 92_000_00,
      contributionPriority: "preferred",
      note: "Produit net prudent après remboursement du prêt et frais de vente.",
    },
    {
      id: "elodie-practice-shares",
      ownerIds: ["elodie-garnier"],
      label: "Parts de la société de moyens du cabinet",
      category: "company-shares",
      amountCents: 3_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: false,
      contributionPriority: "excluded",
      note: "Outil professionnel conservé, sans valeur retenue pour l'apport.",
    },
    {
      id: "elodie-business-cash",
      ownerIds: ["elodie-garnier"],
      label: "Trésorerie du cabinet",
      category: "other",
      amountCents: 14_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: false,
      contributionPriority: "excluded",
      note: "Réserve professionnelle intégralement préservée.",
    },
    {
      id: "family-car",
      ownerIds: ["elodie-garnier", "mathieu-roux"],
      label: "Véhicule familial",
      category: "vehicle",
      amountCents: 16_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: false,
      contributionPriority: "excluded",
    },
  ],
  liabilities: [
    {
      id: "family-mortgage",
      borrowerIds: ["elodie-garnier", "mathieu-roux"],
      label: "Prêt de la résidence actuelle",
      category: "mortgage",
      outstandingCents: 128_000_00,
      monthlyPaymentCents: 845_00,
      startDate: "2017-10-05",
      endDate: "2027-04-01",
      annualRateBasisPoints: 185,
      includedInEffortRate: true,
      note: "Solde projeté lors de la vente ; maintenu dans la photographie actuelle.",
    },
    {
      id: "elodie-equipment",
      borrowerIds: ["elodie-garnier"],
      label: "Financement de matériel du cabinet",
      category: "professional",
      outstandingCents: 7_800_00,
      monthlyPaymentCents: 325_00,
      startDate: "2024-01-15",
      endDate: "2027-01-15",
      annualRateBasisPoints: 390,
      includedInEffortRate: true,
      note: "Remboursement anticipé programmé sur la trésorerie professionnelle, hors apport immobilier.",
    },
    {
      id: "family-car-loan",
      borrowerIds: ["elodie-garnier", "mathieu-roux"],
      label: "Crédit automobile",
      category: "auto",
      outstandingCents: 9_600_00,
      monthlyPaymentCents: 285_00,
      startDate: "2025-02-01",
      endDate: "2027-03-01",
      annualRateBasisPoints: 430,
      includedInEffortRate: true,
      note: "Solde anticipé intégré au calendrier avant l'acquisition.",
    },
  ],
  monthlySnapshots: [
    {
      id: "family-snapshot-2026-05",
      month: "2026-05",
      assetAmountsCents: {
        "family-current": 7_500_00,
        "family-savings": 29_800_00,
        "family-life-insurance": 18_100_00,
        "family-home": 238_000_00,
        "elodie-practice-shares": 3_000_00,
        "elodie-business-cash": 13_400_00,
        "family-car": 16_000_00,
      },
      incomeAmountsCents: {
        "elodie-income": 3_250_00,
        "mathieu-salary": 3_020_00,
        "mathieu-variable": 0,
        "family-benefit": 150_00,
      },
      monthlySavingsCents: 1_450_00,
      liabilityPaymentsCents: {
        "family-mortgage": 845_00,
        "elodie-equipment": 325_00,
        "family-car-loan": 285_00,
      },
      note: "Photographie mensuelle fictive.",
    },
    {
      id: "family-snapshot-2026-06",
      month: "2026-06",
      assetAmountsCents: {
        "family-current": 7_900_00,
        "family-savings": 30_400_00,
        "family-life-insurance": 18_300_00,
        "family-home": 238_000_00,
        "elodie-practice-shares": 3_000_00,
        "elodie-business-cash": 13_700_00,
        "family-car": 16_000_00,
      },
      incomeAmountsCents: {
        "elodie-income": 3_420_00,
        "mathieu-salary": 3_020_00,
        "mathieu-variable": 0,
        "family-benefit": 150_00,
      },
      monthlySavingsCents: 1_450_00,
      liabilityPaymentsCents: {
        "family-mortgage": 845_00,
        "elodie-equipment": 325_00,
        "family-car-loan": 285_00,
      },
      note: "Photographie mensuelle fictive.",
    },
    {
      id: "family-snapshot-2026-07",
      month: "2026-07",
      assetAmountsCents: {
        "family-current": 8_200_00,
        "family-savings": 31_000_00,
        "family-life-insurance": 18_500_00,
        "family-home": 238_000_00,
        "elodie-practice-shares": 3_000_00,
        "elodie-business-cash": 14_000_00,
        "family-car": 16_000_00,
      },
      incomeAmountsCents: {
        "elodie-income": 3_530_00,
        "mathieu-salary": 3_020_00,
        "mathieu-variable": 0,
        "family-benefit": 150_00,
      },
      monthlySavingsCents: 1_450_00,
      liabilityPaymentsCents: {
        "family-mortgage": 845_00,
        "elodie-equipment": 325_00,
        "family-car-loan": 285_00,
      },
      note: "Date d'observation du dossier.",
    },
  ],
  project: {
    id: "family-house",
    projectType: "primary-residence",
    targetPurchaseDate: "2027-07-01",
    targetPriceCents: 465_000_00,
    minimumPriceCents: 430_000_00,
    comfortableMaximumPriceCents: 485_000_00,
    maximumPriceCents: 510_000_00,
    contributionCents: 118_000_00,
    installationCents: 8_000_00,
    renovationCents: 20_000_00,
    acquisitionFeeBasisPoints: 780,
    expectedLiquidityAtPurchaseCents: 148_000_00,
    monthlySavingsProjectionCents: 1_450_00,
    criteria: {
      propertyType: "Maison familiale existante",
      minimumSurfaceSquareMeters: 115,
      idealSurfaceLabel: "120 à 140 m²",
      minimumLandSquareMeters: 350,
      idealLandLabel: "400 à 700 m²",
      minimumBedrooms: 4,
      office: "Pièce fermée pour la gestion administrative du cabinet.",
      pool: "Non prioritaire ; bassin existant accepté si sécurisé.",
      energyRating: "DPE A à D, audit exigé au-delà de C.",
      works:
        "Travaux énergétiques plafonnés à 20 000 € dans le budget central.",
      services:
        "École, collège et commerces accessibles sans trajet quotidien long.",
      commute: "Moins de 40 minutes des deux lieux d'activité.",
      preferredAreas: ["Meylan", "Saint-Ismier", "Corenc"],
      excludedFeatures: [
        "zone à risque naturel non assurable",
        "accès exclusivement routier difficile",
        "gros œuvre non chiffré",
      ],
      additionalCriteria: [
        {
          id: "family-office",
          label: "Bureau",
          value: "Pièce de 9 m² minimum",
          importance: "required",
        },
        {
          id: "family-garden",
          label: "Jardin",
          value: "Clos et utilisable par les enfants",
          importance: "preferred",
        },
        {
          id: "family-annex",
          label: "Dépendance",
          value: "Optionnelle pour stockage",
          importance: "optional",
        },
      ],
    },
  },
  financingScenarios: financingScenarios(
    "family",
    465_000_00,
    118_000_00,
    345,
    20,
    [
      {
        id: "family-ptz",
        label: "Prêt à taux zéro estimatif",
        amountCents: 40_000_00,
        annualRateBasisPoints: 0,
        durationMonths: 240,
        deferredMonths: 60,
      },
    ],
  ),
  budgetScenarios: budgetScenarios(
    "family",
    "family-central",
    5_705_00,
    5_705_00,
    [
      [
        "utilities",
        "Énergie, assurance et entretien",
        "housing",
        430_00,
        480_00,
        true,
      ],
      ["food", "Alimentation", "living", 760_00, 760_00, true],
      ["transport", "Transports", "transport", 520_00, 520_00, true],
      ["children", "Enfants et scolarité", "family", 430_00, 430_00, true],
      ["leisure", "Loisirs et vacances", "leisure", 360_00, 220_00, true],
      [
        "tax",
        "Fiscalité et charges non mensualisées",
        "tax",
        260_00,
        270_00,
        false,
      ],
      ["savings", "Épargne du foyer", "savings", 200_00, 50_00, true],
      ["other", "Marge de sécurité", "other", 100_00, 130_00, true],
    ],
    845_00,
    true,
  ),
  stressCases: [
    {
      id: "family-activity-drop",
      label: "Baisse temporaire de l'activité libérale",
      description:
        "Teste six mois de recettes libérales réduites et des charges familiales renforcées.",
      enabled: true,
      assumptions: [
        {
          id: "family-income-drop",
          label: "Revenu libéral minoré",
          target: "incomeStreams.elodie-income.monthlyPrudentCents",
          operation: "subtract",
          value: 70_000,
          unit: "cents",
        },
        {
          id: "family-cost-rise",
          label: "Charges du foyer majorées",
          target: "budgetScenarios.family-stress-budget.items",
          operation: "add",
          value: 25_000,
          unit: "cents",
        },
      ],
      note: "Le salaire fixe reste inchangé et la trésorerie professionnelle n'est pas mobilisée.",
    },
  ],
  reservePolicy: {
    minimumCents: 20_000_00,
    targetCents: 22_000_00,
    allocations: [
      {
        id: "family-emergency",
        label: "Sécurité familiale",
        amountCents: 10_000_00,
      },
      {
        id: "family-professional",
        label: "Marge activité libérale",
        amountCents: 5_000_00,
      },
      { id: "family-works", label: "Aléas travaux", amountCents: 4_000_00 },
      { id: "family-moving", label: "Déménagement", amountCents: 3_000_00 },
    ],
  },
  estimatedHouseholdAfterTaxIncomeCents: 5_705_00,
  supportingDocuments: [
    {
      id: "family-id-elodie",
      ownerId: "elodie-garnier",
      label: "Pièce d'identité d'Élodie",
      category: "identity",
      status: "verified",
      sensitive: true,
      responsibleParty: "Élodie Garnier",
      deliveryChannel: "secure-portal",
    },
    {
      id: "family-id-mathieu",
      ownerId: "mathieu-roux",
      label: "Pièce d'identité de Mathieu",
      category: "identity",
      status: "verified",
      sensitive: true,
      responsibleParty: "Mathieu Roux",
      deliveryChannel: "secure-portal",
    },
    {
      id: "family-book",
      label: "Livret de famille et acte de mariage",
      category: "household",
      status: "available",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "in-person",
    },
    {
      id: "family-tax",
      label: "Deux derniers avis d'imposition",
      category: "tax",
      status: "verified",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "secure-portal",
    },
    {
      id: "family-elodie-accounts",
      ownerId: "elodie-garnier",
      label: "Déclarations 2035 et relevés professionnels",
      category: "professional",
      status: "available",
      sensitive: true,
      responsibleParty: "Élodie Garnier",
      deliveryChannel: "secure-portal",
    },
    {
      id: "family-mathieu-payslips",
      ownerId: "mathieu-roux",
      label: "Bulletins de salaire et contrat",
      category: "income",
      status: "verified",
      sensitive: true,
      responsibleParty: "Mathieu Roux",
      deliveryChannel: "secure-portal",
    },
    {
      id: "family-assets",
      label: "Relevés d'épargne et estimation du logement",
      category: "asset",
      status: "available",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "secure-portal",
    },
    {
      id: "family-loans",
      label: "Tableaux d'amortissement des prêts en cours",
      category: "liability",
      status: "available",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "encrypted-email",
    },
    {
      id: "family-sale-mandate",
      label: "Avis de valeur de l'appartement",
      category: "project",
      status: "requested",
      sensitive: true,
      responsibleParty: "Agence fictive",
      deliveryChannel: "other",
    },
    {
      id: "family-compromise",
      label: "Avant-contrat de la future maison",
      category: "project",
      status: "missing",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "secure-portal",
      note: "À fournir lorsqu'un bien aura été retenu.",
    },
    {
      id: "family-explanatory-note",
      label: "Note explicative sur le calendrier de vente",
      category: "other",
      status: "available",
      sensitive: false,
      responsibleParty: "Foyer",
      deliveryChannel: "postal",
      note: "Courrier fictif récapitulant les soldes anticipés et la chronologie de l'opération.",
    },
  ],
  editorial: {
    presentationLetter: `<p><strong>Objet : étude de financement pour notre future résidence principale</strong></p>
<p>Madame, Monsieur,</p>
<p>Nous souhaitons acquérir une maison de 120 à 140 m² dans l’agglomération grenobloise, avec quatre chambres, un bureau et un extérieur. Ce projet répond aux besoins de notre foyer de quatre personnes et permettra d’aménager durablement l’espace nécessaire à l’activité libérale d’Élodie.</p>
<p>Mathieu est salarié en CDI dans la même entreprise depuis 2016. Élodie exerce depuis plus de trois exercices complets ; chiffre d’affaires, charges, bénéfice et encaissements sont détaillés dans l’annexe. Son revenu retenu de 3 150 € par mois reste inférieur à la moyenne observée. Primes et prestations familiales sont <strong>exclues de la capacité centrale</strong>.</p>
<p>Le budget cible est de 465 000 €. L’apport de 118 000 € provient principalement de la vente de notre appartement. Le crédit de ce logement et le prêt automobile seront soldés lors de l’opération. La vente précède l’acquisition afin de limiter la double charge, tandis que la trésorerie du cabinet reste entièrement affectée à l’activité.</p>
<p>Après l’apport, les frais et le budget travaux, nous conservons <strong>22 000 € de réserve familiale et professionnelle</strong>. Le budget post-acquisition intègre mensualité, taxe foncière, entretien, assurances et dépenses des enfants. Le scénario prudent réduit le revenu libéral et reste positif sans primes ni allocations. Le PTZ demeure une estimation à confirmer selon le bien et les règles applicables.</p>
<p>Le dossier joint rassemble la chronologie de la vente, les revenus documentés, les trois exercices professionnels, les scénarios, les budgets et l’inventaire des justificatifs. L’avant-contrat sera transmis dès acceptation d’une offre. Nous restons disponibles pour commenter les hypothèses et compléter les pièces nécessaires à votre étude.</p>
<p>Veuillez agréer, Madame, Monsieur, l’expression de nos salutations distinguées.<br><strong>Élodie Martin et Mathieu Roussel</strong></p>`,
    householdSummary:
      "Couple marié avec deux enfants scolarisés, propriétaire de sa résidence principale actuelle et sans incident de paiement déclaré. Le calendrier du projet organise la vente avant l’acquisition afin de solder les crédits concernés et de limiter toute période de double charge.",
    professionalStabilityItems: [
      {
        id: "family-liberal",
        title: "Activité libérale établie",
        body: "Trois exercices complets rapprochent chiffre d’affaires, charges, bénéfice fiscal et encaissements. La progression est régulière, sans retenir le meilleur exercice comme référence unique, et les justificatifs fiscaux et bancaires sont inventoriés.",
      },
      {
        id: "family-salary",
        title: "CDI ancien",
        body: "Mathieu travaille dans la même entreprise depuis 2016 et occupe son poste actuel depuis 2021. L’ancienneté, la rémunération fixe et les versements observés sont cohérents entre contrat, bulletins et avis d’imposition.",
      },
      {
        id: "family-diversification",
        title: "Revenus diversifiés",
        body: "La capacité centrale combine un salaire fixe et un revenu libéral retraité sur plusieurs exercices. Les primes, allocations et produits exceptionnels restent hors calcul, ce qui évite de faire dépendre l’équilibre d’une ressource variable.",
      },
    ],
    projectSummary:
      "Maison familiale de 120 à 140 m² autour de Grenoble, avec quatre chambres, un bureau et un extérieur. Le budget cible de 465 000 € suppose un bâti sans gros œuvre non chiffré et un calendrier coordonné avec la vente du logement actuel.",
    reserveStrategy:
      "La vente finance l’essentiel de l’apport de 118 000 € tout en préservant 22 000 € : 12 000 € de précaution familiale, 6 000 € de continuité professionnelle et 4 000 € pour les ajustements du logement. La trésorerie du cabinet reste totalement hors opération.",
    independentIncomeIntroduction:
      "L’activité libérale d’Élodie est analysée sur trois exercices fiscaux complets. L’annexe rapproche chiffre d’affaires facturé, charges professionnelles, bénéfice déclaré et encaissements bancaires ; le revenu mensuel retenu de 3 150 € se situe sous la moyenne observée afin d’absorber une variation d’activité.",
    finalDisclaimer: FICTION_DISCLAIMER,
    sectionSlots: {
      cover: {
        introduction:
          "Projet de résidence principale porté par un couple à revenus mixtes, avec vente préalable du logement actuel et analyse pluriannuelle de l’activité libérale.",
        callout:
          "<strong>Points structurants :</strong> CDI ancien, trois exercices professionnels documentés, apport principalement issu de la vente et trésorerie du cabinet conservée hors opération.",
        conclusion:
          "Le scénario central exclut primes et allocations et conserve une réserve distincte de l’apport et du budget travaux.",
      },
      presentationLetter: {
        introduction:
          "Courrier argumenté destiné à un courtier ou à un chargé d’affaires, avec chronologie de vente, origine de l’apport et prudences sur les revenus variables.",
      },
      household: {
        introduction:
          "Le foyer comprend deux emprunteurs et deux enfants ; les charges familiales observées sont conservées dans les budgets après acquisition.",
        conclusion:
          "La vente du logement actuel est une étape structurante : elle apporte les fonds, solde le crédit associé et réduit le risque de double mensualité.",
      },
      income: {
        introduction:
          "La lecture sépare le salaire contractuel de Mathieu, le revenu libéral retraité d’Élodie et les flux volontairement exclus.",
        callout:
          "<strong>Retraitement prudent :</strong> primes et allocations sont recensées mais exclues ; le revenu libéral est retenu sous sa moyenne observée sur trois exercices.",
      },
      riskManagement: {
        introduction:
          "Le stress teste simultanément une baisse du revenu libéral, une hausse des dépenses familiales et l’absence de ressources variables.",
        conclusion:
          "La diversification des revenus et la réserve conservée limitent l’effet d’un ralentissement temporaire de l’activité indépendante.",
      },
      assets: {
        introduction:
          "Les actifs sont répartis entre patrimoine familial, épargne disponible, logement à vendre et éléments professionnels non mobilisables.",
        conclusion:
          "La trésorerie du cabinet reste hors apport et aucun actif professionnel n’est nécessaire à la réalisation de l’opération.",
      },
      cashReserve: {
        callout:
          "<strong>22 000 € conservés après opération :</strong> 12 000 € de précaution familiale, 6 000 € dédiés à la continuité du cabinet et 4 000 € d’ajustements logement.",
        conclusion:
          "Cette réserve s’ajoute au budget travaux déjà intégré et n’est pas financée par les primes futures.",
      },
      project: {
        introduction:
          "La recherche privilégie un logement familial existant, proche des écoles et transports, sans gros œuvre non chiffré ni dépendance à une revente secondaire.",
        conclusion:
          "Une offre ne sera retenue qu’après validation des diagnostics, du coût des travaux et de la compatibilité avec le produit net de vente.",
      },
      financing: {
        introduction:
          "Les variantes montrent l’effet de la durée, du taux et du PTZ provisoire sur mensualité, taux d’effort et capital restant dû.",
        conclusion:
          "Le PTZ est une estimation à confirmer selon le bien et la réglementation applicable ; le dossier reste lisible si cette tranche doit être réduite ou supprimée.",
      },
      sankey: {
        introduction:
          "Le diagramme distingue les revenus retenus, la fiscalité, le logement, la vie familiale, les autres dettes, l’épargne programmée et la marge résiduelle.",
      },
      postPurchaseBudget: {
        introduction:
          "Les trois budgets reprennent les charges des enfants, l’entretien d’une maison et la mensualité centrale sans minorer artificiellement la vie courante.",
        conclusion:
          "Le scénario prudent réduit le revenu libéral, neutralise les ressources variables et augmente les dépenses courantes ; son solde reste positif.",
      },
      supportingDocuments: {
        introduction:
          "L’inventaire organise séparément identité, revenus salariés, activité libérale, prêts à solder, vente du logement et futur compromis.",
        conclusion:
          "Les pièces sont inventoriées sans embarquer de justificatif binaire ; les éléments manquants sont rattachés à leur responsable et à leur prochaine échéance.",
      },
      independentIncomeAnnex: {
        introduction:
          "L’annexe rapproche chiffre d’affaires, charges, résultat fiscal et encaissements sur trois ans, puis explicite le revenu mensuel retenu et l’écart avec la moyenne observée.",
        conclusion:
          "La trésorerie professionnelle est conservée dans l’activité et aucun prélèvement exceptionnel n’est supposé pour constituer l’apport.",
      },
    },
  },
  presentation: presentation(
    "Dossier familial à revenus mixtes",
    "Salarié et profession libérale — maison autour de Grenoble",
    "sage",
  ),
});

export const retiredRentalInvestorDemo = parseDemo({
  ...structuredClone(salariedFirstBuyerDemo),
  metadata: {
    ...salariedFirstBuyerDemo.metadata,
    dossierId: "demo-retraites-investissement-locatif",
    title: "Retraités — investissement locatif",
    documentStage: "review",
    editionCity: "La Rochelle",
  },
  household: {
    people: [
      {
        id: "claire-perrin",
        displayName: "Claire Perrin",
        birthDate: "1959-02-16",
        role: "borrower",
        email: "claire.perrin@example.invalid",
        qualificationNote: "Retraitée de la fonction publique hospitalière.",
      },
      {
        id: "alain-mercier",
        displayName: "Alain Mercier",
        birthDate: "1957-07-28",
        role: "co-borrower",
        qualificationNote:
          "Retraité d'une entreprise de maintenance industrielle.",
      },
    ],
    relationshipStatus: "married",
    matrimonialRegime: "separation-of-property",
    dependents: 0,
    housingStatus: "owner",
    currentMonthlyRentCents: 0,
    relationshipSince: "1982-04-01",
    marriageDate: "1984-09-22",
    currentHousingSince: "2004-06-01",
    currentHousingDescription:
      "Maison principale détenue sans crédit dans l'agglomération rochelaise.",
    rentHistoryNote:
      "Sans objet : résidence principale détenue depuis plus de vingt ans.",
    paymentIncidentsNote: "Aucun incident déclaré.",
    plannedHouseholdEvents: [
      {
        id: "retired-management",
        label: "Délégation future de la gestion locative",
        expectedDate: "2031-01-01",
        impact: "expense",
        note: "Le budget prudent inclut déjà des honoraires de gestion.",
      },
      {
        id: "retired-energy",
        label: "Travaux énergétiques de la résidence principale",
        expectedDate: "2028-04-01",
        impact: "housing",
        note: "Enveloppe distincte, non financée par le prêt locatif.",
      },
    ],
  },
  professionalActivities: [],
  incomeStreams: [
    {
      id: "claire-pension",
      personId: "claire-perrin",
      kind: "pension",
      label: "Pension de retraite de Claire",
      monthlyBankCents: 2_480_00,
      monthlyPrudentCents: 2_480_00,
      monthlyAfterTaxEstimateCents: 2_260_00,
      recurring: true,
      includedInBorrowingCapacity: true,
      note: "Pension de base et complémentaire fictives.",
    },
    {
      id: "alain-pension",
      personId: "alain-mercier",
      kind: "pension",
      label: "Pension de retraite d'Alain",
      monthlyBankCents: 2_130_00,
      monthlyPrudentCents: 2_130_00,
      monthlyAfterTaxEstimateCents: 1_950_00,
      recurring: true,
      includedInBorrowingCapacity: true,
    },
    {
      id: "retired-current-rent",
      personId: "claire-perrin",
      kind: "rental",
      label: "Loyer d'un studio existant",
      monthlyBankCents: 610_00,
      monthlyPrudentCents: 427_00,
      monthlyAfterTaxEstimateCents: 370_00,
      recurring: true,
      includedInBorrowingCapacity: true,
      note: "Décote de 30 % appliquée au loyer brut.",
    },
    {
      id: "retired-future-rent",
      personId: "alain-mercier",
      kind: "rental",
      label: "Loyer projeté du futur bien",
      monthlyBankCents: 760_00,
      monthlyPrudentCents: 0,
      monthlyAfterTaxEstimateCents: 0,
      recurring: false,
      includedInBorrowingCapacity: false,
      note: "Flux informatif exclu de la capacité tant que le bien n'est pas acquis et loué.",
    },
  ],
  revenueHistory: [
    {
      id: "rent-2023",
      incomeStreamId: "retired-current-rent",
      period: "2023",
      turnoverCents: 7_320_00,
      expensesCents: 1_460_00,
      resultCents: 5_860_00,
      collectedCents: 7_320_00,
      observed: true,
      sourceLabel: "Déclaration foncière fictive 2023",
    },
    {
      id: "rent-2024",
      incomeStreamId: "retired-current-rent",
      period: "2024",
      turnoverCents: 7_320_00,
      expensesCents: 1_780_00,
      resultCents: 5_540_00,
      collectedCents: 7_320_00,
      observed: true,
      sourceLabel: "Déclaration foncière fictive 2024",
    },
    {
      id: "rent-2025",
      incomeStreamId: "retired-current-rent",
      period: "2025",
      turnoverCents: 7_320_00,
      expensesCents: 1_620_00,
      resultCents: 5_700_00,
      collectedCents: 7_320_00,
      observed: true,
      sourceLabel: "Déclaration foncière fictive 2025",
    },
  ],
  assets: [
    {
      id: "retired-current",
      ownerIds: ["claire-perrin", "alain-mercier"],
      label: "Comptes courants",
      category: "current-account",
      amountCents: 12_500_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 5_000_00,
      contributionPriority: "available",
    },
    {
      id: "retired-savings",
      ownerIds: ["claire-perrin", "alain-mercier"],
      label: "Livrets réglementés",
      category: "regulated-savings",
      amountCents: 43_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 25_000_00,
      contributionPriority: "preferred",
    },
    {
      id: "retired-securities",
      ownerIds: ["alain-mercier"],
      label: "Portefeuille de titres",
      category: "securities",
      amountCents: 67_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 10_000_00,
      contributionPriority: "avoid",
    },
    {
      id: "retired-life-insurance",
      ownerIds: ["claire-perrin"],
      label: "Contrat d'assurance-vie",
      category: "life-insurance",
      amountCents: 92_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: true,
      contributionAmountCents: 15_000_00,
      contributionPriority: "avoid",
      note: "Rachat partiel plafonné pour préserver l'épargne long terme.",
    },
    {
      id: "retired-home",
      ownerIds: ["claire-perrin", "alain-mercier"],
      label: "Résidence principale",
      category: "real-estate",
      amountCents: 410_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: false,
      contributionPriority: "excluded",
    },
    {
      id: "retired-studio",
      ownerIds: ["claire-perrin"],
      label: "Studio actuellement loué",
      category: "real-estate",
      amountCents: 118_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: false,
      contributionPriority: "excluded",
      note: "Actif locatif conservé.",
    },
    {
      id: "retired-crypto",
      ownerIds: ["alain-mercier"],
      label: "Actifs numériques",
      category: "crypto",
      amountCents: 2_400_00,
      observedAt: OBSERVATION_DATE,
      liquid: true,
      availableForContribution: false,
      contributionPriority: "excluded",
      note: "Recensés par transparence, exclus de l'apport et de la réserve.",
    },
    {
      id: "retired-car",
      ownerIds: ["claire-perrin", "alain-mercier"],
      label: "Véhicule",
      category: "vehicle",
      amountCents: 14_000_00,
      observedAt: OBSERVATION_DATE,
      liquid: false,
      availableForContribution: false,
      contributionPriority: "excluded",
    },
  ],
  liabilities: [
    {
      id: "retired-studio-loan",
      borrowerIds: ["claire-perrin"],
      label: "Solde du prêt du studio",
      category: "mortgage",
      outstandingCents: 26_000_00,
      monthlyPaymentCents: 420_00,
      startDate: "2013-03-10",
      endDate: "2029-03-10",
      annualRateBasisPoints: 245,
      includedInEffortRate: true,
      note: "Charge couverte en partie par le loyer existant.",
    },
  ],
  monthlySnapshots: [
    {
      id: "retired-snapshot-2026-05",
      month: "2026-05",
      assetAmountsCents: {
        "retired-current": 11_800_00,
        "retired-savings": 42_200_00,
        "retired-securities": 65_500_00,
        "retired-life-insurance": 91_300_00,
        "retired-home": 410_000_00,
        "retired-studio": 118_000_00,
        "retired-crypto": 2_200_00,
        "retired-car": 14_000_00,
      },
      incomeAmountsCents: {
        "claire-pension": 2_480_00,
        "alain-pension": 2_130_00,
        "retired-current-rent": 610_00,
        "retired-future-rent": 0,
      },
      monthlySavingsCents: 1_050_00,
      liabilityPaymentsCents: { "retired-studio-loan": 420_00 },
      note: "Photographie mensuelle fictive.",
    },
    {
      id: "retired-snapshot-2026-06",
      month: "2026-06",
      assetAmountsCents: {
        "retired-current": 12_100_00,
        "retired-savings": 42_600_00,
        "retired-securities": 66_200_00,
        "retired-life-insurance": 91_700_00,
        "retired-home": 410_000_00,
        "retired-studio": 118_000_00,
        "retired-crypto": 2_300_00,
        "retired-car": 14_000_00,
      },
      incomeAmountsCents: {
        "claire-pension": 2_480_00,
        "alain-pension": 2_130_00,
        "retired-current-rent": 610_00,
        "retired-future-rent": 0,
      },
      monthlySavingsCents: 1_050_00,
      liabilityPaymentsCents: { "retired-studio-loan": 420_00 },
      note: "Photographie mensuelle fictive.",
    },
    {
      id: "retired-snapshot-2026-07",
      month: "2026-07",
      assetAmountsCents: {
        "retired-current": 12_500_00,
        "retired-savings": 43_000_00,
        "retired-securities": 67_000_00,
        "retired-life-insurance": 92_000_00,
        "retired-home": 410_000_00,
        "retired-studio": 118_000_00,
        "retired-crypto": 2_400_00,
        "retired-car": 14_000_00,
      },
      incomeAmountsCents: {
        "claire-pension": 2_480_00,
        "alain-pension": 2_130_00,
        "retired-current-rent": 610_00,
        "retired-future-rent": 0,
      },
      monthlySavingsCents: 1_050_00,
      liabilityPaymentsCents: { "retired-studio-loan": 420_00 },
      note: "Date d'observation du dossier.",
    },
  ],
  project: {
    id: "retired-rental",
    projectType: "rental-investment",
    targetPurchaseDate: "2027-03-01",
    targetPriceCents: 178_000_00,
    minimumPriceCents: 160_000_00,
    comfortableMaximumPriceCents: 185_000_00,
    maximumPriceCents: 195_000_00,
    contributionCents: 45_000_00,
    installationCents: 2_000_00,
    renovationCents: 12_000_00,
    acquisitionFeeBasisPoints: 800,
    expectedLiquidityAtPurchaseCents: 98_000_00,
    monthlySavingsProjectionCents: 1_050_00,
    criteria: {
      propertyType: "Deux-pièces ancien destiné à la location longue durée",
      minimumSurfaceSquareMeters: 38,
      idealSurfaceLabel: "40 à 48 m²",
      minimumBedrooms: 1,
      office: "Sans objet.",
      pool: "Exclue pour limiter les charges de copropriété.",
      energyRating: "DPE A à D après travaux ; passoire thermique exclue.",
      works:
        "Rafraîchissement, cuisine et amélioration énergétique dans une enveloppe de 12 000 €.",
      services: "Transports, université ou bassin d'emploi à proximité.",
      commute: "Gestion accessible en moins de 45 minutes depuis le domicile.",
      preferredAreas: [
        "La Rochelle — quartiers desservis",
        "Aytré",
        "Rochefort centre",
      ],
      excludedFeatures: [
        "location saisonnière obligatoire",
        "copropriété avec contentieux majeur",
        "DPE F ou G sans plan de travaux voté",
      ],
      additionalCriteria: [
        {
          id: "retired-rent",
          label: "Loyer cible",
          value: "700 à 780 € hors charges",
          importance: "required",
        },
        {
          id: "retired-management",
          label: "Gestion locative",
          value: "Délégable à une agence",
          importance: "preferred",
        },
        {
          id: "retired-furnished",
          label: "Location meublée",
          value: "Optionnelle après étude fiscale",
          importance: "optional",
        },
        {
          id: "retired-pool",
          label: "Piscine",
          value: "Exclue",
          importance: "excluded",
        },
      ],
    },
  },
  financingScenarios: financingScenarios(
    "retired",
    178_000_00,
    45_000_00,
    350,
    48,
  ),
  budgetScenarios: budgetScenarios(
    "retired",
    "retired-central",
    4_580_00,
    4_580_00,
    [
      ["utilities", "Charges des logements", "housing", 510_00, 610_00, true],
      ["food", "Vie courante", "living", 720_00, 790_00, true],
      ["transport", "Transport", "transport", 310_00, 360_00, true],
      ["family", "Santé et aide familiale", "family", 360_00, 450_00, true],
      ["leisure", "Loisirs et voyages", "leisure", 520_00, 390_00, true],
      ["tax", "Fiscalité immobilière", "tax", 330_00, 410_00, false],
      [
        "savings",
        "Épargne et entretien futur",
        "savings",
        650_00,
        350_00,
        true,
      ],
      ["other", "Vacance et gestion locative", "other", 240_00, 340_00, true],
    ],
    0,
  ),
  stressCases: [
    {
      id: "retired-vacancy",
      label: "Vacance locative et travaux",
      description:
        "Teste trois mois sans loyer projeté et une hausse des frais d'entretien.",
      enabled: true,
      assumptions: [
        {
          id: "retired-zero-future-rent",
          label: "Loyer projeté ramené à zéro",
          target: "incomeStreams.retired-future-rent.monthlyPrudentCents",
          operation: "multiply",
          value: 0,
          unit: "ratio",
        },
        {
          id: "retired-maintenance",
          label: "Entretien majoré",
          target: "budgetScenarios.retired-stress-budget.items",
          operation: "add",
          value: 30_000,
          unit: "cents",
        },
      ],
      note: "Le loyer projeté n'est déjà pas retenu dans la capacité centrale.",
    },
  ],
  reservePolicy: {
    minimumCents: 30_000_00,
    targetCents: 36_000_00,
    allocations: [
      {
        id: "retired-living",
        label: "Épargne de précaution",
        amountCents: 18_000_00,
      },
      {
        id: "retired-vacancy-pocket",
        label: "Vacance locative",
        amountCents: 6_000_00,
      },
      {
        id: "retired-works-pocket",
        label: "Entretien des deux biens",
        amountCents: 8_000_00,
      },
      {
        id: "retired-health",
        label: "Dépenses de santé",
        amountCents: 4_000_00,
      },
    ],
  },
  estimatedHouseholdAfterTaxIncomeCents: 4_580_00,
  supportingDocuments: [
    {
      id: "retired-id-claire",
      ownerId: "claire-perrin",
      label: "Pièce d'identité de Claire",
      category: "identity",
      status: "verified",
      sensitive: true,
      responsibleParty: "Claire Perrin",
      deliveryChannel: "secure-portal",
    },
    {
      id: "retired-id-alain",
      ownerId: "alain-mercier",
      label: "Pièce d'identité d'Alain",
      category: "identity",
      status: "verified",
      sensitive: true,
      responsibleParty: "Alain Mercier",
      deliveryChannel: "secure-portal",
    },
    {
      id: "retired-marriage",
      label: "Livret de famille",
      category: "household",
      status: "available",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "in-person",
    },
    {
      id: "retired-pensions",
      label: "Titres de pension et relevés de versement",
      category: "income",
      status: "verified",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "secure-portal",
    },
    {
      id: "retired-tax",
      label: "Avis d'imposition et déclarations foncières",
      category: "tax",
      status: "verified",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "secure-portal",
    },
    {
      id: "retired-assets",
      label: "Relevés d'épargne et estimations immobilières",
      category: "asset",
      status: "available",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "encrypted-email",
    },
    {
      id: "retired-studio-loan-doc",
      ownerId: "claire-perrin",
      label: "Tableau d'amortissement du studio",
      category: "liability",
      status: "available",
      sensitive: true,
      responsibleParty: "Claire Perrin",
      deliveryChannel: "secure-portal",
    },
    {
      id: "retired-lease",
      ownerId: "claire-perrin",
      label: "Bail et quittances du studio existant",
      category: "project",
      status: "available",
      sensitive: true,
      responsibleParty: "Claire Perrin",
      deliveryChannel: "secure-portal",
    },
    {
      id: "retired-target-property",
      label: "Diagnostics et procès-verbaux du bien ciblé",
      category: "project",
      status: "requested",
      sensitive: true,
      responsibleParty: "Vendeur fictif",
      deliveryChannel: "other",
    },
    {
      id: "retired-professional-na",
      label: "Justificatifs d'activité professionnelle",
      category: "professional",
      status: "not-applicable",
      sensitive: true,
      responsibleParty: "Foyer",
      deliveryChannel: "other",
      note: "Sans objet pour deux emprunteurs retraités.",
    },
  ],
  editorial: {
    presentationLetter: `<p><strong>Objet : étude de financement pour un investissement locatif de long terme</strong></p>
<p>Madame, Monsieur,</p>
<p>Nous souhaitons acquérir à La Rochelle un appartement ancien de 40 à 48 m² destiné à la location nue de longue durée. Ce projet complète un patrimoine déjà constitué, dans un secteur que nous connaissons et à une distance compatible avec une gestion suivie.</p>
<p>Nous sommes retraités et propriétaires sans crédit de notre résidence principale. Nos pensions constituent la base du remboursement. Le studio que nous louons déjà dispose d’un historique documenté de baux, quittances et encaissements ; son loyer n’est retenu qu’à 70 %. <strong>Le futur loyer reste totalement exclu de la capacité centrale.</strong></p>
<p>Le prix cible est de 178 000 €. Avant toute offre, nous contrôlerons diagnostics, procès-verbaux de copropriété, charges, taxe foncière et travaux prévisibles. Le budget comprend une remise en état et ne suppose ni location saisonnière ni rendement exceptionnel. L’apport de 45 000 € provient uniquement de notre épargne disponible.</p>
<p>Après l’opération, nous conservons <strong>36 000 € de liquidités</strong> pour la précaution générale, la vacance, l’entretien et la santé. Le budget post-acquisition reprend la mensualité, les dépenses courantes et les charges locatives. Le scénario prudent cumule vacance du studio existant et réparation ponctuelle, sans compter le loyer du nouveau bien ni vendre un placement de long terme.</p>
<p>Le dossier joint présente le foyer, les titres de pension, l’historique locatif, le patrimoine, les scénarios, les budgets et l’inventaire des justificatifs. Les diagnostics et procès-verbaux seront ajoutés dès sélection du bien. Nous restons disponibles pour expliquer notre stratégie de gestion ou transmettre toute pièce complémentaire.</p>
<p>Veuillez agréer, Madame, Monsieur, l’expression de nos salutations distinguées.<br><strong>Claire et Alain Perrin</strong></p>`,
    householdSummary:
      "Couple marié retraité, sans personne à charge et propriétaire de sa résidence principale sans crédit. Les dépenses courantes et de santé sont conservées dans les budgets, sans supposer de baisse liée au passage à la retraite.",
    professionalStabilityItems: [
      {
        id: "retired-pensions",
        title: "Pensions établies",
        body: "Les deux pensions sont versées régulièrement et constituent la base du remboursement. Les titres de pension, relevés de versement et avis d’imposition permettent d’en vérifier la stabilité sans hypothèse de reprise d’activité.",
      },
      {
        id: "retired-experience",
        title: "Première expérience locative",
        body: "Un studio loué depuis plusieurs années documente la gestion, les quittances, les charges et les encaissements. Cette expérience permet d’appuyer les hypothèses de vacance et d’entretien sur des pratiques déjà observées.",
      },
      {
        id: "retired-prudence",
        title: "Loyer futur exclu",
        body: "Le revenu estimé du bien projeté est présenté pour information mais n’entre pas dans la capacité centrale. Le loyer du studio existant subit lui-même une décote de 30 % avant d’être retenu.",
      },
    ],
    projectSummary:
      "Deux-pièces ancien de 40 à 48 m² destiné à la location nue de longue durée, dans une copropriété entretenue à La Rochelle. Le prix cible de 178 000 € inclut une enveloppe de remise en état et exclut toute hypothèse de location saisonnière.",
    reserveStrategy:
      "Après l’apport de 45 000 €, 36 000 € restent disponibles : 16 000 € de précaution générale, 8 000 € pour la vacance et l’entretien locatifs, 8 000 € pour la santé et 4 000 € pour les premières dépenses du bien. Aucun placement long terme n’est vendu.",
    independentIncomeIntroduction:
      "Aucune activité professionnelle indépendante n’est exercée par les emprunteurs. Les loyers du studio existant sont des revenus fonciers et non un chiffre d’affaires professionnel ; leur historique est documenté séparément et retenu après une décote bancaire de 30 %.",
    finalDisclaimer: FICTION_DISCLAIMER,
    sectionSlots: {
      cover: {
        introduction:
          "Investissement locatif de taille mesurée porté par deux retraités propriétaires de leur résidence principale, avec une première expérience de bail longue durée.",
        callout:
          "<strong>Lecture prudente :</strong> remboursement fondé sur les pensions, loyer existant décoté de 30 %, futur loyer exclu et réserve de 36 000 € maintenue après l’apport.",
        conclusion:
          "Le projet ne repose ni sur une revente d’actif, ni sur une hausse de loyer, ni sur une occupation immédiate du futur logement.",
      },
      presentationLetter: {
        introduction:
          "Courrier complet présentant l’expérience locative, les contrôles préalables sur le bien, l’exclusion du futur loyer et la réserve dédiée aux aléas.",
      },
      household: {
        introduction:
          "Le foyer comprend deux emprunteurs retraités, sans personne à charge ni échéance de résidence principale.",
        conclusion:
          "La résidence principale est détenue sans dette ; les dépenses de santé et de vie courante restent néanmoins intégralement budgétées.",
      },
      income: {
        introduction:
          "La capacité distingue pensions récurrentes, loyer du studio existant après décote et revenu locatif futur présenté hors calcul.",
        callout:
          "<strong>Hypothèse centrale :</strong> le futur loyer est visible mais exclu de la capacité d’emprunt ; le loyer existant n’est retenu qu’à 70 %.",
      },
      riskManagement: {
        introduction:
          "Le stress combine vacance locative du studio existant, hausse des charges d’entretien et dépense ponctuelle de réparation.",
        conclusion:
          "La réserve dédiée permet de traiter ces aléas sans vendre un placement de long terme ni compter le futur loyer.",
      },
      assets: {
        introduction:
          "Le patrimoine sépare résidence principale, studio existant, liquidités mobilisables et placements conservés à long terme.",
        conclusion:
          "Les actifs numériques, les placements de long terme et les biens immobiliers conservés ne financent pas l’apport et ne sont pas nécessaires à l’équilibre mensuel.",
      },
      cashReserve: {
        callout:
          "<strong>36 000 € conservés :</strong> précaution générale, vacance et entretien locatifs, santé et premières dépenses du nouveau bien sont provisionnés séparément.",
        conclusion:
          "Cette liquidité reste disponible après paiement de l’apport, des frais et de la remise en état budgétée.",
      },
      project: {
        introduction:
          "Le projet vise une location nue de longue durée proche du domicile, dans une copropriété dont les charges et travaux seront examinés avant engagement.",
        conclusion:
          "Le prix final devra rester compatible avec l’enveloppe de remise en état et les diagnostics du bien, sans rechercher un rendement exceptionnel.",
      },
      financing: {
        introduction:
          "Les scénarios comparent plusieurs durées avec un apport identique et sans intégrer le loyer du bien projeté dans les revenus retenus.",
        conclusion:
          "Le montage reste volontairement simple, sans prêt complémentaire, différé ni hypothèse de remboursement anticipé indispensable.",
      },
      sankey: {
        introduction:
          "Le budget distingue pensions, loyer existant décoté, mensualité, dépenses courantes, charges locatives, épargne et marge résiduelle.",
      },
      postPurchaseBudget: {
        introduction:
          "Les budgets central et prudent conservent les dépenses de santé, l’entretien du studio existant et une provision pour le nouveau bien.",
        conclusion:
          "Le budget reste équilibré sans compter le loyer futur, y compris lorsque la vacance et l’entretien sont augmentés simultanément.",
      },
      supportingDocuments: {
        introduction:
          "L’inventaire rassemble titres de pension, fiscalité, patrimoine, bail existant, tableaux d’amortissement et pièces à obtenir sur la copropriété ciblée.",
        conclusion:
          "Les titres de pension et l’historique des revenus fonciers sont les pièces centrales ; diagnostics et procès-verbaux restent à rattacher au bien choisi.",
      },
      independentIncomeAnnex: {
        callout:
          "<strong>Sans activité indépendante :</strong> l’annexe explique pourquoi les revenus fonciers du studio existant ne constituent pas un revenu professionnel et documente leur décote.",
      },
    },
  },
  presentation: presentation(
    "Dossier d'investissement locatif",
    "Couple retraité — acquisition d'un deux-pièces locatif",
    "heritage",
  ),
});

export interface DemoDossierDescriptor {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly highlights: readonly string[];
  readonly dossier: Dossier;
}

export const demoDossierCatalog = [
  {
    id: "salaried-first-buyer",
    title: "Première acquisition en solo",
    summary: "Salariée en CDI, apport progressif et appartement neuf.",
    highlights: ["1 emprunteuse", "CDI + prime exclue", "Prêt employeur"],
    dossier: salariedFirstBuyerDemo,
  },
  {
    id: "mixed-income-family",
    title: "Famille à revenus mixtes",
    summary:
      "Couple avec deux enfants, revenu libéral documenté et vente du logement actuel.",
    highlights: ["2 emprunteurs", "CDI + profession libérale", "PTZ estimatif"],
    dossier: mixedIncomeFamilyDemo,
  },
  {
    id: "retired-rental-investor",
    title: "Retraités investisseurs locatifs",
    summary:
      "Pensions stables, patrimoine diversifié et loyer futur exclu de la capacité.",
    highlights: ["2 retraités", "Revenus fonciers", "Projet locatif"],
    dossier: retiredRentalInvestorDemo,
  },
] as const satisfies readonly DemoDossierDescriptor[];
