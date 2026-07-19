import {
  useFieldArray,
  type FieldPath,
  type UseFormReturn,
} from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import {
  ArrayCard,
  MoneyField,
  SectionIntro,
  SelectField,
  TextField,
} from "../../../components/fields";
import { EditorDisclosure } from "../../../components/EditorDisclosure";
import { CheckboxField, MultiReferenceSelect, TextareaField } from "./shared";

export function AssetsStep({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  const assets = useFieldArray({ control: form.control, name: "assets" });
  const snapshots = useFieldArray({
    control: form.control,
    name: "monthlySnapshots",
  });
  const peopleOptions = form.watch("household.people").map((person) => ({
    value: person.id,
    label: person.displayName || person.id,
  }));
  const currentAssets = form.watch("assets");
  const currentIncomes = form.watch("incomeStreams");
  const currentLiabilities = form.watch("liabilities");
  const recordPath = (value: string) => value as FieldPath<Dossier>;
  return (
    <>
      <SectionIntro
        title="Patrimoine et historique"
        description="Détaillez chaque actif à la date d'observation. Un actif peut être liquide sans être mobilisable pour l'apport."
        help="Séparer comptes courants, livrets et placements permet au PDF d'utiliser des libellés bancaires propres et de justifier la stratégie d'apport."
      />
      <EditorDisclosure disclosureId="assets-current">
        <summary>
          <div>
            <strong>Actifs à la date d'observation</strong>
            <span>Comptes, placements et patrimoine complémentaire</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <div className="stack">
            {assets.fields.map((asset, index) => (
              <ArrayCard
                key={asset.id}
                disclosureId={`asset-${form.watch(`assets.${index}.id`)}`}
                title={
                  form.watch(`assets.${index}.label`) || `Actif ${index + 1}`
                }
                onRemove={() => assets.remove(index)}
              >
                <TextField
                  label="Libellé"
                  name={`assets.${index}.label`}
                  register={form.register}
                />
                <MultiReferenceSelect
                  label="Titulaire(s)"
                  name={`assets.${index}.ownerIds`}
                  control={form.control}
                  options={peopleOptions}
                />
                <SelectField
                  label="Catégorie"
                  name={`assets.${index}.category`}
                  register={form.register}
                  options={[
                    ["current-account", "Compte courant"],
                    ["regulated-savings", "Épargne réglementée / livrets"],
                    ["securities", "PEA / valeurs mobilières"],
                    ["life-insurance", "Assurance-vie"],
                    ["retirement", "Épargne retraite"],
                    ["crypto", "Cryptoactifs"],
                    ["real-estate", "Immobilier"],
                    ["vehicle", "Véhicule"],
                    ["company-shares", "Parts de société"],
                    ["other", "Autre"],
                  ]}
                />
                <MoneyField
                  label="Montant observé"
                  name={`assets.${index}.amountCents`}
                  control={form.control}
                />
                <TextField
                  label="Date d'observation"
                  name={`assets.${index}.observedAt`}
                  register={form.register}
                  type="date"
                />
                <CheckboxField
                  label="Actif liquide"
                  name={`assets.${index}.liquid`}
                  register={form.register}
                  help="Disponible rapidement, indépendamment de la décision de l'utiliser comme apport."
                />
                <CheckboxField
                  label="Disponible pour l'apport"
                  name={`assets.${index}.availableForContribution`}
                  register={form.register}
                />
                {form.watch(`assets.${index}.availableForContribution`) && (
                  <MoneyField
                    label="Montant mobilisable pour ce projet"
                    name={`assets.${index}.contributionAmountCents`}
                    control={form.control}
                    optional
                    help="Vous pouvez retenir seulement une partie de cet actif, sans dépasser sa valeur observée."
                  />
                )}
                <SelectField
                  label="Priorité d'apport"
                  name={`assets.${index}.contributionPriority`}
                  register={form.register}
                  options={[
                    ["preferred", "À mobiliser en priorité"],
                    ["available", "Mobilisable si nécessaire"],
                    ["avoid", "À préserver"],
                    ["excluded", "Exclu de l'apport"],
                  ]}
                />
                <TextareaField
                  label="Lecture bancaire / allocation"
                  name={`assets.${index}.note`}
                  register={form.register}
                  example="Placement long terme non nécessaire au financement principal."
                />
              </ArrayCard>
            ))}
          </div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              assets.append({
                id: `asset-${crypto.randomUUID().slice(0, 8)}`,
                ownerIds: [form.getValues("household.people.0.id")],
                label: "Nouvel actif",
                category: "other",
                amountCents: 0,
                observedAt: form.getValues("metadata.observationDate"),
                liquid: false,
                availableForContribution: false,
                contributionPriority: "excluded",
              })
            }
          >
            Ajouter un actif
          </button>
        </div>
      </EditorDisclosure>
      <EditorDisclosure disclosureId="assets-history">
        <summary>
          <div>
            <strong>Historique mensuel</strong>
            <span>Traçabilité facultative des évolutions</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <p className="section-note">
            L'historique est facultatif mais améliore la traçabilité des
            liquidités, revenus, épargne et dettes. Les montants courants
            restent ceux des fiches ci-dessus.
          </p>
          <div className="stack">
            {snapshots.fields.map((snapshot, index) => (
              <ArrayCard
                key={snapshot.id}
                disclosureId={`snapshot-${form.watch(`monthlySnapshots.${index}.id`)}`}
                title={`Situation ${form.watch(`monthlySnapshots.${index}.month`)}`}
                onRemove={() => snapshots.remove(index)}
              >
                <TextField
                  label="Mois"
                  name={`monthlySnapshots.${index}.month`}
                  register={form.register}
                />
                <MoneyField
                  label="Épargne du mois"
                  name={`monthlySnapshots.${index}.monthlySavingsCents`}
                  control={form.control}
                />
                <TextareaField
                  label="Commentaire"
                  name={`monthlySnapshots.${index}.note`}
                  register={form.register}
                />
                <div className="field--wide snapshot-grid">
                  <h4>Actifs</h4>
                  {currentAssets.map((item) => (
                    <MoneyField
                      key={item.id}
                      label={item.label || item.id}
                      name={recordPath(
                        `monthlySnapshots.${index}.assetAmountsCents.${item.id}`,
                      )}
                      control={form.control}
                      optional
                    />
                  ))}
                </div>
                <div className="field--wide snapshot-grid">
                  <h4>Revenus</h4>
                  {currentIncomes.map((item) => (
                    <MoneyField
                      key={item.id}
                      label={item.label || item.id}
                      name={recordPath(
                        `monthlySnapshots.${index}.incomeAmountsCents.${item.id}`,
                      )}
                      control={form.control}
                      optional
                    />
                  ))}
                </div>
                <div className="field--wide snapshot-grid">
                  <h4>Mensualités de passifs</h4>
                  {currentLiabilities.map((item) => (
                    <MoneyField
                      key={item.id}
                      label={item.label || item.id}
                      name={recordPath(
                        `monthlySnapshots.${index}.liabilityPaymentsCents.${item.id}`,
                      )}
                      control={form.control}
                      optional
                    />
                  ))}
                </div>
              </ArrayCard>
            ))}
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              snapshots.append({
                id: `snapshot-${crypto.randomUUID().slice(0, 8)}`,
                month: form.getValues("metadata.observationDate").slice(0, 7),
                assetAmountsCents: Object.fromEntries(
                  currentAssets.map((asset) => [asset.id, asset.amountCents]),
                ),
                incomeAmountsCents: {},
                monthlySavingsCents: 0,
                liabilityPaymentsCents: {},
              })
            }
          >
            Ajouter un mois
          </button>
        </div>
      </EditorDisclosure>
    </>
  );
}
