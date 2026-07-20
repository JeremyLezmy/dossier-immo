import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { calculateDossier } from "@dossier-immo/calculations";
import { renderBankDocument } from "@dossier-immo/document";
import { validateDossier } from "@dossier-immo/schema";

const sources = process.argv.slice(2);
if (sources.length === 0) {
  process.stderr.write(
    "Usage : vite-node tools/check-document-layout.ts <dossier.json> [...]\n",
  );
  process.exit(2);
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const sourceArgument of sources) {
    const source = resolve(sourceArgument);
    const input = JSON.parse(await readFile(source, "utf8")) as unknown;
    const validation = validateDossier(input);
    if (!validation.success)
      throw new Error(
        `Dossier invalide : ${validation.issues[0]?.path} ${validation.issues[0]?.message}`,
      );
    const dossier = validation.dossier;
    const page = await browser.newPage({
      locale: "fr-FR",
      timezoneId: "Europe/Paris",
    });
    await page.setContent(
      renderBankDocument(dossier, calculateDossier(dossier)),
      { waitUntil: "load" },
    );
    const renderedPages = page.locator("section.page");
    const pageCount = await renderedPages.count();
    const report = await renderedPages.evaluateAll((pages) =>
      pages
        .map((element, index) => ({
          page: index + 1,
          horizontalOverflow: element.scrollWidth - element.clientWidth,
          verticalOverflow: element.scrollHeight - element.clientHeight,
        }))
        .filter(
          (item) => item.horizontalOverflow > 2 || item.verticalOverflow > 2,
        ),
    );
    await page.close();
    if (report.length > 0)
      throw new Error(`${source} déborde : ${JSON.stringify(report)}`);
    process.stdout.write(
      `${source} : ${pageCount} page${pageCount > 1 ? "s" : ""} sans débordement.\n`,
    );
  }
} finally {
  await browser.close();
}
