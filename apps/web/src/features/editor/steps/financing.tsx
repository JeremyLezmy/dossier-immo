import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { ArrayCard, Field, MoneyField, RateField, SectionIntro, TextField } from "../../../components/fields";
import { CheckboxField, TextareaField } from "./shared";

function ScenarioCard({ form, index, onRemove }: { readonly form: UseFormReturn<Dossier>; readonly index: number; readonly onRemove: () => void }) {
  const components = useFieldArray({ control: form.control, name: `financingScenarios.${index}.additionalLoanComponents` });
  const scenarios = form.watch("financingScenarios");
  return <ArrayCard title={form.watch(`financingScenarios.${index}.label`) || `Scénario ${index + 1}`} onRemove={scenarios.length > 1 ? onRemove : undefined}>
    <TextField label="Libellé" name={`financingScenarios.${index}.label`} register={form.register} />
    <MoneyField label="Prix du scénario" name={`financingScenarios.${index}.priceOverrideCents`} control={form.control} optional help="Laissez vide pour utiliser le prix cible du projet." />
    <MoneyField label="Apport du scénario" name={`financingScenarios.${index}.contributionOverrideCents`} control={form.control} optional help="Laissez vide pour utiliser l'apport central du projet." />
    <RateField label="Taux nominal" name={`financingScenarios.${index}.annualRateBasisPoints`} control={form.control} />
    <TextField label="Durée (mois)" name={`financingScenarios.${index}.durationMonths`} register={form.register} type="number" hint="300 mois = 25 ans." />
    <RateField label="Assurance annuelle" name={`financingScenarios.${index}.insuranceAnnualBasisPoints`} control={form.control} help="Taux annuel rapporté au capital initial, utilisé pour l'estimation mensuelle." />
    <RateField label="Négociation sur le prix" name={`financingScenarios.${index}.negotiationBasisPoints`} control={form.control} help="Hypothèse de réduction du prix vendeur. 3 % = 300 points de base." />
    <Field label="Scénario principal" controlId={`scenario-highlighted-${index}`} help="Un seul scénario est mis en avant dans le PDF."><input id={`scenario-highlighted-${index}`} type="radio" checked={form.watch(`financingScenarios.${index}.highlighted`)} onChange={() => scenarios.forEach((_, scenarioIndex) => form.setValue(`financingScenarios.${scenarioIndex}.highlighted`, scenarioIndex === index, { shouldValidate: true }))} /></Field>
    <CheckboxField label="Afficher dans le tableau principal" name={`financingScenarios.${index}.displayInMainTable`} register={form.register} />
    <TextareaField label="Note" name={`financingScenarios.${index}.note`} register={form.register} />
    <div className="field--wide"><h4>Prêts complémentaires</h4>{components.fields.map((component, componentIndex) => <div className="nested-card" key={component.id}><div className="form-grid"><TextField label="Libellé" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.label`} register={form.register} /><MoneyField label="Montant" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.amountCents`} control={form.control} /><RateField label="Taux annuel" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.annualRateBasisPoints`} control={form.control} /><TextField label="Durée (mois)" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.durationMonths`} register={form.register} type="number" /><TextField label="Différé (mois)" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.deferredMonths`} register={form.register} type="number" /><button type="button" className="button button--ghost button--danger" onClick={() => components.remove(componentIndex)}>Supprimer le prêt</button></div></div>)}<button type="button" className="button button--ghost" onClick={() => components.append({ id: `loan-${crypto.randomUUID().slice(0, 8)}`, label: "Prêt complémentaire", amountCents: 0, annualRateBasisPoints: 0, durationMonths: 240, deferredMonths: 0 })}>Ajouter un prêt complémentaire</button></div>
  </ArrayCard>;
}

export function FinancingStep({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const scenarios = useFieldArray({ control: form.control, name: "financingScenarios" });
  return <><SectionIntro title="Scénarios de financement" description="Comparez prix, apport, taux, durée et éventuels prêts complémentaires. Les budgets central et stress peuvent chacun référencer un scénario précis." />
    <div className="stack">{scenarios.fields.map((scenario, index) => <ScenarioCard key={scenario.id} form={form} index={index} onRemove={() => scenarios.remove(index)} />)}</div><button type="button" className="button button--secondary" onClick={() => scenarios.append({ id: `scenario-${crypto.randomUUID().slice(0, 8)}`, label: "Nouveau scénario", annualRateBasisPoints: 0, durationMonths: 300, insuranceAnnualBasisPoints: 0, negotiationBasisPoints: 0, additionalLoanComponents: [], highlighted: false, displayInMainTable: true })}>Ajouter un scénario</button>
  </>;
}
