import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateDossier } from "@dossier-immo/schema";

const sourceArgument = process.argv[2];

if (!sourceArgument) {
  process.stderr.write("Usage : vite-node tools/validate-dossier.ts <dossier.json>\n");
  process.exitCode = 2;
} else {
  const source = resolve(sourceArgument);
  const input = JSON.parse(await readFile(source, "utf8")) as unknown;
  const result = validateDossier(input);
  if (result.success) {
    process.stdout.write(`Dossier valide : ${source}\n`);
  } else {
    for (const issue of result.issues) process.stdout.write(`${issue.path}\t${issue.message}\n`);
    process.exitCode = 1;
  }
}
