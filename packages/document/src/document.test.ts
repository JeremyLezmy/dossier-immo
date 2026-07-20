import { describe, expect, it } from "vitest";
import { calculateDossier } from "@dossier-immo/calculations";
import {
  completeDemoDossier,
  demoDossierCatalog,
} from "@dossier-immo/fixtures";
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

  it.each(demoDossierCatalog)(
    "ne rend que les pages pertinentes pour $id",
    (demo) => {
      const demoHtml = renderBankDocument(
        demo.dossier,
        calculateDossier(demo.dossier),
      );
      const hasIndependentIncome = demo.dossier.incomeStreams.some((income) =>
        ["self-employed", "liberal"].includes(income.kind),
      );
      expect(demoHtml.match(/<section class="page/g) ?? []).toHaveLength(
        hasIndependentIncome ? 13 : 12,
      );
      expect(demoHtml).not.toMatch(/<tbody>\s*<\/tbody>/);
      if (!hasIndependentIncome) {
        expect(demoHtml).not.toContain(
          "Annexe — revenus indépendants par emprunteur",
        );
      }
      expect(demoHtml).not.toMatch(/\b(undefined|NaN|None)\b/);
      expect(demoHtml).not.toContain("[A_COMPLETER]");
    },
  );

  it("conserve les facteurs de stabilité sans tableau professionnel vide", () => {
    const retired = demoDossierCatalog.find(
      (demo) => demo.id === "retired-rental-investor",
    )!;
    const retiredHtml = renderBankDocument(
      retired.dossier,
      calculateDossier(retired.dossier),
    );
    const riskPage =
      retiredHtml.match(
        /<h2>Éléments de stabilité[\s\S]*?<div class="page-number"/,
      )?.[0] ?? "";

    expect(riskPage).toContain("Pensions établies");
    expect(riskPage).not.toContain("Activités professionnelles");
    expect(riskPage).not.toContain("<table");
  });

  it("utilise les résultats dérivés sans placeholder", () => {
    expect(html).toContain("6 420 €");
    expect(html).toContain("20 000 €");
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
    expect(letterPage).toContain(
      "Nous souhaitons acquérir une maison de 120 à 140 m²",
    );
    expect(letterPage.match(/<p>/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(letterPage).toContain("<strong>Objet : étude de financement");
    expect(letterPage).not.toContain("Approche prudente");
    expect(letterPage).not.toContain(
      completeDemoDossier.editorial.reserveStrategy,
    );
  });

  it("présente le modèle économique de l'activité libérale sans concepts étrangers", () => {
    const riskPage =
      html.match(
        /<h2>Éléments de stabilité[\s\S]*?<div class="page-number"/,
      )?.[0] ?? "";
    expect(riskPage).toContain("Tarif par consultation");
    expect(riskPage).not.toContain("TJM");
    expect(riskPage).not.toContain("CA annuel de référence");
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
    expect(html).toContain("Profession libérale");
    expect(html).toContain("Épargne réglementée");
    expect(html).toContain("Disponible");
    expect(html).toContain("À fournir");
  });

  it("traduit également les catégories du graphique de patrimoine", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.assets.push({
      id: "fictional-securities",
      ownerIds: ["mathieu-roux"],
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
