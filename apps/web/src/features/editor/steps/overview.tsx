import type { DerivedDossier } from "@dossier-immo/calculations";
import type { Dossier, ValidationIssue } from "@dossier-immo/schema";
import { SectionIntro } from "../../../components/fields";
import { editorSteps } from "./metadata";
import { euro } from "./shared";

export function OverviewStep({ dossier, derived, issues }: { readonly dossier: Dossier; readonly derived?: DerivedDossier | undefined; readonly issues: readonly ValidationIssue[] }) {
  const completed = editorSteps.filter((step) => step.paths.every((prefix) => !issues.some((issue) => issue.path.startsWith(prefix)))).length;
  const progress = Math.round(completed / editorSteps.length * 360);
  return <><SectionIntro title="Votre dossier immobilier" description="Toutes les informations restent sur cet appareil. Le fichier téléchargé est la sauvegarde officielle ; le navigateur ne conserve qu'un brouillon de confort." />
    <div className="hero-summary"><div><span className={`status-pill ${issues.length === 0 ? "status-pill--ok" : "status-pill--warning"}`}>{issues.length === 0 ? "Prêt pour la prévisualisation" : `${issues.length} point${issues.length > 1 ? "s" : ""} à corriger`}</span><h3>{dossier.metadata.title}</h3><p>Situation au {dossier.metadata.observationDate} · achat cible {dossier.project.targetPurchaseDate}</p></div><div className="progress-ring" style={{ background: `conic-gradient(#7cc7a3 ${progress}deg, rgba(255,255,255,.18) ${progress}deg)` }} aria-label={`${completed} étapes sur ${editorSteps.length}`}><strong>{completed}/{editorSteps.length}</strong><span>étapes</span></div></div>
    {derived && <div className="metric-grid"><Metric label="Revenu central" value={derived.incomeCentralCents} /><Metric label="Patrimoine" value={derived.totalAssetsCents} /><Metric label="Liquidités projetées" value={derived.projectedLiquidityAtPurchaseCents} /><Metric label="Réserve après achat" value={derived.reserveAfterPurchaseCents} tone={derived.reserveAfterPurchaseCents >= dossier.reservePolicy.minimumCents ? "positive" : "warning"} /></div>}
    <div className="privacy-card"><span aria-hidden="true">✓</span><div><strong>Confidentialité locale</strong><p>Aucun compte, aucune synchronisation et aucune pièce justificative téléversée. Téléchargez régulièrement votre fichier de sauvegarde.</p></div></div>
    {issues.length > 0 && <section className="validation-summary" aria-labelledby="validation-title"><h3 id="validation-title">Points à corriger</h3><ol>{issues.slice(0, 30).map((issue) => <li key={`${issue.path}-${issue.message}`}><code>{issue.path}</code><span>{issue.message}</span></li>)}</ol></section>}
  </>;
}

function Metric({ label, value, tone }: { readonly label: string; readonly value: number; readonly tone?: "positive" | "warning" }) {
  return <div className={`metric-card ${tone ? `metric-card--${tone}` : ""}`}><span>{label}</span><strong>{euro(value)}</strong></div>;
}
