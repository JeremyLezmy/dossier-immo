import { z } from "zod";
import { CashFlowPlanSchema, IncomePeriodSchema } from "./planning";
export type { CashFlowPlan, IncomePeriod } from "./planning";

export const CURRENT_SCHEMA_VERSION = 3 as const;

const id = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9][a-z0-9-]*$/,
    "identifiant stable attendu (minuscules, chiffres, tirets)",
  );
const isoDate = z.iso.date();
const isoMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const cents = z.number().int().nonnegative();
const signedCents = z.number().int();
const basisPoints = z.number().int().min(0).max(100_000);

export const PersonSchema = z.strictObject({
  id,
  displayName: z.string().min(1),
  birthDate: isoDate.optional(),
  role: z.enum(["borrower", "co-borrower", "dependent", "other"]),
  email: z.string().email().optional(),
  phone: z.string().min(3).optional(),
  qualificationNote: z.string().optional(),
});

const HouseholdBaseSchema = z.strictObject({
  people: z.array(PersonSchema).min(1),
  relationshipStatus: z.enum([
    "single",
    "married",
    "civil-union",
    "cohabiting",
    "separated",
    "other",
  ]),
  matrimonialRegime: z
    .enum([
      "community",
      "separation-of-property",
      "participation",
      "not-applicable",
      "other",
    ])
    .optional(),
  dependents: z.number().int().nonnegative(),
  housingStatus: z.enum(["tenant", "owner", "hosted", "other"]),
  currentMonthlyRentCents: cents.default(0),
  relationshipSince: isoDate.optional(),
  marriageDate: isoDate.optional(),
  currentHousingSince: isoDate.optional(),
  currentHousingDescription: z.string().optional(),
  rentHistoryNote: z.string().optional(),
  paymentIncidentsNote: z.string().optional(),
});

const ProfessionalActivityBaseSchema = z.strictObject({
  id,
  personId: id,
  label: z.string().min(1),
  occupation: z.string().min(1),
  status: z.enum([
    "permanent",
    "fixed-term",
    "civil-servant",
    "self-employed",
    "company-director",
    "liberal",
    "mixed",
    "other",
  ]),
  legalRegime: z.string().optional(),
  startDate: isoDate,
  previousStartDate: isoDate.optional(),
  continuityNote: z.string().optional(),
  trialPeriodEndDate: isoDate.optional(),
  dailyRateCents: cents.optional(),
  projectedDailyRateCents: cents.optional(),
  projectedDailyRateDate: isoDate.optional(),
  annualWorkedDays: z.number().int().min(0).max(366).optional(),
  paymentDelayDays: z.number().int().min(0).max(365).optional(),
});

export const IncomeStreamSchema = z.strictObject({
  id,
  personId: id,
  activityId: id.optional(),
  kind: z.enum([
    "salary",
    "public-service",
    "self-employed",
    "liberal",
    "rental",
    "pension",
    "benefit",
    "commission",
    "other",
  ]),
  label: z.string().min(1),
  monthlyBankCents: cents,
  monthlyPrudentCents: cents,
  monthlyAfterTaxEstimateCents: cents.optional(),
  recurring: z.boolean().default(true),
  includedInBorrowingCapacity: z.boolean().default(true),
  note: z.string().optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  bankingConvention: z.string().optional(),
  bankingBasis: z
    .strictObject({
      referenceYear: z.number().int().min(1901).max(2200),
      allowanceBasisPoints: z.number().int().min(0).max(10_000),
    })
    .optional(),
  monthlyEconomicCents: cents.optional(),
});

export const RevenueHistoryEntrySchema = z.strictObject({
  id,
  incomeStreamId: id,
  period: z.string().regex(/^\d{4}(-\d{2})?$/),
  turnoverCents: cents,
  expensesCents: cents,
  resultCents: signedCents,
  collectedCents: cents.optional(),
  observed: z.boolean(),
  sourceLabel: z.string().optional(),
});

export const AssetSchema = z.strictObject({
  id,
  ownerIds: z.array(id).min(1),
  label: z.string().min(1),
  category: z.enum([
    "current-account",
    "regulated-savings",
    "securities",
    "life-insurance",
    "retirement",
    "crypto",
    "real-estate",
    "vehicle",
    "company-shares",
    "other",
  ]),
  amountCents: cents,
  observedAt: isoDate,
  liquid: z.boolean(),
  availableForContribution: z.boolean(),
  contributionAmountCents: cents.optional(),
  contributionPriority: z.enum(["preferred", "available", "avoid", "excluded"]),
  note: z.string().optional(),
});

export const LiabilitySchema = z.strictObject({
  id,
  borrowerIds: z.array(id).min(1),
  label: z.string().min(1),
  category: z.enum([
    "mortgage",
    "auto",
    "consumer",
    "student",
    "professional",
    "alimony",
    "bridge",
    "other",
  ]),
  outstandingCents: cents,
  monthlyPaymentCents: cents,
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  annualRateBasisPoints: basisPoints.optional(),
  includedInEffortRate: z.boolean().default(true),
  note: z.string().optional(),
  servicesMonthlyCents: cents.optional(),
  settlementAtPurchaseCents: cents.optional(),
});

export const MonthlySnapshotSchema = z.strictObject({
  id,
  month: isoMonth,
  assetAmountsCents: z.record(id, cents),
  incomeAmountsCents: z.record(id, cents).default({}),
  monthlySavingsCents: cents,
  liabilityPaymentsCents: z.record(id, cents).default({}),
  note: z.string().optional(),
});

const ProjectCriteriaBaseSchema = z.strictObject({
  propertyType: z.string().min(1),
  minimumSurfaceSquareMeters: z.number().positive().optional(),
  idealSurfaceLabel: z.string().optional(),
  minimumLandSquareMeters: z.number().positive().optional(),
  idealLandLabel: z.string().optional(),
  minimumBedrooms: z.number().int().nonnegative().optional(),
  office: z.string().optional(),
  pool: z.string().optional(),
  energyRating: z.string().optional(),
  works: z.string().optional(),
  services: z.string().optional(),
  commute: z.string().optional(),
  preferredAreas: z.array(z.string()).default([]),
  excludedFeatures: z.array(z.string()).default([]),
});

