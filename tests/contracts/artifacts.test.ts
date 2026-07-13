import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { completeDemoDossier } from "@dossier-immo/fixtures";
import { dossierJsonSchema } from "@dossier-immo/schema";

const readJson = (path: string): unknown => JSON.parse(readFileSync(resolve(path), "utf8"));

describe("artefacts contractuels", () => {
  it("le JSON Schema exporté correspond au modèle courant", () => {
    expect(readJson("docs/schema/dossier.json")).toEqual(dossierJsonSchema());
  });

  it("l'exemple exporté correspond à la fixture applicative complète", () => {
    expect(readJson("config.example/dossier.json")).toEqual(completeDemoDossier);
  });
});
