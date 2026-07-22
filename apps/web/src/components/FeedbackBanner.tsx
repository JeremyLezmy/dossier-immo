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

export interface FeedbackAction {
  readonly disabled?: boolean | undefined;
  readonly label: string;
  readonly emphasis?: "primary" | "secondary" | undefined;
  readonly onClick: () => void;
}

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

export function FeedbackBanner({
  actions = [],
  dismissible = true,
  message,
  onDismiss,
}: {
  readonly actions?: readonly FeedbackAction[];
  readonly dismissible?: boolean;
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
      <span className="feedback-banner__content">{message.text}</span>
      {actions.length > 0 && (
        <div className="feedback-banner__actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              className={
                action.emphasis
                  ? `feedback-banner__action feedback-banner__action--${action.emphasis}`
                  : "feedback-banner__action"
              }
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {dismissible && (
        <button
          className="feedback-banner__dismiss"
          type="button"
          onClick={onDismiss}
          aria-label="Fermer le message"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
