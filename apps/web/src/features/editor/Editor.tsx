import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { calculateDossier } from "@dossier-immo/calculations";
import { renderBankDocument } from "@dossier-immo/document";
import {
  completeDemoDossier,
  createBlankDossier,
  demoDossierCatalog,
  type DemoDossierDescriptor,
} from "@dossier-immo/fixtures";
import { validateDossier, type Dossier } from "@dossier-immo/schema";
import {
  BookOpen,
  Check,
  CircleAlert,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePlus2,
  FolderOpen,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  Minimize2,
  Palette,
  PanelRightOpen,
  Save,
  X,
} from "lucide-react";
import { DossierActionsMenu } from "../../components/DossierActionsMenu";
import { DemoDossierPicker } from "../../components/DemoDossierPicker";
import { EditorDisclosureProvider } from "../../components/EditorDisclosure";
import {
  FeedbackBanner,
  type FeedbackMessage,
} from "../../components/FeedbackBanner";
import { fieldId, ValidationIssuesProvider } from "../../components/fields";
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
  const [message, setMessage] = useState<FeedbackMessage>();
  const [hydrated, setHydrated] = useState(false);
  const [floatingPreview, setFloatingPreview] = useState(false);
  const [isClearingDrafts, setIsClearingDrafts] = useState(false);
  const [isExportingDossier, setIsExportingDossier] = useState(false);
  const [isImportingDossier, setIsImportingDossier] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pendingIssuePath, setPendingIssuePath] = useState<string>();
  const [examplePickerOpen, setExamplePickerOpen] = useState(false);
  const autosaveRevision = useRef(0);
  const autosaveTimer = useRef<number | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingAutosaves = useRef(new Set<Promise<void>>());
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
  const validationIssues = validation.success ? [] : validation.issues;
  const issueCountForStep = (stepId: StepId) => {
    const step = editorSteps.find((candidate) => candidate.id === stepId);
    if (!step) return 0;
    return validationIssues.filter((issue) =>
      step.paths.some(
        (prefix) =>
          issue.path === prefix || issue.path.startsWith(`${prefix}.`),
      ),
    ).length;
  };
  const selectStep = (stepId: StepId) => {
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const openGuide = () => {
    setFloatingPreview(false);
    selectStep("help");
  };
  const goToIssue = (path: string) => {
    const targetStep = editorSteps.find((step) =>
      step.paths.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}.`),
      ),
    );
    setPendingIssuePath(path);
    selectStep(targetStep?.id ?? "overview");
  };

  useEffect(() => {
    void loadLatestDraft()
      .then((draft) => {
        if (draft) {
          form.reset(draft.dossier);
          setMessage({ tone: "info", text: "Brouillon local repris." });
        }
      })
      .catch(() =>
        setMessage({
          tone: "error",
          text: "Le brouillon local n'a pas pu être relu.",
        }),
      )
      .finally(() => setHydrated(true));
  }, [form]);

  useEffect(() => {
    if (!hydrated) return;
    const revision = ++autosaveRevision.current;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      const operation = saveDraft(dossier);
      pendingAutosaves.current.add(operation);
      void operation
        .then(() => {
          if (autosaveRevision.current === revision) setSaveState("saved");
        })
        .catch(() => {
          if (autosaveRevision.current === revision) setSaveState("error");
        })
        .finally(() => pendingAutosaves.current.delete(operation));
    }, 700);
    autosaveTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (autosaveTimer.current === timer) autosaveTimer.current = undefined;
    };
  }, [dossier, hydrated]);

  useEffect(() => {
    if (!pendingIssuePath) return;
    const timer = window.setTimeout(() => {
      let target: HTMLElement | null = document.getElementById(
        fieldId(pendingIssuePath),
      );
      if (!target) {
        const segments = pendingIssuePath.split(".");
        while (!target && segments.length > 1) {
          segments.pop();
          target = document.getElementById(fieldId(segments.join(".")));
        }
      }
      target ??= document.querySelector<HTMLElement>(
        ".workspace__content [aria-invalid='true']",
      );
      target ??= document.querySelector<HTMLElement>(
        ".workspace__content .section-intro h2",
      );
      if (target) {
        let parent = target.parentElement;
        while (parent) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
        target.scrollIntoView({ block: "center" });
        target.focus({ preventScroll: true });
      }
      setPendingIssuePath(undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentStep, pendingIssuePath]);

  const resetTo = (next: Dossier, feedback: FeedbackMessage) => {
    form.reset(structuredClone(next));
    setCurrentStep("overview");
    setPendingIssuePath(undefined);
    setMessage(feedback);
  };

  const openFile = async (file: File) => {
    if (isImportingDossier) return;
    setIsImportingDossier(true);
    try {
      const imported = await importDossierFile(file);
      resetTo(imported.dossier, {
        tone: "success",
        text: "Dossier ouvert.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'ouvrir le dossier.",
      });
    } finally {
      setIsImportingDossier(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const saveFile = async () => {
    if (isExportingDossier) return;
    if (!validation.success) {
      setMessage({
        tone: "warning",
        text: `Corrigez les ${validation.issues.length} point${validation.issues.length > 1 ? "s" : ""} signalé${validation.issues.length > 1 ? "s" : ""} avant de créer une sauvegarde officielle.`,
      });
      selectStep("overview");
      return;
    }
    setIsExportingDossier(true);
    try {
      await saveDossierFile(validation.dossier);
      setMessage({ tone: "success", text: "Sauvegarde officielle créée." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Sauvegarde impossible.",
      });
    } finally {
      setIsExportingDossier(false);
    }
  };

  const downloadPdf = async () => {
    if (isPdfGenerating) return;
    if (!documentHtml) {
      setMessage({
        tone: "warning",
        text: "Le dossier doit être valide avant le téléchargement.",
      });
      return;
    }
    setIsPdfGenerating(true);
    setMessage({ tone: "info", text: "Génération du PDF en cours…" });
    try {
      await downloadPdfDocument(
        documentHtml,
        `${dossier.metadata.dossierId}.pdf`,
      );
      setMessage({ tone: "success", text: "PDF téléchargé." });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Téléchargement impossible.",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const createNewDossier = () => {
    if (
      window.confirm(
        "Créer un dossier vierge ? Le brouillon actuel restera dans l'autosauvegarde locale.",
      )
    )
      resetTo(createBlankDossier(), {
        tone: "success",
        text: "Nouveau dossier créé.",
      });
  };

  const loadExample = (demo: DemoDossierDescriptor) => {
    resetTo(demo.dossier, {
      tone: "success",
      text: `Dossier fictif « ${demo.title} » chargé.`,
    });
    setExamplePickerOpen(false);
  };

  const clearDrafts = async () => {
    if (isClearingDrafts) return;
    if (
      !window.confirm(
        "Effacer tous les brouillons enregistrés sur cet appareil ? Le dossier actuellement affiché restera ouvert, mais les autres brouillons seront supprimés. Cette action est irréversible.",
      )
    )
      return;

    setIsClearingDrafts(true);
    try {
      if (autosaveTimer.current !== undefined) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = undefined;
      }
      autosaveRevision.current += 1;
      await Promise.allSettled([...pendingAutosaves.current]);
      await clearLocalDrafts();
      setSaveState("idle");
      setMessage({ tone: "success", text: "Brouillons locaux effacés." });
    } catch {
      setMessage({
        tone: "error",
        text: "Les brouillons locaux n'ont pas pu être effacés.",
      });
    } finally {
      setIsClearingDrafts(false);
    }
  };

  const next = () =>
    selectStep(
      editorSteps[Math.min(editorSteps.length - 1, activeIndex + 1)]?.id ??
        currentStep,
    );
  const previous = () =>
    selectStep(editorSteps[Math.max(0, activeIndex - 1)]?.id ?? currentStep);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img
            className="brand__mark"
            src={`${import.meta.env.BASE_URL}brand-mark.svg`}
            alt=""
            width="38"
            height="38"
          />
          <div>
            <strong>Dossier Immo</strong>
            <span>Pré-analyse bancaire locale</span>
          </div>
        </div>
        <span
          className={`save-state save-state--${saveState}`}
          role={saveState === "error" ? "alert" : "status"}
          aria-live={saveState === "error" ? "assertive" : "polite"}
        >
          {saveState === "saving" ? (
            <LoaderCircle className="spinner" size={15} aria-hidden="true" />
          ) : saveState === "error" ? (
            <CircleAlert size={15} aria-hidden="true" />
          ) : (
            <Check size={15} aria-hidden="true" />
          )}
          <span>
            {saveState === "saving"
              ? "Enregistrement du brouillon…"
              : saveState === "saved"
                ? "Brouillon local à jour"
                : saveState === "error"
                  ? "Autosauvegarde indisponible"
                  : "Brouillon local"}
          </span>
        </span>
        <div className="topbar__actions">
          <button
            className="button button--ghost topbar__mobile-preview-action"
            type="button"
            disabled={!documentHtml}
            aria-label={
              floatingPreview
                ? "Fermer l’aperçu rapide"
                : "Ouvrir l’aperçu rapide"
            }
            aria-pressed={floatingPreview}
            title={
              floatingPreview
                ? "Fermer l’aperçu rapide"
                : "Ouvrir l’aperçu rapide"
            }
            onClick={() => setFloatingPreview((value) => !value)}
          >
            <PanelRightOpen size={19} aria-hidden="true" />
          </button>
          <DossierActionsMenu
            canPreview={Boolean(documentHtml)}
            clearingDrafts={isClearingDrafts}
            exportingDossier={isExportingDossier}
            importingDossier={isImportingDossier}
            onClearDrafts={() => void clearDrafts()}
            onCreateDossier={createNewDossier}
            onImportDossier={() => fileInput.current?.click()}
            onLoadExample={() => setExamplePickerOpen(true)}
            onOpenGuide={openGuide}
            onSaveDossier={() => void saveFile()}
            onTogglePreview={() => setFloatingPreview((value) => !value)}
          />
          <button
            className="button button--ghost topbar__desktop-action"
            type="button"
            onClick={openGuide}
          >
            <BookOpen size={17} /> Guide
          </button>
          <button
            className="button button--ghost topbar__desktop-action"
            type="button"
            disabled={!documentHtml}
            onClick={() => setFloatingPreview((value) => !value)}
          >
            <PanelRightOpen size={17} /> Aperçu en direct
          </button>
          <button
            className="button button--ghost topbar__desktop-action"
            type="button"
            title="Importer une configuration JSON"
            disabled={isImportingDossier}
            onClick={() => fileInput.current?.click()}
          >
            <FolderOpen size={17} />{" "}
            {isImportingDossier ? "Ouverture…" : "Importer"}
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
            className="button button--secondary topbar__desktop-action"
            type="button"
            title="Exporter la configuration JSON sur cet appareil"
            disabled={isExportingDossier}
            onClick={() => void saveFile()}
          >
            {isExportingDossier ? (
              <LoaderCircle className="spinner" size={17} aria-hidden="true" />
            ) : (
              <Save size={17} aria-hidden="true" />
            )}
            {isExportingDossier ? "Sauvegarde…" : "Exporter la config"}
          </button>
          <button
            className="button button--primary"
            type="button"
            disabled={!documentHtml || isPdfGenerating}
            aria-busy={isPdfGenerating}
            onClick={() => void downloadPdf()}
          >
            {isPdfGenerating ? (
              <LoaderCircle className="spinner" size={17} aria-hidden="true" />
            ) : (
              <Download size={17} aria-hidden="true" />
            )}
            <span className="pdf-label pdf-label--long">
              {isPdfGenerating ? "Génération…" : "Télécharger le PDF"}
            </span>
            <span className="pdf-label pdf-label--short">
              {isPdfGenerating ? "Patientez…" : "PDF"}
            </span>
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
              aria-current={currentStep === step.id ? "step" : undefined}
              aria-label={`${index + 1}. ${step.shortLabel} — ${step.label}${issueCountForStep(step.id) > 0 ? ` — ${issueCountForStep(step.id)} point${issueCountForStep(step.id) > 1 ? "s" : ""} à corriger` : ""}`}
              onClick={() => selectStep(step.id)}
            >
              <span className="step-link__number">{index + 1}</span>
              <div>
                <strong>{step.shortLabel}</strong>
                <small>{step.label}</small>
              </div>
              {issueCountForStep(step.id) > 0 ? (
                <span className="step-link__issue" aria-hidden="true">
                  {issueCountForStep(step.id)}
                </span>
              ) : currentStep === step.id ? (
                <ChevronRight size={16} />
              ) : null}
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
        <nav
          className="editor-stepbar"
          aria-label="Navigation compacte des étapes"
        >
          <button
            type="button"
            aria-label="Étape précédente"
            disabled={activeIndex === 0}
            onClick={previous}
          >
            <ChevronLeft size={20} />
          </button>
          <label className="editor-stepbar__select">
            <span>
              Étape {activeIndex + 1} sur {editorSteps.length}
            </span>
            <select
              aria-label="Étape du dossier"
              value={currentStep}
              onChange={(event) => selectStep(event.target.value as StepId)}
            >
              {editorSteps.map((step, index) => {
                const issueCount = issueCountForStep(step.id);
                return (
                  <option key={step.id} value={step.id}>
                    {index + 1}. {step.label}
                    {issueCount > 0 ? ` — ${issueCount} à corriger` : ""}
                  </option>
                );
              })}
            </select>
          </label>
          <button
            type="button"
            aria-label="Étape suivante"
            disabled={activeIndex === editorSteps.length - 1}
            onClick={next}
          >
            <ChevronRight size={20} />
          </button>
        </nav>
        <EditorDisclosureProvider>
          <ValidationIssuesProvider issues={validationIssues}>
            {message && (
              <FeedbackBanner
                message={message}
                onDismiss={() => setMessage(undefined)}
              />
            )}
            <div className="workspace__content">
              {currentStep === "overview" && (
                <OverviewStep
                  dossier={dossier}
                  derived={derived}
                  issues={validationIssues}
                  onSelectIssue={goToIssue}
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
              {currentStep === "presentation" && (
                <PresentationStep form={form} />
              )}
              {currentStep === "help" && <HelpStep />}
              {currentStep === "preview" && (
                <PreviewStep
                  html={documentHtml}
                  issues={validationIssues}
                  form={form}
                  onSelectIssue={goToIssue}
                />
              )}
            </div>
          </ValidationIssuesProvider>
        </EditorDisclosureProvider>
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
              onClick={createNewDossier}
            >
              <FilePlus2 size={16} /> Nouveau dossier
            </button>
            <button
              className="button button--ghost"
              title="Remplace le formulaire courant par un dossier entièrement fictif"
              type="button"
              onClick={() => setExamplePickerOpen(true)}
            >
              <Download size={16} /> Charger l’exemple fictif
            </button>
            <button
              className="button button--ghost button--danger"
              type="button"
              disabled={isClearingDrafts}
              onClick={() => void clearDrafts()}
            >
              {isClearingDrafts ? "Effacement…" : "Effacer les brouillons"}
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
      <DemoDossierPicker
        demos={demoDossierCatalog}
        open={examplePickerOpen}
        onClose={() => setExamplePickerOpen(false)}
        onSelect={loadExample}
      />
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
  const [zoom, setZoom] = useState(() => getPreviewFitZoom(0.65));
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
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <aside
      className="floating-preview"
      aria-label="Aperçu en direct"
      style={{ left: position.x, top: position.y }}
    >
      <header
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          if (window.matchMedia("(max-width: 760px)").matches) return;
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
  onSelectIssue,
}: {
  readonly html?: string | undefined;
  readonly issues: readonly { path: string; message: string }[];
  readonly form: UseFormReturn<Dossier>;
  readonly onSelectIssue: (path: string) => void;
}) {
  const [zoom, setZoom] = useState(() => getPreviewFitZoom(0.8));
  const [themeSettingsOpen, setThemeSettingsOpen] = useState(
    () => !window.matchMedia("(max-width: 760px)").matches,
  );
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const pageCount = html?.match(/<section class="page\b/g)?.length ?? 0;
  const selectedTheme = form.watch("presentation.theme");

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const adaptThemeSettings = (event: MediaQueryListEvent) => {
      setThemeSettingsOpen(!event.matches);
    };
    mobileQuery.addEventListener("change", adaptThemeSettings);
    return () => mobileQuery.removeEventListener("change", adaptThemeSettings);
  }, []);

  useEffect(() => {
    if (!previewFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewFullscreen]);

  return (
    <div
      className={`preview-layout${previewFullscreen ? " preview-layout--fullscreen" : ""}`}
    >
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
            <button
              type="button"
              onClick={() => setZoom(getPreviewFitZoom(0.8))}
            >
              Ajuster
            </button>
            <button
              className="preview-fullscreen-toggle"
              type="button"
              aria-label={
                previewFullscreen
                  ? "Quitter le plein écran"
                  : "Afficher l’aperçu en plein écran"
              }
              aria-pressed={previewFullscreen}
              title={
                previewFullscreen
                  ? "Quitter le plein écran"
                  : "Afficher l’aperçu en plein écran"
              }
              onClick={() => {
                if (
                  !previewFullscreen &&
                  window.matchMedia("(max-width: 760px)").matches
                ) {
                  setThemeSettingsOpen(false);
                }
                setPreviewFullscreen((value) => !value);
              }}
            >
              {previewFullscreen ? (
                <Minimize2 size={15} aria-hidden="true" />
              ) : (
                <Maximize2 size={15} aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </header>
      {html ? (
        <div className="preview-with-themes">
          <details
            className="preview-theme-settings"
            open={themeSettingsOpen}
            onToggle={(event) => setThemeSettingsOpen(event.currentTarget.open)}
          >
            <summary>
              <span>
                <Palette size={16} aria-hidden="true" />
                <strong>Thèmes du document</strong>
                <small>
                  {previewThemes.find((theme) => theme.id === selectedTheme)
                    ?.name ?? "Thème actif"}
                </small>
              </span>
              <ChevronDown size={17} aria-hidden="true" />
            </summary>
            <aside className="preview-theme-rail" aria-label="Changer le thème">
              {previewThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  aria-label={`Thème ${theme.name}`}
                  aria-pressed={selectedTheme === theme.id}
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
          </details>
          <DocumentFrame html={html} className="document-preview" zoom={zoom} />
        </div>
      ) : (
        <div className="issue-panel">
          <h3>Aperçu indisponible</h3>
          <ol>
            {issues.slice(0, 20).map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>
                <button type="button" onClick={() => onSelectIssue(issue.path)}>
                  <code>{issue.path}</code>
                  <span>{issue.message}</span>
                  <strong>Corriger</strong>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const A4_WIDTH_CSS_PIXELS = (210 / 25.4) * 96;

function getPreviewFitZoom(maximum: number): number {
  const availableWidth = Math.max(320, window.innerWidth) - 32;
  return Math.min(maximum, Math.max(0.4, availableWidth / A4_WIDTH_CSS_PIXELS));
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
