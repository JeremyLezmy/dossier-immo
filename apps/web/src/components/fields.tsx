import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Controller, type Control, type FieldPath, type UseFormRegister } from "react-hook-form";
import { CircleHelp } from "lucide-react";
import type { Dossier, ValidationIssue } from "@dossier-immo/schema";
import { EditorDisclosure } from "./EditorDisclosure";

const ValidationIssuesContext = createContext<readonly ValidationIssue[]>([]);

export function ValidationIssuesProvider({
  issues,
  children,
}: {
  readonly issues: readonly ValidationIssue[];
  readonly children: React.ReactNode;
}) {
  return (
    <ValidationIssuesContext.Provider value={issues}>
      {children}
    </ValidationIssuesContext.Provider>
  );
}

export const fieldId = (name: string): string =>
  `field-${name.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

export function useFieldValidation(name: string): {
  readonly error?: string;
  readonly descriptionId?: string;
} {
  const issue = useContext(ValidationIssuesContext).find(
    (candidate) => candidate.path === name,
  );
  return issue
    ? { error: issue.message, descriptionId: `${fieldId(name)}-description` }
    : {};
}

interface Guidance {
  readonly help?: string | undefined;
  readonly example?: string | undefined;
  readonly destination?: string | undefined;
}

interface FieldProps extends Guidance {
  readonly label: string;
  readonly labelId?: string | undefined;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly children: React.ReactNode;
  readonly wide?: boolean | undefined;
  readonly controlId?: string | undefined;
  readonly descriptionId?: string | undefined;
}

function HelpTooltip({ label, help, example, destination }: { readonly label: string } & Guidance) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    readonly top: number;
    readonly left: number;
    readonly arrowLeft: number;
    readonly above: boolean;
  }>();
  const tooltipId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const updatePosition = useCallback(() => {
    if (!trigger.current || !bubble.current) return;
    const margin = 12;
    const gap = 8;
    const triggerRect = trigger.current.getBoundingClientRect();
    const bubbleRect = bubble.current.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - bubbleRect.width - margin,
      Math.max(
        margin,
        triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2,
      ),
    );
    const above =
      triggerRect.bottom + gap + bubbleRect.height >
        window.innerHeight - margin &&
      triggerRect.top - gap - bubbleRect.height >= margin;
    const top = above
      ? triggerRect.top - bubbleRect.height - gap
      : Math.min(
          window.innerHeight - bubbleRect.height - margin,
          triggerRect.bottom + gap,
        );
    setPosition({
      top: Math.max(margin, top),
      left,
      arrowLeft: Math.min(
        bubbleRect.width - 22,
        Math.max(12, triggerRect.left + triggerRect.width / 2 - left - 5),
      ),
      above,
    });
  }, []);
  useLayoutEffect(() => {
    if (!open) {
      setPosition(undefined);
      return;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);
  if (!help && !example && !destination) return null;
  return <span className="help-tooltip">
    <button ref={trigger} type="button" className="help-tooltip__trigger" aria-label={`Aide — ${label}`} aria-expanded={open} aria-describedby={open ? tooltipId : undefined} onClick={() => setOpen((value) => !value)} onBlur={() => setOpen(false)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}><CircleHelp size={15} /></button>
    {open && <span
      ref={bubble}
      className={`help-tooltip__bubble help-tooltip__bubble--anchored ${position?.above ? "help-tooltip__bubble--above" : ""}`}
      role="tooltip"
      id={tooltipId}
      style={position ? {
        top: position.top,
        left: position.left,
        "--tooltip-arrow-left": `${position.arrowLeft}px`,
      } as React.CSSProperties : { visibility: "hidden" }}
    >
      {help && <span>{help}</span>}
      {example && <span><strong>Exemple :</strong> {example}</span>}
      {destination && <span className="help-tooltip__destination">Apparaît dans : {destination}</span>}
    </span>}
  </span>;
}

export function Field({ label, labelId, hint, error, children, wide, controlId, descriptionId, help, example, destination }: FieldProps) {
  const generatedDescriptionId = useId();
  const resolvedDescriptionId = descriptionId ?? generatedDescriptionId;
  return <div className={`field ${wide ? "field--wide" : ""}`}>
    <div className="field__heading">{controlId ? <label className="field__label" htmlFor={controlId}>{label}</label> : <span className="field__label" id={labelId}>{label}</span>}<HelpTooltip label={label} help={help} example={example} destination={destination} /></div>
    {children}
    {(hint || error) && <div id={resolvedDescriptionId}>{hint && <small>{hint}</small>}{error && <small className="field__error">{error}</small>}</div>}
  </div>;
}

interface TextFieldProps extends Guidance {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly register: UseFormRegister<Dossier>;
  readonly type?: "text" | "date" | "number";
  readonly hint?: string | undefined;
  readonly wide?: boolean | undefined;
}

export function TextField({ label, name, register, type = "text", hint, wide, ...guidance }: TextFieldProps) {
  const id = fieldId(name);
  const validation = useFieldValidation(name);
  const describedBy = hint || validation.error ? `${id}-description` : undefined;
  return <Field label={label} hint={hint} error={validation.error} descriptionId={describedBy} wide={wide} controlId={id} {...guidance}><input id={id} type={type} aria-invalid={Boolean(validation.error)} aria-describedby={describedBy} {...register(name, type === "number" ? { valueAsNumber: true } : undefined)} /></Field>;
}

interface MoneyFieldProps extends Guidance {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly control: Control<Dossier>;
  readonly hint?: string | undefined;
  readonly optional?: boolean | undefined;
}

export function MoneyField({ label, name, control, hint, optional = false, ...guidance }: MoneyFieldProps) {
  const id = fieldId(name);
  const validation = useFieldValidation(name);
  const describedBy = hint || validation.error ? `${id}-description` : undefined;
  return <Controller name={name} control={control} render={({ field }) => <Field label={label} hint={hint} error={validation.error} descriptionId={describedBy} controlId={id} {...guidance}><div className="input-affix"><input id={id} type="number" min="0" step="1" aria-invalid={Boolean(validation.error)} aria-describedby={describedBy} value={field.value == null ? "" : Number(field.value) / 100} placeholder={optional ? "Non renseigné" : undefined} onChange={(event) => field.onChange(optional && event.target.value === "" ? undefined : Math.round(Number(event.target.value || 0) * 100))} onBlur={field.onBlur} /><span>€</span></div></Field>} />;
}

interface RateFieldProps extends Guidance {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly control: Control<Dossier>;
  readonly optional?: boolean | undefined;
}

export function RateField({ label, name, control, optional = false, ...guidance }: RateFieldProps) {
  const id = fieldId(name);
  const validation = useFieldValidation(name);
  const describedBy = validation.error ? `${id}-description` : undefined;
  return <Controller name={name} control={control} render={({ field }) => <Field label={label} error={validation.error} descriptionId={describedBy} controlId={id} {...guidance}><div className="input-affix"><input id={id} type="number" min="0" step="0.01" aria-invalid={Boolean(validation.error)} aria-describedby={describedBy} value={field.value == null ? "" : Number(field.value) / 100} placeholder={optional ? "Non renseigné" : undefined} onChange={(event) => field.onChange(optional && event.target.value === "" ? undefined : Math.round(Number(event.target.value || 0) * 100))} onBlur={field.onBlur} /><span>%</span></div></Field>} />;
}

export function SelectField({ label, name, register, options, ...guidance }: { readonly label: string; readonly name: FieldPath<Dossier>; readonly register: UseFormRegister<Dossier>; readonly options: readonly [string, string][] } & Guidance) {
  const id = fieldId(name);
  const validation = useFieldValidation(name);
  const describedBy = validation.error ? `${id}-description` : undefined;
  return <Field label={label} error={validation.error} descriptionId={describedBy} controlId={id} {...guidance}><select id={id} aria-invalid={Boolean(validation.error)} aria-describedby={describedBy} {...register(name)}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></Field>;
}

export function SectionIntro({ title, description, help }: { readonly title: string; readonly description: string; readonly help?: string | undefined }) {
  return <header className="section-intro"><div><p className="eyebrow">Données déclarées</p><div className="section-intro__title"><h2 tabIndex={-1}>{title}</h2>{help && <HelpTooltip label={title} help={help} />}</div><p>{description}</p></div></header>;
}

export function ArrayCard({ disclosureId, title, subtitle, children, onRemove, actions }: { readonly disclosureId: string; readonly title: string; readonly subtitle?: string | undefined; readonly children: React.ReactNode; readonly onRemove?: (() => void) | undefined; readonly actions?: React.ReactNode }) {
  return <EditorDisclosure disclosureId={`item-${disclosureId}`} className="array-card array-card--collapsible">
    <summary><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><span className="array-card__toggle" aria-hidden="true" /></summary>
    <div className="array-card__body">
      {(actions || onRemove) && <div className="array-card__actions">{actions}{onRemove && <button type="button" className="button button--ghost button--danger" aria-label={`Supprimer ${title}`} onClick={onRemove}>Supprimer</button>}</div>}
      <div className="form-grid">{children}</div>
    </div>
  </EditorDisclosure>;
}
