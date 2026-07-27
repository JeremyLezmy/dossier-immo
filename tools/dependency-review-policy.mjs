export function collectOverdueReviewErrors(exclusions, today) {
  return exclusions
    .filter(({ nextReviewOn }) => nextReviewOn < today)
    .map(
      ({ specifier, nextReviewOn }) =>
        `${specifier} aurait dû être revu le ${nextReviewOn}.`,
    );
}

export function shouldStopBeforeProbe({
  probeRequested,
  validationErrors,
  overdueReviewErrors,
}) {
  return (
    validationErrors.length > 0 ||
    (!probeRequested && overdueReviewErrors.length > 0)
  );
}
