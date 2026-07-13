import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { ArrayCard, MoneyField, RateField, SectionIntro, SelectField, TextField } from "../../../components/fields";
import { CheckboxField, MultiReferenceSelect, TextareaField } from "./shared";

export function LiabilitiesStep({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const liabilities = useFieldArray({ control: form.control, name: "liabilities" });
  const peopleOptions = form.watch("household.people").map((person) => ({ value: person.id, label: person.displayName || person.id }));
  return <><SectionIntro title="Crédits et passifs" description="Renseignez les mensualités et échéances connues. Le moteur détermine automatiquement si une dette existe encore à la date d'achat." />
    <div className="stack">{liabilities.fields.map((liability, index) => <ArrayCard key={liability.id} title={form.watch(`liabilities.${index}.label`) || `Passif ${index + 1}`} onRemove={() => liabilities.remove(index)}>
      <TextField label="Libellé" name={`liabilities.${index}.label`} register={form.register} />
      <MultiReferenceSelect label="Emprunteur(s)" name={`liabilities.${index}.borrowerIds`} control={form.control} options={peopleOptions} />
      <SelectField label="Catégorie" name={`liabilities.${index}.category`} register={form.register} options={[["mortgage", "Crédit immobilier"], ["auto", "Crédit automobile"], ["consumer", "Crédit à la consommation"], ["student", "Prêt étudiant"], ["professional", "Crédit professionnel"], ["alimony", "Pension alimentaire"], ["bridge", "Prêt relais"], ["other", "Autre"]]} />
      <MoneyField label="Capital restant dû" name={`liabilities.${index}.outstandingCents`} control={form.control} />
      <MoneyField label="Mensualité" name={`liabilities.${index}.monthlyPaymentCents`} control={form.control} />
      <TextField label="Date de début" name={`liabilities.${index}.startDate`} register={form.register} type="date" />
      <TextField label="Date de fin" name={`liabilities.${index}.endDate`} register={form.register} type="date" />
      <RateField label="Taux annuel" name={`liabilities.${index}.annualRateBasisPoints`} control={form.control} optional />
      <CheckboxField label="Inclure dans le taux d'effort" name={`liabilities.${index}.includedInEffortRate`} register={form.register} help="Décochez uniquement si la dette est juridiquement éteinte ou explicitement exclue par l'analyse." />
      <TextareaField label="Note" name={`liabilities.${index}.note`} register={form.register} />
    </ArrayCard>)}</div><button type="button" className="button button--secondary" onClick={() => liabilities.append({ id: `liability-${crypto.randomUUID().slice(0, 8)}`, borrowerIds: [form.getValues("household.people.0.id")], label: "Nouveau passif", category: "other", outstandingCents: 0, monthlyPaymentCents: 0, includedInEffortRate: true })}>Ajouter un passif</button>
  </>;
}

