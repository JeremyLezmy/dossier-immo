import type { Dossier } from "@dossier-immo/schema";
import type { DerivedDossier } from "@dossier-immo/calculations";
import { escapeHtml, formatDate, formatEuro, formatRate } from "./format";

export function renderFinancialReview(
  dossier: Dossier,
  derived: DerivedDossier,
) {
  const reading = derived.incomePresentation;
  const central = dossier.budgetScenarios.find(
    (item) => item.kind === "central",
  )!;
  const scenario = derived.financingScenarios.find(
    (item) => item.id === derived.highlightedScenarioId,
  )!;
  return `<h2>Repères pour l’étude bancaire</h2>
  <h3>Situation actuelle et trajectoire à l’achat</h3>
  <p class="small">La base proposée utilise les revenus actifs au ${formatDate(reading.bankReferenceDate)}. Les montants ci-dessous sont des lectures distinctes, à valider avec l’établissement lors de l’octroi.</p>
  ${
    reading.automatic
      ? `<table class="compact"><thead><tr><th>Date et contrats actifs</th><th class="num">${escapeHtml(reading.primaryLabel)}</th><th class="num">Effort¹</th><th class="num">${escapeHtml(reading.prudentLabel)}</th><th class="num">Effort¹</th></tr></thead><tbody>
  <tr><td>Étude au ${formatDate(reading.bankReferenceDate)}</td><td class="num">${formatEuro(reading.bankCents)}</td><td class="num">${formatRate(derived.bankReadingEffortBasisPoints.now)}</td><td class="num">${formatEuro(reading.prudentCents)}</td><td class="num">${formatRate(derived.bankReadingEffortBasisPoints.prudentReference)}</td></tr>
  <tr><td>Achat au ${formatDate(dossier.project.targetPurchaseDate)}</td><td class="num">${formatEuro(reading.bankAtPurchaseCents)}</td><td class="num">${formatRate(scenario.effortRateCentralBasisPoints)}</td><td class="num">${formatEuro(reading.prudentAtPurchaseCents)}</td><td class="num">${formatRate(scenario.effortRatePrudentBasisPoints)}</td></tr>
  </tbody></table><p class="small">¹ Charges annuelles maximales du scénario central, assurance et crédits simultanés inclus. Les contrats échus à l’achat sont exclus. ${reading.hasBankForecast ? "Les bases incluent des CA prévisionnels, à actualiser avec le réalisé." : "Exercices de CA déclarés réalisés."} La trajectoire économique du budget de vie reste distincte.</p>`
      : `<table class="compact"><thead><tr><th>Lecture mensuelle</th><th class="num">Montant</th><th class="num">Effort¹</th><th>Portée</th></tr></thead><tbody>
  <tr><td>Convention proposée avec contrats actifs aujourd’hui</td><td class="num">${formatEuro(reading.bankNowCents)}</td><td class="num">${formatRate(derived.bankReadingEffortBasisPoints.now)}</td><td>Étude préparatoire ; justificatifs et prévisions à confirmer.</td></tr>
  <tr><td>Même convention à la date d’achat</td><td class="num">${formatEuro(reading.bankAtPurchaseCents)}</td><td class="num">${formatRate(derived.bankReadingEffortBasisPoints.atPurchase)}</td><td>Fin des contrats prise en compte, sans revalorisation du libéral.</td></tr>
  ${reading.fiscalCents === undefined ? "" : `<tr><td>Rythme cible converti en base fiscale</td><td class="num">${formatEuro(reading.fiscalCents)}</td><td class="num">${formatRate(derived.bankReadingEffortBasisPoints.projected ?? 0)}</td><td>Projection du budget central ; ne vaut pas revenu accepté par la banque.</td></tr>`}
  </tbody></table><p class="small">¹ Scénario immobilier central, assurance et crédits simultanés inclus. La dernière ligne est une sensibilité sur revenus projetés, à discuter avec la banque.</p>`
  }
  ${dossier.professionalActivities
    .filter((item) => item.compensationModel.kind === "salary")
    .map(
      (item) =>
        `<p class="small">${escapeHtml(item.compensationModel.note ?? "")}</p>`,
    )
    .join("")}
  <h3>Impôt du foyer : hypothèses et calcul</h3>
  <p class="small">Barème 2026 utilisé comme référence : 0 %, 11 %, 30 %, 41 %, 45 %, seuils par part 11 600 €, 29 579 €, 84 577 €, 181 917 €. IR brut avant décote, réductions et crédits ; les barèmes futurs ne sont pas connus. Salaire net imposable avec frais forfaitaires de 10 % ; micro-BNC après abattement de 34 % (minimum annuel 305 €).</p>
  <table class="compact"><thead><tr><th>Référence</th><th class="num">Parts</th><th class="num">Base annuelle</th><th class="num">IR brut / an</th><th class="num">Provision / mois</th></tr></thead><tbody>${derived.taxProjections.map((tax) => `<tr><td>${escapeHtml(tax.label)}</td><td class="num">${tax.parts}</td><td class="num">${formatEuro(tax.taxableCents)}</td><td class="num">${formatEuro(tax.annualTaxCents)}</td><td class="num">${formatEuro(tax.monthlyTaxCents)}</td></tr>`).join("")}</tbody></table>
  ${derived.taxProjections.map((tax) => `<p class="small"><strong>${escapeHtml(tax.label)}.</strong> ${escapeHtml(tax.note)}</p>`).join("")}
  <h3>Crédits en cours : échéances et remboursement anticipé</h3>
  <table class="compact"><thead><tr><th>Option</th><th class="num">Somme à régler</th><th class="num">${dossier.cashFlowPlan?.reservedTaxCents ? "Réserve libre" : "Réserve après achat"}</th><th class="num">Effort à l’achat</th></tr></thead><tbody><tr><td>Maintien des crédits en cours</td><td class="num">—</td><td class="num">${formatEuro(dossier.cashFlowPlan?.reservedTaxCents ? scenario.freeReserveAfterPurchaseCents : scenario.reserveAfterPurchaseCents)}</td><td class="num">${formatRate(scenario.effortRateCentralBasisPoints)}</td></tr>${derived.prepaymentComparisons.map((item) => `<tr><td>Clôture : ${escapeHtml(item.label)}</td><td class="num">${formatEuro(item.settlementCents)}</td><td class="num">${formatEuro(dossier.cashFlowPlan?.reservedTaxCents ? item.freeReserveCents : item.reserveCents)}</td><td class="num">${formatRate(item.effortBasisPoints)}</td></tr>`).join("")}</tbody></table>
  <p class="small">Comparaison à apport immobilier inchangé, remboursement prélevé sur la réserve. Décompte du prêteur et maintien des services ou garanties à confirmer. Les ratios retiennent le maximum annuel des charges, assurance comprise ; un crédit court ne disparaît pas du calcul initial.</p>
  <p class="small">${dossier.liabilities
    .filter((item) => item.endDate)
    .map(
      (item) =>
        `${escapeHtml(item.label)} : ${formatEuro(item.monthlyPaymentCents)} / mois jusqu’au ${formatDate(item.endDate!)}${item.servicesMonthlyCents ? `, dont ${formatEuro(item.servicesMonthlyCents)} de services` : ""}.`,
    )
    .join(" ")}</p>
  <p class="small"><strong>Effet des crédits, toutes autres hypothèses inchangées :</strong> ${(
    derived.budgetSavingsPhases[central.id] ?? []
  )
    .slice(0, 3)
    .map(
      (item) =>
        `${formatDate(item.date)} : autres crédits ${formatEuro(item.debtCents)} / mois`,
    )
    .join(" ; ")}. Les revenus futurs restent des hypothèses d’activité.</p>`;
}

