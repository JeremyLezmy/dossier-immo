import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { calculateDossier } from "@dossier-immo/calculations";
import { renderBankDocument } from "@dossier-immo/document";
import {
  completeDemoDossier,
  createBlankDossier,
} from "@dossier-immo/fixtures";
import { validateDossier, type Dossier } from "@dossier-immo/schema";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePlus2,
  FolderOpen,
  LockKeyhole,
  PanelRightOpen,
  Save,
  X,
} from "lucide-react";
import {
  clearLocalDrafts,
  loadLatestDraft,
  saveDraft,
} from "../../persistence/database";
import {
  downloadPdfDocument,
  importDossierFile,
  saveDossierFile,
} from "../../persistence/files";
import {
  applyTheme,
  AssetsStep,
  BudgetsStep,
  DocumentsStep,
  editorSteps,
  FinancingStep,
  HelpStep,
  HouseholdStep,
  IncomeStep,
  LiabilitiesStep,
  OverviewStep,
  PresentationStep,
  previewThemes,
  ProjectStep,
  type StepId,
} from "./steps";

type SaveState = "idle" | "saving" | "saved" | "error";

export function Editor() {
  const form = useForm<Dossier>({
    defaultValues: structuredClone(completeDemoDossier),
    mode: "onChange",
  });
  const [currentStep, setCurrentStep] = useState<StepId>("help");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  const [floatingPreview, setFloatingPreview] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dossier = useWatch({ control: form.control }) as Dossier;
  const validation = useMemo(() => validateDossier(dossier), [dossier]);
  const derived = useMemo(
    () =>
      validation.success ? calculateDossier(validation.dossier) : undefined,
    [validation],
  );
  const documentHtml = useMemo(
    () =>
      validation.success && derived
        ? renderBankDocument(validation.dossier, derived)
        : undefined,
    [validation, derived],
  );
  const activeIndex = editorSteps.findIndex((step) => step.id === currentStep);

  useEffect(() => {
    void loadLatestDraft()
      .then((draft) => {
        if (draft) {
          form.reset(draft.dossier);
          setMessage("Brouillon local repris.");
        }
      })
      .catch(() => setMessage("Le brouillon local n'a pas pu être relu."))
      .finally(() => setHydrated(true));
  }, [form]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      void saveDraft(dossier)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [dossier, hydrated]);

  const resetTo = (next: Dossier, text: string) => {
    form.reset(structuredClone(next));
    setCurrentStep("overview");
    setMessage(text);
  };

  const openFile = async (file: File) => {
    try {
      const imported = await importDossierFile(file);
      resetTo(imported.dossier, "Dossier ouvert.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'ouvrir le dossier.",
      );
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const saveFile = async () => {
    if (!validation.success) {
      setMessage(
        "Corrigez les erreurs avant de créer une sauvegarde officielle.",
      );
      return;
    }
    try {
      await saveDossierFile(validation.dossier);
      setMessage("Sauvegarde locale créée.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Sauvegarde impossible.",
      );
    }
  };

  const downloadPdf = () => {
    if (!documentHtml) {
      setMessage("Le dossier doit être valide avant le téléchargement.");
      return;
    }
    setMessage("Génération du PDF en cours…");
    void downloadPdfDocument(documentHtml, `${dossier.metadata.dossierId}.pdf`)
      .then(() => setMessage("PDF téléchargé."))
      .catch((error) => {
        setMessage(
          error instanceof Error ? error.message : "Téléchargement impossible.",
        );
      });
  };

  const next = () =>
    setCurrentStep(
      editorSteps[Math.min(editorSteps.length - 1, activeIndex + 1)]?.id ??
        currentStep,
    );
  const previous = () =>
    setCurrentStep(
      editorSteps[Math.max(0, activeIndex - 1)]?.id ?? currentStep,
    );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">DI</div>
          <div>
            <strong>Dossier Immo</strong>
            <span>Pré-analyse bancaire locale</span>
          </div>
        </div>
        <div className="topbar__actions">
          <span className={`save-state save-state--${saveState}`}>
            {saveState === "saving"
              ? "Sauvegarde…"
              : saveState === "saved"
                ? "Brouillon local à jour"
                : saveState === "error"
                  ? "Autosauvegarde indisponible"
                  : "Brouillon local"}
          </span>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => setCurrentStep("help")}
          >
            <BookOpen size={17} /> Guide
          </button>
          <button
            className="button button--ghost"
            type="button"
            disabled={!documentHtml}
            onClick={() => setFloatingPreview((value) => !value)}
          >
            <PanelRightOpen size={17} /> Aperçu en direct
          </button>
          <button
            className="button button--ghost"
            type="button"
            title="Importer une configuration JSON"
            onClick={() => fileInput.current?.click()}
          >
            <FolderOpen size={17} /> Importer
          </button>
          <input
            ref={fileInput}
            aria-label="Importer un fichier Dossier Immo"
            className="visually-hidden"
            type="file"
            accept=".json,.dossier-immo.json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void openFile(file);
            }}
          />
          <button
            className="button button--secondary"
            type="button"
            title="Exporter la configuration JSON sur cet appareil"
            onClick={() => void saveFile()}
          >
            <Save size={17} /> Exporter la config
          </button>
          <button
            className="button button--primary"
            type="button"
            disabled={!documentHtml}
            onClick={downloadPdf}
          >
            <Download size={17} /> Télécharger le PDF
          </button>
        </div>
      </header>
      <aside className="sidebar">
        <nav aria-label="Étapes du dossier">
          {editorSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`step-link ${currentStep === step.id ? "step-link--active" : ""}`}
              onClick={() => setCurrentStep(step.id)}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{step.shortLabel}</strong>
                <small>{step.label}</small>
              </div>
              {currentStep === step.id && <ChevronRight size={16} />}
            </button>
          ))}
        </nav>
        <div className="sidebar__privacy">
          <LockKeyhole size={18} />
          <div>
            <strong>100 % local</strong>
            <span>Aucune donnée envoyée</span>
          </div>
        </div>
      </aside>
      <main
        className={`workspace ${currentStep === "preview" ? "workspace--preview" : ""}`}
      >
        {message && (
          <div className="message" role="status">
            <Check size={17} />
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage(undefined)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        )}
        <div className="workspace__content">
          {currentStep === "overview" && (
            <OverviewStep
              dossier={dossier}
              derived={derived}
              issues={validation.success ? [] : validation.issues}
            />
          )}
          {currentStep === "household" && <HouseholdStep form={form} />}
          {currentStep === "income" && <IncomeStep form={form} />}
          {currentStep === "assets" && <AssetsStep form={form} />}
          {currentStep === "liabilities" && <LiabilitiesStep form={form} />}
          {currentStep === "project" && <ProjectStep form={form} />}
          {currentStep === "financing" && <FinancingStep form={form} />}
          {currentStep === "budgets" && <BudgetsStep form={form} />}
          {currentStep === "documents" && <DocumentsStep form={form} />}
          {currentStep === "presentation" && <PresentationStep form={form} />}
          {currentStep === "help" && <HelpStep />}
          {currentStep === "preview" && (
            <PreviewStep
              html={documentHtml}
              issues={validation.success ? [] : validation.issues}
              form={form}
            />
          )}
        </div>
        <footer className="step-footer">
          <button
            className="button button--ghost"
            type="button"
            disabled={activeIndex === 0}
            onClick={previous}
          >
            <ChevronLeft size={17} /> Précédent
          </button>
          <div className="step-footer__tools">
            <button
              className="button button--ghost"
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Créer un dossier vierge ? Le brouillon actuel restera dans l'autosauvegarde locale.",
                  )
                )
                  resetTo(createBlankDossier(), "Nouveau dossier créé.");
              }}
            >
              <FilePlus2 size={16} /> Nouveau dossier
            </button>
            <button
              className="button button--ghost"
              title="Remplace le formulaire courant par un dossier entièrement fictif"
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Charger le dossier fictif Nora Leclerc et Samir Diallo ? Les valeurs affichées dans le formulaire seront remplacées.",
                  )
                )
                  resetTo(
                    completeDemoDossier,
                    "Dossier fictif Nora Leclerc et Samir Diallo chargé.",
                  );
              }}
            >
              <Download size={16} /> Charger l’exemple fictif
            </button>
            <button
              className="button button--ghost button--danger"
              type="button"
              onClick={() =>
                void clearLocalDrafts().then(() =>
                  setMessage("Brouillons locaux effacés."),
                )
              }
            >
              Effacer les brouillons
            </button>
          </div>
          <button
            className="button button--primary"
            type="button"
            disabled={activeIndex === editorSteps.length - 1}
            onClick={next}
          >
            Continuer <ChevronRight size={17} />
          </button>
        </footer>
      </main>
      {floatingPreview && documentHtml && (
        <FloatingPreview
          html={documentHtml}
          onClose={() => setFloatingPreview(false)}
        />
      )}
    </div>
  );
}