const RealEstateProjectBaseSchema = z.strictObject({
  id,
  projectType: z.enum([
    "primary-residence",
    "rental-investment",
    "new-build",
    "construction",
    "other",
  ]),
  targetPurchaseDate: isoDate,
  targetPriceCents: cents.positive(),
  minimumPriceCents: cents.optional(),
  comfortableMaximumPriceCents: cents.optional(),
  maximumPriceCents: cents.positive(),
  contributionCents: cents,
  bankIncomeReferenceDate: isoDate.optional(),
  financingFeesCents: cents.optional(),
  installationCents: cents,
  renovationCents: cents.default(0),
  acquisitionFeeBasisPoints: basisPoints,
  expectedLiquidityAtPurchaseCents: cents.optional(),
  monthlySavingsProjectionCents: cents.optional(),
  criteria: ProjectCriteriaBaseSchema,
});

export const LoanComponentSchema = z.strictObject({
  id,
  label: z.string().min(1),
  amountCents: cents,
  annualRateBasisPoints: basisPoints,
  durationMonths: z.number().int().positive().max(600),
  deferredMonths: z.number().int().nonnegative().max(120).default(0),
});

export const FinancingScenarioSchema = z.strictObject({
  id,
  label: z.string().min(1),
  annualRateBasisPoints: basisPoints,
  durationMonths: z.number().int().positive().max(600),
  insuranceAnnualBasisPoints: basisPoints,
  priceOverrideCents: cents.positive().optional(),
  contributionOverrideCents: cents.optional(),
  negotiationBasisPoints: basisPoints.default(0),
  additionalLoanComponents: z.array(LoanComponentSchema).default([]),
  highlighted: z.boolean().default(false),
  displayInMainTable: z.boolean().default(true),
  note: z.string().optional(),
});

const BudgetItemBaseSchema = z.strictObject({
  id,
  label: z.string().min(1),
  group: z.enum([
    "housing",
    "living",
    "transport",
    "family",
    "leisure",
    "tax",
    "savings",
    "other",
  ]),
  amountCents: cents,
  sankeyLabel: z.string().optional(),
  showInSankey: z.boolean().default(true),
  adjustable: z.boolean().default(false),
  note: z.string().optional(),
});

const BudgetScenarioBaseSchema = z.strictObject({
  id,
  label: z.string().min(1),
  kind: z.enum(["current", "central", "stress", "custom"]),
  items: z.array(BudgetItemBaseSchema).min(1),
});

const SupportingDocumentBaseSchema = z.strictObject({
  id,
  ownerId: id.optional(),
  label: z.string().min(1),
  category: z.enum([
    "identity",
    "household",
    "income",
    "tax",
    "asset",
    "liability",
    "project",
    "professional",
    "other",
  ]),
  status: z.enum([
    "missing",
    "requested",
    "available",
    "verified",
    "not-applicable",
  ]),
  sensitive: z.boolean().default(true),
  note: z.string().optional(),
});

const EditorialContentBaseSchema = z.strictObject({
  presentationLetter: z.string(),
  householdSummary: z.string(),
  professionalStabilityItems: z.array(
    z.strictObject({ id, title: z.string(), body: z.string() }),
  ),
  projectSummary: z.string().default(""),
  reserveStrategy: z.string(),
  independentIncomeIntroduction: z.string(),
  finalDisclaimer: z.string(),
});

const PresentationBaseSchema = z.strictObject({
  whitePaper: z.boolean().optional(),
  theme: z.enum([
    "banking-clean",
    "heritage",
    "sage",
    "slate",
    "editorial",
    "monochrome",
    "burgundy",
  ]),
  density: z.enum(["comfortable", "compact"]),
  pageSize: z.enum(["A4"]),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  footer: z.string().min(1),
  sections: z.record(z.string(), z.boolean()),
  colors: z.strictObject({
    navy: z.string(),
    blue: z.string(),
    green: z.string(),
    gold: z.string(),
    muted: z.string(),
  }),
});

