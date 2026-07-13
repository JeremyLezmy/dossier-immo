import { describe, expect, it } from "vitest";
import { calculateDossier } from "@dossier-immo/calculations";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { renderAssetCompositionChart } from "./charts";
import { renderBankDocument } from "./index";

describe("document bancaire", () => {
  const derived = calculateDossier(completeDemoDossier);
  const html = renderBankDocument(completeDemoDossier, derived);

  it("reproduit les treize pages et leur ordre fonctionnel", () => {
    expect((html.match(/<section class="page/g) ?? []).length).toBe(13);
    const titles = [
      "Lettre de présentation",
      "Synthèse foyer",
      "Revenus retenus",
      "Éléments de stabilité",
      "Patrimoine, liquidités et apport",
      "Trésorerie conservée après achat",
      "Projet immobilier",
      "Scénarios de financement",
      "Budget post-achat — flux mensuels",
      "Budget post-achat",
      "Pièces justificatives",
      "Annexe — revenus indépendants",
    ];
    let cursor = 0;
    for (const title of titles) {
      const position = html.indexOf(title, cursor + 1);
      expect(
        position,
        `section absente ou mal ordonnée : ${title}`,
      ).toBeGreaterThan(cursor);
      cursor = position;
    }
  });

  it("utilise les résultats dérivés sans placeholder", () => {
    expect(html).toContain("5 500 €");
    expect(html).toContain("15 000 €");
    expect(html).not.toMatch(/\b(undefined|NaN|None)\b/);
    expect(html).not.toContain("[A_COMPLETER]");
  });

  it("inclut le Sankey accessible et l'annexe indépendante", () => {
    expect(html).toContain('aria-labelledby="sankey-title sankey-desc"');
    expect(html).toContain("Annexe — revenus indépendants par emprunteur");
    expect(html).toContain("CA facturé");
  });

  it("rend la lettre complète sans injecter la stratégie de réserve", () => {
    const letterPage =
      html.match(
        /<section class="page letter-page">([\s\S]*?)<div class="page-number"/,
      )?.[1] ?? "";
    expect(letterPage).toContain("Nora Leclerc et Samir Diallo présentent");
    expect(letterPage).not.toContain("Approche prudente");
    expect(letterPage).not.toContain(
      completeDemoDossier.editorial.reserveStrategy,
    );
  });

  it("présente le modèle économique de l'activité commerciale sans concepts étrangers", () => {
    const riskPage =
      html.match(
        /<h2>Éléments de stabilité[\s\S]*?<div class="page-number"/,
      )?.[0] ?? "";
    expect(riskPage).toContain("CA annuel de référence");
    expect(riskPage).not.toContain("TJM");
    expect(riskPage).not.toContain("Tarif par consultation");
  });

  it("n'expose aucun code métier brut dans le HTML bancaire", () => {
    const principalCodes = [
      "borrower",
      "co-borrower",
      "married",
      "separation-of-property",
      "tenant",
      "self-employed",
      "permanent",
      "liberal",
      "salary",
      "regulated-savings",
      "current-account",
      "securities",
      "crypto",
      "vehicle",
      "identity",
      "household",
      "professional",
      "liability",
      "project",
      "available",
      "missing",
    ];

    for (const code of principalCodes) {
      expect(
        html,
        `le code métier \"${code}\" ne doit pas être rendu`,
      ).not.toMatch(
        new RegExp(
          `(^|[^a-z-])${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z-]|$)`,
          "i",
        ),
      );
    }

    expect(html).toContain("Co-emprunteur");
    expect(html).toContain("Travailleur indépendant");
    expect(html).toContain("Épargne réglementée");
    expect(html).toContain("Disponible");
    expect(html).toContain("À fournir");
  });

  it("traduit également les catégories du graphique de patrimoine", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.assets.push({
      id: "fictional-securities",
      ownerIds: ["samir-diallo"],
      label: "Portefeuille fictif",
      category: "securities",
      amountCents: 100_000,
      observedAt: dossier.metadata.observationDate,
      liquid: true,
      availableForContribution: false,
      contributionPriority: "excluded",
    });
    const chart = renderAssetCompositionChart(dossier);

    expect(chart).toContain("Épargne réglementée");
    expect(chart).toContain("Valeurs mobilières");
    expect(chart).not.toContain("regulated-savings");
    expect(chart).not.toContain("securities");
  });

  it("rend le texte riche autorisé sans afficher ses balises ni les espaces HTML", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.editorial.sectionSlots.financing = {
      ...dossier.editorial.sectionSlots.financing,
      callout:
        '<span style="font-size: 16px;"><strong>Hypothèses :</strong>&nbsp;texte explicatif</span>',
    };
    const richHtml = renderBankDocument(dossier, calculateDossier(dossier));
    expect(richHtml).toContain(
      '<span style="font-size: 16px;"><strong>Hypothèses :</strong> texte explicatif</span>',
    );
    expect(richHtml).not.toContain("&lt;span");
    expect(richHtml).not.toContain("&nbsp;");
  });
});
