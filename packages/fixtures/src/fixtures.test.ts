import { describe, expect, it } from "vitest";
import { DossierSchema } from "@dossier-immo/schema";
import {
  completeDemoDossier,
  conformityFixtures,
  createBlankDossier,
  demoDossierCatalog,
} from "./index";

describe("fixtures", () => {
  it.each(Object.entries(conformityFixtures))(
    "valide le dossier de conformité %s",
    (_name, dossier) => {
      expect(DossierSchema.safeParse(dossier).success).toBe(true);
    },
  );

  it("propose trois profils radicalement différents et entièrement synthétiques", () => {
    expect(demoDossierCatalog).toHaveLength(3);
    expect(
      new Set(
        demoDossierCatalog.map(
          (demo) => demo.dossier.household.relationshipStatus,
        ),
      ).size,
    ).toBeGreaterThan(1);
    expect(
      new Set(
        demoDossierCatalog.map((demo) => demo.dossier.project.projectType),
      ).size,
    ).toBe(3);
    expect(
      demoDossierCatalog
        .flatMap((demo) => demo.dossier.household.people)
        .every(
          (person) =>
            !person.email || person.email.endsWith("@example.invalid"),
        ),
    ).toBe(true);
  });

  it("fournit pour chaque profil une véritable lettre bancaire structurée", () => {
    for (const demo of demoDossierCatalog) {
      const letter = demo.dossier.editorial.presentationLetter;
      const words = letter
        .replace(/<[^>]+>/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      expect(words.length, demo.id).toBeGreaterThanOrEqual(250);
      expect(
        (letter.match(/<p>/g) ?? []).length,
        demo.id,
      ).toBeGreaterThanOrEqual(8);
      expect(letter, demo.id).toContain("<strong>Objet :");
      expect(letter, demo.id).toContain("Madame, Monsieur,");
    }
  });

  it("couvre collectivement toutes les catégories de patrimoine", () => {
    const categories = new Set(
      demoDossierCatalog.flatMap((demo) =>
        demo.dossier.assets.map((asset) => asset.category),
      ),
    );
    expect(categories).toEqual(
      new Set([
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
    );
  });

  it("exprime les modèles salarié et libéral sans champs étrangers", () => {
    const liberal = completeDemoDossier.professionalActivities.find(
      (activity) => activity.id === "elodie-practice",
    );
    const salaried = completeDemoDossier.professionalActivities.find(
      (activity) => activity.id === "mathieu-logistics",
    );

    expect(liberal?.compensationModel.kind).toBe("consultation");
    expect(salaried?.compensationModel).toMatchObject({ kind: "salary" });
    expect(salaried?.compensationModel).not.toHaveProperty("dailyRateCents");
    expect(salaried?.compensationModel).not.toHaveProperty(
      "collectionDelayDays",
    );
  });

  it("aligne explicitement le stress sur chaque poste central", () => {
    const central = completeDemoDossier.budgetScenarios.find(
      (budget) => budget.kind === "central",
    )!;
    const stress = completeDemoDossier.budgetScenarios.find(
      (budget) => budget.kind === "stress",
    )!;
    expect(stress.items.map((item) => item.sourceItemId)).toEqual(
      central.items.map((item) => item.id),
    );
    expect(central.assumptions.financingScenarioId).toBeTruthy();
    expect(stress.assumptions.financingScenarioId).toBeTruthy();
  });

  it("crée un dossier vierge structurellement valide et directement éditable", () => {
    const blank = createBlankDossier("2026-07-12");
    expect(DossierSchema.safeParse(blank).success).toBe(true);
    expect(
      blank.budgetScenarios.find((budget) => budget.kind === "central")?.items,
    ).toHaveLength(1);
    expect(
      blank.budgetScenarios.find((budget) => budget.kind === "stress")?.items[0]
        ?.sourceItemId,
    ).toBe("depenses-a-renseigner");
  });
});
