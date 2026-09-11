import type { Dossier } from "@dossier-immo/schema";
import type { DerivedDossier } from "@dossier-immo/calculations";
import { escapeHtml, formatEuro, formatRate, formatDate } from "./format";

export function renderCashBridge(dossier: Dossier, derived: DerivedDossier) {
  const rows: [string, number | undefined, number | undefined][] = [
    [
      "Liquidités mobilisables avant apport",
      derived.contributionLiquidityCents,
      derived.projectedLiquidityAtPurchaseCents,
    ],
    [
      "Apport envisagé",
      -dossier.project.contributionCents,
      -dossier.project.contributionCents,
    ],
    [
      "Solde après le seul apport¹",
      derived.bankReview.todayAfterContributionCents,
      derived.bankReview.purchaseAfterContributionCents,
    ],
    [
      "Enveloppe fiscale complémentaire²",
      undefined,
      -(dossier.cashFlowPlan?.reservedTaxCents ?? 0),
    ],
    ...(!dossier.reservePolicy.includesInstallation
      ? [
          [
            "Installation, déménagement et équipement",
            undefined,
            -dossier.project.installationCents,
          ] as [string, undefined, number],
        ]
      : []),
    [
      dossier.reservePolicy.includesInstallation
        ? "Réserve conservée, installation comprise"
        : "Réserve après installation",
      undefined,
      derived.reserveForObjectiveCents,
    ],
  ];
  return `<h3>Rapprochement : aujourd’hui et à l’achat</h3><table class="compact"><thead><tr><th>Lecture des liquidités</th><th class="num">Aujourd’hui<br><small>Soldes au ${formatDate(dossier.metadata.observationDate)}</small></th><th class="num">À l’achat<br><small>${formatDate(dossier.project.targetPurchaseDate)}</small></th></tr></thead><tbody>${rows.map(([label, current, future], index) => `<tr${index === rows.length - 1 ? ' class="total-row"' : ""}><td>${label}</td><td class="num">${current === undefined ? "—" : formatEuro(current)}</td><td class="num">${future === undefined ? "—" : formatEuro(future)}</td></tr>`).join("")}</tbody></table><p class="small">¹ Aujourd’hui : soldes déclarés, sans encaissements futurs. Le solde après le seul apport ne déduit pas les impôts et cotisations restant dus : ce n’est pas une réserve nette. À l’achat : encaissements, dépenses et provisions du tableau mensuel déjà intégrés. ² Enveloppe complémentaire réservée à l’achat ; le tiret ne signifie pas absence d’impôt aujourd’hui.</p><p class="small">Objectif : ${formatEuro(dossier.reservePolicy.minimumCents)} à ${formatEuro(dossier.reservePolicy.targetCents)}${dossier.reservePolicy.includesInstallation ? `, dont ${formatEuro(dossier.project.installationCents)} d’installation inclus` : ", après installation"}. Marge au minimum à l’achat : <strong>${formatEuro(derived.bankReview.freeReserveMarginCents)}</strong>.</p>`;
}

export function renderBudgetSensitivity(derived: DerivedDossier) {
  const review = derived.bankReview;
  return `<p class="small">Sensibilité du stress : revenu après IR ${review.stressIncomeChangeBasisPoints === undefined ? "non comparable" : formatRate(review.stressIncomeChangeBasisPoints)} ; dépenses hors crédits ${review.stressExpenseChangeBasisPoints === undefined ? "non comparables" : formatRate(review.stressExpenseChangeBasisPoints)} par rapport au central.</p>${review.interruption ? `<p class="small"><strong>Interruption de revenu pendant ${review.interruption.months} mois :</strong> sans revenu économique de ${escapeHtml(review.interruption.person)}, autres revenus, charges et IR maintenus, déficit ${formatEuro(review.interruption.monthlyShortfallCents)}/mois ; disponible restant après installation et interruption ${formatEuro(review.interruption.reserveAfterCents)}. Test mécanique, hors indemnités, sans recalcul fiscal ni prévision de perte de mission.</p>` : ""}`;
}
