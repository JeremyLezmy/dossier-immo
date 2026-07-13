import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { ArrayCard, SectionIntro, SelectField, TextField } from "../../../components/fields";
import { CheckboxField, ReferenceSelect, TextareaField } from "./shared";

export function DocumentsStep({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const documents = useFieldArray({ control: form.control, name: "supportingDocuments" });
  const peopleOptions = form.watch("household.people").map((person) => ({ value: person.id, label: person.displayName || person.id }));
  return <><SectionIntro title="Pièces justificatives" description="Seuls le statut, le responsable et le canal prévu sont conservés. Aucun fichier sensible n'est chargé dans l'application." help="Les justificatifs réels doivent rester hors du dépôt Git et être transmis via le portail sécurisé de la banque ou du courtier." />
    <div className="stack">{documents.fields.map((document, index) => <ArrayCard key={document.id} title={form.watch(`supportingDocuments.${index}.label`) || `Pièce ${index + 1}`} onRemove={() => documents.remove(index)}>
      <TextField label="Libellé" name={`supportingDocuments.${index}.label`} register={form.register} />
      <ReferenceSelect label="Titulaire" name={`supportingDocuments.${index}.ownerId`} register={form.register} options={peopleOptions} optional />
      <SelectField label="Catégorie" name={`supportingDocuments.${index}.category`} register={form.register} options={[["identity", "Identité"], ["household", "Foyer / situation familiale"], ["income", "Revenus"], ["tax", "Fiscalité"], ["asset", "Patrimoine"], ["liability", "Passif"], ["project", "Bien / projet"], ["professional", "Professionnel"], ["other", "Autre"]]} />
      <SelectField label="Statut" name={`supportingDocuments.${index}.status`} register={form.register} options={[["missing", "À fournir"], ["requested", "Demandée"], ["available", "Disponible"], ["verified", "Vérifiée"], ["not-applicable", "Non applicable"]]} />
      <TextField label="Responsable" name={`supportingDocuments.${index}.responsibleParty`} register={form.register} help="Personne ou partie chargée de fournir la pièce : foyer, emprunteur, vendeur, banque…" />
      <SelectField label="Canal de transmission" name={`supportingDocuments.${index}.deliveryChannel`} register={form.register} options={[["secure-portal", "Portail sécurisé"], ["encrypted-email", "Courriel chiffré"], ["in-person", "Remise en main propre"], ["postal", "Courrier"], ["other", "Autre"]]} />
      <CheckboxField label="Document sensible" name={`supportingDocuments.${index}.sensitive`} register={form.register} />
      <TextareaField label="Note" name={`supportingDocuments.${index}.note`} register={form.register} />
    </ArrayCard>)}</div><button type="button" className="button button--secondary" onClick={() => documents.append({ id: `document-${crypto.randomUUID().slice(0, 8)}`, label: "Nouvelle pièce", category: "other", status: "missing", sensitive: true })}>Ajouter une pièce</button>
  </>;
}

