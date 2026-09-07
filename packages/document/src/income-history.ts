import type { TurnoverHistory } from "@dossier-immo/calculations";
import { escapeHtml, formatEuro } from "./format";

export function renderTurnoverHistory(histories: TurnoverHistory) {
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  return `<h2>Annexe — évolution des CA encaissés</h2><p class="small">CA HT : barres pleines = encaissé ; barres hachurées = prévision d’encaissement, factures en attente comprises. Les rythmes annuels théoriques sont exclus. Un mois absent reste absent. Le décalage entre facturation et encaissement peut expliquer des creux et des rattrapages ; ce graphique ne représente pas le revenu net disponible.</p>${histories
    .map((history) => {
      const ceiling = Math.max(
        100_000,
        Math.ceil(
          Math.max(
            ...history.series.flatMap((item) =>
              [...item.values, ...item.forecastValues].map(
                (value) => value ?? 0,
              ),
            ),
          ) / 100_000,
        ) * 100_000,
      );
      const tickStep = Math.max(100_000, Math.ceil(ceiling / 1_500_000) * 100_000);
      const ticks = Array.from({length: Math.floor(ceiling / tickStep) + 1}, (_, index) => index * tickStep / ceiling);
      if (ticks.at(-1) !== 1) ticks.push(1);
      const colors = ["#64748b", "#237866", "#a76d35"];
      return `<h3>${escapeHtml(history.label)}</h3><svg viewBox="0 0 660 225" style="width:100%;height:auto" role="img" aria-label="${escapeHtml(history.label)} : CA encaissés mensuels comparés"><rect x="0" y="0" width="660" height="225" fill="none"/>${ticks.map((fraction) => `<line x1="60" x2="650" y1="${185 - fraction * 145}" y2="${185 - fraction * 145}" stroke="#d8dee5"/><text x="54" y="${189 - fraction * 145}" text-anchor="end" font-size="8.5" fill="#475569">${formatEuro(ceiling * fraction)}</text>`).join("")}${months.map((month, index) => `<text x="${83 + index * 49}" y="204" text-anchor="middle" font-size="10">${month}</text>`).join("")}${history.series
        .map((series, seriesIndex) => {
          const color = colors[seriesIndex % colors.length];
          const patternId = `forecast-${escapeHtml(history.streamId)}-${series.year}`;
          return `<defs><pattern id="${patternId}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${color}" opacity="0.18"/><path d="M-1,1 L1,-1 M0,5 L5,0 M4,6 L6,4" stroke="${color}" stroke-width="1.5"/></pattern></defs><text x="${65 + seriesIndex * 195}" y="20" fill="${color}" font-size="11">■ ${series.year} · ${series.forecastValues.some((value) => value !== undefined) ? (series.values.some((value) => value !== undefined) ? "réel / prévision" : "prévision") : "encaissé"}</text>${series.values
            .map((actual, index) => {
              const value = actual ?? series.forecastValues[index];
              if (value === undefined) return "";
              const forecast = actual === undefined;
              const width = history.series.length > 2 ? 11 : 15;
              return `<rect x="${65 + index * 49 + seriesIndex * (width + 2)}" y="${185 - (value / ceiling) * 145}" width="${width}" height="${Math.max(value === 0 ? 1 : 0, (value / ceiling) * 145)}" fill="${forecast ? `url(#${patternId})` : color}" stroke="${color}" stroke-width="0.4"><title>${months[index]} ${series.year} · ${forecast ? "prévision" : "encaissé"} : ${formatEuro(value)}</title></rect>`;
            })
            .join("")}`;
        })
        .join(
          "",
        )}</svg><p class="small"><strong>Réalisé comparé sur ${history.commonMonthCount} mois communs :</strong> ${history.comparableTotals.map((item) => `${item.year} : ${formatEuro(item.cents)}`).join(" ; ")}. Les totaux d’une année incomplète ne sont pas comparés à une année entière.</p>`;
    })
    .join(
      "",
    )}<p class="small">Sources : historiques mensuels saisis dans Activités et revenus, à rapprocher des déclarations URSSAF et relevés d’encaissements. Les charges et revenus économiques sont détaillés dans l’annexe précédente. Les prévisions proviennent des périodes de revenus datées, à leur date d’encaissement ; elles ne sont pas des revenus acquis. Une série prévisionnelle constante traduit une moyenne mensuelle, pas un calendrier de travail confirmé.</p>`;
}
