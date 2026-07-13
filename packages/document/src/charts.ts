import type { DerivedDossier } from "@dossier-immo/calculations";
import { assetCategoryLabels } from "@dossier-immo/domain";
import type { Dossier } from "@dossier-immo/schema";
import { escapeHtml, formatDate, formatEuro, formatRate } from "./format";

const palette = ["#17324d", "#1f77b4", "#2f855a", "#b7791f", "#0f766e", "#475467", "#7c3aed"];

type SankeyOutputVariant = "mortgage" | "debt" | "housing" | "daily" | "savings";

type SankeyRibbonVariant = "neutral" | "tax" | "available" | SankeyOutputVariant;

type SankeyNodeVariant = "tax" | "available" | SankeyOutputVariant;

type SankeyOutputSpec = {
  id: SankeyOutputVariant;
  value: number;
  label: string;
  y: number;
  minimumHeight: number;
  ribbonVariant: SankeyOutputVariant;
  nodeVariant: SankeyOutputVariant;
  textSize: number;
  insuranceIncluded: boolean;
};

export function renderAssetCompositionChart(dossier: Dossier): string {
  const groups = new Map<Dossier["assets"][number]["category"], number>();

  for (const asset of dossier.assets) {
    groups.set(asset.category, (groups.get(asset.category) ?? 0) + asset.amountCents);
  }

  const total = [...groups.values()].reduce((sum, value) => sum + value, 0) || 1;

  let x = 0;

  const segments = [...groups.entries()].map(([category, value], index) => {
    const width = (value / total) * 760;

    const result = `<rect x="${x.toFixed(2)}" y="20" width="${width.toFixed(2)}" height="54" fill="${palette[index % palette.length]}"/><text x="${(
      x +
      width / 2
    ).toFixed(2)}" y="51" fill="white" text-anchor="middle" font-size="13">${width > 75 ? escapeHtml(assetCategoryLabels[category]) : ""}</text>`;

    x += width;
    return result;
  });

  const legend = [...groups.entries()].map(
    ([category, value], index) =>
      `<g transform="translate(${(index % 3) * 255}, ${105 + Math.floor(index / 3) * 28})"><rect width="13" height="13" rx="2" fill="${
        palette[index % palette.length]
      }"/><text x="20" y="12" font-size="12" fill="#344054">${escapeHtml(assetCategoryLabels[category])} · ${formatEuro(value)}</text></g>`,
  );

  return `<svg class="embedded-chart" viewBox="0 0 760 180" role="img" aria-label="Répartition du patrimoine"><title>Répartition du patrimoine</title>${segments.join(
    "",
  )}${legend.join("")}</svg>`;
}