const DossierCoreSchema = z
  .strictObject({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
    metadata: z.strictObject({
      dossierId: id,
      title: z.string().min(1),
      createdAt: isoDate,
      updatedAt: isoDate,
      observationDate: isoDate,
      currency: z.literal("EUR"),
      locale: z.literal("fr-FR"),
    }),
    household: HouseholdBaseSchema,
    professionalActivities: z.array(ProfessionalActivityBaseSchema),
    incomeStreams: z.array(IncomeStreamSchema).min(1),
    revenueHistory: z.array(RevenueHistoryEntrySchema),
    assets: z.array(AssetSchema).min(1),
    liabilities: z.array(LiabilitySchema),
    monthlySnapshots: z.array(MonthlySnapshotSchema),
    project: RealEstateProjectBaseSchema,
    financingScenarios: z.array(FinancingScenarioSchema).min(1),
    budgetScenarios: z.array(BudgetScenarioBaseSchema).min(1),
    reservePolicy: z.strictObject({
      includesInstallation: z.boolean().optional(),
      minimumCents: cents,
      targetCents: cents,
      allocations: z
        .array(
          z.strictObject({
            id,
            label: z.string().min(1),
            amountCents: cents,
            note: z.string().optional(),
          }),
        )
        .default([]),
    }),
    estimatedHouseholdAfterTaxIncomeCents: cents,
    supportingDocuments: z.array(SupportingDocumentBaseSchema),
    editorial: EditorialContentBaseSchema,
    presentation: PresentationBaseSchema,
  })
  .superRefine((dossier, context) => {
    const collectIds = (
      items: readonly { id: string }[],
      path: (string | number)[],
    ) => {
      const seen = new Set<string>();
      for (const [index, item] of items.entries()) {
        if (seen.has(item.id)) {
          context.addIssue({
            code: "custom",
            path: [...path, index, "id"],
            message: `identifiant dupliqué : ${item.id}`,
          });
        }
        seen.add(item.id);
      }
      return seen;
    };

    const personIds = collectIds(dossier.household.people, [
      "household",
      "people",
    ]);
    const activityIds = collectIds(dossier.professionalActivities, [
      "professionalActivities",
    ]);
    const incomeIds = collectIds(dossier.incomeStreams, ["incomeStreams"]);
    const assetIds = collectIds(dossier.assets, ["assets"]);
    const liabilityIds = collectIds(dossier.liabilities, ["liabilities"]);
    collectIds(dossier.monthlySnapshots, ["monthlySnapshots"]);
    collectIds(dossier.financingScenarios, ["financingScenarios"]);
    dossier.financingScenarios.forEach((scenario, index) =>
      collectIds(scenario.additionalLoanComponents, [
        "financingScenarios",
        index,
        "additionalLoanComponents",
      ]),
    );
    collectIds(dossier.budgetScenarios, ["budgetScenarios"]);
    collectIds(dossier.supportingDocuments, ["supportingDocuments"]);

    const reference = (
      exists: Set<string>,
      value: string,
      path: (string | number)[],
      label: string,
    ) => {
      if (!exists.has(value))
        context.addIssue({
          code: "custom",
          path,
          message: `${label} inconnu : ${value}`,
        });
    };
    dossier.professionalActivities.forEach((activity, index) =>
      reference(
        personIds,
        activity.personId,
        ["professionalActivities", index, "personId"],
        "personne",
      ),
    );
    dossier.incomeStreams.forEach((income, index) => {
      reference(
        personIds,
        income.personId,
        ["incomeStreams", index, "personId"],
        "personne",
      );
      if (income.activityId)
        reference(
          activityIds,
          income.activityId,
          ["incomeStreams", index, "activityId"],
          "activité",
        );
    });
    dossier.revenueHistory.forEach((entry, index) =>
      reference(
        incomeIds,
        entry.incomeStreamId,
        ["revenueHistory", index, "incomeStreamId"],
        "revenu",
      ),
    );
    dossier.assets.forEach((asset, index) =>
      asset.ownerIds.forEach((ownerId, ownerIndex) =>
        reference(
          personIds,
          ownerId,
          ["assets", index, "ownerIds", ownerIndex],
          "titulaire",
        ),
      ),
    );
    dossier.liabilities.forEach((liability, index) =>
      liability.borrowerIds.forEach((borrowerId, borrowerIndex) =>
        reference(
          personIds,
          borrowerId,
          ["liabilities", index, "borrowerIds", borrowerIndex],
          "emprunteur",
        ),
      ),
    );
    dossier.monthlySnapshots.forEach((snapshot, index) => {
      Object.keys(snapshot.assetAmountsCents).forEach((assetId) =>
        reference(
          assetIds,
          assetId,
          ["monthlySnapshots", index, "assetAmountsCents", assetId],
          "actif",
        ),
      );
      Object.keys(snapshot.incomeAmountsCents).forEach((incomeId) =>
        reference(
          incomeIds,
          incomeId,
          ["monthlySnapshots", index, "incomeAmountsCents", incomeId],
          "revenu",
        ),
      );
      Object.keys(snapshot.liabilityPaymentsCents).forEach((liabilityId) =>
        reference(
          liabilityIds,
          liabilityId,
          ["monthlySnapshots", index, "liabilityPaymentsCents", liabilityId],
          "passif",
        ),
      );
    });
    dossier.supportingDocuments.forEach((document, index) => {
      if (document.ownerId)
        reference(
          personIds,
          document.ownerId,
          ["supportingDocuments", index, "ownerId"],
          "titulaire",
        );
    });

    dossier.revenueHistory.forEach((entry, index) => {
      if (entry.resultCents !== entry.turnoverCents - entry.expensesCents) {
        context.addIssue({
          code: "custom",
          path: ["revenueHistory", index, "resultCents"],
          message:
            "le résultat doit être égal au chiffre d'affaires diminué des dépenses",
        });
      }
    });
    dossier.liabilities.forEach((liability, index) => {
      if (
        liability.servicesMonthlyCents !== undefined &&
        liability.servicesMonthlyCents > liability.monthlyPaymentCents
      )
        context.addIssue({
          code: "custom",
          path: ["liabilities", index, "servicesMonthlyCents"],
          message: "les prestations sont une part de la mensualité totale",
        });
      if (
        liability.endDate &&
        liability.endDate < dossier.metadata.observationDate
      ) {
        context.addIssue({
          code: "custom",
          path: ["liabilities", index, "endDate"],
          message: "l'échéance est antérieure à la date d'observation",
        });
      }
    });
    dossier.budgetScenarios.forEach((budget, budgetIndex) =>
      collectIds(budget.items, ["budgetScenarios", budgetIndex, "items"]),
    );
    const highlightedCount = dossier.financingScenarios.filter(
      (scenario) => scenario.highlighted,
    ).length;
    if (highlightedCount !== 1) {
      context.addIssue({
        code: "custom",
        path: ["financingScenarios"],
        message: "un unique scénario de financement doit être mis en avant",
      });
    }
    dossier.financingScenarios.forEach((scenario, index) => {
      const priceCents =
        scenario.priceOverrideCents ?? dossier.project.targetPriceCents;
      const negotiatedPriceCents = Math.round(
        priceCents * (1 - scenario.negotiationBasisPoints / 10_000),
      );
      const feesCents = Math.round(
        (negotiatedPriceCents * dossier.project.acquisitionFeeBasisPoints) /
          10_000,
      );
      const contributionCents =
        scenario.contributionOverrideCents ?? dossier.project.contributionCents;
      const principalCents = Math.max(
        0,
        negotiatedPriceCents +
          feesCents +
          dossier.project.renovationCents +
          (dossier.project.financingFeesCents ?? 0) -
          contributionCents,
      );
      const componentTotalCents = scenario.additionalLoanComponents.reduce(
        (total, component) => total + component.amountCents,
        0,
      );
      if (componentTotalCents > principalCents) {
        context.addIssue({
          code: "custom",
          path: ["financingScenarios", index, "additionalLoanComponents"],
          message:
            "le total des prêts complémentaires ne peut pas dépasser le capital à financer",
        });
      }
    });

    if (
      dossier.reservePolicy.targetCents < dossier.reservePolicy.minimumCents
    ) {
      context.addIssue({
        code: "custom",
        path: ["reservePolicy", "targetCents"],
        message: "la réserve cible doit être supérieure ou égale au minimum",
      });
    }
    if (dossier.project.maximumPriceCents < dossier.project.targetPriceCents) {
      context.addIssue({
        code: "custom",
        path: ["project", "maximumPriceCents"],
        message: "le prix maximal doit être supérieur ou égal au prix cible",
      });
    }
    if (
      dossier.project.minimumPriceCents != null &&
      dossier.project.minimumPriceCents > dossier.project.targetPriceCents
    ) {
      context.addIssue({
        code: "custom",
        path: ["project", "minimumPriceCents"],
        message: "le prix minimal doit être inférieur ou égal au prix cible",
      });
    }
    if (
      dossier.project.comfortableMaximumPriceCents != null &&
      (dossier.project.comfortableMaximumPriceCents <
        dossier.project.targetPriceCents ||
        dossier.project.comfortableMaximumPriceCents >
          dossier.project.maximumPriceCents)
    ) {
      context.addIssue({
        code: "custom",
        path: ["project", "comfortableMaximumPriceCents"],
        message:
          "le plafond de confort doit être compris entre le prix cible et le prix maximal",
      });
    }
    if (dossier.project.targetPurchaseDate < dossier.metadata.observationDate) {
      context.addIssue({
        code: "custom",
        path: ["project", "targetPurchaseDate"],
        message: "la date d'achat cible doit suivre la date d'observation",
      });
    }
    dossier.assets.forEach((asset, index) => {
      if (
        asset.contributionAmountCents != null &&
        asset.contributionAmountCents > asset.amountCents
      ) {
        context.addIssue({
          code: "custom",
          path: ["assets", index, "contributionAmountCents"],
          message:
            "le montant mobilisable ne peut pas dépasser la valeur de l'actif",
        });
      }
      if (
        !asset.availableForContribution &&
        (asset.contributionAmountCents ?? 0) > 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["assets", index, "contributionAmountCents"],
          message:
            "un actif exclu de l'apport ne peut pas porter de montant mobilisable",
        });
      }
    });
    const observedContributionLiquidity = dossier.assets
      .filter((asset) => asset.availableForContribution)
      .reduce(
        (total, asset) =>
          total + (asset.contributionAmountCents ?? asset.amountCents),
        0,
      );
    const [observationYear = 0, observationMonth = 1] =
      dossier.metadata.observationDate.split("-").map(Number);
    const [purchaseYear = 0, purchaseMonth = 1] =
      dossier.project.targetPurchaseDate.split("-").map(Number);
    const projectionMonths = Math.max(
      0,
      (purchaseYear - observationYear) * 12 + purchaseMonth - observationMonth,
    );
    const liquidityAtPurchase =
      dossier.project.expectedLiquidityAtPurchaseCents ??
      observedContributionLiquidity +
        (dossier.project.monthlySavingsProjectionCents ?? 0) * projectionMonths;
    const reserveAfterPurchase =
      liquidityAtPurchase -
      dossier.project.contributionCents -
      (dossier.reservePolicy.includesInstallation
        ? 0
        : dossier.project.installationCents);
    if (reserveAfterPurchase < dossier.reservePolicy.minimumCents) {
      context.addIssue({
        code: "custom",
        path: ["project", "contributionCents"],
        message:
          "la trésorerie projetée ne préserve pas la réserve minimale selon le périmètre choisi",
      });
    }
    dossier.financingScenarios.forEach((scenario, index) => {
      const contribution =
        scenario.contributionOverrideCents ?? dossier.project.contributionCents;
      if (
        liquidityAtPurchase -
          contribution -
          (dossier.reservePolicy.includesInstallation
            ? 0
            : dossier.project.installationCents) <
        dossier.reservePolicy.minimumCents
      ) {
        context.addIssue({
          code: "custom",
          path: ["financingScenarios", index, "contributionOverrideCents"],
          message:
            "l'apport de ce scénario ne préserve pas la réserve minimale selon le périmètre choisi",
        });
      }
    });
    const allocatedReserve = dossier.reservePolicy.allocations.reduce(
      (total, allocation) => total + allocation.amountCents,
      0,
    );
    if (allocatedReserve > dossier.reservePolicy.targetCents) {
      context.addIssue({
        code: "custom",
        path: ["reservePolicy", "allocations"],
        message: "les poches de réserve dépassent la réserve cible",
      });
    }
  });

