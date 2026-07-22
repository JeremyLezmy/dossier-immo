import Dexie, { type EntityTable } from "dexie";
import type { Dossier } from "@dossier-immo/schema";
import { draftExpirationFrom, isDraftExpired } from "./policy";

export interface DraftRecord {
  id: string;
  dossier: Dossier;
  updatedAt: string;
  expiresAt: string;
}

class DossierDatabase extends Dexie {
  drafts!: EntityTable<DraftRecord, "id">;

  constructor() {
    super("dossier-immo-local-v1");
    this.version(1).stores({ drafts: "id, updatedAt" });
    this.version(2)
      .stores({ drafts: "id, updatedAt, expiresAt" })
      .upgrade((transaction) =>
        transaction
          .table("drafts")
          .toCollection()
          .modify((draft: DraftRecord & { expiresAt?: string }) => {
            if (!draft.expiresAt) draft.expiresAt = draftExpirationFrom();
          }),
      );
  }
}

export const database = new DossierDatabase();

export async function saveDraft(
  dossier: Dossier,
  now: Date = new Date(),
): Promise<DraftRecord> {
  const record: DraftRecord = {
    id: dossier.metadata.dossierId,
    dossier: structuredClone(dossier),
    updatedAt: now.toISOString(),
    expiresAt: draftExpirationFrom(now),
  };
  await database.drafts.put(record);
  return record;
}

export async function purgeExpiredDrafts(
  now: Date = new Date(),
): Promise<number> {
  return database.drafts
    .filter((draft) => isDraftExpired(draft.expiresAt, now))
    .delete();
}

export async function getNextDraftExpiration(): Promise<string | undefined> {
  return (await database.drafts.orderBy("expiresAt").first())?.expiresAt;
}

export async function loadLatestDraft(
  now: Date = new Date(),
): Promise<DraftRecord | undefined> {
  await purgeExpiredDrafts(now);
  return database.drafts.orderBy("updatedAt").last();
}

export async function countLocalDrafts(
  now: Date = new Date(),
): Promise<number> {
  await purgeExpiredDrafts(now);
  return database.drafts.count();
}

export async function deleteLocalDraft(id: string): Promise<void> {
  await database.drafts.delete(id);
}

export async function clearLocalDrafts(): Promise<void> {
  await database.drafts.clear();
}
