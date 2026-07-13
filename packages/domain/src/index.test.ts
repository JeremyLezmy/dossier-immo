import { describe, expect, it } from "vitest";
import {
  assetCategoryLabels,
  budgetGroupLabels,
  budgetKindLabels,
  compensationModelLabels,
  documentCategoryLabels,
  documentStatusLabels,
  incomeKindLabels,
  liabilityCategoryLabels,
  personRoleLabels,
  professionalEngagementLabels,
  professionalStatusLabels,
  relationshipStatusLabels,
} from "./index";

describe("catalogue des libellés métier", () => {
  it("fournit des libellés français explicites pour les domaines bancaires", () => {
    expect(personRoleLabels["co-borrower"]).toBe("Co-emprunteur");
    expect(relationshipStatusLabels["civil-union"]).toBe("Pacsé(e)");
    expect(professionalStatusLabels["self-employed"]).toBe("Travailleur indépendant");
    expect(professionalEngagementLabels["independent-practice"]).toBe("Exercice libéral indépendant");
    expect(compensationModelLabels.consultation).toBe("Facturation à la consultation");
    expect(incomeKindLabels.liberal).toBe("Revenu de profession libérale");
    expect(assetCategoryLabels["regulated-savings"]).toBe("Épargne réglementée");
    expect(liabilityCategoryLabels.consumer).toBe("Crédit à la consommation");
    expect(documentCategoryLabels.liability).toBe("Crédits et passifs");
    expect(documentStatusLabels.missing).toBe("À fournir");
    expect(budgetGroupLabels.tax).toBe("Impôts et taxes");
    expect(budgetKindLabels.stress).toBe("Budget de stress");
  });
});
