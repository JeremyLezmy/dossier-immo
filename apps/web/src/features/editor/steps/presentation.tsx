import { useFieldArray, type FieldPath, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { ArrayCard, SectionIntro, SelectField, TextField } from "../../../components/fields";
import { CheckboxField, RichTextField } from "./shared";

const path = (value: string) => value as FieldPath<Dossier>;
type SectionKey = keyof Dossier["presentation"]["sections"];

const themePresets = [
  {
    id: "banking-clean",
    name: "Banque claire",
    description: "Bleu bancaire, cartes nettes et typographie sans serif.",
    colors: {
      navy: "#17324d",
      blue: "#1f77b4",
      green: "#2f855a",
      gold: "#b7791f",
      muted: "#667085",
    },
  },
  {
    id: "heritage",
    name: "Héritage discret",
    description: "Ivoire, bleu encre et bronze pour un rendu patrimonial classique.",
    colors: {
      navy: "#243954",
      blue: "#496a89",
      green: "#526f5a",
      gold: "#a77b35",
      muted: "#716b63",
    },
  },
  {
    id: "sage",
    name: "Sauge patrimoniale",
    description: "Palette calme et contemporaine, verte sans connotation écologique.",
    colors: {
      navy: "#315e52",
      blue: "#527d79",
      green: "#3f7d5b",
      gold: "#b78a42",
      muted: "#68766f",
    },
  },
  {
    id: "slate",
    name: "Ardoise analytique",
    description: "Tons acier, angles nets et hiérarchie rationnelle pour un rendu technique.",
    colors: {
      navy: "#2d4357",
      blue: "#4e7895",
      green: "#527767",
      gold: "#a77838",
      muted: "#627181",
    },
  },
  {
    id: "editorial",
    name: "Éditorial ivoire",
    description: "Titres serif, corps sans serif et accents cuivre pour un rendu premium.",
    colors: {
      navy: "#343c46",
      blue: "#627688",
      green: "#607662",
      gold: "#a96f4b",
      muted: "#786f68",
    },
  },
  {
    id: "monochrome",
    name: "Monochrome institutionnel",
    description: "Noir, blanc et gris hiérarchisés, optimisés pour l'impression.",
    colors: {
      navy: "#202020",
      blue: "#4a4a4a",
      green: "#555555",
      gold: "#777777",
      muted: "#666666",
    },
  },
  {
    id: "burgundy",
    name: "Bordeaux privé",
    description: "Bordeaux sombre, bleu encre et laiton pour un dossier de conseil privé.",
    colors: {
      navy: "#29384b",
      blue: "#7a3048",
      green: "#55715c",
      gold: "#b28a52",
      muted: "#75686d",
    },
  },
] as const satisfies readonly {
  id: Dossier["presentation"]["theme"];
  name: string;
  description: string;
  colors: Dossier["presentation"]["colors"];
}[];

const sections: readonly {
  key: SectionKey;
  title: string;
  description: string;
  mainField?: FieldPath<Dossier>;
  mainLabel?: string;
}[] = [
  {
    key: "cover",
    title: "Couverture",
    description: "Contexte, lecture de synthèse et plan du dossier.",
  },
  {
    key: "presentationLetter",
    title: "Lettre de présentation",
    description: "Lettre complète adressée à la banque ou au courtier.",
    mainField: "editorial.presentationLetter",
    mainLabel: "Corps de la lettre",
  },
  {
    key: "household",
    title: "Synthèse du foyer",
    description: "Texte complémentaire aux données structurées du foyer.",
    mainField: "editorial.householdSummary",
    mainLabel: "Encadré de synthèse",
  },
  {
    key: "income",
    title: "Revenus retenus",
    description: "Convention de revenu, impôt estimé et assurance.",
  },
  {
    key: "riskManagement",
    title: "Stabilité et maîtrise du risque",
    description: "Conclusion qui accompagne les six facteurs de solidité.",
  },
  {
    key: "assets",
    title: "Patrimoine et apport",
    description: "Lecture bancaire du patrimoine ventilé par titulaire.",
  },
  {
    key: "cashReserve",
    title: "Trésorerie conservée",
    description: "Convention et règle d'affectation du surplus.",
    mainField: "editorial.reserveStrategy",
    mainLabel: "Convention de réserve",
  },
  {
    key: "project",
    title: "Projet immobilier",
    description: "Compléments éditoriaux aux critères structurés du bien.",
  },
  {
    key: "financing",
    title: "Scénarios de financement",
    description: "Hypothèses de calcul et lecture des ratios.",
  },
  {
    key: "sankey",
    title: "Flux budgétaires",
    description: "Texte d'accompagnement du diagramme Sankey.",
  },
  {
    key: "postPurchaseBudget",
    title: "Budget post-achat",
    description: "Lecture de la comparaison central / stress.",
  },
  {
    key: "supportingDocuments",
    title: "Pièces justificatives",
    description: "Introduction et conclusion de la liste de suivi.",
  },
  {
    key: "independentIncomeAnnex",
    title: "Annexes des revenus indépendants",
    description: "Présentation nominative et graphique des historiques par emprunteur.",
  },
];

export function PresentationStep({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const strengths = useFieldArray({
    control: form.control,
    name: "editorial.professionalStabilityItems",
  });
  return (
    <>
      <SectionIntro
        title="Textes et présentation"
        description="Chaque contenu est rattaché une seule fois à une section métier. L'ordre et le nombre de pages peuvent évoluer sans casser cette structure."
        help="La barre de mise en forme permet le gras, l'italique, les listes, la taille et la police sans saisir de Markdown."
      />
      <details className="editor-subsection" open>
        <summary>
          <div>
            <strong>Paramètres du document</strong>
            <span>Titre, état, pied de page et densité</span>
          </div>
        </summary>
        <div className="editor-subsection__content form-grid">
          <TextField label="Titre interne du dossier" name="metadata.title" register={form.register} wide />
          <SelectField
            label="État du document"
            name="metadata.documentStage"
            register={form.register}
            options={[
              ["draft", "Brouillon"],
              ["review", "En relecture"],
              ["ready-for-submission", "Prêt à transmettre"],
              ["submitted", "Transmis"],
              ["archived", "Archivé"],
            ]}
          />
          <TextField label="Ville d'édition" name="metadata.editionCity" register={form.register} help="Utilisée dans l'en-tête de la lettre." />
          <TextField label="Titre du PDF" name="presentation.title" register={form.register} wide />
          <TextField label="Sous-titre" name="presentation.subtitle" register={form.register} wide />
          <TextField label="Pied de page" name="presentation.footer" register={form.register} wide />
          <SelectField
            label="Densité"
            name="presentation.density"
            register={form.register}
            options={[
              ["comfortable", "Confortable"],
              ["compact", "Compacte"],
            ]}
          />
        </div>
      </details>

      <details className="editor-subsection">
        <summary>
          <div>
            <strong>Thème visuel</strong>
            <span>Également modifiable en direct depuis l'aperçu</span>
          </div>
        </summary>
        <div className="editor-subsection__content">
          <div className="theme-picker" role="radiogroup" aria-label="Thème du PDF">
            {themePresets.map((theme) => {
              const selected = form.watch("presentation.theme") === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`theme-card ${selected ? "theme-card--selected" : ""}`}
                  onClick={() => applyTheme(form, theme)}
                >
                  <span className="theme-card__swatches">
                    {Object.values(theme.colors)
                      .slice(0, 4)
                      .map((color) => (
                        <i key={color} style={{ background: color }} />
                      ))}
                  </span>
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                </button>
              );
            })}
          </div>
        </div>
      </details>

      <div className="text-section-list">
        {sections.map((section) => (
          <details className="editor-subsection text-section" key={section.key}>
            <summary>
              <div>
                <strong>{section.title}</strong>
                <span>{section.description}</span>
              </div>
              <CheckboxField label="Inclure" name={path(`presentation.sections.${section.key}`)} register={form.register} />
            </summary>
            <div className="editor-subsection__content form-grid">
              {section.key === "cover" && (
                <>
                  <TextField label="Titre de couverture" name="presentation.title" register={form.register} wide />
                  <TextField label="Sous-titre de couverture" name="presentation.subtitle" register={form.register} wide />
                </>
              )}
              {section.mainField && (
                <RichTextField
                  label={section.mainLabel ?? "Texte principal"}
                  name={section.mainField}
                  control={form.control}
                  destination={section.title}
                />
              )}
              {section.key !== "presentationLetter" && (
                <>
                  <RichTextField
                    label="Introduction"
                    name={path(`editorial.sectionSlots.${section.key}.introduction`)}
                    control={form.control}
                    destination={section.title}
                  />
                  <RichTextField
                    label="Encadré de mise en avant"
                    name={path(`editorial.sectionSlots.${section.key}.callout`)}
                    control={form.control}
                    destination={section.title}
                  />
                  <RichTextField
                    label="Conclusion"
                    name={path(`editorial.sectionSlots.${section.key}.conclusion`)}
                    control={form.control}
                    destination={section.title}
                  />
                </>
              )}
              {section.key === "riskManagement" && (
                <div className="field--wide">
                  <h4>Six facteurs de stabilité</h4>
                  <div className="stack">
                    {strengths.fields.map((strength, index) => (
                      <ArrayCard
                        key={strength.id}
                        title={form.watch(`editorial.professionalStabilityItems.${index}.title`) || `Facteur ${index + 1}`}
                        onRemove={() => strengths.remove(index)}
                      >
                        <TextField label="Titre" name={`editorial.professionalStabilityItems.${index}.title`} register={form.register} />
                        <RichTextField label="Argument factuel" name={`editorial.professionalStabilityItems.${index}.body`} control={form.control} />
                      </ArrayCard>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() =>
                      strengths.append({
                        id: `strength-${crypto.randomUUID().slice(0, 8)}`,
                        title: "",
                        body: "",
                      })
                    }
                  >
                    Ajouter un facteur
                  </button>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

export const previewThemes = themePresets;

export function applyTheme(form: UseFormReturn<Dossier>, theme: (typeof themePresets)[number]) {
  form.setValue("presentation.theme", theme.id, {
    shouldDirty: true,
    shouldValidate: true,
  });
  form.setValue("presentation.colors", structuredClone(theme.colors), {
    shouldDirty: true,
    shouldValidate: true,
  });
}
