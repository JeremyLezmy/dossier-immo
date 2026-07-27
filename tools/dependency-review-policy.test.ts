import { describe, expect, it } from "vitest";

import {
  collectOverdueReviewErrors,
  shouldStopBeforeProbe,
} from "./dependency-review-policy.mjs";

const exclusions = [
  {
    specifier: "example@1.0.0",
    nextReviewOn: "2026-07-26",
  },
];

describe("dependency review policy", () => {
  it("blocks the static policy when a review is overdue", () => {
    const overdueReviewErrors = collectOverdueReviewErrors(
      exclusions,
      "2026-07-27",
    );

    expect(overdueReviewErrors).toEqual([
      "example@1.0.0 aurait dû être revu le 2026-07-26.",
    ]);
    expect(
      shouldStopBeforeProbe({
        probeRequested: false,
        validationErrors: [],
        overdueReviewErrors,
      }),
    ).toBe(true);
  });

  it("allows probes to run before reporting an overdue review", () => {
    const overdueReviewErrors = collectOverdueReviewErrors(
      exclusions,
      "2026-07-27",
    );

    expect(
      shouldStopBeforeProbe({
        probeRequested: true,
        validationErrors: [],
        overdueReviewErrors,
      }),
    ).toBe(false);
  });

  it("does not consider the scheduled review date overdue", () => {
    expect(collectOverdueReviewErrors(exclusions, "2026-07-26")).toEqual([]);
  });

  it("never probes when another static validation has failed", () => {
    expect(
      shouldStopBeforeProbe({
        probeRequested: true,
        validationErrors: ["Le lockfile diverge."],
        overdueReviewErrors: [],
      }),
    ).toBe(true);
  });
});
