import {
  useFieldArray,
  type FieldPath,
  type UseFormReturn,
} from "react-hook-form";
import {
  calculateDossier,
  type DerivedDossier,
} from "@dossier-immo/calculations";
import { validateDossier, type Dossier } from "@dossier-immo/schema";
import {
  ArrayCard,
  Field,
  MoneyField,
  RateField,
  TextField,
  SelectField,
} from "../../../components/fields";
import { EditorDisclosure } from "../../../components/EditorDisclosure";
import { ReferenceSelect, TextareaField, euro } from "./shared";
const path = (value: string) => value as FieldPath<Dossier>;
const identifier = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export function IncomeReadingSummary({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  const validation = validateDossier(form.watch());
  if (!validation.success) return null;
  const dossier = validation.dossier;
  const reading = calculateDossier(dossier).incomePresentation;
  return (
    <section
      className="savings-summary income-reading"
      aria-label="Lecture des revenus"
    >
      <TextField label="Date de référence des revenus proposés à la banque" name="project.bankIncomeReferenceDate" register={form.register} type="date" help="Vide : date d’achat. Une étude préparatoire peut utiliser la situation actuelle ; réactualiser les revenus à l’octroi." />
      <div className="metric-grid">
        {reading.cards.map((card) => (
          <div className="metric-card" key={card.id}>
            <span>{card.label}</span>
            <strong>{euro(card.valueCents)} / mois</strong>
            <small>{card.explanation}</small>
          </div>
        ))}
      </div>
      <p className="section-note">Base avec les revenus actifs aujourd’hui : {euro(reading.bankNowCents)} / mois. Même convention historique à l’achat, après fin des contrats : {euro(reading.bankAtPurchaseCents)} / mois. {reading.fiscalCents !== undefined && <>Rythme projeté converti en base fiscale indicative : {euro(reading.fiscalCents)} / mois.</>} Ces lectures ne s’additionnent pas.</p>
      <p className="section-note">
        Le revenu économique mesure le budget de vie après cotisations et frais
        professionnels, avant impôt. La base fiscale et les conventions
        bancaires répondent à d’autres usages. Les références ci-dessous
        précisent leurs périodes.
      </p>
      {reading.rows
        .filter((row) => row.economicCents !== undefined || row.included)
        .map((row) => {
          const stream = dossier.incomeStreams.find(
            (income) => income.id === row.id,
          )!;
          return (
            <p className="section-note" key={row.id}>
              <strong>{stream.label}.</strong>{" "}
              {row.periodLabel && <>Revenu économique : {row.periodLabel}. </>}
              {stream.bankingConvention ?? stream.note}
            </p>
          );
        })}
      {reading.hasEconomicBasis && (
        <p className="section-note">
          Budget après IR :{" "}
          <strong>{euro(reading.afterTaxCents)} / mois</strong>, après une
          provision de {euro(reading.taxProvisionCents)} / mois, à confirmer.
        </p>
      )}
    </section>
  );
}
export function PlanningPeriods({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  const fields = useFieldArray({
    control: form.control,
    name: "incomePeriods",
  });
  const values = form.watch("incomePeriods") ?? [];
  const validation = validateDossier(form.watch());
  const derived = validation.success
    ? calculateDossier(validation.dossier)
    : undefined;
  const incomes = form
    .watch("incomeStreams")
    .map((item) => ({ value: item.id, label: item.label }));
  const documents = form.watch("supportingDocuments");
  return (
    <EditorDisclosure disclosureId="income-periods">
      <summary>
        <div>
          <strong>Réalisé et projections de revenus</strong>
          <span>CA, charges, base fiscale et encaissements datés</span>
        </div>
      </summary>
      <div className="editor-subsection__content">
        <p className="section-note">
          Chaque période distingue recettes HT, cotisations (CFP comprise),
          frais professionnels et base fiscale. Le revenu économique avant IR
          est calculé ; le revenu proposé à la banque reste une convention
          séparée. Un rythme annuel n'est jamais ajouté automatiquement à la
          trésorerie.
        </p>
        <div className="stack">
          {fields.fields.map((field, index) => {
            const period = values[index];
            if (!period) return null;
            const base = `incomePeriods.${index}`;
            const result = derived?.incomePeriods.find(
              (item) => item.id === period.id,
            );
            return (
              <ArrayCard
                key={field.id}
                disclosureId={period.id}
                title={period.label}
                onRemove={() => fields.remove(index)}
              >
                <TextField
                  label="Libellé de la période"
                  name={path(`${base}.label`)}
                  register={form.register}
                />
                <ReferenceSelect
                  label="Revenu concerné"
                  name={path(`${base}.incomeStreamId`)}
                  register={form.register}
                  options={incomes}
                />
                <TextField
                  label="Début de période"
                  name={path(`${base}.startDate`)}
                  register={form.register}
                  type="date"
                />
                <TextField
                  label="Fin de période"
                  name={path(`${base}.endDate`)}
                  register={form.register}
                  type="date"
                />
                <Field
                  label="Nature de la période"
                  controlId={`period-status-${index}`}
                >
                  <select
                    id={`period-status-${index}`}
                    value={period.status}
                    onChange={(event) => {
                      form.setValue(
                        `incomePeriods.${index}.status`,
                        event.target.value as typeof period.status,
                        { shouldDirty: true },
                      );
                      if (event.target.value === "run-rate")
                        form.setValue(
                          `incomePeriods.${index}.collectionDate`,
                          undefined,
                          { shouldDirty: true },
                        );
                    }}
                  >
                    <option value="observed">Réalisé encaissé</option>
                    <option value="invoiced">Facturé à encaisser</option>
                    <option value="forecast">Prévision</option>
                    <option value="run-rate">Rythme annuel de référence</option>
                  </select>
                </Field>
                <Field
                  label="Mode de calcul"
                  controlId={`period-basis-${index}`}
                >
                  <select
                    id={`period-basis-${index}`}
                    value={period.basis}
                    onChange={(event) => {
                      const basis = event.target.value as typeof period.basis;
                      const {
                        amountCents: _amount,
                        units: _units,
                        ...rest
                      } = period;
                      fields.update(index, {
                        ...rest,
                        basis,
                        ...(basis === "amount"
                          ? { amountCents: 0 }
                          : { units: 0 }),
                      });
                    }}
                  >
                    <option value="amount">Montant déclaré</option>
                    <option value="days">Jours × TJM</option>
                    <option value="sessions">Séances × tarif</option>
                  </select>
                </Field>
                {period.basis === "amount" ? (
                  <MoneyField
                    label="Recettes HT ou salaire net avant IR"
                    name={path(`${base}.amountCents`)}
                    control={form.control}
                  />
                ) : (
                  <>
                    <TextField
                      label={
                        period.basis === "days"
                          ? "Jours facturables"
                          : "Séances encaissées"
                      }
                      name={path(`${base}.units`)}
                      register={form.register}
                      type="number"
                    />
                    <MoneyField
                      label="Tarif unitaire spécifique"
                      name={path(`${base}.unitAmountCents`)}
                      control={form.control}
                      optional
                      help="Vide : tarif de l'activité, avec son changement daté éventuel. Scindez une période qui traverse un changement de tarif."
                    />
                  </>
                )}
                {period.status !== "run-rate" && (
                  <TextField
                    label="Encaissement prévu ou constaté"
                    name={path(`${base}.collectionDate`)}
                    register={form.register}
                    type="date"
                    help="Pour un cumul réalisé, laisser vide. Pour une facture future, saisir l'échéance exacte ; cette date permet le rapprochement avec le plan de trésorerie."
                  />
                )}
                <RateField
                  label="Cotisations sociales de la période"
                  name={path(`${base}.socialRateBasisPoints`)}
                  control={form.control}
                />
                <RateField
                  label="Contribution formation (CFP)"
                  name={path(`${base}.trainingRateBasisPoints`)}
                  control={form.control}
                />
                <MoneyField
                  label="Cotisations et CFP réellement constatées"
                  name={path(`${base}.socialContributionsPaidCents`)}
                  control={form.control}
                  optional
                  help="Si renseignées, remplacent le calcul par taux. Ne pas compter deux fois la CFP. Pour un salaire net avant IR, ne pas déduire à nouveau les cotisations salariales."
                />
                <MoneyField
                  label="Frais professionnels de la période"
                  name={path(`${base}.professionalExpensesCents`)}
                  control={form.control}
                />
                <RateField
                  label="Commissions sur recettes"
                  name={path(`${base}.expenseRateBasisPoints`)}
                  control={form.control}
                  optional
                />
                <RateField
                  label="Abattement fiscal indicatif"
                  name={path(`${base}.taxAllowanceBasisPoints`)}
                  control={form.control}
                  optional
                  help="34 % pour le micro-BNC ; calcul proportionnel indicatif, hors minimum annuel d’abattement. Vide pour un salaire ou une activité hors micro. Cette base fiscale ne déduit pas une seconde fois les charges réelles."
                />
                <Field label="Justificatifs de cette période" wide>
                  <div className="reference-checks">
                    {documents.map((document) => (
                      <label key={document.id}>
                        <input
                          type="checkbox"
                          checked={period.sourceDocumentIds.includes(
                            document.id,
                          )}
                          onChange={(event) =>
                            form.setValue(
                              `incomePeriods.${index}.sourceDocumentIds`,
                              event.target.checked
                                ? [...period.sourceDocumentIds, document.id]
                                : period.sourceDocumentIds.filter(
                                    (id) => id !== document.id,
                                  ),
                              { shouldDirty: true, shouldValidate: true },
                            )
                          }
                        />
                        {document.label}
                      </label>
                    ))}
                  </div>
                </Field>
                <TextareaField
                  label="Hypothèses et rapprochement"
                  name={path(`${base}.note`)}
                  register={form.register}
                />
                {result && (
                  <div className="field--wide planning-result">
                    <span>
                      Recettes : <strong>{euro(result.revenueCents)}</strong>
                    </span>
                    <span>
                      Cotisations :{" "}
                      <strong>{euro(result.socialContributionsCents)}</strong>
                    </span>
                    <span>
                      Frais :{" "}
                      <strong>{euro(result.professionalExpensesCents)}</strong>
                    </span>
                    <span>
                      Revenu économique avant IR :{" "}
                      <strong>{euro(result.economicIncomeCents)}</strong>
                    </span>
                    {result.taxableIncomeCents !== undefined && (
                      <span>
                        Base fiscale indicative :{" "}
                        <strong>{euro(result.taxableIncomeCents)}</strong>
                      </span>
                    )}
                    <span>
                      Moyenne sur {result.months} mois calendaires couverts :{" "}
                      <strong>
                        {euro(result.monthlyEconomicIncomeCents)} / mois
                      </strong>
                    </span>
                  </div>
                )}
              </ArrayCard>
            );
          })}
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={() =>
            fields.append({
              id: identifier("period"),
              incomeStreamId: incomes[0]?.value ?? "",
              label: "Nouvelle période",
              startDate: form.getValues("metadata.observationDate"),
              endDate: form.getValues("metadata.observationDate"),
              status: "forecast",
              basis: "amount",
              amountCents: 0,
              socialRateBasisPoints: 0,
              trainingRateBasisPoints: 0,
              professionalExpensesCents: 0,
              sourceDocumentIds: [],
            })
          }
        >
          Ajouter une période de revenu
        </button>
      </div>
    </EditorDisclosure>
  );
}
export function CashFlowFields({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  if (form.watch("cashFlowPlan")) return <DetailedCashFlowFields form={form} />;
  return (
    <section className="planning-actions">
      <button
        type="button"
        className="button button--secondary"
        onClick={() => {
          form.setValue("project.expectedLiquidityAtPurchaseCents", undefined, {
            shouldDirty: true,
          });
          form.setValue("project.monthlySavingsProjectionCents", undefined, {
            shouldDirty: true,
          });
          form.setValue(
            "cashFlowPlan",
            {
              note: "Encaissements et dépenses restant à effectuer jusqu'à l'achat.",
              entries: [],
            },
            { shouldDirty: true, shouldValidate: true },
          );
        }}
      >
        Utiliser un plan de trésorerie détaillé
      </button>
    </section>
  );
}
function DetailedCashFlowFields({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  const fields = useFieldArray({
    control: form.control,
    name: "cashFlowPlan.entries",
  });
  const plan = form.watch("cashFlowPlan");
  const periods = (form.watch("incomePeriods") ?? []).filter((item) =>
    ["forecast", "invoiced"].includes(item.status),
  );
  const validation = validateDossier(form.watch());
  const derived = validation.success
    ? calculateDossier(validation.dossier)
    : undefined;
  return (
    <EditorDisclosure disclosureId="cash-flow-plan">
      <summary>
        <div>
          <strong>Trésorerie jusqu'à l'achat</strong>
          <span>Encaissements, dépenses et provisions datés</span>
        </div>
      </summary>
      <div className="editor-subsection__content">
        <p className="section-note">
          Le plan détaillé remplace les liquidités attendues et l'épargne
          mensuelle simplifiées. Une période liée apporte son revenu après
          cotisations et frais professionnels, avant IR. Ajoutez les dépenses du
          foyer et l'IR séparément ; ne déduisez pas de nouveau les cotisations
          déjà provisionnées dans la période. Les flux portent uniquement sur ce
          qui reste à encaisser ou payer après la date d'observation.
        </p>
        {!plan ? (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              form.setValue(
                "project.expectedLiquidityAtPurchaseCents",
                undefined,
                { shouldDirty: true },
              );
              form.setValue(
                "project.monthlySavingsProjectionCents",
                undefined,
                { shouldDirty: true },
              );
              form.setValue(
                "cashFlowPlan",
                {
                  note: "Encaissements et dépenses restant à effectuer jusqu'à l'achat.",
                  entries: [],
                },
                { shouldDirty: true, shouldValidate: true },
              );
            }}
          >
            Utiliser un plan de trésorerie détaillé
          </button>
        ) : (
          <>
            <TextareaField
              label="Convention du plan de trésorerie"
              name="cashFlowPlan.note"
              register={form.register}
            />
            <MoneyField label="Réserve fiscale conservée pour après l’achat" name="cashFlowPlan.reservedTaxCents" control={form.control} optional help="Somme encore présente dans la trésorerie, mais réservée à un impôt futur. Ce n’est pas une sortie à la date d’achat ; ne pas la déduire aussi dans les flux." />
            {derived && <p className="section-note">Réserve après apport et installation : {euro(derived.reserveAfterPurchaseCents)} ; libre après enveloppe fiscale : {euro(derived.freeReserveAfterPurchaseCents)}.</p>}
            <div className="stack">
              {fields.fields.map((field, index) => {
                const entry = plan.entries[index];
                if (!entry) return null;
                const base = `cashFlowPlan.entries.${index}`;
                const result = derived?.cashFlow.find(
                  (item) => item.id === entry.id,
                );
                return (
                  <ArrayCard
                    key={field.id}
                    disclosureId={entry.id}
                    title={entry.label}
                    onRemove={() => fields.remove(index)}
                  >
                    <TextField
                      label="Libellé du flux"
                      name={path(`${base}.label`)}
                      register={form.register}
                    />
                    <TextField
                      label="Date du flux"
                      name={path(`${base}.date`)}
                      register={form.register}
                      type="date"
                    />
                    <SelectField
                      label="Sens du flux"
                      name={path(`${base}.direction`)}
                      register={form.register}
                      options={[
                        ["income", "Encaissement"],
                        ["expense", "Dépense / provision"],
                      ]}
                    />
                    <SelectField
                      label="Catégorie du flux"
                      name={path(`${base}.category`)}
                      register={form.register}
                      options={[
                        ["income", "Revenus"],
                        ["living", "Dépenses du foyer"],
                        ["income-tax", "Impôt sur le revenu"],
                        ["social", "Cotisations antérieures à régler"],
                        ["other", "Autre engagement"],
                      ]}
                    />
                    <Field
                      label="Source du montant"
                      controlId={`cash-source-${index}`}
                    >
                      <select
                        id={`cash-source-${index}`}
                        value={entry.incomePeriodId ?? ""}
                        onChange={(event) => {
                          const period = periods.find(
                            (item) => item.id === event.target.value,
                          );
                          const {
                            amountCents: _amount,
                            incomePeriodId: _period,
                            ...rest
                          } = entry;
                          fields.update(
                            index,
                            period
                              ? {
                                  ...rest,
                                  incomePeriodId: period.id,
                                  direction: "income",
                                  date: period.collectionDate ?? entry.date,
                                }
                              : { ...rest, amountCents: 0 },
                          );
                        }}
                      >
                        <option value="">Montant saisi</option>
                        {periods.map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {!entry.incomePeriodId && (
                      <MoneyField
                        label="Montant du flux"
                        name={path(`${base}.amountCents`)}
                        control={form.control}
                      />
                    )}
                    {entry.direction === "expense" && entry.category === "income-tax" && <label><input type="checkbox" {...form.register(path(`${base}.isProvision`))} /> Somme mise de côté (provision fiscale)</label>}
                    <TextareaField
                      label="Justification du flux"
                      name={path(`${base}.note`)}
                      register={form.register}
                    />
                    {result && (
                      <p className="field--wide">
                        Variation : <strong>{euro(result.amountCents)}</strong>{" "}
                        · Solde projeté :{" "}
                        <strong>{euro(result.balanceCents)}</strong>
                      </p>
                    )}
                  </ArrayCard>
                );
              })}
            </div>
            <div className="planning-actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() =>
                  fields.append({
                    id: identifier("cash"),
                    date: form.getValues("project.targetPurchaseDate"),
                    label: "Nouveau flux",
                    direction: "expense",
                    category: "other",
                    amountCents: 0,
                  })
                }
              >
                Ajouter un flux de trésorerie
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  if (
                    window.confirm(
                      "Supprimer le plan détaillé et revenir à la projection simplifiée ?",
                    )
                  )
                    form.setValue("cashFlowPlan", undefined, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                }}
              >
                Revenir à la projection simplifiée
              </button>
            </div>
            {derived && (
              <p>
                Liquidités projetées à l'achat, après les provisions saisies :{" "}
                <strong>
                  {euro(derived.projectedLiquidityAtPurchaseCents)}
                </strong>
                .
              </p>
            )}
          </>
        )}
      </div>
    </EditorDisclosure>
  );
}
export function SavingsSummary({
  dossier,
  derived,
}: {
  readonly dossier: Dossier;
  readonly derived: DerivedDossier | undefined;
}) {
  if (!derived) return null;
  return (
    <section className="savings-summary">
      <h3>Capacité d'épargne du foyer</h3>
      <p className="section-note">
        Revenus après IR moins dépenses et crédits. L'épargne déjà affectée à un
        livret ou placement est incluse dans la capacité totale ; les
        projections restent conditionnelles aux hypothèses saisies.
      </p>
      <div className="metric-grid">
        {dossier.budgetScenarios
          .filter((item) =>
            ["current", "central", "stress"].includes(item.kind),
          )
          .map((budget) => (
            <div className="metric-card" key={budget.id}>
              <span>{budget.label}</span>
              <strong>
                {euro(derived.savingsCapacityCents[budget.id] ?? 0)} / mois
              </strong>
              <small>
                Revenu après IR :{" "}
                {euro(derived.budgetIncomeCents[budget.id] ?? 0)}
              </small>
            </div>
          ))}
      </div>
      {dossier.budgetScenarios
        .filter((item) => item.kind === "central")
        .map((budget) => (
          <div key={budget.id} className="planning-result">
            {(derived.budgetSavingsPhases[budget.id] ?? []).map((phase) => (
              <span key={phase.date}>
                À partir du {phase.date} : épargne résiduelle{" "}
                <strong>{euro(phase.savingsCents)} / mois</strong>, crédits{" "}
                <strong>{euro(phase.mortgageCents + phase.debtCents)}</strong>
              </span>
            ))}
          </div>
        ))}
    </section>
  );
}
