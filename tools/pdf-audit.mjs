import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [sourceArgument, outputArgument] = process.argv.slice(2);
if (!sourceArgument || !outputArgument) {
  process.stderr.write("Usage : node tools/pdf-audit.mjs <source.pdf> <contact-sheet.png>\n");
  process.exit(2);
}

const data = new Uint8Array(await readFile(resolve(sourceArgument)));
const document = await getDocument({ data, disableWorker: true }).promise;
const rendered = [];
const stats = [];
for (let number = 1; number <= document.numPages; number += 1) {
  const page = await document.getPage(number);
  const viewport = page.getViewport({ scale: 0.55 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  const text = await page.getTextContent();
  const strings = text.items.flatMap((item) => "str" in item ? [item.str] : []);
  stats.push({ page: number, width: Math.round(page.view[2] - page.view[0]), height: Math.round(page.view[3] - page.view[1]), characters: strings.join(" ").length, lines: strings.length, sample: strings.join(" ").slice(0, 120) });
  rendered.push(canvas);
}

const columns = 3;
const cellWidth = Math.max(...rendered.map((canvas) => canvas.width)) + 28;
const cellHeight = Math.max(...rendered.map((canvas) => canvas.height)) + 50;
const sheet = createCanvas(cellWidth * columns, cellHeight * Math.ceil(rendered.length / columns));
const sheetContext = sheet.getContext("2d");
sheetContext.fillStyle = "#dfe5ec";
sheetContext.fillRect(0, 0, sheet.width, sheet.height);
sheetContext.font = "bold 16px Arial";
sheetContext.fillStyle = "#17324d";
rendered.forEach((canvas, index) => {
  const x = index % columns * cellWidth + 14;
  const y = Math.floor(index / columns) * cellHeight + 34;
  sheetContext.fillText(`Page ${index + 1}`, x, y - 10);
  sheetContext.drawImage(canvas, x, y);
});
await writeFile(resolve(outputArgument), sheet.toBuffer("image/png"));
process.stdout.write(`${basename(sourceArgument)}\t${document.numPages} pages\n${JSON.stringify(stats, null, 2)}\n`);