export type Person = z.infer<typeof PersonSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type FinancingScenario = z.infer<typeof FinancingScenarioSchema>;

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

// Current dossier contract ---------------------------------------------------

export const ProfessionalHistoryEntrySchema = z
  .strictObject({
    id,
    kind: z.enum([
      "education",
      "employment",
      "assignment",
      "practice",
      "business",
      "career-break",
      "other",
    ]),
    label: z.string().min(1),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    note: z.string().optional(),
    evidenceLabels: z.array(z.string().min(1)).default([]),
  })
  .refine(
    (entry) =>
      !entry.startDate || !entry.endDate || entry.endDate >= entry.startDate,
    {
      path: ["endDate"],
      message: "la date de fin doit suivre la date de début",
    },
  );

const CompensationProjectionSchema = z.strictObject({
  amountCents: cents,
  effectiveDate: isoDate,
  note: z.string().optional(),
});

export const CompensationModelSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("salary"),
    contractualGrossAnnualCents: cents.optional(),
    variableGrossAnnualCents: cents.optional(),
    workTimeBasisPoints: z.number().int().min(1).max(10_000).optional(),
    note: z.string().optional(),
  }),
  z.strictObject({
    kind: z.literal("day-rate"),
    dailyRateCents: cents.positive(),
    billableDaysPerYear: z.number().int().positive().max(366).optional(),
    collectionDelayDays: z.number().int().min(0).max(365).optional(),
    projection: CompensationProjectionSchema.optional(),
    note: z.string().optional(),
  }),
  z.strictObject({
    kind: z.literal("consultation"),
    consultationFeeCents: cents.positive().optional(),
    consultationsPerWeek: z.number().positive().max(200).optional(),
    workingWeeksPerYear: z.number().positive().max(53).optional(),
    collectionDelayDays: z.number().int().min(0).max(365).optional(),
    projection: CompensationProjectionSchema.optional(),
    note: z.string().optional(),
  }),
  z.strictObject({
    kind: z.literal("turnover"),
    annualTurnoverCents: cents.optional(),
    collectionDelayDays: z.number().int().min(0).max(365).optional(),
    projection: CompensationProjectionSchema.optional(),
    note: z.string().optional(),
  }),
  z.strictObject({
    kind: z.literal("hourly"),
    hourlyRateCents: cents.positive(),
    hoursPerWeek: z.number().positive().max(168).optional(),
    workingWeeksPerYear: z.number().positive().max(53).optional(),
    collectionDelayDays: z.number().int().min(0).max(365).optional(),
    projection: CompensationProjectionSchema.optional(),
    note: z.string().optional(),
  }),
  z.strictObject({
    kind: z.literal("commission"),
    referenceAnnualCommissionCents: cents.optional(),
    collectionDelayDays: z.number().int().min(0).max(365).optional(),
    note: z.string().optional(),
  }),
  z.strictObject({
    kind: z.literal("other"),
    description: z.string().min(1),
    note: z.string().optional(),
  }),
]);

export const ProfessionalActivitySchema = z.strictObject({
  id,
  personId: id,
  label: z.string().min(1),
  occupation: z.string().min(1),
  status: z.enum([
    "permanent",
    "fixed-term",
    "civil-servant",
    "self-employed",
    "company-director",
    "liberal",
    "other",
  ]),
  engagementType: z.enum([
    "employee",
    "civil-service",
    "contractor",
    "independent-practice",
    "business-owner",
    "other",
  ]),
  legalRegime: z.string().optional(),
  startDate: isoDate,
  trialPeriodEndDate: isoDate.optional(),
  compensationModel: CompensationModelSchema,
  entries: z.array(ProfessionalHistoryEntrySchema).default([]),
});

