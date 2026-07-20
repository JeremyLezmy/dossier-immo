import { mkdir, writeFile } from "node:fs/promises";
import { dossierJsonSchema } from "@dossier-immo/schema";
import {
  completeDemoDossier,
  demoDossierCatalog,
} from "@dossier-immo/fixtures";

await mkdir("docs/schema", { recursive: true });
await mkdir("config.example", { recursive: true });
await mkdir("config.example/dossiers", { recursive: true });
await writeFile(
  "docs/schema/dossier.json",
  `${JSON.stringify(dossierJsonSchema(), null, 2)}\n`,
  "utf8",
);
await writeFile(
  "config.example/dossier.json",
  `${JSON.stringify(completeDemoDossier, null, 2)}\n`,
  "utf8",
);
await Promise.all(
  demoDossierCatalog.map((demo) =>
    writeFile(
      `config.example/dossiers/${demo.id}.json`,
      `${JSON.stringify(demo.dossier, null, 2)}\n`,
      "utf8",
    ),
  ),
);
process.stdout.write("Contrat et trois dossiers fictifs exportés.\n");
