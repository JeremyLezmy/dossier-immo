import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { completeDemoDossier } from "@dossier-immo/fixtures";

test("les bases annuelles calculées se mettent à jour depuis les périodes de CA", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dossier-immo-persistence-mode-v1", "local"),
  );
  await page.goto("/");
  const dossier = structuredClone(completeDemoDossier);
  const independent = dossier.incomeStreams.find((s) =>
    ["liberal", "self-employed"].includes(s.kind),
  )!;
  dossier.incomeStreams.forEach((s) => {
    s.includedInBorrowingCapacity = s.id === independent.id;
  });
  independent.bankingBasis = {
    referenceYear: 2026,
    allowanceBasisPoints: 3400,
  };
  independent.monthlyBankCents = independent.monthlyPrudentCents = 0;
  dossier.incomePeriods = [2025, 2026].map((year) => ({
    id: `year-${year}`,
    incomeStreamId: independent.id,
    label: `Référence annuelle ${year}`,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    status: year === 2025 ? "observed" : "forecast",
    basis: "amount",
    amountCents: year === 2025 ? 6_000_000 : 9_000_000,
    socialRateBasisPoints: 2500,
    trainingRateBasisPoints: 0,
    professionalExpensesCents: 0,
    sourceDocumentIds: [],
  }));
  await page
    .getByLabel("Importer un fichier Dossier Immo")
    .setInputFiles({
      name: "bases-fictives.dossier-immo.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(dossier)),
    });
  await expect(page.getByText("Dossier ouvert.")).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Revenus/ })
    .click();
  const summary = page.getByRole("region", { name: "Lecture des revenus" });
  await expect(
    summary.locator(".metric-card").filter({ hasText: "Base 2026" }),
  ).toContainText(/4\s*950/);
  await expect(
    summary.locator(".metric-card").filter({ hasText: "Moyenne 2025–2026" }),
  ).toContainText(/4\s*125/);
  await expect(summary).toContainText("Prévisions incluses");
  await page.locator('[data-disclosure-id="income-periods"] > summary').click();
  const period = page.locator('[data-disclosure-id="item-year-2026"]');
  await period.locator("summary").click();
  await period
    .getByRole("spinbutton", { name: "Recettes HT ou salaire net avant IR" })
    .fill("102000");
  await period
    .getByRole("spinbutton", { name: "Recettes HT ou salaire net avant IR" })
    .blur();
  await expect(
    summary.locator(".metric-card").filter({ hasText: "Base 2026" }),
  ).toContainText(/5\s*610/);
  await expect(
    summary.locator(".metric-card").filter({ hasText: "Moyenne 2025–2026" }),
  ).toContainText(/4\s*455/);
});

test("sépare les revenus économiques et bancaires à chaque largeur", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dossier-immo-persistence-mode-v1", "local"),
  );
  await page.goto("/");
  const dossier = JSON.parse(
    readFileSync("config.example/dossier.json", "utf8"),
  );
  dossier.incomePeriods = [
    {
      id: "income-reading-year",
      incomeStreamId: dossier.incomeStreams[0].id,
      label: "Rythme annuel projeté fictif",
      startDate: "2027-01-01",
      endDate: "2027-12-31",
      status: "run-rate",
      basis: "amount",
      amountCents: 12_000_000,
      socialRateBasisPoints: 2_500,
      trainingRateBasisPoints: 0,
      professionalExpensesCents: 0,
      taxAllowanceBasisPoints: 3_400,
      sourceDocumentIds: [],
    },
  ];
  dossier.budgetScenarios.find(
    (item: { kind: string }) => item.kind === "central",
  ).assumptions = {
    incomePeriodIds: ["income-reading-year"],
    monthlyIncomeTaxCents: 100_000,
    note: "Hypothèses fictives de vérification",
  };
  await page.getByLabel("Importer un fichier Dossier Immo").setInputFiles({
    name: "lecture-fictive.dossier-immo.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(dossier)),
  });
  await expect(page.getByText("Dossier ouvert.")).toBeVisible();
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [768, 1024],
    [1920, 1080],
    [2560, 1440],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    const mobileNavigation = page.getByRole("combobox", {
      name: "Étape du dossier",
    });
    if (await mobileNavigation.isVisible())
      await mobileNavigation.selectOption("income");
    else
      await page
        .locator(".sidebar")
        .getByRole("button", { name: /Revenus/ })
        .click();
    const summary = page.getByRole("region", { name: "Lecture des revenus" });
    await expect(summary).toBeVisible();
    const cards = summary.locator(".metric-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText("Revenu économique projeté");
    await expect(cards.first()).toContainText(/7\s*500/);
    await expect(summary).toContainText(/Budget après IR : 6\s*500/);
    await expect(summary).toContainText("Rythme annuel projeté fictif");
    const clipped = await cards.evaluateAll((elements) =>
      elements.some((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.left < 0 ||
          box.right > window.innerWidth + 1 ||
          element.scrollWidth > element.clientWidth + 1
        );
      }),
    );
    expect(clipped, `cartes lisibles à ${width}px`).toBe(false);
  }
});

