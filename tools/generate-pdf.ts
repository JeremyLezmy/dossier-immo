import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { calculateDossier } from "@dossier-immo/calculations";
import { renderBankDocument } from "@dossier-immo/document";
import { validateDossier } from "@dossier-immo/schema";

const argumentsList = process.argv.slice(2);
const forceIndex = argumentsList.indexOf("--force");
const force = forceIndex >= 0;
if (force) argumentsList.splice(forceIndex, 1);
const [sourceArgument, destinationArgument] = argumentsList;

if (!sourceArgument || !destinationArgument) {
  process.stderr.write("Usage : npm run generate:pdf -- <dossier.json> <sortie.pdf> [--force]\n");
  process.exitCode = 2;
} else {
  const source = resolve(sourceArgument);
  const destination = resolve(destinationArgument);
  if (!destination.toLowerCase().endsWith(".pdf")) throw new Error("La destination doit porter l'extension .pdf.");
  if (source === destination) throw new Error("La destination doit être différente de la source.");

  const input = JSON.parse(await readFile(source, "utf8")) as unknown;
  const validation = validateDossier(input);
  if (!validation.success) throw new Error(`Dossier invalide : ${validation.issues[0]?.path} ${validation.issues[0]?.message}`);
  const dossier = validation.dossier;
  const derived = calculateDossier(dossier);
  const html = renderBankDocument(dossier, derived);
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    const bytes = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
    await writeFile(destination, bytes, { flag: force ? "w" : "wx" });
    process.stdout.write(`PDF généré : ${destination} (${bytes.byteLength} octets, ${dossier.presentation.sections.sankey ? "page paysage incluse" : "portrait"}).\n`);
  } finally {
    await browser.close();
  }
}
