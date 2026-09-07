import type { Dossier } from "@dossier-immo/schema";
import type { DerivedDossier } from "@dossier-immo/calculations";
import { escapeHtml, formatEuro, formatRate } from "./format";

export function renderCashBridge(dossier: Dossier, derived: DerivedDossier) {
  const rows: [string, number][] = [
    [
      "Disponible budgété avant achat, après provisions mensuelles",
      derived.projectedLiquidityAtPurchaseCents,
    ],
    ["Apport central", -dossier.project.contributionCents],
    [
      "Installation, déménagement et équipement",
      -dossier.project.installationCents,
    ],
    [
      "Enveloppe fiscale complémentaire, hors provisions mensuelles",
      -(dossier.cashFlowPlan?.reservedTaxCents ?? 0),
    ],
    ["Réserve libre estimée", derived.freeReserveAfterPurchaseCents],
  ];
  return `<h3>Rapprochement à l’achat</h3><table class="compact"><tbody>${rows.map(([label, value], index) => `<tr${index === rows.length - 1 ? ' class="total-row"' : ""}><td>${label}</td><td class="num">${formatEuro(value)}</td></tr>`).join("")}</tbody></table><p class="small">Écart au minimum de sécurité : <strong>${formatEuro(derived.bankReview.freeReserveMarginCents)}</strong>. Objectif atteint uniquement sous les hypothèses renseignées si cet écart est positif ; la réserve libre n’est pas garantie. Le disponible budgété exclut les provisions : il ne représente pas un solde bancaire.</p>`;
}

export function renderBudgetSensitivity(derived: DerivedDossier) {
  const review = derived.bankReview;
  return `<p class="small">Sensibilité du stress : revenu après IR ${review.stressIncomeChangeBasisPoints === undefined ? "non comparable" : formatRate(review.stressIncomeChangeBasisPoints)} ; dépenses hors crédits ${review.stressExpenseChangeBasisPoints === undefined ? "non comparables" : formatRate(review.stressExpenseChangeBasisPoints)} par rapport au central.</p>${review.interruption ? `<p class="small"><strong>Interruption de revenu pendant ${review.interruption.months} mois :</strong> sans revenu économique de ${escapeHtml(review.interruption.person)}, autres revenus, charges et IR maintenus, déficit ${formatEuro(review.interruption.monthlyShortfallCents)}/mois ; réserve libre restante ${formatEuro(review.interruption.reserveAfterCents)}. Test mécanique, hors indemnités, sans recalcul fiscal ni prévision de perte de mission.</p>` : ""}`;
}