function FloatingPreview({
  html,
  onClose,
}: {
  readonly html: string;
  readonly onClose: () => void;
}) {
  const [zoom, setZoom] = useState(0.65);
  const [position, setPosition] = useState(() => ({
    x: Math.max(12, window.innerWidth - 732),
    y: 78,
  }));
  const drag = useRef<
    | {
        x: number;
        y: number;
        originX: number;
        originY: number;
      }
    | undefined
  >(undefined);
  return (
    <aside
      className="floating-preview"
      aria-label="Aperçu en direct"
      style={{ left: position.x, top: position.y }}
    >
      <header
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            originX: position.x,
            originY: position.y,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start) return;
          setPosition({
            x: Math.max(0, start.originX + event.clientX - start.x),
            y: Math.max(0, start.originY + event.clientY - start.y),
          });
        }}
        onPointerUp={() => {
          drag.current = undefined;
        }}
      >
        <div>
          <strong>Aperçu en direct</strong>
          <span>Déplaçable, redimensionnable et zoomable</span>
        </div>
        <div className="floating-preview__actions">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.35, value - 0.1))}
            aria-label="Dézoomer l'aperçu"
          >
            −
          </button>
          <output>{Math.round(zoom * 100)} %</output>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.25, value + 0.1))}
            aria-label="Zoomer l'aperçu"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Fermer l'aperçu en direct"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <DocumentFrame
        html={html}
        className="floating-preview__frame"
        zoom={zoom}
      />
    </aside>
  );
}