test("importe les annexes facultatives et recalcule l’impôt quand le CA change", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dossier-immo-persistence-mode-v1", "local"),
  );
  await page.goto("/");
  const dossier = JSON.parse(
    readFileSync("config.example/dossier.json", "utf8"),
  );
  dossier.incomePeriods = [
    {
      id: "annual-reference",
      incomeStreamId: dossier.incomeStreams[0].id,
      label: "Année de référence fictive",
      startDate: "2027-01-01",
      endDate: "2027-12-31",
      status: "run-rate",
      basis: "amount",
      amountCents: 12_000_000,
      socialRateBasisPoints: 2500,
      trainingRateBasisPoints: 0,
      professionalExpensesCents: 0,
      taxAllowanceBasisPoints: 3400,
      sourceDocumentIds: [],
    },
  ];
  dossier.budgetScenarios.find(
    (item: { kind: string }) => item.kind === "central",
  ).assumptions = {
    incomePeriodIds: ["annual-reference"],
    taxProjection: {
      parts: 2,
      incomePeriodIds: ["annual-reference"],
      annualSalaryNetTaxableCents: 0,
      annualOtherTaxableCents: 0,
      note: "Hypothèse fictive",
    },
    note: "Exemple",
  };
  dossier.presentation.sections.financialReview = true;
  dossier.presentation.sections.incomeHistoryChart = true;
  dossier.revenueHistory = ["2025-01", "2026-01"].map((period, index) => ({
    id: `history-${index}`,
    incomeStreamId: dossier.incomeStreams[0].id,
    period,
    turnoverCents: 500_000,
    collectedCents: 500_000,
    expensesCents: 100_000,
    resultCents: 400_000,
    observed: true,
  }));
  await page.getByLabel("Importer un fichier Dossier Immo").setInputFiles({
    name: "annexes-fictives.dossier-immo.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(dossier)),
  });
  await expect(page.getByText("Dossier ouvert.")).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Revenus/ })
    .click();
  const summary = page.getByRole("region", { name: "Lecture des revenus" });
  const initial = await summary.innerText();
  await page.locator('[data-disclosure-id="income-periods"] > summary').click();
  const period = page.locator('[data-disclosure-id="item-annual-reference"]');
  await period.locator("summary").click();
  await period
    .getByRole("spinbutton", { name: "Recettes HT ou salaire net avant IR" })
    .fill("100000");
  await period
    .getByRole("spinbutton", { name: "Recettes HT ou salaire net avant IR" })
    .blur();
  await expect(summary).not.toHaveText(initial);
  await expect(summary).toContainText(/6\s*250/);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Aperçu/ })
    .click();
  const frame = page.frameLocator("iframe[title='Aperçu du dossier bancaire']");
  await expect(frame.locator("section.page")).toHaveCount(15);
  await expect(frame.locator(".financial-review-page")).toContainText(
    /66\s*000/,
  );
  await expect(frame.locator(".income-history-page")).toContainText(
    "mois communs",
  );
});

test("la navigation latérale reste accessible sur un laptop à hauteur réduite", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dossier-immo-persistence-mode-v1", "local"),
  );
  await page.setViewportSize({ width: 1280, height: 650 });
  await page.goto("/");
  const sidebar = page.locator(".sidebar");
  await expect(sidebar).toBeVisible();
  await sidebar.hover();
  await page.mouse.wheel(0, 1500);
  await expect
    .poll(() => sidebar.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  const last = sidebar.getByRole("button").last();
  await last.focus();
  await expect(last).toBeInViewport();
  await last.press("Enter");
  await expect(last).toHaveAttribute("aria-current", "step");
});
