import { z } from "zod";

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const cents = z.number().int().nonnegative();
const rate = z.number().int().min(0).max(10_000);

/** Inputs only: results, fiscal bases and monthly averages are never persisted. */
export const IncomePeriodSchema = z
  .strictObject({
    id,
    incomeStreamId: id,
    label: z.string().min(1),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    status: z.enum(["observed", "invoiced", "forecast", "run-rate"]),
    basis: z.enum(["amount", "days", "sessions"]),
    amountCents: cents.optional(),
    units: z.number().min(0).max(100_000).optional(),
    unitAmountCents: cents.optional(),
    collectionDate: z.iso.date().optional(),
    socialRateBasisPoints: rate,
    trainingRateBasisPoints: rate,
    socialContributionsPaidCents: cents.optional(),
    professionalExpensesCents: cents,
    expenseRateBasisPoints: rate.optional(),
    taxAllowanceBasisPoints: rate.optional(),
    sourceDocumentIds: z.array(id).default([]),
    note: z.string().optional(),
  })
  .superRefine((period, ctx) => {
    if (period.endDate < period.startDate)
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "la fin doit suivre le début de période",
      });
    if (period.basis === "amount" && period.amountCents === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["amountCents"],
        message: "le montant déclaré est requis",
      });
    if (period.basis !== "amount" && period.units === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["units"],
        message: "le nombre de jours ou séances est requis",
      });
    if (period.basis !== "amount" && period.amountCents !== undefined)
      ctx.addIssue({
        code: "custom",
        path: ["amountCents"],
        message: "ne pas saisir un total en plus des unités et du tarif",
      });
    if (
      period.socialRateBasisPoints +
        period.trainingRateBasisPoints +
        (period.expenseRateBasisPoints ?? 0) >
      10_000
    )
      ctx.addIssue({
        code: "custom",
        path: ["socialRateBasisPoints"],
        message: "les prélèvements proportionnels dépassent 100 %",
      });
    if (period.status === "run-rate" && period.collectionDate)
      ctx.addIssue({
        code: "custom",
        path: ["collectionDate"],
        message: "un rythme annuel de référence n'est pas un encaissement daté",
      });
  });

export const CashFlowPlanSchema = z.strictObject({
  reservedTaxCents: cents.optional(),
  note: z.string().min(1),
  entries: z.array(
    z
      .strictObject({
        id,
        date: z.iso.date(),
        label: z.string().min(1),
        direction: z.enum(["income", "expense"]),
        category: z.enum(["income", "living", "income-tax", "social", "other"]),
        amountCents: cents.optional(),
        isProvision: z.boolean().optional(),
        incomePeriodId: id.optional(),
        note: z.string().optional(),
      })
      .superRefine((entry, ctx) => {
        if (
          (entry.amountCents === undefined) ===
          (entry.incomePeriodId === undefined)
        )
          ctx.addIssue({
            code: "custom",
            path: ["amountCents"],
            message:
              "renseigner soit un montant, soit une période de revenu, jamais les deux",
          });
        if (entry.incomePeriodId && entry.direction !== "income")
          ctx.addIssue({
            code: "custom",
            path: ["direction"],
            message: "une période de revenu doit être une entrée",
          });
      }),
  ),
});

export type IncomePeriod = z.infer<typeof IncomePeriodSchema>;
export type CashFlowPlan = z.infer<typeof CashFlowPlanSchema>;
