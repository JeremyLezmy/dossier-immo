export const PERSISTENCE_MODE_STORAGE_KEY = "dossier-immo-persistence-mode-v1";

export const LOCAL_DRAFT_TTL_MS = 24 * 60 * 60 * 1_000;

export type PersistenceMode = "session" | "local";

export function isPersistenceMode(value: unknown): value is PersistenceMode {
  return value === "session" || value === "local";
}

export function readPersistenceMode(
  storage: Pick<Storage, "getItem"> = window.localStorage,
): PersistenceMode | undefined {
  try {
    const value = storage.getItem(PERSISTENCE_MODE_STORAGE_KEY);
    return isPersistenceMode(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function writePersistenceMode(
  mode: PersistenceMode,
  storage: Pick<Storage, "setItem"> = window.localStorage,
): boolean {
  try {
    storage.setItem(PERSISTENCE_MODE_STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
}

export function draftExpirationFrom(now: Date = new Date()): string {
  return new Date(now.getTime() + LOCAL_DRAFT_TTL_MS).toISOString();
}

export function isDraftExpired(
  expiresAt: string,
  now: Date = new Date(),
): boolean {
  const expiration = Date.parse(expiresAt);
  return !Number.isFinite(expiration) || expiration <= now.getTime();
}
