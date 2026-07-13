import { describe, expect, it } from "vitest";
import { DossierSchema } from "@dossier-immo/schema";
import { completeDemoDossier, conformityFixtures, createBlankDossier } from "./index";

describe("fixtures", () => {
  it.each(Object.entries(conformityFixtures))("valide le dossier de conformité %s", (_name, dossier) => {
    expect(DossierSchema.safeParse(dossier).success).toBe(true);
  });

  it("exprime chaque activité avec son modèle économique réel", () => {
    const nora = completeDemoDossier.professionalActivities.find((activity) => activity.id === "nora-boulangerie");
    const samir = completeDemoDossier.professionalActivities.find((activity) => activity.id === "samir-education-nationale");

    expect(nora?.compensationModel.kind).toBe("turnover");
    expect(samir?.compensationModel).toMatchObject({ kind: "salary" });
    expect(samir?.compensationModel).not.toHaveProperty("dailyRateCents");
    expect(samir?.compensationModel).not.toHaveProperty("collectionDelayDays");
  });

  it("aligne explicitement le stress sur chaque poste central", () => {
    const central = completeDemoDossier.budgetScenarios.find((budget) => budget.kind === "central")!;
    const stress = completeDemoDossier.budgetScenarios.find((budget) => budget.kind === "stress")!;
    expect(stress.items.map((item) => item.sourceItemId)).toEqual(central.items.map((item) => item.id));
    expect(central.assumptions.financingScenarioId).toBeTruthy();
    expect(stress.assumptions.financingScenarioId).toBeTruthy();
  });

  it("crée un dossier vierge structurellement valide et directement éditable", () => {
    const blank = createBlankDossier("2026-07-12");
    expect(DossierSchema.safeParse(blank).success).toBe(true);
    expect(blank.budgetScenarios.find((budget) => budget.kind === "central")?.items).toHaveLength(1);
    expect(blank.budgetScenarios.find((budget) => budget.kind === "stress")?.items[0]?.sourceItemId).toBe("depenses-a-renseigner");
  });
});
