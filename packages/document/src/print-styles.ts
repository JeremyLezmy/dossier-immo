export const printStyles = `
:root{
  --ink:#1f2933;
  --muted:#667085;
  --line:#d0d5dd;
  --soft:#f4f7fb;
  --paper:#fff;
  --blue:#1f77b4;
  --navy:#17324d;
  --green:#2f855a;
  --gold:#b7791f;
  --red:#b42318;

  /* Palette sémantique du diagramme de Sankey */
  --sankey-background:#fbfcfe;

  --sankey-person-start:#073c68;
  --sankey-person-end:#0d4f80;
  --sankey-household-start:#24588c;
  --sankey-household-end:#367eba;

  --sankey-neutral-ribbon:#bcc4cf;

  --sankey-tax-start:#d99a16;
  --sankey-tax-end:#e5aa28;
  --sankey-tax-ribbon:#e3ad3e;

  --sankey-available-start:#358d61;
  --sankey-available-end:#4ca173;
  --sankey-available-ribbon:#54a87c;

  --sankey-mortgage-start:#2c68aa;
  --sankey-mortgage-end:#397bbc;
  --sankey-mortgage-ribbon:#558ed0;

  --sankey-debt-start:#6d4caf;
  --sankey-debt-end:#845fc1;
  --sankey-debt-ribbon:#8570c7;

  --sankey-housing-start:#4e9ed0;
  --sankey-housing-end:#69b1dc;
  --sankey-housing-ribbon:#6dadd6;

  --sankey-daily-start:#27999d;
  --sankey-daily-end:#3bafb1;
  --sankey-daily-ribbon:#39a9ab;

  --sankey-savings-start:#287e4f;
  --sankey-savings-end:#3b9560;
  --sankey-savings-ribbon:#3b9361;

  --sankey-detail-text:#17324d;
  --sankey-note-text:#344054;
  --sankey-icon:#536780;
  --sankey-shadow:rgba(23,50,77,.11);
}

*{
  box-sizing:border-box;
}

html,body{
  margin:0;
  padding:0;
  background:#e9eef5;
  color:var(--ink);
  font-family:"Segoe UI",Arial,sans-serif;
  line-height:1.45;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

@page{
  size:A4;
  margin:0;
}

@page landscape{
  size:A4 landscape;
  margin:0;
}

.page{
  position:relative;
  width:210mm;
  height:297mm;
  margin:18px auto;
  padding:16mm;
  background:var(--paper);
  box-shadow:0 8px 30px rgba(16,24,40,.13);
  page-break-after:always;
  overflow:hidden;
}

.page.landscape{
  page:landscape;
  width:297mm;
  height:210mm;
  padding:9mm 11mm;
}

.page:last-child{
  page-break-after:auto;
}

.page-number{
  position:absolute;
  right:16mm;
  bottom:7mm;
  color:var(--muted);
  font-size:9px;
}

.page-number::after{
  content:attr(data-footer);
}

.cover{
  display:flex;
  height:297mm;
  flex-direction:column;
  justify-content:space-between;
  background:var(--paper);
}

.eyebrow{
  color:var(--blue);
  font-size:12px;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
}

h1{
  margin:14px 0 8px;
  color:var(--navy);
  font-size:38px;
  line-height:1.08;
}

h2{
  margin:24px 0 12px;
  padding-bottom:8px;
  border-bottom:2px solid var(--line);
  color:var(--navy);
  font-size:22px;
}

h3{
  margin:16px 0 7px;
  color:var(--ink);
  font-size:15px;
}

p{
  margin:0 0 10px;
}

.lead{
  max-width:650px;
  color:#344054;
  font-size:17px;
}

.meta-grid,
.kpi-grid,
.split-grid,
.risk-grid{
  display:grid;
  gap:10px;
}

.meta-grid,
.split-grid,
.risk-grid{
  grid-template-columns:repeat(2,minmax(0,1fr));
}

.kpi-grid{
  grid-template-columns:repeat(3,minmax(0,1fr));
  margin:18px 0;
}

.meta,
.kpi,
.callout,
.risk-card{
  border:1px solid var(--line);
  border-radius:8px;
  background:#fff;
  padding:12px 14px;
}

.meta span,
.kpi span{
  display:block;
  color:var(--muted);
  font-size:10px;
  font-weight:700;
  letter-spacing:.04em;
  text-transform:uppercase;
}

.meta strong,
.kpi strong{
  display:block;
  margin-top:4px;
  color:var(--ink);
  font-size:18px;
}

.kpi strong{
  font-size:21px;
}

.callout{
  border-left:5px solid var(--blue);
  background:#f5f9ff;
}

.callout.prudent{
  border-left-color:var(--green);
  background:#f4fbf7;
}

.callout.risk{
  border-left-color:var(--gold);
  background:#fffaf0;
}

.risk-card{
  min-height:90px;
}

.risk-card h3{
  margin:0 0 6px;
  color:var(--navy);
  font-size:14px;
}

.risk-card p{
  font-size:12.2px;
  line-height:1.38;
}

table{
  width:100%;
  margin:11px 0 16px;
  border-collapse:collapse;
  font-size:12.5px;
}

table.compact{
  font-size:10.2px;
}

th{
  background:#eef4fb;
  color:var(--navy);
  font-weight:700;
  text-align:left;
}

th,
td{
  padding:7px 8px;
  border-bottom:1px solid var(--line);
  vertical-align:top;
}

td.num,
th.num{
  text-align:right;
  white-space:nowrap;
}

tr.total-row>td,
tr.total-row>th{
  border-top:2px solid var(--green);
  background:#f4fbf7;
  color:var(--navy);
  font-weight:700;
}

tr.central-row>td{
  border-top:2px solid var(--navy);
  background:#f7fbff;
}

.small{
  color:var(--muted);
  font-size:10.8px;
}

.badge{
  display:inline-block;
  margin:0 5px 5px 0;
  padding:4px 8px;
  border-radius:999px;
  background:#eaf2fb;
  color:var(--navy);
  font-size:11px;
  font-weight:700;
}

ul{
  margin:8px 0 14px 20px;
  padding:0;
}

li{
  margin:4px 0;
}

.embedded-chart{
  display:block;
  width:100%;
  max-height:55mm;
  margin:8px 0;
}

.sankey-chart{
  display:block;
  width:100%;
  height:auto;
  margin:0;
}

.annex-kpis{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:8px;
  margin:10px 0;
}

.annex-kpi{
  border:1px solid var(--line);
  border-radius:8px;
  padding:9px;
}

.annex-kpi span{
  display:block;
  color:var(--muted);
  font-size:9px;
  text-transform:uppercase;
}

.annex-kpi strong{
  display:block;
  color:var(--navy);
  font-size:15px;
}

.two-cols{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
}

.document-status{
  font-weight:700;
}

.document-status--positive{
  color:var(--green);
}

.document-status--attention{
  color:var(--gold);
}

.document-status--neutral{
  color:var(--muted);
}

.cover{
  justify-content:flex-start;
  gap:15mm;
}

.cover>div:last-of-type{
  margin-top:auto;
}

.cover .meta-grid{
  margin-top:10mm;
}

.documents-summary td:nth-child(1){
  width:24%;
}

.documents-summary td:nth-child(3){
  width:16%;
  white-space:nowrap;
}

.theme-heritage{
  font-family:Georgia,"Times New Roman",serif;

  --sankey-background:#fffdf8;
  --sankey-person-start:#243954;
  --sankey-person-end:#455f7d;
  --sankey-household-start:#2d4b6d;
  --sankey-household-end:#557393;
  --sankey-neutral-ribbon:#c4c3bd;
  --sankey-tax-start:#a57a2b;
  --sankey-tax-end:#c49a45;
  --sankey-tax-ribbon:#c9a45b;
  --sankey-available-start:#4d755c;
  --sankey-available-end:#71947a;
  --sankey-available-ribbon:#7fa187;
  --sankey-mortgage-start:#355d80;
  --sankey-mortgage-end:#527b9d;
  --sankey-mortgage-ribbon:#668ba8;
  --sankey-debt-start:#725b73;
  --sankey-debt-end:#947b95;
  --sankey-debt-ribbon:#9a869b;
  --sankey-housing-start:#6689a2;
  --sankey-housing-end:#84a5bb;
  --sankey-housing-ribbon:#91afc1;
  --sankey-daily-start:#547f7b;
  --sankey-daily-end:#78a09b;
  --sankey-daily-ribbon:#83aaa5;
  --sankey-savings-start:#4d755c;
  --sankey-savings-end:#71947a;
  --sankey-savings-ribbon:#7fa187;
}

.theme-heritage table,
.theme-heritage .small,
.theme-heritage .meta span,
.theme-heritage .kpi span{
  font-family:"Segoe UI",Arial,sans-serif;
}

.theme-sage{
  --sankey-background:#fffefb;
  --sankey-person-start:#294c42;
  --sankey-person-end:#3f6d5e;
  --sankey-household-start:#356657;
  --sankey-household-end:#5a8978;
  --sankey-neutral-ribbon:#c8cec8;
  --sankey-tax-start:#b88932;
  --sankey-tax-end:#d2a653;
  --sankey-tax-ribbon:#d1ae67;
  --sankey-available-start:#3b7756;
  --sankey-available-end:#609575;
  --sankey-available-ribbon:#70a382;
  --sankey-mortgage-start:#527a79;
  --sankey-mortgage-end:#709694;
  --sankey-mortgage-ribbon:#80a3a1;
  --sankey-debt-start:#846d8e;
  --sankey-debt-end:#a08aaa;
  --sankey-debt-ribbon:#aa96b2;
  --sankey-housing-start:#779b92;
  --sankey-housing-end:#96b5ad;
  --sankey-housing-ribbon:#a0bdb5;
  --sankey-daily-start:#4f9185;
  --sankey-daily-end:#73aa9f;
  --sankey-daily-ribbon:#80b4aa;
  --sankey-savings-start:#3b7756;
  --sankey-savings-end:#609575;
  --sankey-savings-ribbon:#70a382;
  --sankey-shadow:rgba(47,94,72,.14);
}

.theme-sage .page{
  background:#fffefb;
}

.theme-slate{
  --sankey-background:#fcfdff;
  --sankey-person-start:#253548;
  --sankey-person-end:#41556b;
  --sankey-household-start:#344b63;
  --sankey-household-end:#54708a;
  --sankey-neutral-ribbon:#c2cad4;
  --sankey-tax-start:#a87226;
  --sankey-tax-end:#c58e3d;
  --sankey-tax-ribbon:#c99b55;
  --sankey-available-start:#456f59;
  --sankey-available-end:#638b70;
  --sankey-available-ribbon:#749a7f;
  --sankey-mortgage-start:#356685;
  --sankey-mortgage-end:#5085a6;
  --sankey-mortgage-ribbon:#6595b2;
  --sankey-debt-start:#675a7c;
  --sankey-debt-end:#827493;
  --sankey-debt-ribbon:#9184a1;
  --sankey-housing-start:#60849b;
  --sankey-housing-end:#7fa0b5;
  --sankey-housing-ribbon:#8eacbf;
  --sankey-daily-start:#477f83;
  --sankey-daily-end:#669b9e;
  --sankey-daily-ribbon:#76a7aa;
  --sankey-savings-start:#456f59;
  --sankey-savings-end:#638b70;
  --sankey-savings-ribbon:#749a7f;
}

.theme-slate .page{
  background:#fcfdff;
}

.density-compact .page:not(.landscape){
  padding:14mm;
}

.density-compact p{
  margin-bottom:7px;
}

.density-compact table{
  margin:8px 0 12px;
}

.density-compact th,
.density-compact td{
  padding:5px 7px;
}

.project-page table{
  margin:8px 0 10px;
  font-size:11.4px;
}

.project-page th,
.project-page td{
  padding:5px 7px;
  line-height:1.3;
}

.project-page .kpi-grid{
  margin:12px 0;
}

.project-page .kpi strong{
  font-size:17px;
  white-space:nowrap;
}

.project-page h2{
  margin-top:14px;
}

.editorial-introduction{
  margin:0 0 12px;
  color:#475467;
  font-size:11.8px;
}

.editorial-conclusion{
  margin-top:12px;
  padding:10px 12px;
  border-top:1px solid var(--line);
  background:#fafbfc;
  color:#344054;
  font-size:11.4px;
}

.cover .editorial-introduction{
  max-width:165mm;
  margin-top:5mm;
  font-size:12.5px;
}

.cover .callout{
  margin-top:8mm;
}

.cover>div:last-of-type .editorial-conclusion{
  margin:0 0 5mm;
  background:transparent;
}

.reserve-convention{
  margin-bottom:16px;
}

.assets-multiindex{
  font-size:9.2px;
}

.assets-multiindex .owner-index{
  width:17%;
  border-right:1px solid #cbd5df;
  background:#f7f9fc;
  color:var(--navy);
  vertical-align:middle;
}

.assets-multiindex .owner-start td{
  border-top:2px solid #c6d3df;
}

.assets-multiindex .owner-total td{
  background:#f8fafc;
  color:#475467;
  font-weight:700;
}

.assets-multiindex .total-row th,
.assets-multiindex .total-row td{
  background:#eef8f2;
}

.search-area-list{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:6px;
  margin-top:7px;
}

.search-area-list>div{
  padding:7px 8px;
  border:1px solid #dbe3eb;
  border-radius:6px;
  background:#f9fbfd;
}

.search-area-list strong,
.search-area-list span{
  display:block;
}

.search-area-list strong{
  color:var(--navy);
  font-size:9.8px;
}

.search-area-list span{
  margin-top:2px;
  color:#536273;
  font-size:8.8px;
  line-height:1.3;
}

.financing-page .callout{
  margin:10px 0;
}

.financing-table{
  font-size:7.6px;
}

.financing-table th,
.financing-table td{
  padding:4px 3px;
}

.financing-table .central-row td{
  border-top:2px solid var(--navy);
  border-bottom:2px solid var(--navy);
  background:#e9f3fb;
  color:var(--navy);
}

.financing-table .central-row td:first-child{
  border-left:4px solid var(--navy);
}

.financing-note{
  padding:7px 9px;
  border-radius:5px;
  background:#f4f7fb;
}

.financing-composition-table{
  margin:6px 0 5px;
  font-size:7.8px;
}

.financing-composition-table th,
.financing-composition-table td{
  padding:3px 4px;
  line-height:1.22;
}

.financing-phase-summary{
  margin:0 0 6px;
}

.sensitivity-table{
  font-size:9px;
}

.sensitivity-table th,
.sensitivity-table td{
  padding:4px 6px;
}

.independent-income-annex h2{
  margin-bottom:8px;
}

.annex-legend{
  display:flex;
  gap:15px;
  margin:0 0 8px;
}

.annex-legend span{
  display:flex;
  align-items:center;
  gap:6px;
  color:#344054;
  font-size:10px;
  font-weight:700;
}

.annex-legend i{
  width:9px;
  height:9px;
  border-radius:50%;
}

.annex-person{
  margin-bottom:9px;
  padding:9px 10px;
  border:1px solid #d7e0e9;
  border-left:5px solid var(--person-accent);
  border-radius:7px;
  background:#fff;
}

.annex-person>header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  margin-bottom:6px;
}

.annex-person>header span{
  color:var(--person-accent);
  font-size:8px;
  font-weight:800;
  text-transform:uppercase;
}

.annex-person>header h3{
  margin:1px 0 2px;
  color:var(--navy);
  font-size:14px;
}

.annex-person>header p{
  margin:0;
  color:#667085;
  font-size:8.8px;
}

.annex-person>header i{
  width:24px;
  height:5px;
  border-radius:999px;
}

.annex-person-kpis{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:5px;
}

.annex-person-kpis>div{
  padding:5px 7px;
  border-radius:5px;
  background:#f5f8fb;
}

.annex-person-kpis span,
.annex-person-kpis strong{
  display:block;
}

.annex-person-kpis span{
  color:#667085;
  font-size:7px;
  text-transform:uppercase;
}

.annex-person-kpis strong{
  margin-top:2px;
  color:var(--navy);
  font-size:10.2px;
}

.annex-person-table{
  margin:6px 0;
  font-size:8px;
}

.annex-person-table th,
.annex-person-table td{
  padding:3px 5px;
}

.annex-person-notes{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:7px;
}

.annex-person-notes p{
  margin:0;
  padding:5px 7px;
  border-radius:5px;
  background:#f8fafc;
  font-size:8.2px;
  line-height:1.3;
}

/*
 * Diagramme de Sankey
 *
 * Le SVG conserve son ratio intrinsèque 1600 / 940.
 * La page paysage possède un padding dédié afin de maximiser l'espace
 * sans modifier les autres pages du document.
 */
.page.landscape.sankey-page{
  padding:5.5mm 6mm 5mm;
}

.sankey-page .sankey-chart{
  display:block;
  width:100%;
  height:auto;
  margin:0;
  overflow:visible;
  font-family:"Segoe UI",Arial,sans-serif;
  shape-rendering:geometricPrecision;
  text-rendering:optimizeLegibility;
}

.sankey-background{
  fill:var(--sankey-background);
}

.sankey-heading{
  fill:var(--navy);
  font-weight:800;
}

.sankey-subheading{
  fill:var(--sankey-note-text);
}

.sankey-column-title{
  fill:var(--navy);
  font-weight:700;
}

.sankey-column-line{
  stroke:var(--line);
  stroke-width:1.5;
}

.sankey-column-marker{
  fill:#b8c2d1;
}

.sankey-node{
  stroke:#fff;
  stroke-width:2;
  filter:drop-shadow(0 1.5px 1.6px var(--sankey-shadow));
}

.sankey-node-text{
  fill:#fff;
  font-weight:700;
}

.sankey-person-avatar{
  fill:#fff;
}

.sankey-person-label,
.sankey-person-value{
  fill:#fff;
  font-size:18px;
  font-weight:700;
}

.sankey-house-icon{
  fill:none;
  stroke:#fff;
  stroke-width:5;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.sankey-household-label,
.sankey-household-value{
  fill:#fff;
  font-size:19px;
  font-weight:700;
}

.sankey-ribbon{
  stroke:none;
}

.sankey-ribbon--neutral{
  fill:var(--sankey-neutral-ribbon);
  opacity:.64;
}

.sankey-ribbon--tax{
  fill:var(--sankey-tax-ribbon);
  opacity:.62;
}

.sankey-ribbon--available{
  fill:var(--sankey-available-ribbon);
  opacity:.56;
}

.sankey-ribbon--mortgage{
  fill:var(--sankey-mortgage-ribbon);
  opacity:.82;
}

.sankey-ribbon--debt{
  fill:var(--sankey-debt-ribbon);
  opacity:.82;
}

.sankey-ribbon--housing{
  fill:var(--sankey-housing-ribbon);
  opacity:.82;
}

.sankey-ribbon--daily{
  fill:var(--sankey-daily-ribbon);
  opacity:.82;
}

.sankey-ribbon--savings{
  fill:var(--sankey-savings-ribbon);
  opacity:.82;
}

.sankey-detail-line{
  fill:none;
  opacity:.9;
  stroke-linecap:round;
}

.sankey-detail-line--housing{
  stroke:var(--sankey-housing-ribbon);
}

.sankey-detail-line--daily{
  stroke:var(--sankey-daily-ribbon);
}

.sankey-detail-label{
  fill:var(--sankey-detail-text);
  font-size:14.8px;
  font-weight:500;
}

.sankey-note{
  fill:var(--sankey-note-text);
  font-size:14px;
}

.sankey-note-icon-circle{
  fill:none;
  stroke:var(--sankey-icon);
  stroke-width:2;
}

.sankey-note-icon-text{
  fill:var(--sankey-icon);
  font-size:17px;
  font-weight:700;
}

.sankey-note-icon-stroke{
  fill:none;
  stroke:var(--sankey-icon);
  stroke-width:1.8;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.sankey-source-separator{
  stroke:var(--line);
}

.sankey-source-icon-circle{
  fill:none;
  stroke:var(--muted);
  stroke-width:1.7;
}

.sankey-source-icon{
  fill:none;
  stroke:var(--muted);
  stroke-width:1.4;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.sankey-source{
  fill:var(--muted);
  font-size:12px;
}

.documents-multiindex{
  font-size:8.7px;
}

.documents-multiindex th,
.documents-multiindex td{
  padding:4px 6px;
}

.documents-multiindex .document-category{
  width:18%;
  border-right:1px solid #cbd5df;
  background:#f6f8fb;
  color:var(--navy);
  vertical-align:middle;
}

.documents-multiindex .document-category-start td{
  border-top:1.5px solid #c6d3df;
}

.financing-page .callout{
  margin:12px 0 18px;
}

.financing-table{
  font-size:7.8px;
}

.financing-table th,
.financing-table td{
  padding:8px 4px;
  border-right:1px solid rgba(208,213,221,.45);
}

.financing-table th:last-child,
.financing-table td:last-child{
  border-right:0;
}

.documents-multiindex{
  font-size:7.8px;
}

.documents-multiindex th,
.documents-multiindex td{
  padding:3px 5px;
}

.documents-multiindex .small{
  display:none;
}

.theme-heritage .meta,
.theme-heritage .kpi,
.theme-heritage .callout,
.theme-heritage .risk-card{
  border-radius:2px;
}

.theme-sage .meta,
.theme-sage .kpi,
.theme-sage .callout,
.theme-sage .risk-card{
  border-radius:14px;
  box-shadow:0 3px 12px rgba(47,94,72,.08);
}

.theme-slate .meta,
.theme-slate .kpi,
.theme-slate .callout,
.theme-slate .risk-card{
  border-radius:0;
  border-left:3px solid var(--blue);
}

.theme-editorial{
  font-family:Georgia,"Times New Roman",serif;
}

.theme-editorial .page{
  padding:19mm;
  background:#fffaf5;
}

.theme-editorial h2{
  border:0;
  font-size:25px;
  font-style:italic;
}

.theme-editorial .meta,
.theme-editorial .kpi,
.theme-editorial .risk-card{
  border:0;
  border-radius:0;
  background:#f7eee8;
}

.theme-editorial table{
  font-family:"Segoe UI",Arial,sans-serif;
}

.theme-editorial .sankey-chart{
  font-family:"Segoe UI",Arial,sans-serif;
}

.theme-monochrome{
  --sankey-background:#fff;
  --sankey-person-start:#111;
  --sankey-person-end:#383838;
  --sankey-household-start:#292929;
  --sankey-household-end:#555;
  --sankey-neutral-ribbon:#c8c8c8;
  --sankey-tax-start:#555;
  --sankey-tax-end:#777;
  --sankey-tax-ribbon:#999;
  --sankey-available-start:#333;
  --sankey-available-end:#666;
  --sankey-available-ribbon:#8a8a8a;
  --sankey-mortgage-start:#222;
  --sankey-mortgage-end:#555;
  --sankey-mortgage-ribbon:#777;
  --sankey-debt-start:#444;
  --sankey-debt-end:#6a6a6a;
  --sankey-debt-ribbon:#888;
  --sankey-housing-start:#555;
  --sankey-housing-end:#777;
  --sankey-housing-ribbon:#999;
  --sankey-daily-start:#666;
  --sankey-daily-end:#888;
  --sankey-daily-ribbon:#aaa;
  --sankey-savings-start:#333;
  --sankey-savings-end:#555;
  --sankey-savings-ribbon:#777;
  --sankey-detail-text:#171717;
  --sankey-note-text:#171717;
  --sankey-icon:#171717;
  --sankey-shadow:rgba(0,0,0,.12);
}

.theme-monochrome .page{
  background:#fff;
}

.theme-monochrome h2{
  border-bottom:4px solid #171717;
  text-transform:uppercase;
  letter-spacing:.035em;
}

.theme-monochrome .meta,
.theme-monochrome .kpi,
.theme-monochrome .callout,
.theme-monochrome .risk-card{
  border:1.5px solid #171717;
  border-radius:0;
  box-shadow:none;
}

.theme-monochrome th{
  background:#e5e5e5;
  color:#171717;
}

.theme-monochrome .badge{
  border:1px solid #171717;
  border-radius:0;
  background:#fff;
  color:#171717;
}

.theme-monochrome .sankey-node{
  stroke:#171717;
  stroke-width:1.5;
  filter:none;
}

/*
 * Annexe revenus indépendants
 */
.independent-income-annex{
  display:block;
  padding-top:14mm;
  padding-bottom:13mm;
}

.independent-income-annex h2{
  margin:0 0 12px;
  padding-bottom:9px;
  font-size:24px;
  line-height:1.15;
}

.independent-income-annex .annex-legend{
  display:flex;
  gap:22px;
  margin:0 0 13px;
}

.independent-income-annex .annex-legend span{
  display:flex;
  align-items:center;
  gap:7px;
  font-size:11px;
}

.independent-income-annex .annex-legend i{
  width:10px;
  height:10px;
}

.independent-income-annex .annex-people{
  display:grid;
  gap:13px;
}

/*
 * Cartes emprunteur
 */
.independent-income-annex .annex-person{
  margin:0;
  padding:11px 13px;
  border-radius:8px;
}

.independent-income-annex .annex-person>header{
  margin-bottom:9px;
}

.independent-income-annex .annex-person>header span{
  font-size:8.7px;
  letter-spacing:.035em;
}

.independent-income-annex .annex-person>header h3{
  margin:2px 0 4px;
  font-size:16px;
  line-height:1.15;
}

.independent-income-annex .annex-person>header p{
  font-size:9.7px;
  line-height:1.3;
}

.independent-income-annex .annex-person>header i{
  width:28px;
  height:5px;
}

/*
 * KPI
 */
.independent-income-annex .annex-person-kpis{
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:8px;
  margin-top:5px;
}

.independent-income-annex .annex-person-kpis>div{
  min-height:41px;
  padding:7px 9px;
}

.independent-income-annex .annex-person-kpis span{
  font-size:7.7px;
  line-height:1.2;
}

.independent-income-annex .annex-person-kpis strong{
  margin-top:4px;
  font-size:11.4px;
  line-height:1.2;
}

/*
 * Tableaux
 */
.independent-income-annex .annex-person-table{
  margin:9px 0;
  font-size:9.1px;
}

.independent-income-annex .annex-person-table th,
.independent-income-annex .annex-person-table td{
  padding:4.5px 6px;
  line-height:1.32;
}

/*
 * Convention et justificatifs
 */
.independent-income-annex .annex-person-notes{
  gap:9px;
}

.independent-income-annex .annex-person-notes p{
  min-height:34px;
  padding:7px 9px;
  font-size:9px;
  line-height:1.38;
}

/*
 * Graphique comparatif
 *
 * On n'utilise plus margin-top:auto : le graphique reste dans la partie
 * basse, mais sans créer un vide disproportionné.
 */
.independent-income-annex .annex-comparison-block{
  margin-top:10mm;
  padding-top:9px;
  border-top:1px solid var(--line);
}

.independent-income-annex .annex-comparison-block h3{
  margin:0 0 5px;
  color:var(--navy);
  font-size:12.5px;
  line-height:1.2;
}

.independent-income-annex .annex-comparison-chart{
  display:block;
  width:100%;
  height:auto;
  margin:0;
}

.independent-income-annex .annex-footer-note{
  margin:4mm 0 0;
  font-size:9.7px;
  line-height:1.35;
}

.sankey-note-icon-stroke{
  fill:none;
  stroke:var(--sankey-icon);
  stroke-width:1.8;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.sankey-note-icon-stroke:is(circle){
  fill:var(--sankey-icon);
}

/* ========================================================================== 
 * Theme system v2
 *
 * Banque claire remains the default theme. Each alternate theme overrides the
 * same semantic tokens so that cards, tables, callouts, annexes, cover and
 * Sankey stay visually coherent.
 * ========================================================================== */

:root{
  --body-font:"Segoe UI",Arial,sans-serif;
  --display-font:"Segoe UI",Arial,sans-serif;
  --surface:#fff;
  --surface-soft:#f4f7fb;
  --surface-muted:#fafbfc;
  --table-header:#eef4fb;
  --table-central:#f7fbff;
  --table-total:#f4fbf7;
  --owner-surface:#f7f9fc;
  --search-surface:#f9fbfd;
  --annex-surface:#fff;
  --annex-kpi-surface:#f5f8fb;
  --annex-note-surface:#f8fafc;
  --callout-info:#f5f9ff;
  --callout-prudent:#f4fbf7;
  --callout-risk:#fffaf0;
  --badge-surface:#eaf2fb;
  --cover-background:var(--paper);
  --card-radius:8px;
  --small-radius:5px;
  --callout-radius:8px;
  --card-border-width:1px;
  --card-left-border:var(--card-border-width) solid var(--line);
  --card-shadow:none;
  --page-shadow:rgba(16,24,40,.13);
  --heading-rule:2px solid var(--line);
  --heading-style:normal;
  --heading-transform:none;
  --heading-letter-spacing:normal;
}

body[class^="theme-"],
body[class*=" theme-"]{
  color:var(--ink);
  font-family:var(--body-font);
}

body[class^="theme-"] .page,
body[class*=" theme-"] .page{
  background:var(--paper);
  box-shadow:0 8px 30px var(--page-shadow);
}

body[class^="theme-"] .cover,
body[class*=" theme-"] .cover{
  background:var(--paper);
}

body[class^="theme-"] h1,
body[class^="theme-"] h2,
body[class*=" theme-"] h1,
body[class*=" theme-"] h2{
  color:var(--navy);
  font-family:var(--display-font);
}

body[class^="theme-"] h2,
body[class*=" theme-"] h2{
  border-bottom:var(--heading-rule);
  font-style:var(--heading-style);
  letter-spacing:var(--heading-letter-spacing);
  text-transform:var(--heading-transform);
}

body[class^="theme-"] h3,
body[class*=" theme-"] h3{
  color:var(--ink);
}

body[class^="theme-"] .lead,
body[class^="theme-"] .editorial-introduction,
body[class^="theme-"] .editorial-conclusion,
body[class*=" theme-"] .lead,
body[class*=" theme-"] .editorial-introduction,
body[class*=" theme-"] .editorial-conclusion{
  color:var(--muted);
}

body[class^="theme-"] .editorial-conclusion,
body[class*=" theme-"] .editorial-conclusion{
  border-top-color:var(--line);
  background:var(--surface-muted);
}

body[class^="theme-"] .meta,
body[class^="theme-"] .kpi,
body[class^="theme-"] .risk-card,
body[class*=" theme-"] .meta,
body[class*=" theme-"] .kpi,
body[class*=" theme-"] .risk-card{
  border:var(--card-border-width) solid var(--line);
  border-left:var(--card-left-border);
  border-radius:var(--card-radius);
  background:var(--surface);
  box-shadow:var(--card-shadow);
}

body[class^="theme-"] .meta span,
body[class^="theme-"] .kpi span,
body[class*=" theme-"] .meta span,
body[class*=" theme-"] .kpi span{
  color:var(--muted);
}

body[class^="theme-"] .meta strong,
body[class^="theme-"] .kpi strong,
body[class*=" theme-"] .meta strong,
body[class*=" theme-"] .kpi strong{
  color:var(--ink);
}

body[class^="theme-"] .callout,
body[class*=" theme-"] .callout{
  border:1px solid var(--line);
  border-left:5px solid var(--blue);
  border-radius:var(--callout-radius);
  background:var(--callout-info);
  box-shadow:var(--card-shadow);
}

body[class^="theme-"] .callout.prudent,
body[class*=" theme-"] .callout.prudent{
  border-left-color:var(--green);
  background:var(--callout-prudent);
}

body[class^="theme-"] .callout.risk,
body[class*=" theme-"] .callout.risk{
  border-left-color:var(--gold);
  background:var(--callout-risk);
}

body[class^="theme-"] th,
body[class*=" theme-"] th{
  background:var(--table-header);
  color:var(--navy);
}

body[class^="theme-"] th,
body[class^="theme-"] td,
body[class*=" theme-"] th,
body[class*=" theme-"] td{
  border-bottom-color:var(--line);
}

body[class^="theme-"] tr.total-row>td,
body[class^="theme-"] tr.total-row>th,
body[class*=" theme-"] tr.total-row>td,
body[class*=" theme-"] tr.total-row>th{
  border-top-color:var(--green);
  background:var(--table-total);
  color:var(--navy);
}

body[class^="theme-"] tr.central-row>td,
body[class*=" theme-"] tr.central-row>td{
  border-top-color:var(--navy);
  background:var(--table-central);
  color:var(--navy);
}

body[class^="theme-"] .badge,
body[class*=" theme-"] .badge{
  border-radius:999px;
  background:var(--badge-surface);
  color:var(--navy);
}

body[class^="theme-"] .small,
body[class^="theme-"] .page-number,
body[class*=" theme-"] .small,
body[class*=" theme-"] .page-number{
  color:var(--muted);
}

body[class^="theme-"] .assets-multiindex .owner-index,
body[class^="theme-"] .documents-multiindex .document-category,
body[class*=" theme-"] .assets-multiindex .owner-index,
body[class*=" theme-"] .documents-multiindex .document-category{
  border-right-color:var(--line);
  background:var(--owner-surface);
  color:var(--navy);
}

body[class^="theme-"] .assets-multiindex .owner-start td,
body[class^="theme-"] .documents-multiindex .document-category-start td,
body[class*=" theme-"] .assets-multiindex .owner-start td,
body[class*=" theme-"] .documents-multiindex .document-category-start td{
  border-top-color:var(--line);
}

body[class^="theme-"] .assets-multiindex .owner-total td,
body[class*=" theme-"] .assets-multiindex .owner-total td{
  background:var(--surface-muted);
  color:var(--muted);
}

body[class^="theme-"] .assets-multiindex .total-row th,
body[class^="theme-"] .assets-multiindex .total-row td,
body[class*=" theme-"] .assets-multiindex .total-row th,
body[class*=" theme-"] .assets-multiindex .total-row td{
  background:var(--table-total);
}

body[class^="theme-"] .search-area-list>div,
body[class*=" theme-"] .search-area-list>div{
  border-color:var(--line);
  border-radius:var(--small-radius);
  background:var(--search-surface);
}

body[class^="theme-"] .search-area-list strong,
body[class*=" theme-"] .search-area-list strong{
  color:var(--navy);
}

body[class^="theme-"] .search-area-list span,
body[class*=" theme-"] .search-area-list span{
  color:var(--muted);
}

body[class^="theme-"] .financing-table .central-row td,
body[class*=" theme-"] .financing-table .central-row td{
  border-top-color:var(--navy);
  border-bottom-color:var(--navy);
  background:var(--table-central);
  color:var(--navy);
}

body[class^="theme-"] .financing-table .central-row td:first-child,
body[class*=" theme-"] .financing-table .central-row td:first-child{
  border-left-color:var(--navy);
}

body[class^="theme-"] .financing-note,
body[class*=" theme-"] .financing-note{
  border-radius:var(--small-radius);
  background:var(--surface-soft);
}

body[class^="theme-"] .annex-person,
body[class*=" theme-"] .annex-person{
  border-color:var(--line);
  border-left-color:var(--person-accent);
  border-radius:var(--card-radius);
  background:var(--annex-surface);
  box-shadow:var(--card-shadow);
}

body[class^="theme-"] .annex-person>header h3,
body[class^="theme-"] .annex-person-kpis strong,
body[class*=" theme-"] .annex-person>header h3,
body[class*=" theme-"] .annex-person-kpis strong{
  color:var(--navy);
}

body[class^="theme-"] .annex-person>header p,
body[class^="theme-"] .annex-person-kpis span,
body[class*=" theme-"] .annex-person>header p,
body[class*=" theme-"] .annex-person-kpis span{
  color:var(--muted);
}

body[class^="theme-"] .annex-person-kpis>div,
body[class*=" theme-"] .annex-person-kpis>div{
  border-radius:var(--small-radius);
  background:var(--annex-kpi-surface);
}

body[class^="theme-"] .annex-person-notes p,
body[class*=" theme-"] .annex-person-notes p{
  border-radius:var(--small-radius);
  background:var(--annex-note-surface);
}

body[class^="theme-"] .annex-comparison-block,
body[class*=" theme-"] .annex-comparison-block{
  border-top-color:var(--line);
}

body[class^="theme-"] .annex-comparison-block h3,
body[class*=" theme-"] .annex-comparison-block h3{
  color:var(--navy);
}

body[class^="theme-"] .document-status--positive,
body[class*=" theme-"] .document-status--positive{color:var(--green)}
body[class^="theme-"] .document-status--attention,
body[class*=" theme-"] .document-status--attention{color:var(--gold)}
body[class^="theme-"] .document-status--neutral,
body[class*=" theme-"] .document-status--neutral{color:var(--muted)}

/* Heritage discret */
.theme-heritage{
  --body-font:"Segoe UI",Arial,sans-serif;
  --display-font:Georgia,"Times New Roman",serif;
  --paper:#fffdf8;--ink:#28313a;--muted:#716b63;--line:#d9d2c6;--soft:#f6f1e8;
  --navy:#243954;--blue:#496a89;--green:#526f5a;--gold:#a77b35;--red:#9b413b;
  --surface:#fffdf9;--surface-soft:#f6f1e8;--surface-muted:#faf7f1;
  --table-header:#f0ebe2;--table-central:#f1f4f7;--table-total:#f1f5ef;
  --owner-surface:#f5f1ea;--search-surface:#faf7f1;--annex-surface:#fffdf9;
  --annex-kpi-surface:#f5f1ea;--annex-note-surface:#faf7f1;
  --callout-info:#f3f6f8;--callout-prudent:#f2f5ef;--callout-risk:#fbf5e8;
  --badge-surface:#f1ece3;
  --cover-background:var(--paper);
  --card-radius:3px;--small-radius:2px;--callout-radius:2px;--card-shadow:none;
  --page-shadow:rgba(54,45,35,.11);--heading-rule:1.5px solid #c9bfae;
  --sankey-background:#fffdf8;--sankey-person-start:#243954;--sankey-person-end:#455f7d;
  --sankey-household-start:#2d4b6d;--sankey-household-end:#557393;
  --sankey-neutral-ribbon:#c4c3bd;--sankey-tax-start:#a57a2b;--sankey-tax-end:#c49a45;
  --sankey-tax-ribbon:#c9a45b;--sankey-available-start:#4d755c;--sankey-available-end:#71947a;
  --sankey-available-ribbon:#7fa187;--sankey-mortgage-start:#355d80;--sankey-mortgage-end:#527b9d;
  --sankey-mortgage-ribbon:#668ba8;--sankey-debt-start:#725b73;--sankey-debt-end:#947b95;
  --sankey-debt-ribbon:#9a869b;--sankey-housing-start:#6689a2;--sankey-housing-end:#84a5bb;
  --sankey-housing-ribbon:#91afc1;--sankey-daily-start:#547f7b;--sankey-daily-end:#78a09b;
  --sankey-daily-ribbon:#83aaa5;--sankey-savings-start:#4d755c;--sankey-savings-end:#71947a;
  --sankey-savings-ribbon:#7fa187;--sankey-detail-text:#243954;--sankey-note-text:#4f5660;
  --sankey-icon:#66717c;--sankey-shadow:rgba(54,45,35,.09);
}
.theme-heritage .badge{border:1px solid var(--line);border-radius:2px}

/* Sauge patrimoniale */
.theme-sage{
  --body-font:"Segoe UI",Arial,sans-serif;--display-font:"Segoe UI",Arial,sans-serif;
  --paper:#fffefb;--ink:#2e3b37;--muted:#68766f;--line:#d5ded8;--soft:#f2f7f3;
  --navy:#315e52;--blue:#527d79;--green:#3f7d5b;--gold:#b78a42;--red:#a8544a;
  --surface:#fffefc;--surface-soft:#f2f7f3;--surface-muted:#f7faf7;
  --table-header:#eaf2ed;--table-central:#eef5f3;--table-total:#eef7f0;
  --owner-surface:#f0f5f1;--search-surface:#f6faf7;--annex-surface:#fffefc;
  --annex-kpi-surface:#eef5f1;--annex-note-surface:#f6faf7;
  --callout-info:#eef5f4;--callout-prudent:#eef7f0;--callout-risk:#fbf5e8;
  --badge-surface:#e8f1ed;
  --cover-background:var(--paper);
  --card-radius:14px;--small-radius:9px;--callout-radius:12px;
  --card-shadow:0 3px 12px rgba(47,94,72,.08);--page-shadow:rgba(47,94,72,.11);
  --heading-rule:2px solid #cbdad1;
  --sankey-background:#fffefb;--sankey-person-start:#294c42;--sankey-person-end:#3f6d5e;
  --sankey-household-start:#356657;--sankey-household-end:#5a8978;
  --sankey-neutral-ribbon:#c8cec8;--sankey-tax-start:#b88932;--sankey-tax-end:#d2a653;
  --sankey-tax-ribbon:#d1ae67;--sankey-available-start:#3b7756;--sankey-available-end:#609575;
  --sankey-available-ribbon:#70a382;--sankey-mortgage-start:#527a79;--sankey-mortgage-end:#709694;
  --sankey-mortgage-ribbon:#80a3a1;--sankey-debt-start:#846d8e;--sankey-debt-end:#a08aaa;
  --sankey-debt-ribbon:#aa96b2;--sankey-housing-start:#779b92;--sankey-housing-end:#96b5ad;
  --sankey-housing-ribbon:#a0bdb5;--sankey-daily-start:#4f9185;--sankey-daily-end:#73aa9f;
  --sankey-daily-ribbon:#80b4aa;--sankey-savings-start:#3b7756;--sankey-savings-end:#609575;
  --sankey-savings-ribbon:#70a382;--sankey-detail-text:#315e52;--sankey-note-text:#4b625a;
  --sankey-icon:#5e776e;--sankey-shadow:rgba(47,94,72,.12);
}

/* Ardoise analytique */
.theme-slate{
  --body-font:"Segoe UI",Arial,sans-serif;--display-font:"Segoe UI",Arial,sans-serif;
  --paper:#fcfdff;--ink:#263442;--muted:#627181;--line:#cfd8e1;--soft:#f1f4f7;
  --navy:#2d4357;--blue:#4e7895;--green:#527767;--gold:#a77838;--red:#a34a42;
  --surface:#fff;--surface-soft:#f1f4f7;--surface-muted:#f7f9fb;
  --table-header:#e9eff4;--table-central:#edf3f7;--table-total:#eef4f0;
  --owner-surface:#eef2f5;--search-surface:#f5f7f9;--annex-surface:#fff;
  --annex-kpi-surface:#eef2f5;--annex-note-surface:#f5f7f9;
  --callout-info:#eef3f6;--callout-prudent:#eef4f0;--callout-risk:#f8f2e8;
  --badge-surface:#e9eef2;
  --cover-background:var(--paper);
  --card-radius:1px;--small-radius:1px;--callout-radius:1px;
  --card-left-border:3px solid var(--blue);--card-shadow:none;
  --page-shadow:rgba(37,53,72,.11);--heading-rule:1px solid var(--line);
  --sankey-background:#fcfdff;--sankey-person-start:#253548;--sankey-person-end:#41556b;
  --sankey-household-start:#344b63;--sankey-household-end:#54708a;
  --sankey-neutral-ribbon:#c2cad4;--sankey-tax-start:#a87226;--sankey-tax-end:#c58e3d;
  --sankey-tax-ribbon:#c99b55;--sankey-available-start:#456f59;--sankey-available-end:#638b70;
  --sankey-available-ribbon:#749a7f;--sankey-mortgage-start:#356685;--sankey-mortgage-end:#5085a6;
  --sankey-mortgage-ribbon:#6595b2;--sankey-debt-start:#675a7c;--sankey-debt-end:#827493;
  --sankey-debt-ribbon:#9184a1;--sankey-housing-start:#60849b;--sankey-housing-end:#7fa0b5;
  --sankey-housing-ribbon:#8eacbf;--sankey-daily-start:#477f83;--sankey-daily-end:#669b9e;
  --sankey-daily-ribbon:#76a7aa;--sankey-savings-start:#456f59;--sankey-savings-end:#638b70;
  --sankey-savings-ribbon:#749a7f;--sankey-detail-text:#2d4357;--sankey-note-text:#536575;
  --sankey-icon:#607486;--sankey-shadow:rgba(37,53,72,.08);
}
.theme-slate .badge{border:1px solid var(--line);border-radius:1px}

/* Editorial ivoire */
.theme-editorial{
  --body-font:"Segoe UI",Arial,sans-serif;--display-font:Georgia,"Times New Roman",serif;
  --paper:#fffaf5;--ink:#302f2c;--muted:#786f68;--line:#ded4ca;--soft:#f7eee8;
  --navy:#343c46;--blue:#627688;--green:#607662;--gold:#a96f4b;--red:#a64d45;
  --surface:#fffaf6;--surface-soft:#f7eee8;--surface-muted:#fbf6f1;
  --table-header:#f1e7df;--table-central:#f2f0ee;--table-total:#f0f3ed;
  --owner-surface:#f5ece5;--search-surface:#fbf5ef;--annex-surface:#fffaf6;
  --annex-kpi-surface:#f5ece5;--annex-note-surface:#fbf5ef;
  --callout-info:#f2f0ee;--callout-prudent:#f0f3ed;--callout-risk:#f8eee7;
  --badge-surface:#f1e7df;
  --cover-background:var(--paper);
  --card-radius:0;--small-radius:0;--callout-radius:0;--card-shadow:none;
  --page-shadow:rgba(80,61,48,.10);--heading-rule:1px solid var(--line);--heading-style:normal;
  --sankey-background:#fffaf5;--sankey-person-start:#343c46;--sankey-person-end:#596775;
  --sankey-household-start:#475766;--sankey-household-end:#70808d;
  --sankey-neutral-ribbon:#d0c8c1;--sankey-tax-start:#9d6746;--sankey-tax-end:#b9825e;
  --sankey-tax-ribbon:#c09273;--sankey-available-start:#56705a;--sankey-available-end:#748a77;
  --sankey-available-ribbon:#879b89;--sankey-mortgage-start:#566d80;--sankey-mortgage-end:#73899a;
  --sankey-mortgage-ribbon:#8296a6;--sankey-debt-start:#786579;--sankey-debt-end:#958196;
  --sankey-debt-ribbon:#a28fa3;--sankey-housing-start:#7a8e9b;--sankey-housing-end:#98a9b4;
  --sankey-housing-ribbon:#a3b2bc;--sankey-daily-start:#667f7c;--sankey-daily-end:#849a96;
  --sankey-daily-ribbon:#92a5a1;--sankey-savings-start:#56705a;--sankey-savings-end:#748a77;
  --sankey-savings-ribbon:#879b89;--sankey-detail-text:#343c46;--sankey-note-text:#6b625d;
  --sankey-icon:#766d67;--sankey-shadow:rgba(80,61,48,.07);
}
.theme-editorial .eyebrow,.theme-editorial .meta span,.theme-editorial .kpi span,
.theme-editorial table,.theme-editorial .small,.theme-editorial .badge,
.theme-editorial .sankey-chart{font-family:"Segoe UI",Arial,sans-serif}

/* Monochrome institutionnel */
.theme-monochrome{
  --body-font:"Segoe UI",Arial,sans-serif;--display-font:"Segoe UI",Arial,sans-serif;
  --paper:#fff;--ink:#202020;--muted:#666;--line:#c8c8c8;--soft:#f2f2f2;
  --navy:#202020;--blue:#4a4a4a;--green:#555;--gold:#777;--red:#333;
  --surface:#fff;--surface-soft:#f2f2f2;--surface-muted:#f7f7f7;
  --table-header:#e8e8e8;--table-central:#f0f0f0;--table-total:#ededed;
  --owner-surface:#f1f1f1;--search-surface:#f7f7f7;--annex-surface:#fff;
  --annex-kpi-surface:#f1f1f1;--annex-note-surface:#f7f7f7;
  --callout-info:#f4f4f4;--callout-prudent:#ededed;--callout-risk:#e7e7e7;
  --badge-surface:#fff;
  --cover-background:var(--paper);
  --card-radius:0;--small-radius:0;--callout-radius:0;--card-border-width:1.5px;
  --card-shadow:none;--page-shadow:rgba(0,0,0,.10);--heading-rule:3px solid #202020;
  --heading-transform:none;--heading-letter-spacing:.02em;
  --sankey-background:#fff;--sankey-person-start:#111;--sankey-person-end:#383838;
  --sankey-household-start:#292929;--sankey-household-end:#555;--sankey-neutral-ribbon:#c8c8c8;
  --sankey-tax-start:#555;--sankey-tax-end:#777;--sankey-tax-ribbon:#999;
  --sankey-available-start:#333;--sankey-available-end:#666;--sankey-available-ribbon:#8a8a8a;
  --sankey-mortgage-start:#222;--sankey-mortgage-end:#555;--sankey-mortgage-ribbon:#777;
  --sankey-debt-start:#444;--sankey-debt-end:#6a6a6a;--sankey-debt-ribbon:#888;
  --sankey-housing-start:#555;--sankey-housing-end:#777;--sankey-housing-ribbon:#999;
  --sankey-daily-start:#666;--sankey-daily-end:#888;--sankey-daily-ribbon:#aaa;
  --sankey-savings-start:#333;--sankey-savings-end:#555;--sankey-savings-ribbon:#777;
  --sankey-detail-text:#171717;--sankey-note-text:#171717;--sankey-icon:#171717;
  --sankey-shadow:rgba(0,0,0,.08);
}
.theme-monochrome .meta,.theme-monochrome .kpi,.theme-monochrome .callout,
.theme-monochrome .risk-card,.theme-monochrome .annex-person{box-shadow:none}
.theme-monochrome .badge{border:1px solid #171717;border-radius:0}

/* Bordeaux prive - optional extra theme. Add "burgundy" to the schema and UI
 * theme selector to expose it in the application. */
.theme-burgundy{
  --body-font:"Segoe UI",Arial,sans-serif;--display-font:Georgia,"Times New Roman",serif;
  --paper:#fffdfb;--ink:#302b2e;--muted:#75686d;--line:#ddced2;--soft:#f8f1f3;
  --navy:#29384b;--blue:#7a3048;--green:#55715c;--gold:#b28a52;--red:#9e3848;
  --surface:#fffdfc;--surface-soft:#f8f1f3;--surface-muted:#fbf6f7;
  --table-header:#f1e5e9;--table-central:#f4edef;--table-total:#eef3ef;
  --owner-surface:#f6ecef;--search-surface:#fbf6f7;--annex-surface:#fffdfc;
  --annex-kpi-surface:#f6ecef;--annex-note-surface:#fbf6f7;
  --callout-info:#f5edf0;--callout-prudent:#eef3ef;--callout-risk:#faf2e8;
  --badge-surface:#f1e5e9;
  --cover-background:var(--paper);
  --card-radius:6px;--small-radius:4px;--callout-radius:5px;
  --card-shadow:0 2px 10px rgba(77,35,51,.07);--page-shadow:rgba(77,35,51,.11);
  --heading-rule:1.5px solid #d6c2c8;
  --sankey-background:#fffdfb;--sankey-person-start:#29384b;--sankey-person-end:#465b73;
  --sankey-household-start:#384e66;--sankey-household-end:#5a7187;
  --sankey-neutral-ribbon:#d2c9cc;--sankey-tax-start:#a8793f;--sankey-tax-end:#c29a62;
  --sankey-tax-ribbon:#cbaa7c;--sankey-available-start:#4c6d55;--sankey-available-end:#6d8a72;
  --sankey-available-ribbon:#7c987f;--sankey-mortgage-start:#6b2940;--sankey-mortgage-end:#8a455c;
  --sankey-mortgage-ribbon:#9c6174;--sankey-debt-start:#73556f;--sankey-debt-end:#92728d;
  --sankey-debt-ribbon:#a2849d;--sankey-housing-start:#687f95;--sankey-housing-end:#879aad;
  --sankey-housing-ribbon:#96a8b8;--sankey-daily-start:#5d807f;--sankey-daily-end:#7e9c9a;
  --sankey-daily-ribbon:#8da9a7;--sankey-savings-start:#4c6d55;--sankey-savings-end:#6d8a72;
  --sankey-savings-ribbon:#7c987f;--sankey-detail-text:#29384b;--sankey-note-text:#665c61;
  --sankey-icon:#74676d;--sankey-shadow:rgba(77,35,51,.09);
}
.theme-burgundy .eyebrow,.theme-burgundy .meta span,.theme-burgundy .kpi span,
.theme-burgundy table,.theme-burgundy .small,.theme-burgundy .badge,
.theme-burgundy .sankey-chart{font-family:"Segoe UI",Arial,sans-serif}


/* Couverture volontairement unie pour tous les thèmes. */
.cover,
body[class^="theme-"] .cover,
body[class*=" theme-"] .cover{
  background:var(--paper);
  background-image:none;
}

@media print{
  html,body{
    background:#fff;
  }

  .page{
    margin:0;
    box-shadow:none;
  }

  .screen-only{
    display:none!important;
  }
}
`;
