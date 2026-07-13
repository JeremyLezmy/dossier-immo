import { useEffect } from "react";
import {
  useFieldArray,
  type FieldPath,
  type UseFormReturn,
} from "react-hook-form";
import type { CompensationModel, Dossier } from "@dossier-immo/schema";
import {
  ArrayCard,
  Field,
  MoneyField,
  SectionIntro,
  SelectField,
  TextField,
} from "../../../components/fields";
import { CheckboxField, ReferenceSelect, TextareaField, euro } from "./shared";

const personOptions = (form: UseFormReturn<Dossier>) =>
  form.watch("household.people").map((person) => ({
    value: person.id,
    label: person.displayName || person.id,
  }));

function defaultCompensation(
  kind: CompensationModel["kind"],
): CompensationModel {
  if (kind === "salary") return { kind: "salary" };
  if (kind === "day-rate") return { kind: "day-rate", dailyRateCents: 0 };
  if (kind === "consultation") return { kind: "consultation" };
  if (kind === "turnover") return { kind: "turnover" };
  if (kind === "hourly") return { kind: "hourly", hourlyRateCents: 0 };
  if (kind === "commission") return { kind: "commission" };
  return { kind: "other", description: "" };
}

function CompensationFields({
  form,
  index,
}: {
  readonly form: UseFormReturn<Dossier>;
  readonly index: number;
}) {
  const model = form.watch(`professionalActivities.${index}.compensationModel`);
  const base = `professionalActivities.${index}.compensationModel` as const;
  const money = (suffix: string) => `${base}.${suffix}` as FieldPath<Dossier>;
  return (
    <>
      <Field
        label="Mode de rémunération"
        controlId={`compensation-${index}`}
        help="Choisissez le modèle réellement utilisé. Les indicateurs non pertinents ne seront ni demandés ni imprimés."
      >
        <select
          id={`compensation-${index}`}
          value={model.kind}
          onChange={(event) =>
            form.setValue(
              base,
              defaultCompensation(
                event.target.value as CompensationModel["kind"],
              ),
              { shouldDirty: true, shouldValidate: true },
            )
          }
        >
          <option value="salary">Salaire</option>
          <option value="day-rate">Taux journalier (TJM)</option>
          <option value="consultation">Consultation / séance</option>
          <option value="turnover">Chiffre d'affaires</option>
          <option value="hourly">Taux horaire</option>
          <option value="commission">Commission</option>
          <option value="other">Autre</option>
        </select>
      </Field>
      {model.kind === "salary" && (
        <>
          <MoneyField
            label="Salaire brut annuel contractuel"
            name={money("contractualGrossAnnualCents")}
            control={form.control}
            optional
            help="Facultatif : les revenus mensuels retenus restent renseignés dans les flux de revenus."
          />
          <MoneyField
            label="Variable brut annuel"
            name={money("variableGrossAnnualCents")}
            control={form.control}
            optional
          />
          <TextField
            label="Quotité de travail (points de base)"
            name={money("workTimeBasisPoints")}
            register={form.register}
            type="number"
            hint="10 000 = temps plein ; 4 000 = 40 %."
          />
        </>
      )}
      {model.kind === "day-rate" && (
        <>
          <MoneyField
            label="TJM actuel"
            name={money("dailyRateCents")}
            control={form.control}
            help="Tarif journalier hors taxes facturé. Ce champ n'apparaît que pour une activité au taux journalier."
          />
          <TextField
            label="Jours facturables par an"
            name={money("billableDaysPerYear")}
            register={form.register}
            type="number"
          />
          <TextField
            label="Délai moyen d'encaissement (jours)"
            name={money("collectionDelayDays")}
            register={form.register}
            type="number"
            help="À renseigner seulement si les factures sont encaissées avec un décalage significatif."
          />
          <MoneyField
            label="TJM projeté"
            name={money("projection.amountCents")}
            control={form.control}
            optional
          />
          <TextField
            label="Date d'effet projetée"
            name={money("projection.effectiveDate")}
            register={form.register}
            type="date"
          />
        </>
      )}
      {model.kind === "consultation" && (
        <>
          <MoneyField
            label="Tarif par consultation"
            name={money("consultationFeeCents")}
            control={form.control}
            optional
            help="Honoraires moyens facturés par consultation ou séance."
          />
          <TextField
            label="Consultations par semaine"
            name={money("consultationsPerWeek")}
            register={form.register}
            type="number"
          />
          <TextField
            label="Semaines travaillées par an"
            name={money("workingWeeksPerYear")}
            register={form.register}
            type="number"
          />
          <TextField
            label="Délai d'encaissement (jours)"
            name={money("collectionDelayDays")}
            register={form.register}
            type="number"
            help="Laissez vide pour un règlement immédiat ; ne saisissez pas zéro par défaut."
          />
        </>
      )}
      {model.kind === "turnover" && (
        <>
          <MoneyField
            label="Chiffre d'affaires annuel de référence"
            name={money("annualTurnoverCents")}
            control={form.control}
            optional
          />
          <TextField
            label="Délai moyen d'encaissement (jours)"
            name={money("collectionDelayDays")}
            register={form.register}
            type="number"
          />
        </>
      )}
      {model.kind === "hourly" && (
        <>
          <MoneyField
            label="Taux horaire"
            name={money("hourlyRateCents")}
            control={form.control}
          />
          <TextField
            label="Heures par semaine"
            name={money("hoursPerWeek")}
            register={form.register}
            type="number"
          />
          <TextField
            label="Semaines travaillées par an"
            name={money("workingWeeksPerYear")}
            register={form.register}
            type="number"
          />
          <TextField
            label="Délai moyen d'encaissement (jours)"
            name={money("collectionDelayDays")}
            register={form.register}
            type="number"
          />
        </>
      )}
      {model.kind === "commission" && (
        <>
          <MoneyField
            label="Commission annuelle de référence"
            name={money("referenceAnnualCommissionCents")}
            control={form.control}
            optional
          />
          <TextField
            label="Délai moyen d'encaissement (jours)"
            name={money("collectionDelayDays")}
            register={form.register}
            type="number"
          />
        </>
      )}
      {model.kind === "other" && (
        <TextareaField
          label="Description du modèle de rémunération"
          name={money("description")}
          register={form.register}
        />
      )}
      <TextareaField
        label="Note sur la rémunération"
        name={money("note")}
        register={form.register}
        help="Expliquez uniquement les particularités utiles à l'analyse bancaire."
      />
    </>
  );
}