export const BudgetItemSchema = BudgetItemBaseSchema.extend({
  sourceItemId: id.optional(),
  liabilityId: id.optional(),
});
export const BudgetAssumptionsSchema = z.strictObject({
  afterTaxIncomeCents: cents.optional(),
  financingScenarioId: id.optional(),
  note: z.string().default(""),
  beforeTaxIncomeCents: cents.optional(),
  incomePeriodIds: z.array(id).optional(),
  monthlyIncomeTaxCents: cents.optional(),
  taxProjection: z
    .strictObject({
      parts: z.union([z.literal(1), z.literal(2)]),
      incomePeriodIds: z.array(id).min(1),
      annualSalaryNetTaxableCents: cents,
      annualOtherTaxableCents: cents,
      note: z.string().min(1),
    })
    .optional(),
});
export const BudgetScenarioSchema = z.strictObject({
  id,
  label: z.string().min(1),
  kind: z.enum(["current", "central", "stress", "custom"]),
  assumptions: BudgetAssumptionsSchema,
  items: z.array(BudgetItemSchema).min(1),
});

export const AdditionalCriterionSchema = z.strictObject({
  id,
  label: z.string().min(1),
  value: z.string().min(1),
  importance: z
    .enum(["required", "preferred", "optional", "excluded"])
    .default("preferred"),
  note: z.string().optional(),
});
export const ProjectCriteriaSchema = ProjectCriteriaBaseSchema.extend({
  additionalCriteria: z.array(AdditionalCriterionSchema).default([]),
});
export const RealEstateProjectSchema = RealEstateProjectBaseSchema.extend({
  criteria: ProjectCriteriaSchema,
});

export const PlannedHouseholdEventSchema = z.strictObject({
  id,
  label: z.string().min(1),
  expectedDate: isoDate.optional(),
  impact: z.enum([
    "income",
    "expense",
    "housing",
    "household",
    "professional",
    "other",
  ]),
  note: z.string().optional(),
});
export const HouseholdSchema = HouseholdBaseSchema.extend({
  plannedHouseholdEvents: z.array(PlannedHouseholdEventSchema).default([]),
});

export const SupportingDocumentSchema = SupportingDocumentBaseSchema.extend({
  responsibleParty: z.string().min(1).optional(),
  deliveryChannel: z
    .enum(["secure-portal", "encrypted-email", "in-person", "postal", "other"])
    .optional(),
});

export const EditorialSectionSlotSchema = z.strictObject({
  introduction: z.string().optional(),
  callout: z.string().optional(),
  conclusion: z.string().optional(),
});
export const EditorialSectionSlotsSchema = z.strictObject({
  cover: EditorialSectionSlotSchema.optional(),
  presentationLetter: EditorialSectionSlotSchema.optional(),
  household: EditorialSectionSlotSchema.optional(),
  income: EditorialSectionSlotSchema.optional(),
  riskManagement: EditorialSectionSlotSchema.optional(),
  assets: EditorialSectionSlotSchema.optional(),
  cashReserve: EditorialSectionSlotSchema.optional(),
  project: EditorialSectionSlotSchema.optional(),
  financing: EditorialSectionSlotSchema.optional(),
  sankey: EditorialSectionSlotSchema.optional(),
  postPurchaseBudget: EditorialSectionSlotSchema.optional(),
  supportingDocuments: EditorialSectionSlotSchema.optional(),
  independentIncomeAnnex: EditorialSectionSlotSchema.optional(),
  financialReview: EditorialSectionSlotSchema.optional(),
  incomeHistoryChart: EditorialSectionSlotSchema.optional(),
});
export const EditorialContentSchema = EditorialContentBaseSchema.extend({
  // Explicit page destinations complement the reusable editorial fields.
  sectionSlots: EditorialSectionSlotsSchema.default({}),
});

export const PresentationSectionsSchema = z.strictObject({
  cover: z.boolean(),
  presentationLetter: z.boolean(),
  household: z.boolean(),
  income: z.boolean(),
  riskManagement: z.boolean(),
  assets: z.boolean(),
  cashReserve: z.boolean(),
  project: z.boolean(),
  financing: z.boolean(),
  sankey: z.boolean(),
  postPurchaseBudget: z.boolean(),
  supportingDocuments: z.boolean(),
  independentIncomeAnnex: z.boolean(),
  financialReview: z.boolean().optional(),
  incomeHistoryChart: z.boolean().optional(),
});
export const PresentationSchema = PresentationBaseSchema.extend({
  sections: PresentationSectionsSchema,
});

export const StressCaseSchema = z.strictObject({
  id,
  label: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean().default(true),
  assumptions: z
    .array(
      z.strictObject({
        id,
        label: z.string().min(1),
        target: z.string().min(1),
        operation: z.enum(["set", "add", "subtract", "multiply"]),
        value: z.number().finite(),
        unit: z.enum([
          "cents",
          "basis-points",
          "days",
          "count",
          "ratio",
          "other",
        ]),
        note: z.string().optional(),
      }),
    )
    .min(1),
  note: z.string().optional(),
});

const DossierObjectSchema = z.strictObject({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  metadata: z.strictObject({
    dossierId: id,
    title: z.string().min(1),
    createdAt: isoDate,
    updatedAt: isoDate,
    observationDate: isoDate,
    currency: z.literal("EUR"),
    locale: z.literal("fr-FR"),
    documentStage: z.enum([
      "draft",
      "review",
      "ready-for-submission",
      "submitted",
      "archived",
    ]),
    editionCity: z.string().min(1).optional(),
  }),
  household: HouseholdSchema,
  professionalActivities: z.array(ProfessionalActivitySchema),
  incomeStreams: z.array(IncomeStreamSchema).min(1),
  revenueHistory: z.array(RevenueHistoryEntrySchema),
  assets: z.array(AssetSchema).min(1),
  liabilities: z.array(LiabilitySchema),
  monthlySnapshots: z.array(MonthlySnapshotSchema),
  project: RealEstateProjectSchema,
  financingScenarios: z.array(FinancingScenarioSchema).min(1),
  budgetScenarios: z.array(BudgetScenarioSchema).min(2),
  stressCases: z.array(StressCaseSchema).default([]),
  reservePolicy: z.strictObject({
    includesInstallation: z.boolean().optional(),
    minimumCents: cents,
    targetCents: cents,
    allocations: z
      .array(
        z.strictObject({
          id,
          label: z.string().min(1),
          amountCents: cents,
          note: z.string().optional(),
        }),
      )
      .default([]),
  }),
  estimatedHouseholdAfterTaxIncomeCents: cents,
  supportingDocuments: z.array(SupportingDocumentSchema),
  editorial: EditorialContentSchema,
  presentation: PresentationSchema,
  incomePeriods: z.array(IncomePeriodSchema).optional(),
  cashFlowPlan: CashFlowPlanSchema.optional(),
});

