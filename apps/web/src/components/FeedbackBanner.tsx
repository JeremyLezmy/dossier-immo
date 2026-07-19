import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

export type FeedbackTone = "success" | "info" | "warning" | "error";

export interface FeedbackMessage {
  readonly text: string;
  readonly tone: FeedbackTone;
}

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

export function FeedbackBanner({
  message,
  onDismiss,
}: {
  readonly message: FeedbackMessage;
  readonly onDismiss: () => void;
}) {
  const Icon = icons[message.tone];
  const isError = message.tone === "error";

  return (
    <div
      className={`feedback-banner feedback-banner--${message.tone}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{message.text}</span>
      <button type="button" onClick={onDismiss} aria-label="Fermer le message">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
