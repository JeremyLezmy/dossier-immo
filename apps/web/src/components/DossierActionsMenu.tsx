import { useEffect, useId, useRef, useState } from "react";
import {
  BookOpen,
  Download,
  FilePlus2,
  FolderOpen,
  Menu,
  PanelRightOpen,
  Save,
  Trash2,
} from "lucide-react";

interface DossierActionsMenuProps {
  readonly canPreview: boolean;
  readonly clearingDrafts: boolean;
  readonly exportingDossier: boolean;
  readonly importingDossier: boolean;
  readonly onClearDrafts: () => void;
  readonly onCreateDossier: () => void;
  readonly onImportDossier: () => void;
  readonly onLoadExample: () => void;
  readonly onOpenGuide: () => void;
  readonly onSaveDossier: () => void;
  readonly onTogglePreview: () => void;
}

export function DossierActionsMenu({
  canPreview,
  clearingDrafts,
  exportingDossier,
  importingDossier,
  onClearDrafts,
  onCreateDossier,
  onImportDossier,
  onLoadExample,
  onOpenGuide,
  onSaveDossier,
  onTogglePreview,
}: DossierActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstAction = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstAction.current?.focus();

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
    window.requestAnimationFrame(() => trigger.current?.focus());
  };

  return (
    <div className="dossier-actions-menu" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="dossier-actions-menu__trigger"
        aria-label="Actions du dossier"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={panelId}
          className="dossier-actions-menu__panel"
          role="group"
          aria-label="Actions du dossier"
        >
          <p>Navigation</p>
          <button
            ref={firstAction}
            type="button"
            onClick={() => run(onOpenGuide)}
          >
            <BookOpen size={18} aria-hidden="true" />
            <span>
              <strong>Guide</strong>
              <small>Consulter le mode d'emploi</small>
            </span>
          </button>
          <button
            type="button"
            disabled={!canPreview}
            onClick={() => run(onTogglePreview)}
          >
            <PanelRightOpen size={18} aria-hidden="true" />
            <span>
              <strong>Aperçu en direct</strong>
              <small>Afficher le dossier à côté du formulaire</small>
            </span>
          </button>

          <p>Fichier officiel</p>
          <button
            type="button"
            disabled={importingDossier}
            onClick={() => run(onImportDossier)}
          >
            <FolderOpen size={18} aria-hidden="true" />
            <span>
              <strong>
                {importingDossier ? "Ouverture…" : "Ouvrir un dossier"}
              </strong>
              <small>Importer une sauvegarde JSON</small>
            </span>
          </button>
          <button
            type="button"
            disabled={exportingDossier}
            onClick={() => run(onSaveDossier)}
          >
            <Save size={18} aria-hidden="true" />
            <span>
              <strong>
                {exportingDossier ? "Sauvegarde…" : "Sauvegarder le dossier"}
              </strong>
              <small>Créer la sauvegarde officielle JSON</small>
            </span>
          </button>

          <p>Dossier courant</p>
          <button type="button" onClick={() => run(onCreateDossier)}>
            <FilePlus2 size={18} aria-hidden="true" />
            <span>
              <strong>Nouveau dossier</strong>
              <small>Commencer avec un formulaire vierge</small>
            </span>
          </button>
          <button type="button" onClick={() => run(onLoadExample)}>
            <Download size={18} aria-hidden="true" />
            <span>
              <strong>Charger l'exemple fictif</strong>
              <small>Remplacer temporairement le formulaire</small>
            </span>
          </button>
          <button
            type="button"
            className="dossier-actions-menu__danger"
            disabled={clearingDrafts}
            onClick={() => run(onClearDrafts)}
          >
            <Trash2 size={18} aria-hidden="true" />
            <span>
              <strong>
                {clearingDrafts ? "Effacement…" : "Effacer les brouillons"}
              </strong>
              <small>Supprimer les brouillons de cet appareil</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
