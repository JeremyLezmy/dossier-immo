import { useEffect, useRef } from "react";
import { Clock3, HardDrive, ShieldCheck, X } from "lucide-react";
import type { PersistenceMode } from "../persistence/policy";

interface PersistenceChoiceDialogProps {
  readonly busy: boolean;
  readonly currentMode?: PersistenceMode | undefined;
  readonly existingDraftCount: number;
  readonly localExpiresAt?: string | undefined;
  readonly open: boolean;
  readonly required: boolean;
  readonly onChooseLocal: () => void;
  readonly onChooseSession: () => void;
  readonly onClose: () => void;
}

const expirationFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function PersistenceChoiceDialog({
  busy,
  currentMode,
  existingDraftCount,
  localExpiresAt,
  open,
  required,
  onChooseLocal,
  onChooseSession,
  onClose,
}: PersistenceChoiceDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sessionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => sessionButtonRef.current?.focus());
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const formattedExpiration = localExpiresAt
    ? expirationFormatter.format(new Date(localExpiresAt))
    : undefined;
  const sessionWillDelete = currentMode === "local" || existingDraftCount > 0;

  return (
    <dialog
      ref={dialogRef}
      className="persistence-dialog"
      aria-labelledby="persistence-dialog-title"
      aria-describedby="persistence-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!required && !busy) onClose();
      }}
      onClose={() => {
        if (!required) onClose();
      }}
    >
      <header className="persistence-dialog__header">
        <div>
          <span className="eyebrow">Confidentialité et reprise</span>
          <h2 id="persistence-dialog-title">
            Comment souhaitez-vous travailler&nbsp;?
          </h2>
          <p id="persistence-dialog-description">
            Aucune donnée du dossier n’est envoyée à un serveur. Choisissez si
            ce navigateur peut conserver temporairement votre brouillon.
          </p>
        </div>
        {!required && (
          <button
            type="button"
            className="persistence-dialog__close"
            aria-label="Fermer les réglages de confidentialité"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </header>

      {existingDraftCount > 0 && !currentMode && (
        <p className="persistence-dialog__existing" role="status">
          <HardDrive size={18} aria-hidden="true" />
          <span>
            {existingDraftCount === 1
              ? "Un brouillon local existant a été détecté."
              : existingDraftCount +
                " brouillons locaux existants ont été détectés."}{" "}
            Le mode local les conserve ; le mode session les efface.
          </span>
        </p>
      )}

      <div className="persistence-dialog__choices">
        <section
          className={
            "persistence-choice" +
            (currentMode === "session" ? " persistence-choice--current" : "")
          }
        >
          <div className="persistence-choice__title">
            <span className="persistence-choice__icon">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="persistence-choice__badge">Recommandé</span>
              <h3>Session privée</h3>
            </div>
          </div>
          <p>
            Aucune donnée du dossier n’est enregistrée dans le navigateur.
            Fermer ou recharger l’onglet fait perdre les modifications non
            exportées.
          </p>
          <ul>
            <li>Adapté à un appareil partagé ou public</li>
            <li>Le fichier JSON reste votre sauvegarde officielle</li>
          </ul>
          <button
            ref={sessionButtonRef}
            className="button button--primary"
            type="button"
            disabled={busy || currentMode === "session"}
            onClick={onChooseSession}
          >
            {currentMode === "session"
              ? "Mode actuel"
              : sessionWillDelete
                ? "Effacer les brouillons et passer en session"
                : "Continuer en session privée"}
          </button>
        </section>

        <section
          className={
            "persistence-choice" +
            (currentMode === "local" ? " persistence-choice--current" : "")
          }
        >
          <div className="persistence-choice__title">
            <span className="persistence-choice__icon persistence-choice__icon--local">
              <Clock3 size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="persistence-choice__badge persistence-choice__badge--local">
                Reprise 24 h
              </span>
              <h3>Reprise locale</h3>
            </div>
          </div>
          <p>
            Le brouillon reste dans le stockage local associé à l’adresse de
            l’application, dans ce profil de navigateur. Chaque modification ou
            prolongation renouvelle les 24 h.
          </p>
          <ul>
            <li>Aucun compte, serveur ni synchronisation</li>
            <li>
              Suppression à l’échéance, ou à la prochaine ouverture si
              l’application était fermée
            </li>
          </ul>
          {currentMode === "local" && formattedExpiration && (
            <p className="persistence-choice__expiration">
              Brouillon courant prévu jusqu’au {formattedExpiration}.
            </p>
          )}
          <button
            className="button button--secondary"
            type="button"
            disabled={busy || currentMode === "local"}
            onClick={onChooseLocal}
          >
            {currentMode === "local"
              ? "Mode actuel"
              : "Activer la reprise locale 24 h"}
          </button>
        </section>
      </div>

      <p className="persistence-dialog__footnote">
        Les données locales peuvent aussi disparaître si les données du site ou
        le profil du navigateur sont effacés. Évitez ce mode sur un appareil
        partagé. Sur un hébergement où plusieurs applications utilisent la même
        adresse web, elles partagent techniquement cette zone locale&nbsp;:
        n’activez la reprise que si vous leur faites confiance. Vous pourrez
        modifier ce choix plus tard.
      </p>
    </dialog>
  );
}