export function renderRateComparison(
  dossier: Dossier,
  derived: DerivedDossier,
) {
  const selected = dossier.financingScenarios.filter(
    (item) => !item.displayInMainTable,
  );
  if (!selected.length) return "";
  return `<h3>Conditions de financement comparées</h3><table class="compact"><thead><tr><th>Variante</th><th class="num">Taux nominal</th><th class="num">Assurance / an</th><th class="num">Mensualité immo max.</th><th class="num">Effort à l’achat</th></tr></thead><tbody>${selected
    .map((item) => {
      const result = derived.financingScenarios.find(
        (scenario) => scenario.id === item.id,
      )!;
      return `<tr><td>${escapeHtml(item.label)}</td><td class="num">${formatRate(item.annualRateBasisPoints)}</td><td class="num">${formatRate(item.insuranceAnnualBasisPoints)}</td><td class="num">${formatEuro(result.maximumMonthlyPaymentIncludingInsuranceCents)}</td><td class="num">${formatRate(result.effortRateCentralBasisPoints)}</td></tr>`;
    })
    .join(
      "",
    )}</tbody></table><p class="small">Assurance exprimée en coût annuel total du foyer sur le capital initial, quotités incluses. Les variantes et leurs hypothèses sont modifiables dans Financement ; aucune ne constitue une offre.</p>`;
}
