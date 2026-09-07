import type { UseFormReturn, FieldPath } from "react-hook-form";
import { validateDossier, type Dossier } from "@dossier-immo/schema";
import { calculateDossier } from "@dossier-immo/calculations";
import { MoneyField, Field } from "../../../components/fields";
import { TextareaField, euro } from "./shared";

export function TaxProjectionFields({
  form,
  index,
}: {
  form: UseFormReturn<Dossier>;
  index: number;
}) {
  const base = `budgetScenarios.${index}.assumptions` as const;
  const projection = form.watch(`${base}.taxProjection`);
  const periods = (form.watch("incomePeriods") ?? []).filter(
    (item) => item.taxAllowanceBasisPoints !== undefined,
  );
  const validation = validateDossier(form.watch());
  const result = validation.success
    ? calculateDossier(validation.dossier).taxProjections.find(
        (item) =>
          item.budgetId === form.getValues(`budgetScenarios.${index}.id`),
      )
    : undefined;
  return (
    <div className="field--wide">
      <label>
        <input
          type="checkbox"
          checked={Boolean(projection)}
          onChange={(event) => {
            const assumptions = form.getValues(base);
            const {
              taxProjection: _tax,
              monthlyIncomeTaxCents: _manual,
              afterTaxIncomeCents: _after,
              ...rest
            } = assumptions;
            form.setValue(
              base,
              event.target.checked
                ? {
                    ...rest,
                    taxProjection: {
                      parts: 2,
                      incomePeriodIds: (
                        assumptions.incomePeriodIds ?? []
                      ).filter((id) =>
                        periods.some((period) => period.id === id),
                      ),
                      annualSalaryNetTaxableCents: 0,
                      annualOtherTaxableCents: 0,
                      note: "Revenus annuels de référence ; barème 2026, hors décote, réductions et crédits d’impôt.",
                    },
                  }
                : {
                    ...rest,
                    monthlyIncomeTaxCents: result?.monthlyTaxCents ?? 0,
                  },
              { shouldDirty: true },
            );
          }}
        />{" "}
        Estimer l’IR au barème 2026
      </label>
      {projection && (
        <div className="form-grid">
          <p className="field--wide section-note">
            Estimation brute pour un adulte seul ou un couple sans majoration de
            parts. Barème 2026 utilisé comme référence pour les projections
            futures ; hors décote, réductions, crédits d’impôt et contributions
            sur hauts revenus. Les périodes doivent couvrir une année cohérente,
            ou un seul rythme annuel par activité. Ne pas cumuler total annuel
            et mois inclus.
          </p>
          <Field label="Parts ordinaires" controlId={`tax-parts-${index}`}>
            <select
              id={`tax-parts-${index}`}
              value={projection.parts}
              onChange={(event) =>
                form.setValue(
                  `${base}.taxProjection.parts`,
                  Number(event.target.value) as 1 | 2,
                  { shouldDirty: true },
                )
              }
            >
              <option value="1">1 — personne seule</option>
              <option value="2">2 — couple</option>
            </select>
          </Field>
          <MoneyField
            label="Salaire annuel net imposable (un salarié)"
            name={
              `${base}.taxProjection.annualSalaryNetTaxableCents` as FieldPath<Dossier>
            }
            control={form.control}
            help="Avant déduction forfaitaire de 10 %. Ne pas saisir le net bancaire."
          />
          <MoneyField
            label="Autres revenus annuels imposables au barème"
            name={
              `${base}.taxProjection.annualOtherTaxableCents` as FieldPath<Dossier>
            }
            control={form.control}
          />
          <details className="field--wide">
            <summary>Détailler les périodes fiscales sélectionnées</summary>
            <Field label="Périodes professionnelles pour l’année fiscale" wide>
              <div className="reference-checks">
                {periods.map((period) => (
                  <label key={period.id}>
                    <input
                      type="checkbox"
                      checked={projection.incomePeriodIds.includes(period.id)}
                      onChange={(event) =>
                        form.setValue(
                          `${base}.taxProjection.incomePeriodIds`,
                          event.target.checked
                            ? [...projection.incomePeriodIds, period.id]
                            : projection.incomePeriodIds.filter(
                                (id) => id !== period.id,
                              ),
                          { shouldDirty: true },
                        )
                      }
                    />
                    {period.label}
                  </label>
                ))}
              </div>
            </Field>
          </details>
          <TextareaField
            label="Année et hypothèses fiscales"
            name={`${base}.taxProjection.note` as FieldPath<Dossier>}
            register={form.register}
          />
          {result && (
            <p className="field--wide planning-result">
              Base annuelle : {euro(result.taxableCents)} · IR brut :{" "}
              {euro(result.annualTaxCents)} / an, soit{" "}
              <strong>{euro(result.monthlyTaxCents)} / mois</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