function PreviewStep({
  html,
  issues,
  form,
}: {
  readonly html?: string | undefined;
  readonly issues: readonly { path: string; message: string }[];
  readonly form: UseFormReturn<Dossier>;
}) {
  const [zoom, setZoom] = useState(0.8);
  const pageCount = html?.match(/<section class="page\b/g)?.length ?? 0;
  return (
    <div className="preview-layout">
      <header className="preview-toolbar">
        <strong>Aperçu du dossier bancaire</strong>
        <span>
          {html
            ? `${pageCount} pages · A4 · données validées`
            : "Aperçu indisponible tant que des données sont à corriger"}
        </span>
        {html && (
          <div className="preview-zoom">
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(0.4, value - 0.1))}
              aria-label="Dézoomer"
            >
              −
            </button>
            <output>{Math.round(zoom * 100)} %</output>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(1.4, value + 0.1))}
              aria-label="Zoomer"
            >
              +
            </button>
            <button type="button" onClick={() => setZoom(0.8)}>
              Ajuster
            </button>
          </div>
        )}
      </header>
      {html ? (
        <div className="preview-with-themes">
          <aside className="preview-theme-rail" aria-label="Changer le thème">
            {previewThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                aria-label={`Thème ${theme.name}`}
                aria-pressed={form.watch("presentation.theme") === theme.id}
                onClick={() => applyTheme(form, theme)}
              >
                <span>
                  {Object.values(theme.colors)
                    .slice(0, 3)
                    .map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                </span>
                <small>{theme.name}</small>
              </button>
            ))}
          </aside>
          <DocumentFrame html={html} className="document-preview" zoom={zoom} />
        </div>
      ) : (
        <div className="issue-panel">
          <h3>Aperçu indisponible</h3>
          <ol>
            {issues.slice(0, 20).map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>
                <code>{issue.path}</code>
                <span>{issue.message}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function DocumentFrame({
  html,
  className,
  zoom = 1,
}: {
  readonly html: string;
  readonly className: string;
  readonly zoom?: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const initialized = useRef(false);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    if (!initialized.current) {
      initialized.current = true;
      element.addEventListener(
        "load",
        () => {
          if (element.contentDocument?.body)
            element.contentDocument.body.style.zoom = String(zoom);
        },
        { once: true },
      );
      element.srcdoc = html;
      return;
    }
    const target = element.contentWindow;
    const document = element.contentDocument;
    if (!target || !document) return;
    const x = target.scrollX;
    const y = target.scrollY;
    document.open();
    document.write(html);
    document.close();
    window.requestAnimationFrame(() => {
      if (document.body) document.body.style.zoom = String(zoom);
      target.scrollTo(x, y);
    });
  }, [html, zoom]);
  return (
    <iframe
      ref={frame}
      className={className}
      title={
        className === "document-preview"
          ? "Aperçu du dossier bancaire"
          : "Aperçu en direct du dossier bancaire"
      }
    />
  );
}