function ActivityCard({
  form,
  index,
  onRemove,
}: {
  readonly form: UseFormReturn<Dossier>;
  readonly index: number;
  readonly onRemove: () => void;
}) {
  const entries = useFieldArray({
    control: form.control,
    name: `professionalActivities.${index}.entries`,
  });
  const title =
    form.watch(`professionalActivities.${index}.label`) ||
    `Activité ${index + 1}`;
  return (
    <ArrayCard
      title={title}
      subtitle="Une activité correspond à un engagement professionnel homogène. Créez une seconde activité pour un exercice institutionnel et libéral."
      onRemove={onRemove}
    >
      <ReferenceSelect
        label="Personne"
        name={`professionalActivities.${index}.personId`}
        register={form.register}
        options={personOptions(form)}
      />
      <TextField
        label="Libellé de l'activité"
        name={`professionalActivities.${index}.label`}
        register={form.register}
      />
      <TextField
        label="Métier / fonction"
        name={`professionalActivities.${index}.occupation`}
        register={form.register}
      />
      <SelectField
        label="Statut"
        name={`professionalActivities.${index}.status`}
        register={form.register}
        options={[
          ["permanent", "CDI"],
          ["fixed-term", "CDD"],
          ["civil-servant", "Fonctionnaire"],
          ["self-employed", "Indépendant"],
          ["company-director", "Dirigeant"],
          ["liberal", "Profession libérale"],
          ["other", "Autre"],
        ]}
      />
      <SelectField
        label="Modalité d'exercice"
        name={`professionalActivities.${index}.engagementType`}
        register={form.register}
        options={[
          ["employee", "Salariat"],
          ["civil-service", "Fonction publique"],
          ["contractor", "Prestation / mission"],
          ["independent-practice", "Exercice libéral"],
          ["business-owner", "Direction d'entreprise"],
          ["other", "Autre"],
        ]}
      />
      <TextField
        label="Régime juridique / convention"
        name={`professionalActivities.${index}.legalRegime`}
        register={form.register}
      />
      <TextField
        label="Début de l'activité"
        name={`professionalActivities.${index}.startDate`}
        register={form.register}
        type="date"
      />
      <TextField
        label="Fin de période d'essai"
        name={`professionalActivities.${index}.trialPeriodEndDate`}
        register={form.register}
        type="date"
      />
      <CompensationFields form={form} index={index} />
      <div className="field--wide">
        <h4>Parcours et éléments de stabilité</h4>
        <p className="section-note">
          Ajoutez uniquement les étapes utiles. La continuité professionnelle
          est une information possible, pas un champ imposé.
        </p>
        {entries.fields.map((entry, entryIndex) => (
          <div className="nested-card" key={entry.id}>
            <div className="form-grid">
              <TextField
                label="Étape"
                name={`professionalActivities.${index}.entries.${entryIndex}.label`}
                register={form.register}
              />
              <SelectField
                label="Nature"
                name={`professionalActivities.${index}.entries.${entryIndex}.kind`}
                register={form.register}
                options={[
                  ["education", "Formation"],
                  ["employment", "Emploi salarié"],
                  ["assignment", "Mission"],
                  ["practice", "Exercice professionnel"],
                  ["business", "Création d'entreprise"],
                  ["career-break", "Interruption"],
                  ["other", "Autre"],
                ]}
              />
              <TextField
                label="Début"
                name={`professionalActivities.${index}.entries.${entryIndex}.startDate`}
                register={form.register}
                type="date"
              />
              <TextField
                label="Fin"
                name={`professionalActivities.${index}.entries.${entryIndex}.endDate`}
                register={form.register}
                type="date"
              />
              <TextareaField
                label="Explication"
                name={`professionalActivities.${index}.entries.${entryIndex}.note`}
                register={form.register}
              />
              <button
                type="button"
                className="button button--ghost button--danger"
                onClick={() => entries.remove(entryIndex)}
              >
                Supprimer l'étape
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="button button--ghost"
          onClick={() =>
            entries.append({
              id: `history-${crypto.randomUUID().slice(0, 8)}`,
              kind: "other",
              label: "",
              evidenceLabels: [],
            })
          }
        >
          Ajouter une étape
        </button>
      </div>
    </ArrayCard>
  );
}

function HistoryCard({
  form,
  index,
  onRemove,
}: {
  readonly form: UseFormReturn<Dossier>;
  readonly index: number;
  readonly onRemove: () => void;
}) {
  const turnover = form.watch(`revenueHistory.${index}.turnoverCents`) ?? 0;
  const expenses = form.watch(`revenueHistory.${index}.expensesCents`) ?? 0;
  useEffect(() => {
    form.setValue(`revenueHistory.${index}.resultCents`, turnover - expenses, {
      shouldValidate: true,
    });
  }, [expenses, form, index, turnover]);
  const incomeOptions = form
    .watch("incomeStreams")
    .map((income) => ({ value: income.id, label: income.label || income.id }));
  return (
    <ArrayCard
      title={`Historique ${form.watch(`revenueHistory.${index}.period`) || index + 1}`}
      onRemove={onRemove}
    >
      <ReferenceSelect
        label="Flux de revenu"
        name={`revenueHistory.${index}.incomeStreamId`}
        register={form.register}
        options={incomeOptions}
      />
      <TextField
        label="Période (AAAA ou AAAA-MM)"
        name={`revenueHistory.${index}.period`}
        register={form.register}
      />
      <MoneyField
        label="Chiffre d'affaires"
        name={`revenueHistory.${index}.turnoverCents`}
        control={form.control}
      />
      <MoneyField
        label="Dépenses professionnelles"
        name={`revenueHistory.${index}.expensesCents`}
        control={form.control}
      />
      <Field label="Résultat calculé">
        <output>{euro(turnover - expenses)}</output>
      </Field>
      <MoneyField
        label="Montant encaissé"
        name={`revenueHistory.${index}.collectedCents`}
        control={form.control}
        optional
        help="À distinguer du chiffre d'affaires facturé lorsqu'il existe un décalage d'encaissement."
      />
      <CheckboxField
        label="Donnée observée"
        name={`revenueHistory.${index}.observed`}
        register={form.register}
      />
      <TextField
        label="Source / justificatif"
        name={`revenueHistory.${index}.sourceLabel`}
        register={form.register}
      />
    </ArrayCard>
  );
}

export function IncomeStep({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  const activities = useFieldArray({
    control: form.control,
    name: "professionalActivities",
  });
  const incomes = useFieldArray({
    control: form.control,
    name: "incomeStreams",
  });
  const history = useFieldArray({
    control: form.control,
    name: "revenueHistory",
  });
  const activitiesOptions = form
    .watch("professionalActivities")
    .map((activity) => ({
      value: activity.id,
      label: activity.label || activity.id,
    }));
  return (
    <>
      <SectionIntro
        title="Activités et revenus"
        description="Séparez les activités, leur mode de rémunération et les revenus retenus. L'interface n'affiche que les indicateurs adaptés au modèle choisi."
      />
      <details className="editor-subsection" open>
        <summary>
          <div>
            <strong>Activités professionnelles</strong>
            <span>Statuts, rémunérations et parcours</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <div className="stack">
            {activities.fields.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                form={form}
                index={index}
                onRemove={() => activities.remove(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              activities.append({
                id: `activity-${crypto.randomUUID().slice(0, 8)}`,
                personId: form.getValues("household.people.0.id"),
                label: "Nouvelle activité",
                occupation: "",
                status: "other",
                engagementType: "other",
                startDate: dossierDate(form),
                compensationModel: { kind: "other", description: "À préciser" },
                entries: [],
              })
            }
          >
            Ajouter une activité
          </button>
        </div>
      </details>
      <details className="editor-subsection">
        <summary>
          <div>
            <strong>Flux de revenus</strong>
            <span>Hypothèses centrale, prudente et après impôt</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <div className="stack">
            {incomes.fields.map((income, index) => (
              <ArrayCard
                key={income.id}
                title={
                  form.watch(`incomeStreams.${index}.label`) ||
                  `Revenu ${index + 1}`
                }
                onRemove={() => incomes.remove(index)}
              >
                <ReferenceSelect
                  label="Personne"
                  name={`incomeStreams.${index}.personId`}
                  register={form.register}
                  options={personOptions(form)}
                />
                <ReferenceSelect
                  label="Activité liée"
                  name={`incomeStreams.${index}.activityId`}
                  register={form.register}
                  options={activitiesOptions}
                  optional
                />
                <SelectField
                  label="Nature du revenu"
                  name={`incomeStreams.${index}.kind`}
                  register={form.register}
                  options={[
                    ["salary", "Salaire"],
                    ["public-service", "Traitement public"],
                    ["self-employed", "Revenu indépendant"],
                    ["liberal", "Honoraires libéraux"],
                    ["rental", "Revenu locatif"],
                    ["pension", "Pension / retraite"],
                    ["benefit", "Allocation / prestation"],
                    ["commission", "Commission"],
                    ["other", "Autre"],
                  ]}
                />
                <TextField
                  label="Libellé"
                  name={`incomeStreams.${index}.label`}
                  register={form.register}
                />
                <MoneyField
                  label="Revenu mensuel retenu — central"
                  name={`incomeStreams.${index}.monthlyBankCents`}
                  control={form.control}
                  help="Montant net avant impôt retenu dans le scénario bancaire central. Ce n'est pas automatiquement le chiffre d'affaires divisé par douze."
                />
                <MoneyField
                  label="Revenu mensuel retenu — prudent"
                  name={`incomeStreams.${index}.monthlyPrudentCents`}
                  control={form.control}
                  help="Hypothèse minorée utilisée pour mesurer la robustesse du dossier."
                />
                <MoneyField
                  label="Après impôt estimé"
                  name={`incomeStreams.${index}.monthlyAfterTaxEstimateCents`}
                  control={form.control}
                  optional
                />
                <CheckboxField
                  label="Récurrent"
                  name={`incomeStreams.${index}.recurring`}
                  register={form.register}
                />
                <CheckboxField
                  label="Inclus dans la capacité d'emprunt"
                  name={`incomeStreams.${index}.includedInBorrowingCapacity`}
                  register={form.register}
                />
                <TextareaField
                  label="Méthode de retenue / justification"
                  name={`incomeStreams.${index}.note`}
                  register={form.register}
                  help="Expliquez la base documentaire et la prudence appliquée."
                />
              </ArrayCard>
            ))}
          </div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              incomes.append({
                id: `income-${crypto.randomUUID().slice(0, 8)}`,
                personId: form.getValues("household.people.0.id"),
                kind: "other",
                label: "Nouveau revenu",
                monthlyBankCents: 0,
                monthlyPrudentCents: 0,
                recurring: true,
                includedInBorrowingCapacity: true,
              })
            }
          >
            Ajouter un revenu
          </button>
        </div>
      </details>
      <details className="editor-subsection">
        <summary>
          <div>
            <strong>Historique documenté</strong>
            <span>Chiffre d'affaires, charges et justificatifs</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <div className="stack">
            {history.fields.map((entry, index) => (
              <HistoryCard
                key={entry.id}
                form={form}
                index={index}
                onRemove={() => history.remove(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="button button--ghost"
            disabled={incomes.fields.length === 0}
            onClick={() =>
              history.append({
                id: `history-${crypto.randomUUID().slice(0, 8)}`,
                incomeStreamId: form.getValues("incomeStreams.0.id"),
                period: String(new Date().getFullYear()),
                turnoverCents: 0,
                expensesCents: 0,
                resultCents: 0,
                observed: true,
              })
            }
          >
            Ajouter une période
          </button>
        </div>
      </details>
    </>
  );
}

const dossierDate = (form: UseFormReturn<Dossier>) =>
  form.getValues("metadata.observationDate");
