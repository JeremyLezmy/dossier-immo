import { describe, expect, it } from "vitest";
import { calculateDossier } from "@dossier-immo/calculations";
import {
  completeDemoDossier,
  demoDossierCatalog,
} from "@dossier-immo/fixtures";
import { renderAssetCompositionChart } from "./charts";
import { renderBankDocument } from "./index";
import { formatEuro } from "./format";
import { renderCashBridge } from "./bank-review";

describe("document bancaire", () => {
  it("définit les deux nets et explique le changement de période avant les conventions", () => {
    const dossier = structuredClone(completeDemoDossier);
    const independent = dossier.incomeStreams.find((stream) =>
      ["liberal", "self-employed"].includes(stream.kind),
    )!;
    independent.bankingBasis = {
      referenceYear: 2026,
      allowanceBasisPoints: 3400,
    };
    dossier.incomePeriods = [2025, 2026, 2027].map((year) => ({
      id: `example-${year}`,
      incomeStreamId: independent.id,
      label: `Exercice fictif ${year}`,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      status:
        year === 2025 ? "observed" : year === 2026 ? "forecast" : "run-rate",
      basis: "amount",
      amountCents: 9_000_000,
      socialRateBasisPoints: 2500,
      trainingRateBasisPoints: 0,
      professionalExpensesCents: 120_000,
      taxAllowanceBasisPoints: 3400,
      sourceDocumentIds: [],
    }));
    dossier.budgetScenarios.find(
      (budget) => budget.kind === "central",
    )!.assumptions = {
      incomePeriodIds: ["example-2027"],
      monthlyIncomeTaxCents: 100_000,
    };
    const rendered = renderBankDocument(dossier, calculateDossier(dossier));
    const income = rendered.slice(
      rendered.indexOf("<h2>Revenus —"),
      rendered.indexOf("<h2>Éléments de stabilité"),
    );
    expect(income).toContain("Net avant impôt*");
    expect(income).toContain("Revenu imposable**");
    expect(income).toContain(
      "CA − cotisations URSSAF/CFP − frais professionnels",
    );
    expect(income).toContain("CA − 34 % d’abattement (soit CA × 66 %)");
    expect(income).toContain("10 % de frais forfaitaires");
    expect(income).toContain("Aucun salaire dans ce premier tableau");
    expect(income.indexOf("income-definitions")).toBeLessThan(
      income.indexOf("Conventions proposées"),
    );
    expect(income.indexOf("Pourquoi les montants changent")).toBeLessThan(
      income.indexOf("Revenu et origine de la base"),
    );
    expect(income).toContain(
      `CA 2026 : ${formatEuro(9_000_000)} ; 2025 : ${formatEuro(9_000_000)}`,
    );
  });

  it("date les soldes actuels sans les confondre avec une réserve nette à l’achat", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.reservePolicy.includesInstallation = true;
    dossier.cashFlowPlan = {
      note: "Exemple fictif",
      entries: [],
      reservedTaxCents: 1_000_000,
    };
    const result = calculateDossier(dossier);
    const bridge = renderCashBridge(dossier, result);
    expect(result.bankReview.todayAfterContributionCents).toBe(
      result.contributionLiquidityCents - dossier.project.contributionCents,
    );
    expect(result.bankReview.purchaseAfterContributionCents).toBe(
      result.projectedLiquidityAtPurchaseCents -
        dossier.project.contributionCents,
    );
    expect(bridge).toContain("Aujourd’hui<br><small>Soldes au");
    expect(bridge).toContain("ce n’est pas une réserve nette");
    expect(bridge).toContain(
      `<td>Réserve conservée, installation comprise</td><td class="num">—</td><td class="num">${formatEuro(result.reserveForObjectiveCents)}</td>`,
    );
    expect(bridge).not.toContain("Installation, déménagement et équipement");
  });

  it("place les repères bancaires après le financement et avant le Sankey", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.presentation.sections.financialReview = true;
    const rendered = renderBankDocument(dossier, calculateDossier(dossier));
    const financing = rendered.indexOf("<h2>Scénarios de financement");
    const review = rendered.indexOf("<h2>Repères pour l’étude bancaire");
    const sankey = rendered.indexOf("Budget post-achat — flux mensuels");
    expect(financing).toBeGreaterThan(0);
    expect(review).toBeGreaterThan(financing);
    expect(sankey).toBeGreaterThan(review);
    expect(rendered.match(/<section class="page/g)).toHaveLength(14);
  });
  it("totalise les conventions préparatoires avec le salaire actif et affiche la réserve calculée", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.incomeStreams.find((stream) => stream.kind === "salary")!.endDate =
      "2027-03-26";
    dossier.project.bankIncomeReferenceDate = dossier.metadata.observationDate;
    const calculated = calculateDossier(dossier);
    const rendered = renderBankDocument(dossier, calculated);
    expect(rendered).toContain(
      `<td>Foyer / mois</td><td class="num">${formatEuro(calculated.incomePresentation.bankCents)}</td><td class="num">${formatEuro(calculated.incomePresentation.prudentCents)}</td>`,
    );
    expect(rendered).toContain(
      `<span>Réserve conservée · après installation</span><strong>${formatEuro(calculated.reserveForObjectiveCents)}</strong>`,
    );
  });
  it("conserve la fin des notes bancaires longues et leur échappement", () => {
    const dossier = structuredClone(completeDemoDossier);
    dossier.editorial.sectionSlots.project = {
      conclusion:
        "Hypothèse documentée. ".repeat(20) +
        "FIN À CONSERVER <script>indésirable</script>",
    };
    const rendered = renderBankDocument(dossier, calculateDossier(dossier));
    expect(rendered).toContain("FIN À CONSERVER");
    expect(rendered).not.toContain("<script>");
  });
  it("introduit les définitions sur la page des revenus et garde les profils sans jargon", () => {
    const dossier = structuredClone(completeDemoDossier);
    const rendered = renderBankDocument(dossier, calculateDossier(dossier));
    const household = rendered.slice(
      rendered.indexOf("<h2>Synthèse foyer"),
      rendered.indexOf("<h2>Revenus —"),
    );
    expect(household).not.toContain("Base bancaire proposée");
    expect(household).not.toContain("Économique avant IR");
    const incomes = rendered.slice(
      rendered.indexOf("<h2>Revenus —"),
      rendered.indexOf("<h2>Éléments de stabilité"),
    );
    expect(incomes).toContain(
      "Revenu mensuel avant impôt proposé pour calculer le taux d’effort",
    );
    expect(incomes).not.toContain("Base documentaire alternative");
  });
  const derived = calculateDossier(completeDemoDossier);
  const html = renderBankDocument(completeDemoDossier, derived);

  it("reproduit les treize pages et leur ordre fonctionnel", () => {
    expect((html.match(/<section class="page/g) ?? []).length).toBe(13);
    const titles = [
      "Lettre de présentation",
      "Synthèse foyer",
      "Revenus — budget de vie et lecture bancaire",
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

  it("présente les phases et la composition uniquement lorsqu'un prêt complémentaire existe", () => {
    expect(html).toContain("Composition du financement — Projet central");
    expect(html).toContain("Prêt principal");
    expect(html).toContain("Prêt à taux zéro estimatif");
    expect(html).toContain("0 € hors assurance pendant 60 mois");
    expect(html).toContain("mensualité initiale estimée");
    expect(html).toContain("à partir du mois 61");

    const retired = demoDossierCatalog.find(
      (demo) => demo.id === "retired-rental-investor",
    )!;
    const retiredHtml = renderBankDocument(
      retired.dossier,
      calculateDossier(retired.dossier),
    );
    expect(retiredHtml).not.toContain("Composition du financement —");
    expect(retiredHtml).not.toContain(
      '<table class="compact financing-composition-table">',
    );
  });

  it("décrit les intérêts seuls d'une tranche positive différée", () => {
    const dossier = structuredClone(completeDemoDossier);
    const scenario = dossier.financingScenarios.find(
      (candidate) => candidate.id === "family-central",
    )!;
    scenario.additionalLoanComponents[0]!.annualRateBasisPoints = 600;
    const positiveRateHtml = renderBankDocument(
      dossier,
      calculateDossier(dossier),
    );
    expect(positiveRateHtml).toContain("d’intérêts seuls pendant 60 mois");
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
