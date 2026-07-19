import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { ArrayCard, MoneyField, SectionIntro, SelectField, TextField } from "../../../components/fields";
import { TextareaField } from "./shared";

export function HouseholdStep({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const people = useFieldArray({ control: form.control, name: "household.people" });
  const events = useFieldArray({ control: form.control, name: "household.plannedHouseholdEvents" });
  const relationship = form.watch("household.relationshipStatus");
  const housing = form.watch("household.housingStatus");
  return <><SectionIntro title="Foyer" description="Décrivez la situation actuelle et les évolutions déjà envisagées. Les projections restent explicitement distinctes des faits observés." help="Les identifiants techniques sont générés automatiquement ; vous ne renseignez que les informations utiles au dossier bancaire." />
    <div className="form-grid">
      <SelectField label="Situation familiale" name="household.relationshipStatus" register={form.register} options={[["single", "Célibataire"], ["married", "Marié(e)"], ["civil-union", "Pacsé(e)"], ["cohabiting", "Concubinage"], ["separated", "Séparé(e)"], ["other", "Autre"]]} help="Situation juridique actuelle du foyer." />
      {relationship !== "single" && <SelectField label="Régime matrimonial" name="household.matrimonialRegime" register={form.register} options={[["community", "Communauté"], ["separation-of-property", "Séparation de biens"], ["participation", "Participation aux acquêts"], ["not-applicable", "Non applicable"], ["other", "Autre"]]} />}
      <TextField label="Relation depuis le" name="household.relationshipSince" register={form.register} type="date" />
      {relationship === "married" && <TextField label="Date du mariage" name="household.marriageDate" register={form.register} type="date" />}
      <TextField label="Personnes à charge" name="household.dependents" register={form.register} type="number" help="Nombre de personnes actuellement à charge. Les projets futurs se déclarent séparément ci-dessous." />
      <SelectField label="Logement actuel" name="household.housingStatus" register={form.register} options={[["tenant", "Locataire"], ["owner", "Propriétaire"], ["hosted", "Hébergé à titre gratuit"], ["other", "Autre"]]} />
      {housing === "tenant" && <MoneyField label="Loyer mensuel actuel" name="household.currentMonthlyRentCents" control={form.control} help="Loyer charges comprises utilisé pour décrire l'historique de paiement, pas dans le budget post-achat." />}
      <TextField label="Dans ce logement depuis le" name="household.currentHousingSince" register={form.register} type="date" />
      <TextareaField label="Description du logement actuel" name="household.currentHousingDescription" register={form.register} example="Appartement de 52 m² en location à Villeurbanne." />
      <TextareaField label="Historique locatif" name="household.rentHistoryNote" register={form.register} example="Loyer réglé sans incident depuis 2019 ; quittances disponibles." />
      <TextareaField label="Incidents de paiement" name="household.paymentIncidentsNote" register={form.register} example="Aucun incident de paiement déclaré." />
    </div>
    <h3>Personnes du foyer</h3><div className="stack">{people.fields.map((person, index) => <ArrayCard key={person.id} disclosureId={`person-${form.watch(`household.people.${index}.id`)}`} title={form.watch(`household.people.${index}.displayName`) || `Personne ${index + 1}`} subtitle={index === 0 ? "Emprunteur principal" : "Co-emprunteur ou personne à charge"} onRemove={people.fields.length > 1 ? () => people.remove(index) : undefined}>
      <TextField label="Nom affiché" name={`household.people.${index}.displayName`} register={form.register} />
      <TextField label="Date de naissance" name={`household.people.${index}.birthDate`} register={form.register} type="date" />
      <SelectField label="Rôle" name={`household.people.${index}.role`} register={form.register} options={[["borrower", "Emprunteur principal"], ["co-borrower", "Co-emprunteur"], ["dependent", "Personne à charge"], ["other", "Autre"]]} />
      <TextField label="Courriel (optionnel)" name={`household.people.${index}.email`} register={form.register} />
      <TextField label="Téléphone (optionnel)" name={`household.people.${index}.phone`} register={form.register} />
      <TextareaField label="Qualification / éléments utiles" name={`household.people.${index}.qualificationNote`} register={form.register} help="Formation ou qualification utile à l'analyse, sans transformer le dossier en CV exhaustif." />
    </ArrayCard>)}</div><button type="button" className="button button--secondary" onClick={() => people.append({ id: `person-${crypto.randomUUID().slice(0, 8)}`, displayName: "", role: "co-borrower" })}>Ajouter une personne</button>
    <h3>Évolutions du foyer envisagées</h3><p className="section-note">Ces éléments sont des hypothèses de prudence, jamais présentés comme une situation actuelle.</p><div className="stack">{events.fields.map((event, index) => <ArrayCard key={event.id} disclosureId={`household-event-${form.watch(`household.plannedHouseholdEvents.${index}.id`)}`} title={form.watch(`household.plannedHouseholdEvents.${index}.label`) || `Événement ${index + 1}`} onRemove={() => events.remove(index)}>
      <TextField label="Événement" name={`household.plannedHouseholdEvents.${index}.label`} register={form.register} />
      <TextField label="Date indicative" name={`household.plannedHouseholdEvents.${index}.expectedDate`} register={form.register} type="date" />
      <SelectField label="Impact principal" name={`household.plannedHouseholdEvents.${index}.impact`} register={form.register} options={[["income", "Revenus"], ["expense", "Dépenses"], ["housing", "Logement"], ["household", "Composition du foyer"], ["professional", "Situation professionnelle"], ["other", "Autre"]]} />
      <TextareaField label="Note de prudence" name={`household.plannedHouseholdEvents.${index}.note`} register={form.register} />
    </ArrayCard>)}</div><button type="button" className="button button--ghost" onClick={() => events.append({ id: `event-${crypto.randomUUID().slice(0, 8)}`, label: "", impact: "household" })}>Ajouter une évolution envisagée</button>
  </>;
}
