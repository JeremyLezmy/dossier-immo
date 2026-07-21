import type {
  DerivedDossier,
  FinancingLoanComponentResult,
} from "@dossier-immo/calculations";
import {
  assetCategoryLabels,
  compensationModelLabels,
  documentCategoryLabels,
  documentStatusLabels,
  housingStatusLabels,
  incomeKindLabels,
  matrimonialRegimeLabels,
  personRoleLabels,
  professionalEngagementLabels,
  professionalStatusLabels,
  projectTypeLabels,
  relationshipStatusLabels,
} from "@dossier-immo/domain";
import type { Dossier, ProfessionalActivity } from "@dossier-immo/schema";
import { renderBudgetSankey, renderIndependentComparisonChart } from "./charts";
import { escapeHtml, formatDate, formatEuro, formatRate } from "./format";
import { printStyles } from "./print-styles";

type SectionKey = keyof Dossier["presentation"]["sections"];

function page(
  dossier: Dossier,
  number: number,
  content: string,
  className = "",
): string {
  return `<section class="page ${className}">${content}<div class="page-number" data-footer="Page ${number} — ${escapeHtml(dossier.presentation.footer)}"></div></section>`;
}

function paragraphs(text: string): string {
  if (/<\/?(?:p|div|strong|b|em|i|ul|ol|li|font|span|br)\b/i.test(text))
    return safeRichText(text);
  return plainNarrative(text)
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`,
    )
    .join("");
}

function safeRichText(input: string): string {
  const tokens: string[] = [];
  const normalizedInput = input.replace(/&nbsp;|\u00a0/gi, " ");
  const tokenized = normalizedInput.replace(
    /<\/?(?:p|div|strong|b|em|i|ul|ol|li|br)\s*\/?\s*>|<font\s+size="[1-7]"\s*>|<\/font\s*>|<span\s+style="font-size:\s*(?:8|10|12|14|16|18|20|22)px;?"\s*>|<\/span\s*>/gi,
    (tag) => {
      const normalized = tag
        .replace(/^<b>$/i, "<strong>")
        .replace(/^<\/b>$/i, "</strong>")
        .replace(/^<i>$/i, "<em>")
        .replace(/^<\/i>$/i, "</em>")
        .replace(/^<div>$/i, "<p>")
        .replace(/^<\/div>$/i, "</p>")
        .replace(/^<font\s+size="1"\s*>$/i, '<span style="font-size:8px">')
        .replace(/^<font\s+size="2"\s*>$/i, '<span style="font-size:10px">')
        .replace(/^<font\s+size="3"\s*>$/i, '<span style="font-size:12px">')
        .replace(/^<font\s+size="4"\s*>$/i, '<span style="font-size:14px">')
        .replace(/^<font\s+size="5"\s*>$/i, '<span style="font-size:16px">')
        .replace(/^<font\s+size="6"\s*>$/i, '<span style="font-size:18px">')
        .replace(/^<font\s+size="7"\s*>$/i, '<span style="font-size:20px">')
        .replace(/^<\/font>$/i, "</span>");
      const token = `RICH_TEXT_TOKEN_${tokens.length}_END`;
      tokens.push(normalized);
      return token;
    },
  );
  let safe = escapeHtml(tokenized);
  tokens.forEach((tag, index) => {
    safe = safe.replace(`RICH_TEXT_TOKEN_${index}_END`, tag);
  });
  return safe;
}

function plainNarrative(text: string): string {
  return text
    .replace(/<\/?(?:p|div|ul|ol|li|br)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*\|?\s*:?-{3,}/.test(line))
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);
        return cells.length >= 2
          ? `${cells[0]} : ${cells.slice(1).join(" · ")}`
          : (cells[0] ?? "");
      }
      return line
        .replace(/^\s{0,3}#{1,6}\s+/, "")
        .replace(/^\s*[-*+]\s+/, "• ")
        .replace(/^\s*\d+[.)]\s+/, "• ")
        .replace(/[*_`]/g, "");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function conciseParagraphs(text: string, maximumCharacters: number): string {
  if (/<\/?(?:p|div|strong|b|em|i|ul|ol|li|font|span|br)\b/i.test(text))
    return safeRichText(text);
  const plain = plainNarrative(text);
  if (plain.length <= maximumCharacters) return paragraphs(plain);
  const prefix = plain.slice(0, maximumCharacters + 1);
  const boundary = Math.max(
    prefix.lastIndexOf(". "),
    prefix.lastIndexOf("\n"),
    prefix.lastIndexOf("; "),
  );
  return paragraphs(
    `${prefix.slice(0, boundary > maximumCharacters * 0.55 ? boundary + 1 : maximumCharacters).trim()}…`,
  );
}

function editorial(
  dossier: Dossier,
  section: SectionKey,
  position: "introduction" | "callout" | "conclusion",
  className = "",
): string {
  const value = dossier.editorial.sectionSlots[section]?.[position]?.trim();
  if (!value) return "";
  if (position === "callout")
    return `<div class="callout ${className}">${conciseParagraphs(value, 520)}</div>`;
  return `<div class="editorial-${position}">${conciseParagraphs(value, 240)}</div>`;
}

