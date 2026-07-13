import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [sourceArgument, ...pageArguments] = process.argv.slice(2);
if (!sourceArgument) {
  process.stderr.write("Usage : node tools/pdf-text.mjs <source.pdf> [pages...]\n");
  process.exit(2);
}
const document = await getDocument({ data: new Uint8Array(await readFile(resolve(sourceArgument))), disableWorker: true }).promise;
const requested = pageArguments.length > 0 ? pageArguments.map(Number) : Array.from({ length: document.numPages }, (_value, index) => index + 1);
for (const number of requested) {
  const page = await document.getPage(number);
  const content = await page.getTextContent();
  const lines = content.items.flatMap((item) => "str" in item ? [item.str] : []);
  process.stdout.write(`\n===== PAGE ${number} =====\n${lines.join("\n")}\n`);
}
