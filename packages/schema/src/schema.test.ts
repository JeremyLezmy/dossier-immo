import { describe, expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import {
  CompensationModelSchema,
  CURRENT_SCHEMA_VERSION,
  dossierJsonSchema,
  normalizeDossierInput,
  validateDossier,
} from "./index";

describe("DossierSchema", () => {
  it("valide le dossier fictif complet", () => {
    expect(completeDemoDossier.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    const result = validateDossier(completeDemoDossier);
    expect(result.success).toBe(true);
  });

  it("rejette explicitement une version de contrat différente", () => {
    const invalid = { ...completeDemoDossier, schemaVersion: 1 };
    const result = validateDossier(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual({
        path: "schemaVersion",
        message: "Invalid input: expected 3",
      });
    }
  });

  it("rejette les références orphelines avec un chemin exploitable par la GUI", () => {
    const invalid = structuredClone(completeDemoDossier);
    invalid.incomeStreams[0]!.personId = "unknown-person";
    const result = validateDossier(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ path: "incomeStreams.0.personId" }),
      );
    }
  });

  it("rejette un identifiant dupliqué", () => {
    const invalid = structuredClone(completeDemoDossier);
    invalid.assets[1]!.id = invalid.assets[0]!.id;
    const result = validateDossier(invalid);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.issues.some((issue) => issue.message.includes("dupliqué")),
      ).toBe(true);
  });

  it("rejette une réserve post-achat insuffisante", () => {
    const invalid = structuredClone(completeDemoDossier);
    invalid.project.contributionCents = 14_000_000;
    const result = validateDossier(invalid);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.issues.some((issue) =>
          issue.message.includes("réserve minimale"),
        ),
      ).toBe(true);
  });

  it("inclut l'épargne mensuelle projetée dans la réserve lorsque la liquidité future n'est pas imposée", () => {
    const projected = structuredClone(completeDemoDossier);
    delete projected.project.expectedLiquidityAtPurchaseCents;
    projected.project.monthlySavingsProjectionCents = 100_000;
    const available = projected.assets
      .filter((asset) => asset.availableForContribution)
      .reduce(
        (total, asset) =>
          total + (asset.contributionAmountCents ?? asset.amountCents),
        0,
      );
    const [observationYear, observationMonth] =
      projected.metadata.observationDate.split("-").map(Number) as [
        number,
        number,
      ];
    const [purchaseYear, purchaseMonth] = projected.project.targetPurchaseDate
      .split("-")
      .map(Number) as [number, number];
    const months =
      (purchaseYear - observationYear) * 12 + purchaseMonth - observationMonth;
    projected.project.contributionCents =
      available +
      projected.project.monthlySavingsProjectionCents * months -
      projected.project.installationCents -
      projected.reservePolicy.minimumCents;

    expect(validateDossier(projected).success).toBe(true);
  });

  it("rejette un historique dont le résultat est incohérent", () => {
    const invalid = structuredClone(completeDemoDossier);
    invalid.revenueHistory[1]!.resultCents += 1;
    const result = validateDossier(invalid);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.issues.some((issue) => issue.path.endsWith("resultCents")),
      ).toBe(true);
  });

  it("rejette des prêts complémentaires supérieurs au capital à financer", () => {
    const invalid = structuredClone(completeDemoDossier);
    invalid.financingScenarios[0]!.additionalLoanComponents = [
      {
        id: "oversized-loan",
        label: "Prêt complémentaire incohérent",
        amountCents: 100_000_000,
        annualRateBasisPoints: 0,
        durationMonths: 240,
        deferredMonths: 0,
      },
    ];
    const result = validateDossier(invalid);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.issues.some((issue) =>
          issue.message.includes("capital à financer"),
        ),
      ).toBe(true);
  });

  it("exporte un JSON Schema strict", () => {
    const schema = dossierJsonSchema() as {
      type?: string;
      additionalProperties?: boolean;
    };
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
  });
});

describe("modèles de rémunération", () => {
  it("ignore les valeurs vides temporaires des champs optionnels", () => {
    const draft = structuredClone(completeDemoDossier) as Record<string, any>;
    draft.household.people[0].birthDate = "";
    draft.household.people[0].email = "";
    draft.professionalActivities[0].trialPeriodEndDate = "";
    draft.professionalActivities[0].compensationModel.collectionDelayDays =
      Number.NaN;
    draft.monthlySnapshots[0].incomeAmountsCents["temporary-field"] = undefined;

    const normalized = normalizeDossierInput(draft) as Record<string, any>;
    expect(normalized.household.people[0]).not.toHaveProperty("birthDate");
    expect(normalized.household.people[0]).not.toHaveProperty("email");
    expect(
      normalized.professionalActivities[0].compensationModel,
    ).not.toHaveProperty("collectionDelayDays");
    expect(
      normalized.monthlySnapshots[0].incomeAmountsCents,
    ).not.toHaveProperty("temporary-field");
    expect(validateDossier(draft).success).toBe(true);
  });
  it.each([
    ["salarié", { kind: "salary", contractualGrossAnnualCents: 52_000_00 }],
    [
      "TJM",
      {
        kind: "day-rate",
        dailyRateCents: 650_00,
        billableDaysPerYear: 210,
        collectionDelayDays: 45,
      },
    ],
    [
      "consultation",
      {
        kind: "consultation",
        consultationFeeCents: 70_00,
        consultationsPerWeek: 22,
        workingWeeksPerYear: 46,
      },
    ],
  ])("valide le persona %s", (_label, compensation) => {
    expect(CompensationModelSchema.safeParse(compensation).success).toBe(true);
  });

  it("interdit au salaire les concepts de TJM, volume de consultation et délai d'encaissement", () => {
    const result = CompensationModelSchema.safeParse({
      kind: "salary",
      dailyRateCents: 650_00,
      consultationsPerWeek: 20,
      collectionDelayDays: 30,
    });
    expect(result.success).toBe(false);
  });

  it("interdit au modèle consultation les champs propres au TJM", () => {
    expect(
      CompensationModelSchema.safeParse({
        kind: "consultation",
        consultationFeeCents: 70_00,
        dailyRateCents: 650_00,
      }).success,
    ).toBe(false);
  });
});
