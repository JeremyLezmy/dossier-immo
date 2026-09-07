import { expect, test } from "@playwright/test";
import { calculateDossier } from "@dossier-immo/calculations";
import { renderBankDocument } from "@dossier-immo/document";
import {
  completeDemoDossier,
  retiredRentalInvestorDemo,
} from "@dossier-immo/fixtures";

test("le papier blanc conserve les thèmes et blanchit toutes les pages et le Sankey", async ({
  page,
}) => {
  for (const theme of ["editorial", "burgundy"] as const) {
    const dossier = structuredClone(completeDemoDossier);
    dossier.presentation.theme = theme;
    dossier.presentation.whitePaper = true;
    await page.setContent(
      renderBankDocument(dossier, calculateDossier(dossier)),
    );
    const backgrounds = await page
      .locator("section.page")
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).backgroundColor),
      );
    expect(backgrounds.every((color) => color === "rgb(255, 255, 255)")).toBe(
      true,
    );
    await expect(page.locator(".sankey-background")).toHaveCSS(
      "fill",
      "rgb(255, 255, 255)",
    );
    await expect(page.locator("body")).toHaveClass(
      new RegExp(`theme-${theme}.*white-paper`),
    );
  }
});

test("le document fictif conserve les treize pages et produit un PDF A4", async ({
  page,
}) => {
  await page.goto("/?print-fixture=complete");
  const pages = page.locator("section.page");
  await expect(pages).toHaveCount(13);
  await expect(
    page.getByRole("heading", { name: "Scénarios de financement" }),
  ).toBeVisible();
  const overflowingPages = await pages.evaluateAll((elements) =>
    elements.flatMap((element, index) =>
      element.scrollHeight > element.clientHeight + 2 ? [index + 1] : [],
    ),
  );
  expect(overflowingPages).toEqual([]);
  for (let index = 0; index < 13; index += 1) {
    await expect(pages.nth(index)).toHaveScreenshot(
      `document-page-${String(index + 1).padStart(2, "0")}.png`,
      {
        animations: "disabled",
        maxDiffPixels: 0,
      },
    );
  }

  const bytes = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });
  const source = Buffer.from(bytes).toString("latin1");
  expect(source.match(/\/Type\s*\/Page(?!s)/g)).toHaveLength(13);
  expect(bytes.byteLength).toBeGreaterThan(100_000);
});

test("le dossier retraité masque les contenus professionnels vides", async ({
  page,
}) => {
  await page.setContent(
    renderBankDocument(
      retiredRentalInvestorDemo,
      calculateDossier(retiredRentalInvestorDemo),
    ),
    { waitUntil: "load" },
  );

  const pages = page.locator("section.page");
  const riskPage = pages.filter({
    has: page.getByRole("heading", {
      name: "Éléments de stabilité et de maîtrise du risque",
    }),
  });
  await expect(pages).toHaveCount(12);
  await expect(riskPage).toHaveCount(1);
  await expect(riskPage.getByText("Pensions établies")).toBeVisible();
  await expect(
    riskPage.getByRole("heading", { name: "Activités professionnelles" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Annexe — revenus indépendants par emprunteur",
    }),
  ).toHaveCount(0);
  await expect(riskPage).toHaveScreenshot("retired-risk-page.png", {
    animations: "disabled",
    maxDiffPixels: 0,
  });
});
