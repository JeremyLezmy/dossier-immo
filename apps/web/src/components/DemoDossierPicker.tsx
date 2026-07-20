import { useEffect, useRef, useState } from "react";
import type { DemoDossierDescriptor } from "@dossier-immo/fixtures";
import { ArrowLeft, ArrowRight, FileCheck2, X } from "lucide-react";

interface DemoDossierPickerProps {
  readonly demos: readonly DemoDossierDescriptor[];
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect: (demo: DemoDossierDescriptor) => void;
}

export function DemoDossierPicker({
  demos,
  open,
  onClose,
  onSelect,
}: DemoDossierPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [pendingDemo, setPendingDemo] = useState<DemoDossierDescriptor | null>(
    null,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open) {
      setPendingDemo(null);
      if (dialog.open) dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (pendingDemo) confirmButtonRef.current?.focus();
  }, [pendingDemo]);

  const closePicker = () => {
    setPendingDemo(null);
    onClose();
  };

  const confirmSelection = () => {
    if (!pendingDemo) return;
    onSelect(pendingDemo);
  };

  return (
    <dialog
      aria-labelledby="demo-picker-title"
      aria-describedby="demo-picker-description"
      className="demo-picker"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (pendingDemo) setPendingDemo(null);
        else closePicker();
      }}
      onClose={closePicker}
    >
      <header className="demo-picker__header">
        <div>
          <span className="eyebrow">Données entièrement fictives</span>
          <h2 id="demo-picker-title">
            {pendingDemo
              ? "Confirmer le chargement"
              : "Choisir un dossier d’exemple"}
          </h2>
          <p id="demo-picker-description">
            {pendingDemo
              ? "Vérifiez le profil choisi avant de remplacer les valeurs affichées."
              : "Chaque profil illustre un parcours différent. Le dossier actuellement affiché sera remplacé après confirmation."}
          </p>
        </div>
        <button
          className="demo-picker__close"
          type="button"
          onClick={closePicker}
          aria-label="Fermer le sélecteur d’exemple"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      {pendingDemo ? (
        <div className="demo-picker__confirmation">
          <div className="demo-picker__selection">
            <span className="demo-picker__selection-icon">
              <FileCheck2 size={24} aria-hidden="true" />
            </span>
            <span className="demo-picker__content">
              <strong>{pendingDemo.title}</strong>
              <small>{pendingDemo.summary}</small>
              <span className="demo-picker__tags">
                {pendingDemo.highlights.map((highlight) => (
                  <span key={highlight}>{highlight}</span>
                ))}
              </span>
            </span>
          </div>
          <p className="demo-picker__warning">
            Les valeurs actuellement affichées dans le formulaire seront
            remplacées par ce dossier fictif.
          </p>
          <div className="demo-picker__actions">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setPendingDemo(null)}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Retour aux profils
            </button>
            <button
              className="button button--primary"
              type="button"
              ref={confirmButtonRef}
              onClick={confirmSelection}
            >
              Charger ce dossier
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="demo-picker__grid">
            {demos.map((demo, index) => (
              <button
                className="demo-picker__card"
                type="button"
                key={demo.id}
                onClick={() => setPendingDemo(demo)}
              >
                <span className="demo-picker__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="demo-picker__content">
                  <strong>{demo.title}</strong>
                  <small>{demo.summary}</small>
                  <span className="demo-picker__tags">
                    {demo.highlights.map((highlight) => (
                      <span key={highlight}>{highlight}</span>
                    ))}
                  </span>
                </span>
                <ArrowRight
                  className="demo-picker__arrow"
                  size={19}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <p className="demo-picker__privacy">
            Ces identités, métiers, villes, montants et récits ont été inventés
            pour la démonstration. Aucun justificatif ni donnée réelle n’est
            inclus.
          </p>
        </>
      )}
    </dialog>
  );
}