export function renderBudgetSankey(dossier: Dossier, derived: DerivedDossier): string {
  const budget = dossier.budgetScenarios.find((item) => item.kind === "central") ?? dossier.budgetScenarios[0];

  const scenario = derived.financingScenarios.find((item) => item.id === derived.highlightedScenarioId) ?? derived.financingScenarios[0];

  if (!budget || !scenario) {
    return "";
  }

  const sourceScenario = dossier.financingScenarios.find((item) => item.id === scenario.id);

  const includedIncomes = dossier.incomeStreams.filter((income) => income.includedInBorrowingCapacity);

  const people = dossier.household.people
    .filter((person) => person.role !== "dependent")
    .map((person) => ({
      label: person.displayName.split(/\s+/)[0] ?? person.displayName,
      value: includedIncomes.filter((income) => income.personId === person.id).reduce((sum, income) => sum + income.monthlyBankCents, 0),
    }))
    .filter((person) => person.value > 0);

  const grossIncome = Math.max(
    1,
    people.reduce((sum, person) => sum + person.value, 0),
  );

  const disposableIncome = dossier.estimatedHouseholdAfterTaxIncomeCents;

  const estimatedTax = Math.max(0, grossIncome - disposableIncome);

  const visibleItems = budget.items.filter((item) => item.showInSankey);

  const houseItems = visibleItems.filter((item) => ["housing", "tax"].includes(item.group));

  const dailyItems = visibleItems.filter((item) => !["housing", "tax", "savings"].includes(item.group));

  const houseTotal = houseItems.reduce((sum, item) => sum + item.amountCents, 0);

  const dailyTotal = dailyItems.reduce((sum, item) => sum + item.amountCents, 0);

  const explicitSavings = visibleItems.filter((item) => item.group === "savings").reduce((sum, item) => sum + item.amountCents, 0);

  const residualSavings = Math.max(0, (derived.residualSavingsCents[budget.id] ?? 0) + explicitSavings);

  const existingDebt = derived.existingMonthlyDebtAtPurchaseCents;

  const mortgage = scenario.monthlyPaymentIncludingInsuranceCents;

  const liability = dossier.liabilities.find((item) => item.includedInEffortRate && item.endDate);

  /*
   * Échelle financière commune à tous les flux.
   *
   * Les épaisseurs restent strictement proportionnelles aux montants.
   * Les hauteurs et positions des nœuds sont ensuite ajustées séparément
   * pour obtenir une composition éditoriale lisible.
   */
  const flowScale = 360 / grossIncome;

  const ribbon = (x1: number, top1: number, bottom1: number, x2: number, top2: number, bottom2: number, variant: SankeyRibbonVariant): string => {
    const controlX = (x1 + x2) / 2;

    return `<path class="sankey-ribbon sankey-ribbon--${variant}" d="M${x1} ${top1.toFixed(1)} C${controlX.toFixed(1)} ${top1.toFixed(
      1,
    )} ${controlX.toFixed(1)} ${top2.toFixed(1)} ${x2} ${top2.toFixed(1)} L${x2} ${bottom2.toFixed(1)} C${controlX.toFixed(1)} ${bottom2.toFixed(
      1,
    )} ${controlX.toFixed(1)} ${bottom1.toFixed(1)} ${x1} ${bottom1.toFixed(1)} Z"/>`;
  };

  const node = (x: number, y: number, width: number, height: number, variant: SankeyNodeVariant, lines: readonly string[], textSize = 18): string => {
    const lineHeight = textSize + 4;

    const firstY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2 + textSize * 0.34;

    return `<g class="sankey-node-group sankey-node-group--${variant}">
      <rect
        class="sankey-node sankey-node--${variant}"
        x="${x}"
        y="${y.toFixed(1)}"
        width="${width}"
        height="${height.toFixed(1)}"
        rx="10"
        fill="url(#sankey-${variant}-gradient)"
      />
      ${lines
        .map(
          (line, index) =>
            `<text
              class="sankey-node-text"
              x="${x + width / 2}"
              y="${(firstY + index * lineHeight).toFixed(1)}"
              text-anchor="middle"
              font-size="${textSize}"
            >${escapeHtml(line)}</text>`,
        )
        .join("")}
    </g>`;
  };

  const detailLines = (
    items: typeof visibleItems,
    sourceX: number,
    sourceY: number,
    sourceHeight: number,
    variant: "housing" | "daily",
    targetStartY: number,
    targetGap: number,
  ): string => {
    const total = Math.max(
      1,
      items.reduce((sum, item) => sum + item.amountCents, 0),
    );

    let sourceCursor = sourceY;

    return items
      .map((item, index) => {
        const allocatedHeight = (item.amountCents / total) * sourceHeight;

        /*
         * Les petits flux restent visibles, sans transformer les plus gros
         * en traits excessivement épais.
         */
        const thickness = Math.max(2.4, Math.min(12, allocatedHeight * 0.72));

        const sourceCenter = sourceCursor + allocatedHeight / 2;

        const targetY = targetStartY + index * targetGap;

        sourceCursor += allocatedHeight;

        return `<path
          class="sankey-detail-line sankey-detail-line--${variant}"
          d="M${sourceX} ${sourceCenter.toFixed(1)} C${sourceX + 58} ${sourceCenter.toFixed(1)} ${sourceX + 108} ${targetY.toFixed(
            1,
          )} ${sourceX + 168} ${targetY.toFixed(1)}"
          stroke-width="${thickness.toFixed(1)}"
        /><text
          class="sankey-detail-label"
          x="${sourceX + 180}"
          y="${targetY + 5}"
        >${escapeHtml(item.sankeyLabel ?? item.label)} : ${formatEuro(item.amountCents)}</text>`;
      })
      .join("");
  };

  /*
   * Revenus individuels.
   *
   * Les personnes sont espacées éditorialement, tandis que leurs flux
   * convergent sans intervalle dans le bloc "Foyer avant IR".
   */
  const householdY = 300;
  const householdHeight = grossIncome * flowScale;
  const householdCenterY = householdY + householdHeight / 2;

  const personStartY = 205;
  const personGap = 74;
  const personMinimumHeight = 142;

  let personNodeCursor = personStartY;
  let householdFlowCursor = householdY;

  const personNodes = people
    .map((person) => {
      const flowHeight = person.value * flowScale;

      const nodeHeight = Math.max(personMinimumHeight, flowHeight);

      const nodeY = personNodeCursor;

      const sourceFlowTop = nodeY + (nodeHeight - flowHeight) / 2;

      const targetFlowTop = householdFlowCursor;

      personNodeCursor += nodeHeight + personGap;
      householdFlowCursor += flowHeight;

      const center = nodeY + nodeHeight / 2;

      return `${ribbon(190, sourceFlowTop, sourceFlowTop + flowHeight, 340, targetFlowTop, targetFlowTop + flowHeight, "neutral")}
      <g class="sankey-person">
        <rect
          class="sankey-node sankey-node--person"
          x="35"
          y="${nodeY.toFixed(1)}"
          width="155"
          height="${nodeHeight.toFixed(1)}"
          rx="10"
          fill="url(#sankey-person-gradient)"
        />
        <circle
          class="sankey-person-avatar"
          cx="112.5"
          cy="${(center - 31).toFixed(1)}"
          r="10"
        />
        <path
          class="sankey-person-avatar"
          d="M96 ${(center - 10).toFixed(1)} Q112.5 ${(center - 24).toFixed(1)} 129 ${(center - 10).toFixed(1)} L129 ${(center - 3).toFixed(
            1,
          )} L96 ${(center - 3).toFixed(1)} Z"
        />
        <text
          class="sankey-person-label"
          x="112.5"
          y="${(center + 24).toFixed(1)}"
          text-anchor="middle"
        >${escapeHtml(person.label)}</text>
        <text
          class="sankey-person-value"
          x="112.5"
          y="${(center + 49).toFixed(1)}"
          text-anchor="middle"
        >${escapeHtml(formatEuro(person.value))}</text>
      </g>`;
    })
    .join("");

  /*
   * Fiscalité et disponible.
   *
   * Le nœud fiscal est remonté afin de matérialiser visuellement la
   * bifurcation, tandis que le disponible reste proche de l'axe principal.
   */
  const taxFlowHeight = estimatedTax * flowScale;

  const disposableFlowHeight = Math.max(1, disposableIncome * flowScale);

  const taxNodeY = 198;

  const taxNodeHeight = Math.max(78, taxFlowHeight);

  const taxTargetTop = taxNodeY + (taxNodeHeight - taxFlowHeight) / 2;

  const availableNodeY = 350;
  const availableNodeHeight = disposableFlowHeight;

  /*
   * Positions éditoriales des sorties.
   *
   * Chaque flux garde son épaisseur financière, mais le nœud possède une
   * hauteur minimale afin de préserver les textes et les respirations.
   */
  const outputSpecs = [
    {
      id: "mortgage",
      value: mortgage,
      label: "Crédit immobilier",
      y: 182,
      minimumHeight: 88,
      ribbonVariant: "mortgage",
      nodeVariant: "mortgage",
      textSize: 16,
      insuranceIncluded: true,
    },
    {
      id: "debt",
      value: existingDebt,
      label: liability?.category === "auto" ? "Crédit auto" : "Crédit existant",
      y: 300,
      minimumHeight: 56,
      ribbonVariant: "debt",
      nodeVariant: "debt",
      textSize: 16,
      insuranceIncluded: false,
    },
    {
      id: "housing",
      value: houseTotal,
      label: "Charges maison",
      y: 414,
      minimumHeight: 64,
      ribbonVariant: "housing",
      nodeVariant: "housing",
      textSize: 16,
      insuranceIncluded: false,
    },
    {
      id: "daily",
      value: dailyTotal,
      label: "Vie quotidienne",
      y: 510,
      minimumHeight: 86,
      ribbonVariant: "daily",
      nodeVariant: "daily",
      textSize: 16,
      insuranceIncluded: false,
    },
    {
      id: "savings",
      value: residualSavings,
      label: "Épargne résiduelle",
      y: 650,
      minimumHeight: 100,
      ribbonVariant: "savings",
      nodeVariant: "savings",
      textSize: 16,
      insuranceIncluded: false,
    },
  ] satisfies readonly SankeyOutputSpec[];

  const activeOutputSpecs = outputSpecs.filter((item) => item.value > 0);

  let availableSourceCursor = availableNodeY;

  const outputLayouts = activeOutputSpecs.map((spec) => {
    const flowHeight = Math.max(1, spec.value * flowScale);

    const nodeHeight = Math.max(spec.minimumHeight, flowHeight);

    const targetFlowTop = spec.y + (nodeHeight - flowHeight) / 2;

    const sourceFlowTop = availableSourceCursor;

    availableSourceCursor += flowHeight;

    return {
      ...spec,
      flowHeight,
      nodeHeight,
      sourceFlowTop,
      targetFlowTop,
    };
  });

  const outputRibbons = outputLayouts
    .map((layout) =>
      ribbon(
        860,
        layout.sourceFlowTop,
        layout.sourceFlowTop + layout.flowHeight,
        975,
        layout.targetFlowTop,
        layout.targetFlowTop + layout.flowHeight,
        layout.ribbonVariant,
      ),
    )
    .join("");

  const percent = (value: number): number => Math.round((value / Math.max(1, disposableIncome)) * 100);

  const outputs = outputLayouts
    .map((layout) => {
      const lines = layout.insuranceIncluded
        ? [layout.label, "assurance incluse", `${formatEuro(layout.value)} · ${percent(layout.value)} % du disponible`]
        : [layout.label, `${formatEuro(layout.value)} · ${percent(layout.value)} % du disponible`];

      return node(975, layout.y, 260, layout.nodeHeight, layout.nodeVariant, lines, layout.textSize);
    })
    .join("");

  const housingLayout = outputLayouts.find((item) => item.id === "housing");

  const dailyLayout = outputLayouts.find((item) => item.id === "daily");

  const housingDetails = housingLayout
    ? detailLines(houseItems, 1235, housingLayout.targetFlowTop, housingLayout.flowHeight, "housing", 356, 28)
    : "";

  const dailyDetails = dailyLayout ? detailLines(dailyItems, 1235, dailyLayout.targetFlowTop, dailyLayout.flowHeight, "daily", 505, 30) : "";

  const targetPrice = sourceScenario?.priceOverrideCents ?? dossier.project.targetPriceCents;

  const contribution = sourceScenario?.contributionOverrideCents ?? dossier.project.contributionCents;

  const durationYears = Math.round((sourceScenario?.durationMonths ?? 0) / 12);

  const scenarioText =
    `Scénario central : achat ${formatEuro(targetPrice)}, apport ${formatEuro(contribution)}, durée ${durationYears} ans, taux ${formatRate(
      sourceScenario?.annualRateBasisPoints ?? 0,
    )}, assurance emprunteur ${formatRate(sourceScenario?.insuranceAnnualBasisPoints ?? 0)}` +
    `${liability?.endDate ? `, crédit existant inclus jusqu'au ${formatDate(liability.endDate)}` : ""}`;

  const liabilityNote = liability?.endDate
    ? `<g class="sankey-note-group">
        <circle
          class="sankey-note-icon-circle"
          cx="53"
          cy="885"
          r="13"
        />

        <path
          class="sankey-note-icon-stroke"
          d="
            M46 886
            L48 881
            Q48.6 879 51 879
            H55
            Q57.4 879 58 881
            L60 886
            V889
            H58
            V887
            H48
            V889
            H46
            Z
          "
        />

        <circle
          class="sankey-note-icon-stroke"
          cx="49"
          cy="889"
          r="1.4"
        />

        <circle
          class="sankey-note-icon-stroke"
          cx="57"
          cy="889"
          r="1.4"
        />

        <text
          class="sankey-note"
          x="82"
          y="890"
        >${escapeHtml(`${liability.label} temporaire inclus jusqu'au ${formatDate(liability.endDate)}.`)}</text>
      </g>`
    : "";

  return `<svg
    class="sankey-chart"
    viewBox="0 0 1600 955"
    role="img"
    aria-labelledby="sankey-title sankey-desc"
    preserveAspectRatio="xMidYMid meet"
  >
    <title id="sankey-title">Budget post-achat — flux mensuels</title>
    <desc id="sankey-desc">Chaque euro est ventilé depuis les revenus individuels jusqu'aux postes finaux et à l'épargne résiduelle.</desc>

    <defs>
      <linearGradient id="sankey-person-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-person-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-person-end)"/>
      </linearGradient>

      <linearGradient id="sankey-household-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-household-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-household-end)"/>
      </linearGradient>

      <linearGradient id="sankey-tax-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-tax-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-tax-end)"/>
      </linearGradient>

      <linearGradient id="sankey-available-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-available-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-available-end)"/>
      </linearGradient>

      <linearGradient id="sankey-mortgage-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-mortgage-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-mortgage-end)"/>
      </linearGradient>

      <linearGradient id="sankey-debt-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-debt-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-debt-end)"/>
      </linearGradient>

      <linearGradient id="sankey-housing-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-housing-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-housing-end)"/>
      </linearGradient>

      <linearGradient id="sankey-daily-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-daily-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-daily-end)"/>
      </linearGradient>

      <linearGradient id="sankey-savings-gradient" x1="0" x2="1">
        <stop offset="0" style="stop-color:var(--sankey-savings-start)"/>
        <stop offset="1" style="stop-color:var(--sankey-savings-end)"/>
      </linearGradient>
    </defs>

    <rect
      class="sankey-background"
      width="1600"
      height="955"
    />

    <text
      class="sankey-heading"
      x="30"
      y="48"
      font-size="31"
    >Budget post-achat — flux mensuels</text>

    <text
      class="sankey-subheading"
      x="30"
      y="79"
      font-size="16"
    >${escapeHtml(scenarioText)}</text>

    ${[
      [85, "Revenus"],
      [410, "Foyer avant IR"],
      [735, "Fiscalité / disponible"],
      [1135, "Postes post-achat"],
      [1450, "Détail"],
    ]
      .map(
        ([x, label]) =>
          `<text
            class="sankey-column-title"
            x="${x}"
            y="132"
            text-anchor="middle"
            font-size="17"
          >${escapeHtml(String(label))}</text>
          <circle
            class="sankey-column-marker"
            cx="${x}"
            cy="150"
            r="5"
          />`,
      )
      .join("")}

    <line
      class="sankey-column-line"
      x1="30"
      y1="150"
      x2="1570"
      y2="150"
    />

    ${personNodes}

    <g class="sankey-household">
      <rect
        class="sankey-node sankey-node--household"
        x="340"
        y="${householdY}"
        width="220"
        height="${householdHeight.toFixed(1)}"
        rx="10"
        fill="url(#sankey-household-gradient)"
      />

      <path
        class="sankey-house-icon"
        d="M410 ${(householdCenterY - 60).toFixed(1)}
           L450 ${(householdCenterY - 95).toFixed(1)}
           L490 ${(householdCenterY - 60).toFixed(1)}
           M420 ${(householdCenterY - 66).toFixed(1)}
           V${(householdCenterY - 22).toFixed(1)}
           H480
           V${(householdCenterY - 66).toFixed(1)}
           M438 ${(householdCenterY - 22).toFixed(1)}
           V${(householdCenterY - 48).toFixed(1)}
           H462
           V${(householdCenterY - 22).toFixed(1)}"
      />

      <text
        class="sankey-household-label"
        x="450"
        y="${(householdCenterY + 20).toFixed(1)}"
        text-anchor="middle"
      >Foyer avant IR</text>

      <text
        class="sankey-household-value"
        x="450"
        y="${(householdCenterY + 47).toFixed(1)}"
        text-anchor="middle"
      >${escapeHtml(formatEuro(grossIncome))}</text>
    </g>

    ${ribbon(560, householdY, householdY + taxFlowHeight, 680, taxTargetTop, taxTargetTop + taxFlowHeight, "tax")}

    ${ribbon(560, householdY + taxFlowHeight, householdY + householdHeight, 665, availableNodeY, availableNodeY + availableNodeHeight, "available")}

    ${node(680, taxNodeY, 180, taxNodeHeight, "tax", ["IR estimé", formatEuro(estimatedTax)], 17)}

    ${node(665, availableNodeY, 195, availableNodeHeight, "available", ["Disponible après IR", formatEuro(disposableIncome)], 18)}

    ${outputRibbons}
    ${outputs}
    ${housingDetails}
    ${dailyDetails}

    <g class="sankey-note-group">
      <circle
        class="sankey-note-icon-circle"
        cx="53"
        cy="805"
        r="13"
      />
      <text
        class="sankey-note-icon-text"
        x="53"
        y="811"
        text-anchor="middle"
      >i</text>
      <text
        class="sankey-note"
        x="82"
        y="810"
      >Lecture : chaque euro est ventilé depuis les revenus individuels jusqu'aux postes finaux.</text>
    </g>

    <g class="sankey-note-group">
      <circle
        class="sankey-note-icon-circle"
        cx="53"
        cy="845"
        r="13"
      />
      <path
        class="sankey-note-icon-stroke"
        d="M47 852 L51 846 L55 849 L60 840"
      />
      <path
        class="sankey-note-icon-stroke"
        d="M56 840 H60 V844"
      />
      <text
        class="sankey-note"
        x="82"
        y="850"
      >Le scénario central conserve une épargne résiduelle significative après crédit, charges maison et dépenses courantes.</text>
    </g>

        ${liabilityNote}

    <line
      class="sankey-source-separator"
      x1="30"
      y1="914"
      x2="1570"
      y2="914"
    />

    <g class="sankey-source-group">
      <circle
        class="sankey-source-icon-circle"
        cx="53"
        cy="935"
        r="12"
      />

      <path
        class="sankey-source-icon"
        d="M45 933
           L53 927
           L61 933

           M47 933
           V940

           M51 933
           V940

           M55 933
           V940

           M59 933
           V940

           M44 941
           H62"
      />

      <text
        class="sankey-source"
        x="82"
        y="940"
      >Source : simulations internes, données fournies par les emprunteurs, à confirmer par l'établissement prêteur.</text>
    </g>
  </svg>`;
}

export function renderRevenueHistoryChart(dossier: Dossier, incomeIds?: ReadonlySet<string>, color = "#1f77b4"): string {
  const observed = dossier.revenueHistory.filter(
    (entry) => entry.observed && entry.turnoverCents > 0 && (!incomeIds || incomeIds.has(entry.incomeStreamId)),
  );

  if (observed.length === 0) {
    return "";
  }

  const max = Math.max(...observed.map((entry) => entry.turnoverCents), 1);

  const barWidth = Math.min(95, 650 / observed.length);

  const bars = observed.map((entry, index) => {
    const height = (entry.turnoverCents / max) * 155;

    const x = 55 + index * (barWidth + 22);

    return `<rect
        x="${x}"
        y="${190 - height}"
        width="${barWidth}"
        height="${height}"
        rx="4"
        fill="${color}"
      /><text
        x="${x + barWidth / 2}"
        y="210"
        text-anchor="middle"
        font-size="11"
        fill="#667085"
      >${escapeHtml(entry.period)}</text><text
        x="${x + barWidth / 2}"
        y="${180 - height}"
        text-anchor="middle"
        font-size="11"
        fill="#17324d"
      >${formatEuro(entry.turnoverCents)}</text>`;
  });

  return `<svg class="embedded-chart" viewBox="0 0 760 230" role="img" aria-label="Historique des chiffres d'affaires"><line x1="40" y1="190" x2="735" y2="190" stroke="#d0d5dd"/>${bars.join(
    "",
  )}</svg>`;
}

export function renderIndependentComparisonChart(dossier: Dossier): string {
  const people = dossier.household.people.filter((person) =>
    dossier.incomeStreams.some((income) => income.personId === person.id && ["self-employed", "liberal"].includes(income.kind)),
  );

  const colors = ["#1f77b4", "#2f855a", "#7c3aed"];

  const periods = [...new Set(dossier.revenueHistory.filter((entry) => entry.observed).map((entry) => entry.period))].sort();

  const maximum = Math.max(...dossier.revenueHistory.filter((entry) => entry.observed).map((entry) => entry.turnoverCents), 1);

  const groups = periods
    .map((period, periodIndex) => {
      const origin = 95 + periodIndex * 290;

      const bars = people
        .map((person, personIndex) => {
          const ids = new Set(
            dossier.incomeStreams
              .filter((income) => income.personId === person.id && ["self-employed", "liberal"].includes(income.kind))
              .map((income) => income.id),
          );

          const amount = dossier.revenueHistory
            .filter((entry) => ids.has(entry.incomeStreamId) && entry.period === period && entry.observed)
            .reduce((sum, entry) => sum + entry.turnoverCents, 0);

          const height = (amount / maximum) * 112;

          const x = origin + personIndex * 74;

          return `<rect
            x="${x}"
            y="${148 - height}"
            width="54"
            height="${height}"
            rx="4"
            fill="${colors[personIndex % colors.length]}"
          /><text
            x="${x + 27}"
            y="${Math.max(20, 139 - height)}"
            font-size="10"
            font-weight="600"
            text-anchor="middle"
            fill="#344054"
          >${escapeHtml(formatEuro(amount))}</text>`;
        })
        .join("");

      return `${bars}<text
        x="${origin + (people.length * 74 - 20) / 2}"
        y="169"
        font-size="10.5"
        text-anchor="middle"
        fill="#667085"
      >${escapeHtml(period)}</text>`;
    })
    .join("");

  const legend = people
    .map(
      (person, index) =>
        `<rect
          x="${95 + index * 190}"
          y="190"
          width="10"
          height="10"
          rx="2"
          fill="${colors[index % colors.length]}"
        /><text
          x="${112 + index * 190}"
          y="199"
          font-size="10.5"
          fill="#344054"
        >${escapeHtml(person.displayName)} · CA observé</text>`,
    )
    .join("");

  return `<svg class="annex-comparison-chart" viewBox="0 0 760 214" role="img" aria-label="Comparaison du chiffre d'affaires observé par emprunteur"><line x1="70" y1="148" x2="700" y2="148" stroke="#d0d5dd"/>${groups}${legend}</svg>`;
}