export const DossierSchema = DossierObjectSchema.superRefine(
  (dossier, context) => {
    const checkUniqueIds = (
      items: readonly { id: string }[],
      path: (string | number)[],
    ) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.id))
          context.addIssue({
            code: "custom",
            path: [...path, index, "id"],
            message: `identifiant dupliqué : ${item.id}`,
          });
        seen.add(item.id);
      });
    };
    checkUniqueIds(dossier.household.plannedHouseholdEvents, [
      "household",
      "plannedHouseholdEvents",
    ]);
    checkUniqueIds(dossier.project.criteria.additionalCriteria, [
      "project",
      "criteria",
      "additionalCriteria",
    ]);
    checkUniqueIds(dossier.stressCases, ["stressCases"]);
    dossier.professionalActivities.forEach((activity, index) =>
      checkUniqueIds(activity.entries, [
        "professionalActivities",
        index,
        "entries",
      ]),
    );
    dossier.stressCases.forEach((stressCase, index) =>
      checkUniqueIds(stressCase.assumptions, [
        "stressCases",
        index,
        "assumptions",
      ]),
    );

    const periods = dossier.incomePeriods ?? [];
    checkUniqueIds(periods, ["incomePeriods"]);
    const incomeIds = new Set(dossier.incomeStreams.map((item) => item.id));
    const documentIds = new Set(
      dossier.supportingDocuments.map((item) => item.id),
    );
    const liabilityIds = new Set(dossier.liabilities.map((item) => item.id));
    const periodIds = new Set(periods.map((item) => item.id));
    periods.forEach((period, index) => {
      const issue = (field: string, message: string) =>
        context.addIssue({
          code: "custom",
          path: ["incomePeriods", index, field],
          message,
        });
      if (!incomeIds.has(period.incomeStreamId))
        issue("incomeStreamId", "revenu inconnu");
      for (const documentId of period.sourceDocumentIds)
        if (!documentIds.has(documentId))
          issue("sourceDocumentIds", "justificatif inconnu");
      const stream = dossier.incomeStreams.find(
        (item) => item.id === period.incomeStreamId,
      );
      const model = dossier.professionalActivities.find(
        (item) => item.id === stream?.activityId,
      )?.compensationModel;
      if (
        period.basis !== "amount" &&
        period.unitAmountCents === undefined &&
        !(
          (period.basis === "days" && model?.kind === "day-rate") ||
          (period.basis === "sessions" &&
            model?.kind === "consultation" &&
            model.consultationFeeCents !== undefined)
        )
      )
        issue(
          "unitAmountCents",
          "un tarif explicite ou une activité compatible est requis",
        );
      if (
        period.status === "observed" &&
        period.endDate > dossier.metadata.observationDate
      )
        issue(
          "endDate",
          "un réalisé ne peut pas dépasser la date d'observation",
        );
      if (
        period.status !== "observed" &&
        stream?.endDate &&
        period.endDate > stream.endDate
      )
        issue(
          "endDate",
          "la période dépasse la fin du revenu ; scinder la transition",
        );
      if (
        period.basis !== "amount" &&
        model &&
        "projection" in model &&
        model.projection &&
        !period.unitAmountCents &&
        period.startDate < model.projection.effectiveDate &&
        period.endDate >= model.projection.effectiveDate
      )
        issue(
          "endDate",
          "scinder la période au changement de tarif, ou préciser un tarif moyen",
        );
    });
    dossier.incomeStreams.forEach((stream, index) => {
      if (stream.bankingBasis) {
        const issue = (message: string) =>
          context.addIssue({
            code: "custom",
            path: ["incomeStreams", index, "bankingBasis"],
            message,
          });
        if (!["self-employed", "liberal"].includes(stream.kind))
          issue("Le calcul par CA est réservé aux revenus indépendants.");
        if (stream.monthlyBankCents !== 0 || stream.monthlyPrudentCents !== 0)
          issue(
            "En mode calculé, les anciens montants manuels doivent être remis à zéro.",
          );
        for (const year of [
          stream.bankingBasis.referenceYear - 1,
          stream.bankingBasis.referenceYear,
        ]) {
          const coverage = Array<number>(12).fill(0);
          for (const period of periods.filter(
            (p) =>
              p.incomeStreamId === stream.id &&
              p.status !== "run-rate" &&
              Number((p.collectionDate ?? p.endDate).slice(0, 4)) === year,
          )) {
            if (period.collectionDate)
              coverage[Number(period.collectionDate.slice(5, 7)) - 1]! += 1;
            else {
              if (Number(period.startDate.slice(0, 4)) !== year) {
                issue(
                  "Scinder les périodes entre exercices avant de calculer la base bancaire.",
                );
                continue;
              }
              for (
                let month = Number(period.startDate.slice(5, 7));
                month <= Number(period.endDate.slice(5, 7));
                month++
              )
                coverage[month - 1]! += 1;
            }
          }
          if (coverage.some((count) => count !== 1))
            issue(
              `L’exercice ${year} doit couvrir douze mois sans doublon, avec réalisé ou prévision explicite.`,
            );
        }
      }
      if (
        stream.startDate &&
        stream.endDate &&
        stream.endDate < stream.startDate
      )
        context.addIssue({
          code: "custom",
          path: ["incomeStreams", index, "endDate"],
          message: "la fin doit suivre le début du revenu",
        });
      const activity = dossier.professionalActivities.find(
        (item) => item.id === stream.activityId,
      );
      if (activity && activity.personId !== stream.personId)
        context.addIssue({
          code: "custom",
          path: ["incomeStreams", index, "activityId"],
          message: "l'activité doit appartenir à la même personne",
        });
    });
    dossier.budgetScenarios.forEach((budget, index) => {
      const sources = budget.assumptions.incomePeriodIds ?? [];
      const sourceStreams = periods
        .filter((period) => sources.includes(period.id))
        .map((period) => period.incomeStreamId);
      if (new Set(sourceStreams).size !== sourceStreams.length)
        context.addIssue({
          code: "custom",
          path: ["budgetScenarios", index, "assumptions", "incomePeriodIds"],
          message:
            "choisir une seule période de référence par revenu pour éviter les doubles comptes",
        });
      if (
        new Set(sources).size !== sources.length ||
        sources.some((item) => !periodIds.has(item))
      )
        context.addIssue({
          code: "custom",
          path: ["budgetScenarios", index, "assumptions", "incomePeriodIds"],
          message: "périodes inconnues ou dupliquées",
        });
      if (
        sources.length &&
        budget.assumptions.afterTaxIncomeCents !== undefined
      )
        context.addIssue({
          code: "custom",
          path: [
            "budgetScenarios",
            index,
            "assumptions",
            "afterTaxIncomeCents",
          ],
          message:
            "choisir soit les périodes et l'IR, soit un revenu après IR saisi",
        });
      if (
        sources.length &&
        budget.assumptions.monthlyIncomeTaxCents === undefined &&
        !budget.assumptions.taxProjection
      )
        context.addIssue({
          code: "custom",
          path: [
            "budgetScenarios",
            index,
            "assumptions",
            "monthlyIncomeTaxCents",
          ],
          message: "préciser l'hypothèse d'IR mensuel",
        });
      const tax = budget.assumptions.taxProjection;
      if (tax) {
        if (
          budget.assumptions.monthlyIncomeTaxCents !== undefined ||
          budget.assumptions.afterTaxIncomeCents !== undefined
        )
          context.addIssue({
            code: "custom",
            path: ["budgetScenarios", index, "assumptions", "taxProjection"],
            message:
              "choisir l'estimation fiscale ou une hypothèse manuelle, pas les deux",
          });
        if (
          new Set(tax.incomePeriodIds).size !== tax.incomePeriodIds.length ||
          tax.incomePeriodIds.some((id) => !periodIds.has(id))
        )
          context.addIssue({
            code: "custom",
            path: [
              "budgetScenarios",
              index,
              "assumptions",
              "taxProjection",
              "incomePeriodIds",
            ],
            message: "périodes fiscales inconnues ou dupliquées",
          });
        const taxPeriods = (dossier.incomePeriods ?? []).filter((period) =>
          tax.incomePeriodIds.includes(period.id),
        );
        const years = new Set(
          taxPeriods.map((period) =>
            (period.collectionDate ?? period.endDate).slice(0, 4),
          ),
        );
        if (
          years.size > 1 ||
          taxPeriods.some(
            (period) =>
              !period.collectionDate &&
              period.startDate.slice(0, 4) !== period.endDate.slice(0, 4),
          )
        )
          context.addIssue({
            code: "custom",
            path: ["budgetScenarios", index, "assumptions", "taxProjection"],
            message:
              "les périodes fiscales doivent porter sur une seule année de référence",
          });
        const covered = new Set<string>();
        for (const period of taxPeriods) {
          const start = (period.collectionDate ?? period.startDate).slice(0, 7);
          const end = (period.collectionDate ?? period.endDate).slice(0, 7);
          for (
            let year = Number(start.slice(0, 4));
            year <= Number(end.slice(0, 4));
            year++
          )
            for (let month = 1; month <= 12; month++) {
              const key = `${year}-${String(month).padStart(2, "0")}`;
              if (key < start || key > end) continue;
              const token = `${period.incomeStreamId}:${key}`;
              if (covered.has(token))
                context.addIssue({
                  code: "custom",
                  path: [
                    "budgetScenarios",
                    index,
                    "assumptions",
                    "taxProjection",
                  ],
                  message:
                    "les périodes fiscales se chevauchent pour le même revenu",
                });
              covered.add(token);
            }
        }
        if (
          taxPeriods.some(
            (period) => period.taxAllowanceBasisPoints === undefined,
          )
        )
          context.addIssue({
            code: "custom",
            path: ["budgetScenarios", index, "assumptions", "taxProjection"],
            message: "chaque période fiscale doit préciser son abattement",
          });
      }
      budget.items.forEach((item, itemIndex) => {
        if (item.liabilityId && !liabilityIds.has(item.liabilityId))
          context.addIssue({
            code: "custom",
            path: ["budgetScenarios", index, "items", itemIndex, "liabilityId"],
            message: "crédit inconnu",
          });
      });
    });
    let detailedLiquidity: number | undefined;
    if (dossier.cashFlowPlan) {
      checkUniqueIds(dossier.cashFlowPlan.entries, ["cashFlowPlan", "entries"]);
      const used = new Set<string>();
      detailedLiquidity = dossier.assets
        .filter((item) => item.availableForContribution)
        .reduce(
          (sum, item) =>
            sum + (item.contributionAmountCents ?? item.amountCents),
          0,
        );
      for (const [index, entry] of dossier.cashFlowPlan.entries.entries()) {
        const issue = (field: string, message: string) =>
          context.addIssue({
            code: "custom",
            path: ["cashFlowPlan", "entries", index, field],
            message,
          });
        if (
          entry.date <= dossier.metadata.observationDate ||
          entry.date > dossier.project.targetPurchaseDate
        )
          issue(
            "date",
            "le flux doit être postérieur à l'observation et au plus tard à l'achat",
          );
        let amount = entry.amountCents ?? 0;
        if (entry.incomePeriodId) {
          const period = periods.find(
            (item) => item.id === entry.incomePeriodId,
          );
          if (!period || used.has(entry.incomePeriodId))
            issue(
              "incomePeriodId",
              "période inconnue ou déjà comptée dans la trésorerie",
            );
          used.add(entry.incomePeriodId);
          if (period) {
            if (period.status === "observed" || period.status === "run-rate")
              issue(
                "incomePeriodId",
                "seul un encaissement futur peut alimenter la trésorerie",
              );
            if (period.collectionDate !== entry.date)
              issue(
                "date",
                "la date doit correspondre à l'encaissement prévu de la période",
              );
            // The schema checks funding bounds; the calculation engine produces the detailed results.
            const stream = dossier.incomeStreams.find(
              (item) => item.id === period.incomeStreamId,
            );
            const model = dossier.professionalActivities.find(
              (item) => item.id === stream?.activityId,
            )?.compensationModel;
            const projected =
              model &&
              "projection" in model &&
              model.projection &&
              model.projection.effectiveDate <= period.startDate
                ? model.projection.amountCents
                : undefined;
            const tariff =
              period.unitAmountCents ??
              projected ??
              (model?.kind === "day-rate"
                ? model.dailyRateCents
                : model?.kind === "consultation"
                  ? model.consultationFeeCents
                  : undefined) ??
              0;
            const revenue =
              period.basis === "amount"
                ? (period.amountCents ?? 0)
                : Math.round((period.units ?? 0) * tariff);
            amount =
              revenue -
              (period.socialContributionsPaidCents ??
                Math.round(
                  (revenue *
                    (period.socialRateBasisPoints +
                      period.trainingRateBasisPoints)) /
                    10_000,
                )) -
              period.professionalExpensesCents -
              Math.round(
                (revenue * (period.expenseRateBasisPoints ?? 0)) / 10_000,
              );
          }
        }
        detailedLiquidity += entry.direction === "income" ? amount : -amount;
      }
      if (
        dossier.project.expectedLiquidityAtPurchaseCents !== undefined ||
        dossier.project.monthlySavingsProjectionCents !== undefined
      )
        context.addIssue({
          code: "custom",
          path: ["cashFlowPlan"],
          message:
            "le plan détaillé remplace les deux hypothèses simplifiées de liquidités et d'épargne",
        });
    }

    // Apply the shared cross-reference and financial invariants to the current
    // contract through its stable core fields.
    const {
      stressCases: _stressCases,
      incomePeriods: _periods,
      cashFlowPlan: _cashFlow,
      ...coreBase
    } = dossier;
    const coreProjection = {
      ...coreBase,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: (({ documentStage: _stage, editionCity: _city, ...metadata }) =>
        metadata)(dossier.metadata),
      household: (({ plannedHouseholdEvents: _events, ...household }) =>
        household)(dossier.household),
      professionalActivities: dossier.professionalActivities.map(
        (activity) => ({
          id: activity.id,
          personId: activity.personId,
          label: activity.label,
          occupation: activity.occupation,
          status: activity.status,
          legalRegime: activity.legalRegime,
          startDate: activity.startDate,
          trialPeriodEndDate: activity.trialPeriodEndDate,
        }),
      ),
      project: {
        ...dossier.project,
        ...(detailedLiquidity === undefined
          ? {}
          : { expectedLiquidityAtPurchaseCents: detailedLiquidity }),
        criteria: (({ additionalCriteria: _additional, ...criteria }) =>
          criteria)(dossier.project.criteria),
      },
      budgetScenarios: dossier.budgetScenarios.map((budget) => ({
        id: budget.id,
        label: budget.label,
        kind: budget.kind,
        items: budget.items.map(
          ({ sourceItemId: _source, liabilityId: _liability, ...item }) => item,
        ),
      })),
      supportingDocuments: dossier.supportingDocuments.map(
        ({
          responsibleParty: _party,
          deliveryChannel: _channel,
          ...document
        }) => document,
      ),
      editorial: (({ sectionSlots: _slots, ...editorial }) => editorial)(
        dossier.editorial,
      ),
    };
    const coreResult = DossierCoreSchema.safeParse(coreProjection);
    if (!coreResult.success) {
      for (const issue of coreResult.error.issues)
        context.addIssue({
          code: "custom",
          path: issue.path,
          message: issue.message,
        });
    }

    const centralBudgets = dossier.budgetScenarios.filter(
      (budget) => budget.kind === "central",
    );
    const stressBudgets = dossier.budgetScenarios.filter(
      (budget) => budget.kind === "stress",
    );
    if (centralBudgets.length !== 1)
      context.addIssue({
        code: "custom",
        path: ["budgetScenarios"],
        message: "un unique budget central est obligatoire",
      });
    if (stressBudgets.length !== 1)
      context.addIssue({
        code: "custom",
        path: ["budgetScenarios"],
        message: "un unique budget stress est obligatoire",
      });
    const central = centralBudgets[0];
    const stress = stressBudgets[0];
    if (central && stress) {
      const centralIds = new Set(central.items.map((item) => item.id));
      central.items.forEach((item, index) => {
        if (item.sourceItemId)
          context.addIssue({
            code: "custom",
            path: [
              "budgetScenarios",
              dossier.budgetScenarios.indexOf(central),
              "items",
              index,
              "sourceItemId",
            ],
            message: "un poste central ne référence pas un poste source",
          });
      });
      const usedSources = new Set<string>();
      stress.items.forEach((item, index) => {
        const path = [
          "budgetScenarios",
          dossier.budgetScenarios.indexOf(stress),
          "items",
          index,
          "sourceItemId",
        ];
        if (!item.sourceItemId)
          context.addIssue({
            code: "custom",
            path,
            message:
              "chaque poste stress doit référencer explicitement son poste central",
          });
        else if (!centralIds.has(item.sourceItemId))
          context.addIssue({
            code: "custom",
            path,
            message: `poste central inconnu : ${item.sourceItemId}`,
          });
        else if (usedSources.has(item.sourceItemId))
          context.addIssue({
            code: "custom",
            path,
            message: `poste central référencé plusieurs fois : ${item.sourceItemId}`,
          });
        else usedSources.add(item.sourceItemId);
      });
      central.items.forEach((item) => {
        if (!usedSources.has(item.id))
          context.addIssue({
            code: "custom",
            path: [
              "budgetScenarios",
              dossier.budgetScenarios.indexOf(stress),
              "items",
            ],
            message: `poste central sans équivalent stress : ${item.id}`,
          });
      });
    }
    const financingIds = new Set(
      dossier.financingScenarios.map((scenario) => scenario.id),
    );
    dossier.budgetScenarios.forEach((budget, index) => {
      const financingScenarioId = budget.assumptions.financingScenarioId;
      if (financingScenarioId && !financingIds.has(financingScenarioId)) {
        context.addIssue({
          code: "custom",
          path: [
            "budgetScenarios",
            index,
            "assumptions",
            "financingScenarioId",
          ],
          message: `scénario de financement inconnu : ${financingScenarioId}`,
        });
      }
    });
  },
);

