import { useFieldArray, type FieldPath, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { ArrayCard, Field, MoneyField, SectionIntro, SelectField, TextField } from "../../../components/fields";
import { CheckboxField, ReferenceSelect, TextareaField, euro } from "./shared";

const path = (value: string) => value as FieldPath<Dossier>;

function BudgetAssumptions({ form, index, title }: { readonly form: UseFormReturn<Dossier>; readonly index: number; readonly title: string }) {
  const scenarios = form.watch("financingScenarios").map((scenario) => ({ value: scenario.id, label: scenario.label || scenario.id }));
  return <section className="budget-assumptions"><h4>{title}</h4><div className="form-grid"><MoneyField label="Revenu foyer après IR" name={path(`budgetScenarios.${index}.assumptions.afterTaxIncomeCents`)} control={form.control} optional help="Laissez vide pour utiliser l'hypothèse globale. Pour un stress test de revenus, saisissez explicitement le revenu stressé." /><ReferenceSelect label="Scénario de financement" name={path(`budgetScenarios.${index}.assumptions.financingScenarioId`)} register={form.register} options={scenarios} optional help="Permet au stress test d'utiliser un taux ou une mensualité différente." /><TextareaField label="Hypothèses et justification" name={path(`budgetScenarios.${index}.assumptions.note`)} register={form.register} /></div></section>;
}

function PairedBudgets({ form, centralIndex, stressIndex }: { readonly form: UseFormReturn<Dossier>; readonly centralIndex: number; readonly stressIndex: number }) {
  const centralItems = useFieldArray({ control: form.control, name: `budgetScenarios.${centralIndex}.items` });
  const stressItems = useFieldArray({ control: form.control, name: `budgetScenarios.${stressIndex}.items` });
  const centralValues = form.watch(`budgetScenarios.${centralIndex}.items`);
  const stressValues = form.watch(`budgetScenarios.${stressIndex}.items`);
  const stressBySource = new Map(stressValues.map((item, index) => [item.sourceItemId, { item, index }]));
  const duplicateAsStress = () => {
    if (!window.confirm("Remplacer le budget stress actuel par une copie du budget central ? Vous pourrez ensuite modifier les montants stressés.")) return;
    stressItems.replace(centralValues.map((item) => ({ ...structuredClone(item), id: `stress-${item.id}`, sourceItemId: item.id })));
    form.setValue(`budgetScenarios.${stressIndex}.label`, "Prudent / stress", { shouldDirty: true });
    form.setValue(`budgetScenarios.${stressIndex}.assumptions`, { ...structuredClone(form.getValues(`budgetScenarios.${centralIndex}.assumptions`)), note: "Copie du budget central à ajuster : documenter les écarts retenus." }, { shouldDirty: true, shouldValidate: true });
  };
  const addItem = () => {
    const semanticId = `budget-item-${crypto.randomUUID().slice(0, 8)}`;
    centralItems.append({ id: semanticId, label: "Nouveau poste", group: "other", amountCents: 0, showInSankey: true, adjustable: true });
    stressItems.append({ id: `stress-${semanticId}`, sourceItemId: semanticId, label: "Nouveau poste", group: "other", amountCents: 0, showInSankey: true, adjustable: true });
  };
  const removeItem = (centralItemId: string, centralItemIndex: number) => {
    const stressMatch = stressBySource.get(centralItemId);
    centralItems.remove(centralItemIndex);
    if (stressMatch) stressItems.remove(stressMatch.index);
  };
  return <>
    <div className="budget-header-grid"><div><TextField label="Nom du budget central" name={path(`budgetScenarios.${centralIndex}.label`)} register={form.register} /></div><div><TextField label="Nom du stress test" name={path(`budgetScenarios.${stressIndex}.label`)} register={form.register} /></div></div>
    <div className="budget-assumptions-grid"><BudgetAssumptions form={form} index={centralIndex} title="Hypothèses centrales" /><BudgetAssumptions form={form} index={stressIndex} title="Hypothèses du stress test" /></div>
    <div className="budget-toolbar"><button type="button" className="button button--secondary" onClick={duplicateAsStress}>Dupliquer le central comme stress test</button><p>La duplication est un point de départ explicite. Les écarts restent visibles ligne par ligne.</p></div>
    <div className="budget-comparison" aria-label="Comparaison budget central et stress"><div className="budget-comparison__header"><span>Poste budgétaire</span><span>Central</span><span>Stress test</span><span>Écart</span><span>Réglages</span></div>{centralItems.fields.map((field, itemIndex) => {
      const centralItem = centralValues[itemIndex]!;
      const stressMatch = stressBySource.get(centralItem.id);
      const stressIndexForItem = stressMatch?.index;
      const stressAmount = stressMatch?.item.amountCents;
      const difference = stressAmount == null ? undefined : stressAmount - centralItem.amountCents;
      return <details className="budget-comparison__item" key={field.id}><summary><span><strong>{centralItem.label}</strong><small>{centralItem.group}</small></span><b>{euro(centralItem.amountCents)}</b><b>{stressAmount == null ? "—" : euro(stressAmount)}</b><span className={`budget-delta ${difference && difference !== 0 ? "budget-delta--changed" : ""}`}>{difference == null ? "À relier" : difference === 0 ? "Inchangé" : `${difference > 0 ? "+" : ""}${euro(difference)}`}</span><em>Modifier</em></summary><div className="budget-comparison__editor"><TextField label="Libellé" name={path(`budgetScenarios.${centralIndex}.items.${itemIndex}.label`)} register={form.register} /><SelectField label="Groupe" name={path(`budgetScenarios.${centralIndex}.items.${itemIndex}.group`)} register={form.register} options={[["housing", "Logement"], ["living", "Vie quotidienne"], ["transport", "Transport"], ["family", "Famille"], ["leisure", "Loisirs"], ["tax", "Impôts / taxes"], ["savings", "Épargne"], ["other", "Autre"]]} /><TextField label="Libellé court du Sankey" name={path(`budgetScenarios.${centralIndex}.items.${itemIndex}.sankeyLabel`)} register={form.register} help="Libellé concis utilisé uniquement dans le graphique." /><MoneyField label="Montant central" name={path(`budgetScenarios.${centralIndex}.items.${itemIndex}.amountCents`)} control={form.control} />{stressIndexForItem != null ? <MoneyField label="Montant stress" name={path(`budgetScenarios.${stressIndex}.items.${stressIndexForItem}.amountCents`)} control={form.control} /> : <div className="missing-pair">Poste stress manquant</div>}<div className="budget-row-options"><CheckboxField label="Afficher dans le Sankey" name={path(`budgetScenarios.${centralIndex}.items.${itemIndex}.showInSankey`)} register={form.register} /><CheckboxField label="Dépense ajustable" name={path(`budgetScenarios.${centralIndex}.items.${itemIndex}.adjustable`)} register={form.register} /></div><button type="button" className="button button--ghost button--danger" onClick={() => removeItem(centralItem.id, itemIndex)}>Supprimer ce poste</button></div></details>;
    })}</div><button type="button" className="button button--ghost" onClick={addItem}>Ajouter un poste aux deux scénarios</button>
  </>;
}

function StandaloneBudget({ form, index, onRemove }: { readonly form: UseFormReturn<Dossier>; readonly index: number; readonly onRemove: () => void }) {
  const items = useFieldArray({ control: form.control, name: `budgetScenarios.${index}.items` });
  return <ArrayCard title={form.watch(`budgetScenarios.${index}.label`) || "Budget complémentaire"} onRemove={onRemove}><TextField label="Libellé" name={path(`budgetScenarios.${index}.label`)} register={form.register} /><SelectField label="Type" name={path(`budgetScenarios.${index}.kind`)} register={form.register} options={[["current", "Budget actuel"], ["custom", "Personnalisé"]]} /><BudgetAssumptions form={form} index={index} title="Hypothèses" /><div className="field--wide nested-list">{items.fields.map((item, itemIndex) => <div className="budget-row" key={item.id}><TextField label="Poste" name={path(`budgetScenarios.${index}.items.${itemIndex}.label`)} register={form.register} /><MoneyField label="Montant mensuel" name={path(`budgetScenarios.${index}.items.${itemIndex}.amountCents`)} control={form.control} /><SelectField label="Groupe" name={path(`budgetScenarios.${index}.items.${itemIndex}.group`)} register={form.register} options={[["housing", "Logement"], ["living", "Vie quotidienne"], ["transport", "Transport"], ["family", "Famille"], ["leisure", "Loisirs"], ["tax", "Impôts"], ["savings", "Épargne"], ["other", "Autre"]]} /><button type="button" className="icon-button" aria-label="Supprimer le poste" onClick={() => items.remove(itemIndex)}>×</button></div>)}</div><button type="button" className="button button--ghost" onClick={() => items.append({ id: `item-${crypto.randomUUID().slice(0, 8)}`, label: "Nouveau poste", group: "other", amountCents: 0, showInSankey: false, adjustable: true })}>Ajouter un poste</button></ArrayCard>;
}

function StressCases({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const cases = useFieldArray({ control: form.control, name: "stressCases" });
  return <><h3>Stress tests complémentaires</h3><p className="section-note">Ces cas documentent des chocs de revenus, dépenses, taux ou situation familiale. Ils ne remplacent pas le budget stress comparatif.</p><div className="stack">{cases.fields.map((stressCase, index) => <ArrayCard key={stressCase.id} title={form.watch(`stressCases.${index}.label`) || `Stress test ${index + 1}`} onRemove={() => cases.remove(index)}><TextField label="Libellé" name={`stressCases.${index}.label`} register={form.register} /><TextareaField label="Description" name={`stressCases.${index}.description`} register={form.register} /><CheckboxField label="Actif" name={`stressCases.${index}.enabled`} register={form.register} /><TextareaField label="Conclusion / note" name={`stressCases.${index}.note`} register={form.register} /><Field label="Hypothèses structurées" wide><p className="section-note">Les hypothèses détaillées sont conservées dans le fichier et seront exposées dans une vue avancée ultérieure. La description ci-dessus doit rester compréhensible par un banquier.</p></Field></ArrayCard>)}</div><button type="button" className="button button--ghost" onClick={() => cases.append({ id: `stress-case-${crypto.randomUUID().slice(0, 8)}`, label: "Nouveau stress test", description: "Décrire le choc et sa justification.", enabled: true, assumptions: [{ id: `assumption-${crypto.randomUUID().slice(0, 8)}`, label: "Hypothèse", target: "budget", operation: "add", value: 0, unit: "cents" }] })}>Ajouter un stress test</button></>;
}

export function BudgetsStep({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const budgets = useFieldArray({ control: form.control, name: "budgetScenarios" });
  const values = form.watch("budgetScenarios");
  const centralIndex = values.findIndex((budget) => budget.kind === "central");
  const stressIndex = values.findIndex((budget) => budget.kind === "stress");
  const standalone = values.map((budget, index) => ({ budget, index })).filter(({ budget }) => !["central", "stress"].includes(budget.kind));
  return <><SectionIntro title="Budgets et stress test" description="Le tableau central / stress rend les écarts explicites. Revenus et financement peuvent également varier entre les deux scénarios." help="Le PDF compare exactement un budget central et un budget stress. Il n'existe plus de duplication silencieuse." />
    <div className="form-grid"><MoneyField label="Revenu foyer après IR — hypothèse globale" name="estimatedHouseholdAfterTaxIncomeCents" control={form.control} help="Valeur de repli. Chaque budget peut définir sa propre hypothèse en tête de tableau." /></div>
    {centralIndex >= 0 && stressIndex >= 0 ? <PairedBudgets form={form} centralIndex={centralIndex} stressIndex={stressIndex} /> : <div className="issue-panel"><h3>Budgets comparatifs incomplets</h3><p>Un budget central et un budget stress sont obligatoires.</p></div>}
    {standalone.length > 0 && <><h3>Budgets complémentaires</h3><div className="stack">{standalone.map(({ budget, index }) => <StandaloneBudget key={budget.id} form={form} index={index} onRemove={() => budgets.remove(index)} />)}</div></>}
    <button type="button" className="button button--secondary" onClick={() => budgets.append({ id: `budget-${crypto.randomUUID().slice(0, 8)}`, label: "Budget actuel", kind: "current", assumptions: { note: "" }, items: [{ id: `item-${crypto.randomUUID().slice(0, 8)}`, label: "Nouveau poste", group: "other", amountCents: 0, showInSankey: false, adjustable: true }] })}>Ajouter un budget actuel ou personnalisé</button>
    <StressCases form={form} />
  </>;
}