function loanPaymentPhase(component: FinancingLoanComponentResult): string {
  if (component.deferredMonths === 0)
    return `${formatEuro(component.amortizingMonthlyPaymentExcludingInsuranceCents)} dès le mois 1`;
  const deferredPhase =
    component.deferredMonthlyPaymentExcludingInsuranceCents === 0
      ? "0 € hors assurance"
      : `${formatEuro(component.deferredMonthlyPaymentExcludingInsuranceCents)} d’intérêts seuls`;
  return `${deferredPhase} pendant ${component.deferredMonths} mois, puis ${formatEuro(component.amortizingMonthlyPaymentExcludingInsuranceCents)}`;
}

function financingComposition(
  dossier: Dossier,
  derived: DerivedDossier,
): string {
  return dossier.financingScenarios
    .filter((scenario) => scenario.additionalLoanComponents.length > 0)
    .map((scenario) => {
      const result = derived.financingScenarios.find(
        (candidate) => candidate.id === scenario.id,
      );
      if (!result)
        throw new Error(`Résultat de financement introuvable : ${scenario.id}`);
      const paymentSummary =
        result.initialMonthlyPaymentIncludingInsuranceCents ===
        result.maximumMonthlyPaymentIncludingInsuranceCents
          ? ""
          : `<p class="small financing-phase-summary"><strong>Phases globales :</strong> mensualité initiale estimée ${formatEuro(result.initialMonthlyPaymentIncludingInsuranceCents)} ; mensualité maximale estimée ${formatEuro(result.maximumMonthlyPaymentIncludingInsuranceCents)} à partir du mois ${result.maximumPaymentStartMonth}, assurance comprise.</p>`;
      return `<h3>Composition du financement — ${escapeHtml(result.label)}</h3><table class="compact financing-composition-table"><thead><tr><th>Ligne</th><th class="num">Montant</th><th class="num">Taux nominal</th><th class="num">Amortissement</th><th class="num">Différé</th><th>Phase estimée hors assurance</th></tr></thead><tbody>${result.loanComponents.map((component) => `<tr><td><strong>${escapeHtml(component.label)}</strong></td><td class="num">${formatEuro(component.principalCents)}</td><td class="num">${formatRate(component.annualRateBasisPoints)}</td><td class="num">${component.durationMonths} mois</td><td class="num">${component.deferredMonths > 0 ? `${component.deferredMonths} mois` : "Aucun"}</td><td>${loanPaymentPhase(component)}</td></tr>`).join("")}</tbody></table>${paymentSummary}`;
    })
    .join("");
}

function ageAt(birthDate: string | undefined, referenceDate: string): string {
  if (!birthDate) return "—";
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const reference = new Date(`${referenceDate}T00:00:00Z`);
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  if (
    reference.getUTCMonth() < birth.getUTCMonth() ||
    (reference.getUTCMonth() === birth.getUTCMonth() &&
      reference.getUTCDate() < birth.getUTCDate())
  )
    age -= 1;
  return String(age);
}

function activityIndicators(activity: ProfessionalActivity): string[] {
  const model = activity.compensationModel;
  if (model.kind === "salary")
    return [
      ...(model.contractualGrossAnnualCents != null
        ? [
            `Salaire brut annuel : ${formatEuro(model.contractualGrossAnnualCents)}`,
          ]
        : []),
      ...(model.workTimeBasisPoints != null
        ? [`Quotité : ${formatRate(model.workTimeBasisPoints)}`]
        : []),
    ];
  if (model.kind === "day-rate")
    return [
      `TJM : ${formatEuro(model.dailyRateCents)} HT`,
      ...(model.billableDaysPerYear != null
        ? [`${model.billableDaysPerYear} jours facturables / an`]
        : []),
      ...(model.collectionDelayDays != null
        ? [`Délai d'encaissement : ${model.collectionDelayDays} jours`]
        : []),
    ];
  if (model.kind === "consultation")
    return [
      ...(model.consultationFeeCents != null
        ? [`Tarif par consultation : ${formatEuro(model.consultationFeeCents)}`]
        : []),
      ...(model.consultationsPerWeek != null
        ? [`${model.consultationsPerWeek} consultations / semaine`]
        : []),
      ...(model.workingWeeksPerYear != null
        ? [`${model.workingWeeksPerYear} semaines / an`]
        : []),
      ...(model.collectionDelayDays != null
        ? [`Délai d'encaissement : ${model.collectionDelayDays} jours`]
        : []),
    ];
  if (model.kind === "turnover")
    return [
      ...(model.annualTurnoverCents != null
        ? [`CA annuel de référence : ${formatEuro(model.annualTurnoverCents)}`]
        : []),
      ...(model.collectionDelayDays != null
        ? [`Délai d'encaissement : ${model.collectionDelayDays} jours`]
        : []),
    ];
  if (model.kind === "hourly")
    return [
      `Taux horaire : ${formatEuro(model.hourlyRateCents)}`,
      ...(model.hoursPerWeek != null
        ? [`${model.hoursPerWeek} heures / semaine`]
        : []),
      ...(model.collectionDelayDays != null
        ? [`Délai d'encaissement : ${model.collectionDelayDays} jours`]
        : []),
    ];
  if (model.kind === "commission")
    return [
      ...(model.referenceAnnualCommissionCents != null
        ? [
            `Commission annuelle de référence : ${formatEuro(model.referenceAnnualCommissionCents)}`,
          ]
        : []),
      ...(model.collectionDelayDays != null
        ? [`Délai d'encaissement : ${model.collectionDelayDays} jours`]
        : []),
    ];
  return [model.description];
}