export type Dossier = z.infer<typeof DossierSchema>;
export type BudgetScenario = z.infer<typeof BudgetScenarioSchema>;
export type ProfessionalActivity = z.infer<typeof ProfessionalActivitySchema>;
export type CompensationModel = z.infer<typeof CompensationModelSchema>;

export type ValidationResult =
  | { readonly success: true; readonly dossier: Dossier }
  | { readonly success: false; readonly issues: readonly ValidationIssue[] };

/** Remove transient empty values emitted by browser form controls. */
export function normalizeDossierInput(input: unknown): unknown {
  if (typeof input === "number" && !Number.isFinite(input)) return undefined;
  if (typeof input === "string" && input.trim() === "") return undefined;
  if (Array.isArray(input)) return input.map(normalizeDossierInput);
  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).flatMap(([key, value]) => {
        const normalized = normalizeDossierInput(value);
        return normalized === undefined ? [] : [[key, normalized]];
      }),
    );
  }
  return input;
}

export function validateDossier(input: unknown): ValidationResult {
  const result = DossierSchema.safeParse(normalizeDossierInput(input));
  if (result.success) return { success: true, dossier: result.data };
  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

export function dossierJsonSchema(): unknown {
  return z.toJSONSchema(DossierSchema, { target: "draft-2020-12" });
}
