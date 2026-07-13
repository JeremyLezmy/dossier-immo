import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import {
  ArrayCard,
  MoneyField,
  RateField,
  SectionIntro,
  SelectField,
  TextField,
} from "../../../components/fields";
import { StringListField, TextareaField } from "./shared";

export function ProjectStep({
  form,
}: {
  readonly form: UseFormReturn<Dossier>;
}) {
  const criteria = useFieldArray({
    control: form.control,
    name: "project.criteria.additionalCriteria",
  });
  const allocations = useFieldArray({
    control: form.control,
    name: "reservePolicy.allocations",
  });
  return (
    <>
      <SectionIntro
        title="Projet immobilier"
        description="Définissez la fourchette de prix, la stratégie d'apport, la réserve et les critères du bien. Les hypothèses exceptionnelles restent séparées du scénario central."
        help="Ces valeurs alimentent la couverture, la page Projet, les scénarios de financement et le calcul de trésorerie après achat."
      />
      <details className="editor-subsection" open>
        <summary>
          <div>
            <strong>Cadrage financier</strong>
            <span>Prix, apport, frais, travaux et liquidités</span>
          </div>
        </summary>
        <div className="editor-subsection__content form-grid">
          <SelectField
            label="Type de projet"
            name="project.projectType"
            register={form.register}
            options={[
              ["primary-residence", "Résidence principale"],
              ["rental-investment", "Investissement locatif"],
              ["new-build", "Logement neuf"],
              ["construction", "Construction"],
              ["other", "Autre"],
            ]}
            help="Détermine le vocabulaire employé dans le PDF ; il ne modifie pas automatiquement la fiscalité."
          />
          <TextField
            label="Date cible d'achat"
            name="project.targetPurchaseDate"
            register={form.register}
            type="date"
            help="Date estimée de signature. Elle sert à projeter l'épargne et à déterminer quels crédits seront encore en cours."
          />
          <MoneyField
            label="Prix cible central"
            name="project.targetPriceCents"
            control={form.control}
            help="Prix du bien utilisé par défaut dans le scénario central, hors frais d'acquisition."
          />
          <MoneyField
            label="Prix minimal envisagé"
            name="project.minimumPriceCents"
            control={form.control}
            optional
            help="Borne basse réaliste de la recherche, affichée sur la couverture et la page Projet."
          />
          <MoneyField
            label="Plafond de confort"
            name="project.comfortableMaximumPriceCents"
            control={form.control}
            optional
            help="Borne haute compatible avec votre niveau de confort, distincte de la limite absolue."
          />
          <MoneyField
            label="Plafond exceptionnel"
            name="project.maximumPriceCents"
            control={form.control}
            help="Limite absolue, distincte du budget de confort et à justifier dans le dossier."
          />
          <MoneyField
            label="Apport central"
            name="project.contributionCents"
            control={form.control}
            help="Somme mobilisée dans le scénario principal. Elle est déduite des liquidités projetées pour calculer la réserve."
          />
          <MoneyField
            label="Installation minimale"
            name="project.installationCents"
            control={form.control}
            help="Dépenses immédiates hors prix du bien : déménagement, mobilier et premiers équipements."
          />
          <MoneyField
            label="Travaux intégrés"
            name="project.renovationCents"
            control={form.control}
            help="Travaux financés dans le coût global de l'opération, sans confondre l'entretien mensuel futur."
          />
          <RateField
            label="Frais d'acquisition"
            name="project.acquisitionFeeBasisPoints"
            control={form.control}
            help="Estimation en pourcentage du prix : par exemple 7,5 % pour 750 points de base."
          />
          <MoneyField
            label="Liquidités attendues à l'achat"
            name="project.expectedLiquidityAtPurchaseCents"
            control={form.control}
            optional
            help="Hypothèse explicite. Laissez vide pour laisser le moteur projeter les liquidités depuis l'épargne mensuelle."
          />
          <MoneyField
            label="Épargne mensuelle projetée"
            name="project.monthlySavingsProjectionCents"
            control={form.control}
            optional
            help="Montant ajouté chaque mois jusqu'à la date cible lorsque les liquidités attendues ne sont pas saisies explicitement."
          />
        </div>
      </details>
      <details className="editor-subsection">
        <summary>
          <div>
            <strong>Critères du bien</strong>
            <span>Surface, organisation, état et zones</span>
          </div>
        </summary>
        <div className="editor-subsection__content form-grid">
          <TextField
            label="Type de bien recherché"
            name="project.criteria.propertyType"
            register={form.register}
            wide
            help="Description bancaire courte du bien : maison ancienne rénovée, appartement récent, construction…"
          />
          <TextField
            label="Surface minimale (m²)"
            name="project.criteria.minimumSurfaceSquareMeters"
            register={form.register}
            type="number"
          />
          <TextField
            label="Surface idéale"
            name="project.criteria.idealSurfaceLabel"
            register={form.register}
          />
          <TextField
            label="Terrain minimal (m²)"
            name="project.criteria.minimumLandSquareMeters"
            register={form.register}
            type="number"
          />
          <TextField
            label="Terrain idéal"
            name="project.criteria.idealLandLabel"
            register={form.register}
          />
          <TextField
            label="Nombre minimal de chambres"
            name="project.criteria.minimumBedrooms"
            register={form.register}
            type="number"
          />
          <TextareaField
            label="Bureau / organisation"
            name="project.criteria.office"
            register={form.register}
          />
          <TextareaField
            label="Piscine / extérieur"
            name="project.criteria.pool"
            register={form.register}
          />
          <TextareaField
            label="DPE"
            name="project.criteria.energyRating"
            register={form.register}
          />
          <TextareaField
            label="Travaux"
            name="project.criteria.works"
            register={form.register}
          />
          <TextareaField
            label="Services"
            name="project.criteria.services"
            register={form.register}
          />
          <TextareaField
            label="Trajets"
            name="project.criteria.commute"
            register={form.register}
          />
          <StringListField
            label="Zones préférées (une par ligne)"
            name="project.criteria.preferredAreas"
            control={form.control}
            help="Chaque ligne devient une étiquette lisible dans la page Projet du PDF."
          />
          <StringListField
            label="Critères d'exclusion (un par ligne)"
            name="project.criteria.excludedFeatures"
            control={form.control}
            help="Défauts rédhibitoires servant à démontrer une recherche structurée et prudente."
          />
        </div>
      </details>
      <details className="editor-subsection">
        <summary>
          <div>
            <strong>Critères complémentaires</strong>
            <span>Exigences spécifiques et niveau d'importance</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <div className="stack">
            {criteria.fields.map((criterion, index) => (
              <ArrayCard
                key={criterion.id}
                title={
                  form.watch(
                    `project.criteria.additionalCriteria.${index}.label`,
                  ) || `Critère ${index + 1}`
                }
                onRemove={() => criteria.remove(index)}
              >
                <TextField
                  label="Critère"
                  name={`project.criteria.additionalCriteria.${index}.label`}
                  register={form.register}
                />
                <TextField
                  label="Valeur souhaitée"
                  name={`project.criteria.additionalCriteria.${index}.value`}
                  register={form.register}
                />
                <SelectField
                  label="Importance"
                  name={`project.criteria.additionalCriteria.${index}.importance`}
                  register={form.register}
                  options={[
                    ["required", "Indispensable"],
                    ["preferred", "Souhaité"],
                    ["optional", "Optionnel"],
                    ["excluded", "Exclu"],
                  ]}
                />
                <TextareaField
                  label="Note"
                  name={`project.criteria.additionalCriteria.${index}.note`}
                  register={form.register}
                />
              </ArrayCard>
            ))}
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              criteria.append({
                id: `criterion-${crypto.randomUUID().slice(0, 8)}`,
                label: "",
                value: "",
                importance: "preferred",
              })
            }
          >
            Ajouter un critère
          </button>
        </div>
      </details>
      <details className="editor-subsection">
        <summary>
          <div>
            <strong>Politique de réserve après achat</strong>
            <span>Seuil de sécurité et poches d'affectation</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <div className="form-grid">
            <MoneyField
              label="Réserve minimale"
              name="reservePolicy.minimumCents"
              control={form.control}
            />
            <MoneyField
              label="Réserve cible de confort"
              name="reservePolicy.targetCents"
              control={form.control}
            />
          </div>
          <div className="stack">
            {allocations.fields.map((allocation, index) => (
              <ArrayCard
                key={allocation.id}
                title={
                  form.watch(`reservePolicy.allocations.${index}.label`) ||
                  `Poche ${index + 1}`
                }
                onRemove={() => allocations.remove(index)}
              >
                <TextField
                  label="Poche"
                  name={`reservePolicy.allocations.${index}.label`}
                  register={form.register}
                />
                <MoneyField
                  label="Montant cible"
                  name={`reservePolicy.allocations.${index}.amountCents`}
                  control={form.control}
                />
                <TextareaField
                  label="But"
                  name={`reservePolicy.allocations.${index}.note`}
                  register={form.register}
                />
              </ArrayCard>
            ))}
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              allocations.append({
                id: `reserve-${crypto.randomUUID().slice(0, 8)}`,
                label: "",
                amountCents: 0,
              })
            }
          >
            Ajouter une poche de réserve
          </button>
        </div>
      </details>
    </>
  );
}
