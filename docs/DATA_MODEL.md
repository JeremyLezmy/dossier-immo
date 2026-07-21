# Modèle de données

## Format canonique

La sauvegarde est un JSON UTF-8 portant `schemaVersion: 3`. Le contrat publié est [dossier.json](schema/dossier.json).

Le modèle couvre notamment :

- un foyer composé de plusieurs personnes et ses événements planifiés ;
- les activités, modes de rémunération et historiques de revenus ;
- les actifs multi-titulaires, passifs et snapshots mensuels ;
- le projet, ses critères et les scénarios de financement ;
- les budgets central et stress, reliés par identifiants stables ;
- les cas de stress financiers et la politique de réserve ;
- l’inventaire des justificatifs sans stocker les fichiers ;
- les textes éditoriaux, emplacements documentaires et options de présentation.

## Unités

- `*Cents` : entier en centimes ;
- `*BasisPoints` : entier, `335` représente `3,35 %` ;
- dates : `YYYY-MM-DD` ;
- mois : `YYYY-MM` ;
- durées : mois entiers ;
- surfaces : mètres carrés.

Aucun formatage français ne se trouve dans le domaine ; il appartient au document et à l’interface.

## Validation transverse

Le schéma rejette notamment les identifiants dupliqués, références orphelines, historiques incohérents, passifs déjà échus, dates d’achat passées, scénarios principaux multiples ou absents, prix mal ordonnés, réserves insuffisantes, allocations excessives, budgets central/stress incomplets et types incorrects.

## Déclaré, hypothèse et calculé

- Déclaré : personnes, revenus, actifs, passifs, budgets, historiques et critères.
- Hypothèse : taux, assurance, prix, épargne projetée, revenu après impôt et réserve.
- Calculé : agrégats, prêt, mensualité, assurance, effort, liquidités projetées, budget total et épargne résiduelle.
- Présentation : textes, titres, couleurs et sections.

Les agrégats calculables ne sont jamais acceptés comme sources déclarées.

## Composition du financement et différé

Un scénario porte un prêt principal implicite et, facultativement, des `additionalLoanComponents`. Le montant de ces tranches complémentaires est retiré du capital du prêt principal : elles ventilent le même besoin de financement sans l’augmenter.

Pour chaque tranche complémentaire :

- `durationMonths` est la durée d’amortissement effective ;
- `deferredMonths` est la période préalable de différé d’amortissement ;
- la durée calendaire totale vaut `deferredMonths + durationMonths`.

L’éditeur peut présenter ces durées en années ou en mois, mais les convertit toujours en mois entiers avant validation et persistance. Pendant le différé, le capital reste constant : une tranche à taux zéro ne produit aucun paiement hors assurance ; une tranche à taux positif produit uniquement les intérêts. L’amortissement à mensualité constante commence ensuite.

La chronologie, les mensualités initiale et maximale, le premier mois du pic et le capital restant dû sont exclusivement dérivés dans `packages/calculations`. Ils ne sont jamais persistés. Le taux d’effort et les budgets utilisent la mensualité maximale estimée, assurance comprise. L’assurance reste une estimation constante calculée sur le capital initial total, sans ventilation par tranche.

## Contrat courant

L’import accepte uniquement le contrat publié. Toute version inconnue ou structure non conforme est refusée explicitement avec un chemin d’erreur exploitable par l’interface.
