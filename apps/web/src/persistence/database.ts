import Dexie, { type EntityTable } from "dexie";
import type { Dossier } from "@dossier-immo/schema";

export interface DraftRecord {
  id: string;
  dossier: Dossier;
  updatedAt: string;
}

class DossierDatabase extends Dexie {
  drafts!: EntityTable<DraftRecord, "id">;

  constructor() {
    super("dossier-immo-local-v1");
    this.version(1).stores({ drafts: "id, updatedAt" });
  }
}

export const database = new DossierDatabase();

export async function saveDraft(dossier: Dossier): Promise<void> {
  await database.drafts.put({
    id: dossier.metadata.dossierId,
    dossier: structuredClone(dossier),
    updatedAt: new Date().toISOString(),
  });
}

export async function loadLatestDraft(): Promise<DraftRecord | undefined> {
  return database.drafts.orderBy("updatedAt").last();
}

export async function clearLocalDrafts(): Promise<void> {
  await database.drafts.clear();
}
