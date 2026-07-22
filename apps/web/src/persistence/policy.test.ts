import { describe, expect, it } from "vitest";
import {
  draftExpirationFrom,
  isDraftExpired,
  LOCAL_DRAFT_TTL_MS,
  PERSISTENCE_MODE_STORAGE_KEY,
  readPersistenceMode,
  writePersistenceMode,
} from "./policy";

describe("browser persistence policy", () => {
  it("accepts only the two explicit persistence modes", () => {
    expect(
      readPersistenceMode({
        getItem: () => "session",
      }),
    ).toBe("session");
    expect(
      readPersistenceMode({
        getItem: () => "local",
      }),
    ).toBe("local");
    expect(
      readPersistenceMode({
        getItem: () => "forever",
      }),
    ).toBeUndefined();
  });

  it("fails closed when browser preference storage is unavailable", () => {
    expect(
      readPersistenceMode({
        getItem: () => {
          throw new DOMException("blocked");
        },
      }),
    ).toBeUndefined();
    expect(
      writePersistenceMode("local", {
        setItem: () => {
          throw new DOMException("blocked");
        },
      }),
    ).toBe(false);
  });

  it("stores only the non-personal mode preference", () => {
    const writes: Array<[string, string]> = [];
    expect(
      writePersistenceMode("session", {
        setItem: (key, value) => writes.push([key, value]),
      }),
    ).toBe(true);
    expect(writes).toEqual([[PERSISTENCE_MODE_STORAGE_KEY, "session"]]);
  });

  it("sets and evaluates the rolling 24 hour expiration", () => {
    const now = new Date("2026-07-21T10:00:00.000Z");
    const expiresAt = draftExpirationFrom(now);
    expect(Date.parse(expiresAt) - now.getTime()).toBe(LOCAL_DRAFT_TTL_MS);
    expect(
      isDraftExpired(expiresAt, new Date("2026-07-22T09:59:59.999Z")),
    ).toBe(false);
    expect(
      isDraftExpired(expiresAt, new Date("2026-07-22T10:00:00.000Z")),
    ).toBe(true);
    expect(isDraftExpired("invalid", now)).toBe(true);
  });
});
