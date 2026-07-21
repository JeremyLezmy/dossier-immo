import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { ArrayCard, DurationField, Field, MoneyField, RateField, SectionIntro, TextField } from "../../../components/fields";
import { EditorDisclosure } from "../../../components/EditorDisclosure";
import { CheckboxField, TextareaField } from "./shared";

function ScenarioCard({ form, index, onRemove, onDuplicate }: { readonly form: UseFormReturn<Dossier>; readonly index: number; readonly onRemove: () => void; readonly onDuplicate: () => void }) {
  const components = useFieldArray({ control: form.control, name: `financingScenarios.${index}.additionalLoanComponents` });
  const scenarios = form.watch("financingScenarios");
  return <ArrayCard disclosureId={`scenario-${form.watch(`financingScenarios.${index}.id`)}`} title={form.watch(`financingScenarios.${index}.label`) || `Scénario ${index + 1}`} actions={<button type="button" className="button button--secondary" onClick={onDuplicate}>Dupliquer ce scénario</button>} onRemove={scenarios.length > 1 ? onRemove : undefined}>
    <TextField label="Libellé" name={`financingScenarios.${index}.label`} register={form.register} />
    <MoneyField label="Prix du scénario" name={`financingScenarios.${index}.priceOverrideCents`} control={form.control} optional help="Laissez vide pour utiliser le prix cible du projet." />
    <MoneyField label="Apport du scénario" name={`financingScenarios.${index}.contributionOverrideCents`} control={form.control} optional help="Laissez vide pour utiliser l'apport central du projet." />
    <RateField label="Taux nominal" name={`financingScenarios.${index}.annualRateBasisPoints`} control={form.control} />
    <DurationField label="Durée d’amortissement" name={`financingScenarios.${index}.durationMonths`} control={form.control} hint="Choisissez années ou mois ; le dossier conserve la valeur en mois." />
    <RateField label="Assurance annuelle" name={`financingScenarios.${index}.insuranceAnnualBasisPoints`} control={form.control} help="Estimation indicative : taux annuel appliqué au capital initial total, avec une mensualité d’assurance constante." />
    <RateField label="Négociation sur le prix" name={`financingScenarios.${index}.negotiationBasisPoints`} control={form.control} help="Hypothèse de réduction du prix vendeur. 3 % = 300 points de base." />
    <Field label="Scénario principal" controlId={`scenario-highlighted-${index}`} help="Un seul scénario est mis en avant dans le PDF."><input id={`scenario-highlighted-${index}`} type="radio" checked={form.watch(`financingScenarios.${index}.highlighted`)} onChange={() => scenarios.forEach((_, scenarioIndex) => form.setValue(`financingScenarios.${scenarioIndex}.highlighted`, scenarioIndex === index, { shouldValidate: true }))} /></Field>
    <CheckboxField label="Afficher dans le tableau principal" name={`financingScenarios.${index}.displayInMainTable`} register={form.register} />
    <TextareaField label="Note" name={`financingScenarios.${index}.note`} register={form.register} />
    <div className="field--wide"><h4>Composition du financement</h4><p className="section-note">Chaque prêt complémentaire remplace la même part du prêt principal. Sa durée correspond à l’amortissement effectif ; le différé est une période préalable. Pendant le différé, une tranche à taux zéro ne génère aucun paiement hors assurance et une tranche à taux positif ne paie que ses intérêts. Ces estimations restent à confirmer par la banque ou le courtier.</p>{components.fields.map((component, componentIndex) => <EditorDisclosure disclosureId={`loan-${form.watch(`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.id`)}`} className="nested-card nested-card--collapsible" key={component.id}><summary><strong>{form.watch(`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.label`) || `Prêt complémentaire ${componentIndex + 1}`}</strong></summary><div className="form-grid"><TextField label="Libellé" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.label`} register={form.register} /><MoneyField label="Montant" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.amountCents`} control={form.control} /><RateField label="Taux nominal" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.annualRateBasisPoints`} control={form.control} /><DurationField label="Durée d’amortissement" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.durationMonths`} control={form.control} hint="La période de différé s’ajoute à cette durée." /><DurationField label="Différé avant amortissement" name={`financingScenarios.${index}.additionalLoanComponents.${componentIndex}.deferredMonths`} control={form.control} allowZero hint="À taux zéro : aucun paiement hors assurance. À taux positif : intérêts seuls." /><button type="button" className="button button--ghost button--danger" onClick={() => components.remove(componentIndex)}>Supprimer le prêt</button></div></EditorDisclosure>)}<button type="button" className="button button--ghost" onClick={() => components.append({ id: `loan-${crypto.randomUUID().slice(0, 8)}`, label: "Prêt complémentaire", amountCents: 0, annualRateBasisPoints: 0, durationMonths: 240, deferredMonths: 0 })}>Ajouter un prêt complémentaire</button></div>
  </ArrayCard>;
}

export function FinancingStep({ form }: { readonly form: UseFormReturn<Dossier> }) {
  const scenarios = useFieldArray({ control: form.control, name: "financingScenarios" });
  const duplicateScenario = (index: number) => {
    const source = structuredClone(form.getValues(`financingScenarios.${index}`));
    const suffix = crypto.randomUUID().slice(0, 8);
    scenarios.append({
      ...source,
      id: `scenario-${suffix}`,
      label: `${source.label} — copie`,
      highlighted: false,
      additionalLoanComponents: source.additionalLoanComponents.map((component) => ({
        ...component,
        id: `loan-${crypto.randomUUID().slice(0, 8)}`,
      })),
    });
  };
  return <><SectionIntro title="Scénarios de financement" description="Comparez prix, apport, taux, durée et composition du financement. Les durées peuvent être saisies en années ou en mois ; les budgets utilisent la mensualité maximale estimée." />
    <div className="stack">{scenarios.fields.map((scenario, index) => <ScenarioCard key={scenario.id} form={form} index={index} onDuplicate={() => duplicateScenario(index)} onRemove={() => scenarios.remove(index)} />)}</div><button type="button" className="button button--secondary" onClick={() => scenarios.append({ id: `scenario-${crypto.randomUUID().slice(0, 8)}`, label: "Nouveau scénario", annualRateBasisPoints: 0, durationMonths: 300, insuranceAnnualBasisPoints: 0, negotiationBasisPoints: 0, additionalLoanComponents: [], highlighted: false, displayInMainTable: true })}>Ajouter un scénario</button>
  </>;
}
