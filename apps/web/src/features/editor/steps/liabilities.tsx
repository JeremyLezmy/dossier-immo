import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { validateDossier, type Dossier } from "@dossier-immo/schema";
import { calculateDossier } from "@dossier-immo/calculations";
import {
  ArrayCard,
  MoneyField,
  RateField,
  SectionIntro,
  SelectField,
  TextField,
} from "../../../components/fields";
import { CheckboxField, MultiReferenceSelect, TextareaField, euro } from "./shared";

export function LiabilitiesStep({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  const validation = validateDossier(form.watch());
  const comparisons = validation.success ? calculateDossier(validation.dossier).prepaymentComparisons : [];
  const liabilities = useFieldArray({
    control: form.control,
    name: "liabilities",
  });
  const peopleOptions = form
    .watch("household.people")
    .map((person) => ({
      value: person.id,
      label: person.displayName || person.id,
    }));
  return (
    <>
      <SectionIntro
        title="Crédits et passifs"
        description="Renseignez les mensualités et échéances connues. Le moteur détermine automatiquement si une dette existe encore à la date d'achat."
      />
      {comparisons.map(item => <p key={item.liabilityId} className="planning-result">Clôture à l’achat — {item.label} : {euro(item.settlementCents)} à régler, {euro(item.releasedMonthlyCents)} / mois libérés, réserve après achat {euro(item.reserveCents)} à apport immobilier inchangé. Décompte et maintien des garanties à confirmer.</p>)}
      <div className="stack">
        {liabilities.fields.map((liability, index) => (
          <ArrayCard
            key={liability.id}
            disclosureId={`liability-${form.watch(`liabilities.${index}.id`)}`}
            title={
              form.watch(`liabilities.${index}.label`) || `Passif ${index + 1}`
            }
            onRemove={() => liabilities.remove(index)}
          >
            <MoneyField label="Décompte estimé de remboursement à l’achat" name={`liabilities.${index}.settlementAtPurchaseCents`} control={form.control} optional help="Capital et frais restant à régler à la date d’achat, à confirmer auprès du prêteur. Active la comparaison de remboursement anticipé." />
            <TextField
              label="Libellé"
              name={`liabilities.${index}.label`}
              register={form.register}
            />
            <MultiReferenceSelect
              label="Emprunteur(s)"
              name={`liabilities.${index}.borrowerIds`}
              control={form.control}
              options={peopleOptions}
            />
            <SelectField
              label="Catégorie"
              name={`liabilities.${index}.category`}
              register={form.register}
              options={[
                ["mortgage", "Crédit immobilier"],
                ["auto", "Crédit automobile"],
                ["consumer", "Crédit à la consommation"],
                ["student", "Prêt étudiant"],
                ["professional", "Crédit professionnel"],
                ["alimony", "Pension alimentaire"],
                ["bridge", "Prêt relais"],
                ["other", "Autre"],
              ]}
            />
            <MoneyField
              label="Capital restant dû"
              name={`liabilities.${index}.outstandingCents`}
              control={form.control}
            />
            <MoneyField
              label="Mensualité"
              name={`liabilities.${index}.monthlyPaymentCents`}
              control={form.control}
            />
            <MoneyField
              label="Dont prestations / frais mensuels"
              name={`liabilities.${index}.servicesMonthlyCents`}
              control={form.control}
              optional
              help="Part déjà comprise dans la mensualité totale. Elle n'est pas déduite une seconde fois ; vérifier son maintien en cas de remboursement anticipé."
            />
            <TextField
              label="Date de début"
              name={`liabilities.${index}.startDate`}
              register={form.register}
              type="date"
            />
            <TextField
              label="Date de fin"
              name={`liabilities.${index}.endDate`}
              register={form.register}
              type="date"
            />
            <RateField
              label="Taux annuel"
              name={`liabilities.${index}.annualRateBasisPoints`}
              control={form.control}
              optional
            />
            <CheckboxField
              label="Inclure dans le taux d'effort"
              name={`liabilities.${index}.includedInEffortRate`}
              register={form.register}
              help="Décochez uniquement si la dette est juridiquement éteinte ou explicitement exclue par l'analyse."
            />
            <TextareaField
              label="Note"
              name={`liabilities.${index}.note`}
              register={form.register}
            />
          </ArrayCard>
        ))}
      </div>
      <button
        type="button"
        className="button button--secondary"
        onClick={() =>
          liabilities.append({
            id: `liability-${crypto.randomUUID().slice(0, 8)}`,
            borrowerIds: [form.getValues("household.people.0.id")],
            label: "Nouveau passif",
            category: "other",
            outstandingCents: 0,
            monthlyPaymentCents: 0,
            includedInEffortRate: true,
          })
        }
      >
        Ajouter un passif
      </button>
    </>
  );
}
