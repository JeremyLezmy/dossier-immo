import { useEffect, useRef } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type UseFormRegister,
} from "react-hook-form";
import type { Dossier } from "@dossier-immo/schema";
import { Field } from "../../../components/fields";

const idFor = (name: string) =>
  `field-${name.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

export function TextareaField({
  label,
  name,
  register,
  rows = 3,
  wide = true,
  help,
  destination,
  example,
}: {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly register: UseFormRegister<Dossier>;
  readonly rows?: number;
  readonly wide?: boolean;
  readonly help?: string;
  readonly destination?: string;
  readonly example?: string;
}) {
  const id = idFor(name);
  return (
    <Field
      label={label}
      controlId={id}
      wide={wide}
      help={help}
      destination={destination}
      example={example}
    >
      <textarea id={id} rows={rows} {...register(name)} />
    </Field>
  );
}

export function RichTextField({
  label,
  name,
  control,
  help,
  destination,
  example,
}: {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly control: Control<Dossier>;
  readonly help?: string;
  readonly destination?: string;
  readonly example?: string;
}) {
  const id = idFor(name);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <RichTextEditor
          id={id}
          label={label}
          value={typeof field.value === "string" ? field.value : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          help={help}
          destination={destination}
          example={example}
        />
      )}
    />
  );
}

const RICH_TEXT_TAGS = new Set([
  "P", "DIV", "STRONG", "B", "EM", "I", "UL", "OL", "LI", "BR", "FONT", "SPAN",
]);
const RICH_TEXT_FONT_SIZES = new Set(["8px", "10px", "12px", "14px", "16px", "18px", "20px", "22px"]);

export function sanitizeRichTextValue(value: string): string {
  const template = document.createElement("template");
  template.innerHTML = value;

  const sanitizeChildren = (parent: ParentNode) => {
    Array.from(parent.childNodes).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      sanitizeChildren(node);
      if (!RICH_TEXT_TAGS.has(node.tagName)) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
      }

      const fontSize = node.tagName === "SPAN" ? node.style.fontSize : "";
      const fontSizeAttribute = node.tagName === "FONT" ? node.getAttribute("size") : null;
      Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name));
      if (node.tagName === "SPAN" && RICH_TEXT_FONT_SIZES.has(fontSize)) node.style.fontSize = fontSize;
      if (node.tagName === "FONT" && fontSizeAttribute && /^[1-7]$/.test(fontSizeAttribute)) node.setAttribute("size", fontSizeAttribute);
    });
  };

  sanitizeChildren(template.content);
  return template.innerHTML;
}

function RichTextEditor({
  id,
  label,
  value,
  onChange,
  onBlur,
  help,
  destination,
  example,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly help?: string | undefined;
  readonly destination?: string | undefined;
  readonly example?: string | undefined;
}) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sanitized = sanitizeRichTextValue(value);
    if (
      editor.current &&
      document.activeElement !== editor.current &&
      editor.current.innerHTML !== sanitized
    )
      editor.current.innerHTML = sanitized;
  }, [value]);
  const commitEditorValue = () => {
    if (!editor.current) return;
    const sanitized = sanitizeRichTextValue(editor.current.innerHTML);
    if (editor.current.innerHTML !== sanitized) editor.current.innerHTML = sanitized;
    onChange(sanitized);
  };
  const command = (name: string, commandValue?: string) => {
    editor.current?.focus();
    document.execCommand(name, false, commandValue);
    commitEditorValue();
  };
  const setFontSize = (size: string) => {
    editor.current?.focus();
    document.execCommand("fontSize", false, "7");
    editor.current?.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.replaceChildren(...Array.from(font.childNodes));
      font.replaceWith(span);
    });
    commitEditorValue();
  };
  return (
    <Field
      label={label}
      controlId={id}
      wide
      help={help}
      destination={destination}
      example={example}
    >
      <div className="rich-text">
        <div
          className="rich-text__toolbar"
          role="toolbar"
          aria-label={`Mise en forme — ${label}`}
        >
          <button
            type="button"
            aria-label="Gras"
            title="Gras"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command("bold")}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            aria-label="Italique"
            title="Italique"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command("italic")}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            aria-label="Liste à puces"
            title="Liste à puces"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command("insertUnorderedList")}
          >
            • Liste
          </button>
          <select
            aria-label="Taille du texte"
            defaultValue="12"
            onChange={(event) => setFontSize(event.target.value)}
          >
            {[8, 10, 12, 14, 16, 18, 20, 22].map((size) => (
              <option key={size} value={size}>
                {size} px
              </option>
            ))}
          </select>
        </div>
        <div
          id={id}
          ref={editor}
          className="rich-text__editor"
          contentEditable
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          data-placeholder="Saisissez votre texte…"
          onInput={commitEditorValue}
          onPaste={(event) => {
            event.preventDefault();
            const html = event.clipboardData.getData("text/html");
            document.execCommand(
              html ? "insertHTML" : "insertText",
              false,
              html ? sanitizeRichTextValue(html) : event.clipboardData.getData("text/plain"),
            );
            commitEditorValue();
          }}
          onDrop={(event) => {
            event.preventDefault();
            document.execCommand("insertText", false, event.dataTransfer.getData("text/plain"));
            commitEditorValue();
          }}
          onBlur={onBlur}
          suppressContentEditableWarning
        />
      </div>
    </Field>
  );
}

export function CheckboxField({
  label,
  name,
  register,
  help,
}: {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly register: UseFormRegister<Dossier>;
  readonly help?: string;
}) {
  const id = idFor(name);
  return (
    <Field label={label} controlId={id} help={help}>
      <input id={id} type="checkbox" {...register(name)} />
    </Field>
  );
}

export function ReferenceSelect({
  label,
  name,
  register,
  options,
  optional = false,
  help,
}: {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly register: UseFormRegister<Dossier>;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly optional?: boolean;
  readonly help?: string;
}) {
  const id = idFor(name);
  return (
    <Field label={label} controlId={id} help={help}>
      <select id={id} {...register(name)}>
        {optional && <option value="">Non renseigné</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function MultiReferenceSelect({
  label,
  name,
  control,
  options,
  help,
}: {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly control: Control<Dossier>;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly help?: string;
}) {
  const id = idFor(name);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selected = new Set(
          Array.isArray(field.value) ? field.value.map(String) : [],
        );
        return (
          <Field label={label} controlId={id} help={help}>
            <div
              id={id}
              className="reference-choice-group"
              role="group"
              aria-label={label}
            >
              {options.map((option) => (
                <label
                  key={option.value}
                  className={`reference-choice ${selected.has(option.value) ? "reference-choice--selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(option.value)}
                    onChange={(event) => {
                      const next = new Set(selected);
                      if (event.target.checked) next.add(option.value);
                      else next.delete(option.value);
                      field.onChange([...next]);
                    }}
                    onBlur={field.onBlur}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </Field>
        );
      }}
    />
  );
}

export function StringListField({
  label,
  name,
  control,
  help,
  wide = true,
}: {
  readonly label: string;
  readonly name: FieldPath<Dossier>;
  readonly control: Control<Dossier>;
  readonly help?: string;
  readonly wide?: boolean;
}) {
  const id = idFor(name);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field label={label} controlId={id} help={help} wide={wide}>
          <textarea
            id={id}
            rows={4}
            value={Array.isArray(field.value) ? field.value.join("\n") : ""}
            onChange={(event) =>
              field.onChange(
                event.target.value
                  .split(/\r?\n/)
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            }
            onBlur={field.onBlur}
          />
        </Field>
      )}
    />
  );
}

export const euro = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