function documentStatusClass(
  status: Dossier["supportingDocuments"][number]["status"],
): string {
  if (status === "available" || status === "verified")
    return "document-status--positive";
  if (status === "missing" || status === "requested")
    return "document-status--attention";
  return "document-status--neutral";
}

function supportingDocumentsTable(
  dossier: Dossier,
  people: readonly Dossier["household"]["people"][number][],
): string {
  const groups = new Map<
    Dossier["supportingDocuments"][number]["category"],
    Dossier["supportingDocuments"]
  >();
  for (const document of dossier.supportingDocuments)
    groups.set(document.category, [
      ...(groups.get(document.category) ?? []),
      document,
    ]);
  const ordered = [...groups.entries()].sort(([a], [b]) =>
    a === "other"
      ? 1
      : b === "other"
        ? -1
        : documentCategoryLabels[a].localeCompare(
            documentCategoryLabels[b],
            "fr",
          ),
  );
  return `<table class="compact documents-multiindex"><thead><tr><th>Catégorie</th><th>Pièce</th><th>Responsable</th><th>Statut</th></tr></thead><tbody>${ordered.flatMap(([category, documents]) => documents.map((document, index) => `<tr class="${index === 0 ? "document-category-start" : ""}">${index === 0 ? `<th class="document-category" rowspan="${documents.length}">${escapeHtml(documentCategoryLabels[category])}</th>` : ""}<td><strong>${escapeHtml(document.label)}</strong>${document.note ? `<br><span class="small">${escapeHtml(document.note)}</span>` : ""}</td><td>${escapeHtml(document.responsibleParty ?? people.find((person) => person.id === document.ownerId)?.displayName ?? "Foyer")}</td><td class="document-status ${documentStatusClass(document.status)}">${escapeHtml(documentStatusLabels[document.status])}</td></tr>`)).join("")}</tbody></table>`;
}

function assetsByOwnerTable(
  dossier: Dossier,
  people: readonly Dossier["household"]["people"][number][],
): string {
  const groups = new Map<string, Dossier["assets"]>();
  for (const asset of dossier.assets) {
    const key = asset.ownerIds.length === 1 ? asset.ownerIds[0]! : "household";
    groups.set(key, [...(groups.get(key) ?? []), asset]);
  }
  const orderedKeys = [
    ...people.map((person) => person.id),
    "household",
  ].filter((key) => groups.has(key));
  const rows = orderedKeys
    .flatMap((key) => {
      const assets = groups.get(key) ?? [];
      const owner =
        key === "household"
          ? "Foyer"
          : (people.find((person) => person.id === key)?.displayName ?? key);
      const assetRows = assets.map(
        (asset, index) =>
          `<tr class="${index === 0 ? "owner-start" : ""}">${index === 0 ? `<th class="owner-index" rowspan="${assets.length + 1}">${escapeHtml(owner)}</th>` : ""}<td><strong>${escapeHtml(asset.label)}</strong></td><td>${escapeHtml(assetCategoryLabels[asset.category])}</td><td class="num">${formatEuro(asset.amountCents)}</td><td class="num">${asset.availableForContribution ? formatEuro(asset.contributionAmountCents ?? asset.amountCents) : "—"}</td><td>${escapeHtml(asset.note ?? "")}</td></tr>`,
      );
      const total = assets.reduce((sum, asset) => sum + asset.amountCents, 0);
      const mobilisable = assets
        .filter((asset) => asset.availableForContribution)
        .reduce(
          (sum, asset) =>
            sum + (asset.contributionAmountCents ?? asset.amountCents),
          0,
        );
      assetRows.push(
        `<tr class="owner-total"><td colspan="2">Sous-total ${escapeHtml(owner)}</td><td class="num">${formatEuro(total)}</td><td class="num">${mobilisable > 0 ? formatEuro(mobilisable) : "—"}</td><td></td></tr>`,
      );
      return assetRows;
    })
    .join("");
  const total = dossier.assets.reduce(
    (sum, asset) => sum + asset.amountCents,
    0,
  );
  const mobilisable = dossier.assets
    .filter((asset) => asset.availableForContribution)
    .reduce(
      (sum, asset) =>
        sum + (asset.contributionAmountCents ?? asset.amountCents),
      0,
    );
  return `<table class="compact assets-multiindex"><thead><tr><th>Titulaire</th><th>Support</th><th>Nature</th><th class="num">Valeur</th><th class="num">Mobilisable retenu</th><th>Lecture bancaire</th></tr></thead><tbody>${rows}<tr class="total-row"><th colspan="3">Total patrimoine déclaré</th><td class="num">${formatEuro(total)}</td><td class="num">${formatEuro(mobilisable)}</td><td>Apport central prévu : ${formatEuro(dossier.project.contributionCents)}</td></tr></tbody></table>`;
}

function searchAreaList(areas: readonly string[]): string {
  return `<div class="search-area-list">${areas
    .map((area) => {
      const separator = area.indexOf(":");
      const title = separator >= 0 ? area.slice(0, separator) : area;
      const details = separator >= 0 ? area.slice(separator + 1).trim() : "";
      return `<div><strong>${escapeHtml(title.trim())}</strong>${details ? `<span>${escapeHtml(details)}</span>` : ""}</div>`;
    })
    .join("")}</div>`;
}

