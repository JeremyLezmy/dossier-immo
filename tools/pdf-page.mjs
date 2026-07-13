import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [sourceArgument, pageArgument, outputArgument] = process.argv.slice(2);
if (!sourceArgument || !pageArgument || !outputArgument) process.exit(2);
const document = await getDocument({ data: new Uint8Array(await readFile(resolve(sourceArgument))), disableWorker: true }).promise;
const page = await document.getPage(Number(pageArgument));
const viewport = page.getViewport({ scale: 2 });
const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
await writeFile(resolve(outputArgument), canvas.toBuffer("image/png"));
