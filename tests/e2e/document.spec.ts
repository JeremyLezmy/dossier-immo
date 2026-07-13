import { expect, test } from "@playwright/test";

test("le document fictif conserve les treize pages et produit un PDF A4", async ({ page }) => {
  await page.goto("/?print-fixture=complete");
  const pages = page.locator("section.page");
  await expect(pages).toHaveCount(13);
  await expect(page.getByRole("heading", { name: "Scénarios de financement" })).toBeVisible();
  const overflowingPages = await pages.evaluateAll((elements) => elements.flatMap((element, index) => element.scrollHeight > element.clientHeight + 2 ? [index + 1] : []));
  expect(overflowingPages).toEqual([]);
  for (let index = 0; index < 13; index += 1) {
    await expect(pages.nth(index)).toHaveScreenshot(`document-page-${String(index + 1).padStart(2, "0")}.png`, {
      animations: "disabled",
      maxDiffPixels: 0,
    });
  }

  const bytes = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
  const source = Buffer.from(bytes).toString("latin1");
  expect(source.match(/\/Type\s*\/Page(?!s)/g)).toHaveLength(13);
  expect(bytes.byteLength).toBeGreaterThan(100_000);
});