export function renderBankDocument(
  dossier: Dossier,
  derived: DerivedDossier,
): string {
  const sections = dossier.presentation.sections;
  const people = dossier.household.people.filter(
    (person) => person.role !== "dependent",
  );
  const central = derived.financingScenarios.find(
    (scenario) => scenario.id === derived.highlightedScenarioId,
  );
  const centralBudget = dossier.budgetScenarios.find(
    (budget) => budget.kind === "central",
  );
  const stressBudget = dossier.budgetScenarios.find(
    (budget) => budget.kind === "stress",
  );
  if (!central || !centralBudget || !stressBudget)
    throw new Error(
      "Le document exige un scénario principal, un budget central et un budget stress explicites.",
    );
  const centralFinancing = derived.financingScenarios.find(
    (scenario) =>
      scenario.id ===
      (centralBudget.assumptions.financingScenarioId ??
        derived.highlightedScenarioId),
  );
  const stressFinancing = derived.financingScenarios.find(
    (scenario) =>
      scenario.id ===
      (stressBudget.assumptions.financingScenarioId ??
        derived.highlightedScenarioId),
  );
  if (!centralFinancing || !stressFinancing)
    throw new Error("Le financement associé à un budget est introuvable.");
  let pageNumber = 0;
  const pages: string[] = [];

  if (sections.cover)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <div class="eyebrow">${escapeHtml(dossier.metadata.title)}</div>
    <div><h1>${escapeHtml(dossier.presentation.title)}</h1><p class="lead">${escapeHtml(dossier.presentation.subtitle)}</p>${editorial(dossier, "cover", "introduction")}
    <div class="meta-grid"><div class="meta"><span>Date d'édition</span><strong>${formatDate(dossier.metadata.updatedAt)}</strong></div><div class="meta"><span>Date cible d'achat</span><strong>${formatDate(dossier.project.targetPurchaseDate)}</strong></div><div class="meta"><span>Budget cible</span><strong>${formatEuro(dossier.project.minimumPriceCents ?? dossier.project.targetPriceCents)} à ${formatEuro(dossier.project.comfortableMaximumPriceCents ?? dossier.project.targetPriceCents)}</strong></div><div class="meta"><span>Plafond exceptionnel</span><strong>${formatEuro(dossier.project.maximumPriceCents)}</strong></div><div class="meta"><span>Liquidités visées</span><strong>${formatEuro(derived.projectedLiquidityAtPurchaseCents)}</strong></div><div class="meta"><span>Revenus avant IR</span><strong>${formatEuro(derived.incomeCentralCents)} / mois</strong></div><div class="meta"><span>Apport central</span><strong>${formatEuro(dossier.project.contributionCents)}</strong></div><div class="meta"><span>Trésorerie conservée</span><strong>≥ ${formatEuro(dossier.reservePolicy.minimumCents)}</strong></div></div>${editorial(dossier, "cover", "callout")}</div>
    <div>${editorial(dossier, "cover", "conclusion")}<p class="footer-note">Document fondé sur les données observées au ${formatDate(dossier.metadata.observationDate)} ; à actualiser au dépôt.</p></div>
  `,
        "cover",
      ),
    );

  if (
    sections.presentationLetter &&
    dossier.editorial.presentationLetter.trim()
  )
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Lettre de présentation</h2>${dossier.metadata.editionCity ? `<p class="letter-place">${escapeHtml(dossier.metadata.editionCity)}, le ${formatDate(dossier.metadata.updatedAt)}</p>` : ""}${paragraphs(dossier.editorial.presentationLetter)}
  `,
        "letter-page",
      ),
    );

  if (sections.household) {
    const hasProfessionalActivities = dossier.professionalActivities.length > 0;
    const incomeByPerson = new Map(
      people.map((person) => [
        person.id,
        dossier.incomeStreams
          .filter(
            (income) =>
              income.personId === person.id &&
              income.includedInBorrowingCapacity,
          )
          .reduce((sum, income) => sum + income.monthlyBankCents, 0),
      ]),
    );
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
      <h2>Synthèse foyer</h2>${editorial(dossier, "household", "introduction")}
      <table><thead><tr><th>Emprunteur</th><th class="num">Âge</th>${hasProfessionalActivities ? "<th>Profession</th><th>Statut</th>" : ""}<th class="num">Revenu net avant IR retenu</th></tr></thead><tbody>${people
        .map((person) => {
          const activities = dossier.professionalActivities.filter(
            (activity) => activity.personId === person.id,
          );
          const professionalCells = hasProfessionalActivities
            ? `<td>${activities.map((activity) => escapeHtml(activity.occupation)).join("<br>") || "Non renseigné"}</td><td>${activities.map((activity) => escapeHtml(professionalStatusLabels[activity.status])).join("<br>") || "Non renseigné"}</td>`
            : "";
          return `<tr><td><strong>${escapeHtml(person.displayName)}</strong><br><span class="small">${escapeHtml(personRoleLabels[person.role])}</span></td><td class="num">${ageAt(person.birthDate, dossier.metadata.observationDate)}</td>${professionalCells}<td class="num">${formatEuro(incomeByPerson.get(person.id) ?? 0)}</td></tr>`;
        })
        .join("")}</tbody></table>
      <table><tbody><tr><th>Situation familiale</th><td>${escapeHtml(relationshipStatusLabels[dossier.household.relationshipStatus])}</td></tr><tr><th>Régime matrimonial</th><td>${escapeHtml(dossier.household.matrimonialRegime ? matrimonialRegimeLabels[dossier.household.matrimonialRegime] : "Non renseigné")}</td></tr><tr><th>Logement actuel</th><td>${escapeHtml(dossier.household.currentHousingDescription ?? housingStatusLabels[dossier.household.housingStatus])}${dossier.household.currentMonthlyRentCents > 0 ? ` · ${formatEuro(dossier.household.currentMonthlyRentCents)} / mois` : ""}</td></tr><tr><th>Historique locatif</th><td>${escapeHtml(dossier.household.rentHistoryNote ?? "Non renseigné")}</td></tr><tr><th>Incidents de paiement</th><td>${escapeHtml(dossier.household.paymentIncidentsNote ?? "Non renseigné")}</td></tr>${dossier.household.plannedHouseholdEvents.length > 0 ? `<tr><th>Évolutions envisagées</th><td>${dossier.household.plannedHouseholdEvents.map((event) => escapeHtml(`${event.label}${event.note ? ` — ${event.note}` : ""}`)).join("<br>")}</td></tr>` : ""}</tbody></table>${editorial(dossier, "household", "callout") || `<div class="callout">${conciseParagraphs(dossier.editorial.householdSummary, 520)}</div>`}
    `,
      ),
    );
  }

  if (sections.income && dossier.incomeStreams.length > 0)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Revenus retenus</h2>${editorial(dossier, "income", "introduction")}<div class="kpi-grid"><div class="kpi"><span>Scénario central</span><strong>${formatEuro(derived.incomeCentralCents)}</strong><small>avant IR / mois</small></div><div class="kpi"><span>Scénario prudent</span><strong>${formatEuro(derived.incomePrudentCents)}</strong><small>avant IR / mois</small></div><div class="kpi"><span>Après IR estimé</span><strong>${formatEuro(dossier.estimatedHouseholdAfterTaxIncomeCents)}</strong><small>hypothèse budgétaire</small></div></div>${editorial(dossier, "income", "callout", "prudent")}
    <table><thead><tr><th>Personne</th><th>Nature et justification</th><th class="num">Central</th><th class="num">Prudent</th></tr></thead><tbody>${dossier.incomeStreams.map((income) => `<tr><td>${escapeHtml(people.find((person) => person.id === income.personId)?.displayName ?? "Foyer")}</td><td><strong>${escapeHtml(income.label)}</strong><br><span class="small">${escapeHtml(incomeKindLabels[income.kind])}</span>${income.note ? `<br>${escapeHtml(income.note)}` : ""}</td><td class="num">${formatEuro(income.monthlyBankCents)}</td><td class="num">${formatEuro(income.monthlyPrudentCents)}</td></tr>`).join("")}</tbody></table>${editorial(dossier, "income", "conclusion")}
  `,
      ),
    );

  if (
    sections.riskManagement &&
    (dossier.editorial.professionalStabilityItems.length > 0 ||
      dossier.professionalActivities.length > 0)
  )
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Éléments de stabilité et de maîtrise du risque</h2>${editorial(dossier, "riskManagement", "introduction")}${dossier.editorial.professionalStabilityItems.length > 0 ? `<div class="risk-grid">${dossier.editorial.professionalStabilityItems.map((item) => `<div class="risk-card"><h3>${escapeHtml(item.title)}</h3>${conciseParagraphs(item.body, 520)}</div>`).join("")}</div>` : ""}
    ${dossier.professionalActivities.length > 0 ? `<h3>Activités professionnelles</h3><table class="compact"><thead><tr><th>Personne</th><th>Activité</th><th>Début</th><th>Statut / exercice</th><th>Indicateurs pertinents</th></tr></thead><tbody>${dossier.professionalActivities.map((activity) => `<tr><td><strong>${escapeHtml(people.find((person) => person.id === activity.personId)?.displayName ?? activity.personId)}</strong></td><td><strong>${escapeHtml(activity.label)}</strong><br>${escapeHtml(activity.occupation)}</td><td>${formatDate(activity.startDate)}</td><td>${escapeHtml(activity.legalRegime ?? professionalStatusLabels[activity.status])}<br><span class="small">${escapeHtml(professionalEngagementLabels[activity.engagementType])}</span></td><td>${activityIndicators(activity).map(escapeHtml).join("<br>") || escapeHtml(compensationModelLabels[activity.compensationModel.kind])}</td></tr>`).join("")}</tbody></table>` : ""}${editorial(dossier, "riskManagement", "conclusion")}
  `,
      ),
    );

  if (sections.assets && dossier.assets.length > 0)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Patrimoine, liquidités et apport</h2>${editorial(dossier, "assets", "introduction")}<div class="kpi-grid"><div class="kpi"><span>Patrimoine déclaré</span><strong>${formatEuro(derived.totalAssetsCents)}</strong></div><div class="kpi"><span>Liquidités</span><strong>${formatEuro(derived.liquidAssetsCents)}</strong></div><div class="kpi"><span>Mobilisable pour apport</span><strong>${formatEuro(derived.contributionLiquidityCents)}</strong></div></div>
    ${assetsByOwnerTable(dossier, people)}${editorial(dossier, "assets", "callout", "prudent")}${editorial(dossier, "assets", "conclusion")}
  `,
        "patrimoine-page",
      ),
    );

  if (sections.cashReserve)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Trésorerie conservée après achat</h2>${editorial(dossier, "cashReserve", "introduction")}${editorial(dossier, "cashReserve", "callout", "prudent") || `<div class="callout prudent reserve-convention">${conciseParagraphs(dossier.editorial.reserveStrategy, 300)}</div>`}
    ${dossier.reservePolicy.allocations.length > 0 ? `<table><thead><tr><th>Poche</th><th class="num">Montant affecté</th><th>Fonction</th></tr></thead><tbody>${dossier.reservePolicy.allocations.map((allocation) => `<tr><td>${escapeHtml(allocation.label)}</td><td class="num">${formatEuro(allocation.amountCents)}</td><td>${escapeHtml(allocation.note ?? "")}</td></tr>`).join("")}<tr class="total-row"><td>Réserve ventilée</td><td class="num">${formatEuro(dossier.reservePolicy.allocations.reduce((total, allocation) => total + allocation.amountCents, 0))}</td><td>Seuil minimal de sécurité : ${formatEuro(dossier.reservePolicy.minimumCents)} · marge : ${formatEuro(Math.max(0, dossier.reservePolicy.targetCents - dossier.reservePolicy.minimumCents))}</td></tr></tbody></table>` : ""}${editorial(dossier, "cashReserve", "conclusion")}
  `,
      ),
    );

  if (sections.project)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Projet immobilier</h2>${editorial(dossier, "project", "introduction")}<div class="kpi-grid"><div class="kpi"><span>Budget cible</span><strong>${formatEuro(dossier.project.minimumPriceCents ?? dossier.project.targetPriceCents)} à ${formatEuro(dossier.project.comfortableMaximumPriceCents ?? dossier.project.targetPriceCents)}</strong></div><div class="kpi"><span>Plafond</span><strong>${formatEuro(dossier.project.maximumPriceCents)}</strong></div><div class="kpi"><span>Horizon</span><strong>${formatDate(dossier.project.targetPurchaseDate)}</strong></div></div>${conciseParagraphs(dossier.editorial.projectSummary, 220)}
    <table><tbody><tr><th>Nature du projet</th><td>${escapeHtml(projectTypeLabels[dossier.project.projectType])}</td></tr><tr><th>Type de bien</th><td>${escapeHtml(dossier.project.criteria.propertyType)}</td></tr><tr><th>Surface</th><td>${dossier.project.criteria.minimumSurfaceSquareMeters ?? "—"} m² minimum · ${escapeHtml(dossier.project.criteria.idealSurfaceLabel ?? "")}</td></tr><tr><th>Terrain</th><td>${dossier.project.criteria.minimumLandSquareMeters ?? "—"} m² minimum · ${escapeHtml(dossier.project.criteria.idealLandLabel ?? "")}</td></tr><tr><th>Organisation</th><td>${dossier.project.criteria.minimumBedrooms ?? "—"} chambres · ${escapeHtml(dossier.project.criteria.office ?? "")}</td></tr><tr><th>Piscine</th><td>${escapeHtml(dossier.project.criteria.pool ?? "—")}</td></tr><tr><th>DPE</th><td>${escapeHtml(dossier.project.criteria.energyRating ?? "—")}</td></tr><tr><th>Travaux</th><td>${escapeHtml(dossier.project.criteria.works ?? "—")}</td></tr><tr><th>Services et trajet</th><td>${escapeHtml([dossier.project.criteria.services, dossier.project.criteria.commute].filter(Boolean).join(" · ") || "—")}</td></tr>${dossier.project.criteria.additionalCriteria.map((criterion) => `<tr><th>${escapeHtml(criterion.label)}</th><td>${escapeHtml(criterion.value)}${criterion.note ? ` · ${escapeHtml(criterion.note)}` : ""}</td></tr>`).join("")}</tbody></table>${dossier.project.criteria.preferredAreas.length > 0 ? `<h3>Zones de recherche</h3>${searchAreaList(dossier.project.criteria.preferredAreas)}` : ""}${editorial(dossier, "project", "callout")}${editorial(dossier, "project", "conclusion")}
  `,
        "project-page",
      ),
    );

  if (sections.financing)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Scénarios de financement</h2>${editorial(dossier, "financing", "introduction")}${editorial(dossier, "financing", "callout", "prudent")}
    <table class="compact financing-table"><thead><tr><th>Scénario</th><th class="num">Prix</th><th class="num">Frais notaire</th><th class="num">Apport</th><th class="num">Prêt</th><th class="num">Taux</th><th class="num">Assurance</th><th class="num">Mensualité max.</th><th class="num">Effort central</th><th class="num">Effort prudent</th></tr></thead><tbody>${derived.financingScenarios
      .filter(
        (scenario) =>
          dossier.financingScenarios.find((item) => item.id === scenario.id)
            ?.displayInMainTable !== false,
      )
      .map((scenario) => {
        const source = dossier.financingScenarios.find(
          (item) => item.id === scenario.id,
        );
        const price =
          source?.priceOverrideCents ?? dossier.project.targetPriceCents;
        const fees = Math.round(
          (price * dossier.project.acquisitionFeeBasisPoints) / 10_000,
        );
        return `<tr class="${scenario.id === derived.highlightedScenarioId ? "central-row" : ""}"><td><strong>${escapeHtml(scenario.label)}</strong></td><td class="num">${formatEuro(price)}</td><td class="num">${formatEuro(fees)}</td><td class="num">${formatEuro(source?.contributionOverrideCents ?? dossier.project.contributionCents)}</td><td class="num">${formatEuro(scenario.principalCents)}</td><td class="num">${formatRate(source?.annualRateBasisPoints ?? 0)}</td><td class="num">${formatRate(source?.insuranceAnnualBasisPoints ?? 0)}</td><td class="num"><strong>${formatEuro(scenario.maximumMonthlyPaymentIncludingInsuranceCents)}</strong></td><td class="num">${formatRate(scenario.effortRateCentralBasisPoints)}</td><td class="num">${formatRate(scenario.effortRatePrudentBasisPoints)}</td></tr>`;
      })
      .join(
        "",
      )}</tbody></table><p class="small financing-note"><strong>Mensualité maximale :</strong> estimation prudente, assurance emprunteur constante incluse. <strong>Effort central :</strong> rapporté à ${formatEuro(derived.incomeCentralCents)}. <strong>Effort prudent :</strong> rapporté à ${formatEuro(derived.incomePrudentCents)}. Le crédit existant à la date d'achat est inclus dans les deux ratios.</p>
    ${financingComposition(dossier, derived)}
    ${editorial(dossier, "financing", "conclusion")}
  `,
        "financing-page",
      ),
    );

  if (sections.sankey)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `${renderBudgetSankey(dossier, derived)}`,
        "landscape sankey-page",
      ),
    );

  if (sections.postPurchaseBudget) {
    const stressBySource = new Map(
      stressBudget.items.map((item) => [item.sourceItemId, item]),
    );
    const centralDebt =
      centralFinancing.maximumMonthlyPaymentIncludingInsuranceCents +
      centralFinancing.existingDebtAtPurchaseCents;
    const stressDebt =
      stressFinancing.maximumMonthlyPaymentIncludingInsuranceCents +
      stressFinancing.existingDebtAtPurchaseCents;
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
      <h2>Budget post-achat</h2>${editorial(dossier, "postPurchaseBudget", "introduction")}<table><thead><tr><th>Poste</th><th class="num">${escapeHtml(centralBudget.label)}</th><th class="num">${escapeHtml(stressBudget.label)}</th></tr></thead><tbody>
      <tr><td>Mensualité immobilière maximale estimée, assurance comprise</td><td class="num">${formatEuro(centralFinancing.maximumMonthlyPaymentIncludingInsuranceCents)}</td><td class="num">${formatEuro(stressFinancing.maximumMonthlyPaymentIncludingInsuranceCents)}</td></tr><tr><td>Crédits existants à la date d'achat</td><td class="num">${formatEuro(centralFinancing.existingDebtAtPurchaseCents)}</td><td class="num">${formatEuro(stressFinancing.existingDebtAtPurchaseCents)}</td></tr>
      ${centralBudget.items
        .map((item) => {
          const stressItem = stressBySource.get(item.id);
          if (!stressItem)
            throw new Error(`Poste stress manquant : ${item.id}`);
          return `<tr><td>${escapeHtml(item.label)}</td><td class="num">${formatEuro(item.amountCents)}</td><td class="num">${formatEuro(stressItem.amountCents)}</td></tr>`;
        })
        .join("")}
      <tr class="total-row"><td>Total dépenses post-achat estimées</td><td class="num">${formatEuro((derived.budgetTotalsCents[centralBudget.id] ?? 0) + centralDebt)}</td><td class="num">${formatEuro((derived.budgetTotalsCents[stressBudget.id] ?? 0) + stressDebt)}</td></tr><tr><td>Revenu foyer après IR estimé</td><td class="num">${formatEuro(derived.budgetIncomeCents[centralBudget.id] ?? 0)}</td><td class="num">${formatEuro(derived.budgetIncomeCents[stressBudget.id] ?? 0)}</td></tr><tr><td>Épargne résiduelle estimée</td><td class="num">${formatEuro(derived.residualSavingsCents[centralBudget.id] ?? 0)}</td><td class="num">${formatEuro(derived.residualSavingsCents[stressBudget.id] ?? 0)}</td></tr></tbody></table>${editorial(dossier, "postPurchaseBudget", "callout", "prudent")}<p class="small">Les deux colonnes reposent sur des hypothèses explicites de revenus, financement et dépenses ; aucun budget n'est dupliqué silencieusement.</p>
    `,
      ),
    );
  }

  if (sections.supportingDocuments && dossier.supportingDocuments.length > 0)
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
    <h2>Pièces justificatives</h2>${editorial(dossier, "supportingDocuments", "introduction")}<div class="callout risk"><strong>Confidentialité.</strong> Le générateur conserve uniquement cette liste de suivi. Les fichiers sensibles sont transmis séparément via un canal sécurisé.</div>
    ${supportingDocumentsTable(dossier, people)}${editorial(dossier, "supportingDocuments", "conclusion")}
  `,
      ),
    );

  const independentPeople = people.filter((person) =>
    dossier.incomeStreams.some(
      (income) =>
        income.personId === person.id &&
        ["self-employed", "liberal"].includes(income.kind),
    ),
  );
  if (sections.independentIncomeAnnex && independentPeople.length > 0) {
    const accents = ["#1f77b4", "#2f855a", "#7c3aed"];
    const hasObservedIndependentHistory = dossier.revenueHistory.some(
      (history) =>
        history.observed &&
        dossier.incomeStreams.some(
          (income) =>
            income.id === history.incomeStreamId &&
            ["self-employed", "liberal"].includes(income.kind),
        ),
    );
    const personSections = independentPeople
      .map((person, personIndex) => {
        const incomes = dossier.incomeStreams.filter(
          (income) =>
            income.personId === person.id &&
            ["self-employed", "liberal"].includes(income.kind),
        );
        const incomeIds = new Set(incomes.map((income) => income.id));
        const histories = dossier.revenueHistory.filter(
          (history) =>
            incomeIds.has(history.incomeStreamId) && history.observed,
        );
        const activities = dossier.professionalActivities.filter(
          (activity) =>
            activity.personId === person.id &&
            [
              "day-rate",
              "consultation",
              "turnover",
              "hourly",
              "commission",
            ].includes(activity.compensationModel.kind),
        );
        const latest = histories.at(-1);
        const retained = incomes.reduce(
          (sum, income) => sum + income.monthlyBankCents,
          0,
        );
        const modelMetric = activities.flatMap((activity) => {
          const model = activity.compensationModel;
          if (model.kind === "day-rate")
            return [
              {
                label: "TJM actuel",
                value: `${formatEuro(model.dailyRateCents)} HT`,
              },
            ];
          if (
            model.kind === "consultation" &&
            model.consultationFeeCents != null
          )
            return [
              {
                label: "Tarif consultation",
                value: formatEuro(model.consultationFeeCents),
              },
            ];
          if (model.kind === "hourly")
            return [
              {
                label: "Taux horaire",
                value: formatEuro(model.hourlyRateCents),
              },
            ];
          return [];
        })[0];
        const evidence = dossier.supportingDocuments
          .filter(
            (document) =>
              document.ownerId === person.id &&
              ["income", "professional"].includes(document.category),
          )
          .map((document) => document.label);
        const accent = accents[personIndex % accents.length]!;
        return `<section class="annex-person" style="--person-accent:${accent}"><header><div><span>Emprunteur ${personIndex + 1}</span><h3>${escapeHtml(person.displayName)}</h3>${activities.length > 0 ? `<p>${activities.map((activity) => escapeHtml(activity.occupation)).join(" · ")}</p>` : ""}</div><i style="background:${accent}"></i></header><div class="annex-person-kpis"><div><span>Revenu retenu</span><strong>${formatEuro(retained)} / mois</strong></div>${latest ? `<div><span>Dernier CA observé</span><strong>${formatEuro(latest.turnoverCents)}</strong></div><div><span>Dernier résultat</span><strong>${formatEuro(latest.resultCents)}</strong></div>` : ""}${modelMetric ? `<div><span>${escapeHtml(modelMetric.label)}</span><strong>${escapeHtml(modelMetric.value)}</strong></div>` : histories.length > 0 ? `<div><span>Périodes documentées</span><strong>${histories.length}</strong></div>` : ""}</div>${histories.length > 0 ? `<table class="compact annex-person-table"><thead><tr><th>Période</th><th class="num">CA facturé</th><th class="num">Encaissé</th><th class="num">Dépenses</th><th class="num">Résultat</th><th>Lecture bancaire</th></tr></thead><tbody>${histories.map((history) => `<tr><td>${escapeHtml(history.period)}</td><td class="num">${formatEuro(history.turnoverCents)}</td><td class="num">${history.collectedCents == null ? "—" : formatEuro(history.collectedCents)}</td><td class="num">${formatEuro(history.expensesCents)}</td><td class="num"><strong>${formatEuro(history.resultCents)}</strong></td><td>${history.period === "2025" ? "Exercice annuel observé" : "Situation intermédiaire à date"}</td></tr>`).join("")}</tbody></table>` : ""}<div class="annex-person-notes"><p><strong>Convention de revenu.</strong> ${formatEuro(retained)} mensuels avant IR, retenus prudemment au regard des résultats observés et de la continuité d'activité.</p><p><strong>Justificatifs associés.</strong> ${escapeHtml(evidence.join(" · ") || "Pièces suivies dans la section Justificatifs")}</p></div></section>`;
      })
      .join("");
    pages.push(
      page(
        dossier,
        ++pageNumber,
        `
          <h2>Annexe — revenus indépendants par emprunteur</h2>

          <div class="annex-legend">
            ${independentPeople
              .map(
                (person, index) => `
                  <span>
                    <i style="background:${accents[index % accents.length]}"></i>
                    ${escapeHtml(person.displayName)}
                  </span>
                `,
              )
              .join("")}
          </div>

          <div class="annex-people">
            ${personSections}
          </div>

          ${
            hasObservedIndependentHistory
              ? `<div class="annex-comparison-block">
            <h3>Comparaison des chiffres d’affaires observés</h3>
            ${renderIndependentComparisonChart(dossier)}
          </div>`
              : ""
          }

          <p class="small annex-footer-note">
            ${escapeHtml(dossier.editorial.finalDisclaimer)}
          </p>
        `,
        "independent-income-annex",
      ),
    );
  }

  const colors = dossier.presentation.colors;
  const colorVariables = `:root{--navy:${colors.navy};--blue:${colors.blue};--green:${colors.green};--gold:${colors.gold};--muted:${colors.muted}}`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(dossier.metadata.title)}</title><style>${printStyles}${colorVariables}</style></head><body class="theme-${dossier.presentation.theme} density-${dossier.presentation.density}">${pages.join("")}</body></html>`;
}

export { formatDate, formatEuro, formatRate } from "./format";
export { printStyles } from "./print-styles";
