# Migration de l’outillage PDF vers PDF.js 6

Migration dédiée de pdfjs-dist 5.7.284 vers 6.2.108 pour corriger GHSA-hq66-cqwq-w95j. Le paquet Mozilla conserve la licence Apache-2.0 et accepte le runtime Node 24.18.0 utilisé ici.

Seuls les outils CLI pdf-text.mjs, pdf-page.mjs et pdf-audit.mjs importent ce paquet ; il n’entre pas dans le bundle web. Les API getDocument, getPage, getTextContent et render restent compatibles avec ces appels.

Le backend @napi-rs/canvas 1.0.8 (MIT), déjà requis par ces outils et dépendance optionnelle de PDF.js, est maintenant déclaré explicitement en dépendance de développement. Les outils ne dépendent plus d’un lien transitif implicite. Son binaire verrouillé est distribué dans les paquets de plateforme, sans nouveau script d’installation autorisé.

Validation locale sur le PDF fictif : extraction du texte, rendu de la première page et planche de contrôle des treize pages ; compilation et tests. Aucun document réel n’est utilisé comme fixture.
