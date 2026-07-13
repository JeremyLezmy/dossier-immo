import { useId, useState } from "react";
import { Controller, type Control, type FieldPath, type UseFormRegister } from "react-hook-form";
import { CircleHelp } from "lucide-react";
import type { Dossier } from "@dossier-immo/schema";

interface Guidance {
  readonly help?: string | undefined;
  readonly example?: string | undefined;
  readonly destination?: string | undefined;
}

interface FieldProps extends Guidance {
  readonly label: string;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly children: React.ReactNode;
  readonly wide?: boolean | undefined;
  readonly controlId?: string | undefined;
}

function HelpTooltip({ label, help, example, destination }: { readonly label: string } & Guidance) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  if (!help && !example && !destination) return null;
  return <span className="help-tooltip">
    <button type="button" className="help-tooltip__trigger" aria-label={`Aide — ${label}`} aria-expanded={open} aria-describedby={open ? tooltipId : undefined} onClick={() => setOpen((value) => !value)} onBlur={() => setOpen(false)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}><CircleHelp size={15} /></button>
    {open && <span className="help-tooltip__bubble" role="tooltip" id={tooltipId}>
      {help && <span>{help}</span>}
      {example && <span><strong>Exemple :</strong> {example}</span>}
      {destination && <span className="help-tooltip__destination">Apparaît dans : {destination}</span>}
    </span>}
  </span>;
}

export function Field({ label, hint, error, children, wide, controlId, help, example, destination }: FieldProps) {
  const descriptionId = useId();
  return <div className={`field ${wide ? "field--wide" : ""}`}>
    <div className="field__heading">{controlId ? <label className="field__label" htmlFor={controlId}>{label}</label> : <span className="field__label">{label}</span>}<HelpTooltip label={label} help={help} example={example} destination={destination} /></div>
    {children}
    {(hint || error) && <div id={descriptionId}>{hint && <small>{hint}</small>}{error && <small className="field__error">{error}</small>}</div>}
  </div>;
}

const fieldId = (name: string): string => `field-${name.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

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
  return <Field label={label} hint={hint} wide={wide} controlId={id} {...guidance}><input id={id} type={type} {...register(name, type === "number" ? { valueAsNumber: true } : undefined)} /></Field>;
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
  return <Controller name={name} control={control} render={({ field }) => <Field label={label} hint={hint} controlId={id} {...guidance}><div className="input-affix"><input id={id} type="number" min="0" step="1" value={field.value == null ? "" : Number(field.value) / 100} placeholder={optional ? "Non renseigné" : undefined} onChange={(event) => field.onChange(optional && event.target.value === "" ? undefined : Math.round(Number(event.target.value || 0) * 100))} onBlur={field.onBlur} /><span>€</span></div></Field>} />;
}

interface RateFieldProps extends Guidance {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly control: Control<Dossier>;
  readonly optional?: boolean | undefined;
}

export function RateField({ label, name, control, optional = false, ...guidance }: RateFieldProps) {
  const id = fieldId(name);
  return <Controller name={name} control={control} render={({ field }) => <Field label={label} controlId={id} {...guidance}><div className="input-affix"><input id={id} type="number" min="0" step="0.01" value={field.value == null ? "" : Number(field.value) / 100} placeholder={optional ? "Non renseigné" : undefined} onChange={(event) => field.onChange(optional && event.target.value === "" ? undefined : Math.round(Number(event.target.value || 0) * 100))} onBlur={field.onBlur} /><span>%</span></div></Field>} />;
}

export function SelectField({ label, name, register, options, ...guidance }: { readonly label: string; readonly name: FieldPath<Dossier>; readonly register: UseFormRegister<Dossier>; readonly options: readonly [string, string][] } & Guidance) {
  const id = fieldId(name);
  return <Field label={label} controlId={id} {...guidance}><select id={id} {...register(name)}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></Field>;
}

export function SectionIntro({ title, description, help }: { readonly title: string; readonly description: string; readonly help?: string | undefined }) {
  return <header className="section-intro"><div><p className="eyebrow">Données déclarées</p><div className="section-intro__title"><h2>{title}</h2>{help && <HelpTooltip label={title} help={help} />}</div><p>{description}</p></div></header>;
}

export function ArrayCard({ title, subtitle, children, onRemove, actions }: { readonly title: string; readonly subtitle?: string | undefined; readonly children: React.ReactNode; readonly onRemove?: (() => void) | undefined; readonly actions?: React.ReactNode }) {
  return <article className="array-card"><header><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><div className="array-card__actions">{actions}{onRemove && <button type="button" className="button button--ghost button--danger" onClick={onRemove}>Supprimer</button>}</div></header><div className="form-grid">{children}</div></article>;
}
