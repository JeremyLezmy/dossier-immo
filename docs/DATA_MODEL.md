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

La chronologie, les mensualités initiale et maximale, le premier mois du pic et le capital restant dû sont exclusivement dérivés dans `packages/calculations`. Ils ne sont jamais persistés. Le taux d’effort utilise la charge annuelle maximale des prêts simultanés, assurance comprise. Les budgets post-achat utilisent la mensualité initiale et exposent les changements de phase, notamment l’extinction des dettes existantes. Le budget actuel ne déduit aucun futur prêt immobilier. L’assurance reste une estimation constante calculée sur le capital initial total, sans ventilation par tranche.

## Revenus indépendants et trésorerie datée

Les ajouts restent facultatifs dans `schemaVersion: 3` : les fichiers antérieurs restent lisibles par cette version de l’outil. Une ancienne version stricte de l’application peut refuser un fichier enrichi ; conserver l’original et utiliser l’application mise à jour.

- `incomeStreams` distingue la convention bancaire (`monthlyBankCents`, `monthlyPrudentCents`, `bankingConvention`) du revenu économique avant IR (`monthlyEconomicCents`). Les dates de début et de fin déterminent l’inclusion à la date cible d’achat.
- `incomePeriods` porte les périodes réalisées, facturées à encaisser, prévues ou de rythme annuel. Le montant est déclaré ou calculé depuis les unités et le tarif de l’activité, avec son changement daté éventuel. Les taux sociaux et de CFP, les cotisations réellement constatées, les frais professionnels, les commissions et l’abattement fiscal sont explicites. Le calcul fiscal est proportionnel et indicatif, hors minimum annuel d’abattement ; il ne calcule pas l’IR. Chaque période peut référencer des justificatifs.
- Les synthèses de revenus séparent réalisé, réalisé complété par les encaissements prévus, et rythme annuel. Ces lignes se comparent : elles ne s’additionnent pas. Un rythme annuel ne représente pas nécessairement un exercice calendaire encaissé.
- Un budget peut sélectionner une période représentative par revenu (`incomePeriodIds`) et une provision d’IR mensuel. Il utilise alors les moyennes économiques sur les mois calendaires couverts. Les dates et la pertinence de la période doivent être revues par l’utilisateur ; les revenus projetés ne sont pas des garanties.
- `cashFlowPlan` remplace les deux hypothèses simplifiées du projet. Il ajoute aux actifs mobilisables les encaissements futurs nets de cotisations et frais professionnels, puis déduit les dépenses et provisions datées. Une période ne peut être encaissée deux fois, et sa date doit correspondre au flux. Les impôts courants, soldes fiscaux antérieurs et cotisations déjà provisionnées doivent rester distincts.
- Un poste de budget lié par `liabilityId` n’est pas ajouté une seconde fois aux dépenses : la dette est calculée à ses dates. Pour les anciens budgets actuels sans aucun lien, les crédits sont supposés déjà compris dans les postes déclarés. Le champ `servicesMonthlyCents` décrit une part incluse dans la mensualité, sans modifier son total.

La capacité totale d’épargne inclut l’épargne déjà affectée à des placements ; l’épargne résiduelle est ce qui reste après tous les postes, y compris ces affectations. Le Sankey consomme le budget central et son financement effectif. Les postes masqués dans le détail restent inclus dans les flux agrégés ; un budget déficitaire affiche explicitement le déséquilibre.

La réserve est contrôlée pour chaque scénario d’apport, après installation. Les totaux, bases fiscales, soldes de trésorerie, moyennes et phases sont dérivés et ne sont pas exportés comme données sources.

## Contrat courant

L’import accepte uniquement le contrat publié. Toute version inconnue ou structure non conforme est refusée explicitement avec un chemin d’erreur exploitable par l’interface.


### Étude préparatoire et annexes facultatives (version 3)

Champs facultatifs : `project.bankIncomeReferenceDate` (repli sur la date d’achat), `project.financingFeesCents` (frais financés), `liabilities[].settlementAtPurchaseCents` (décompte estimé à l’achat), `presentation.sections.financialReview` et `incomeHistoryChart` (leurs emplacements éditoriaux sont également facultatifs).

`budgetScenarios[].assumptions.taxProjection` contient les entrées fiscales : `parts` (1 ou 2), `incomePeriodIds`, `annualSalaryNetTaxableCents`, `annualOtherTaxableCents`, `note`. Ce mode exclut la provision manuelle et un revenu après IR saisi. Les références absentes, dupliquées, sans abattement ou se chevauchant pour un même revenu sont rejetées. Le barème de référence 2026 et ses résultats appartiennent à `packages/calculations/src/tax.ts` ; aucun IR calculé n’est persisté dans ce mode.

Les comparaisons de revenus, remboursements et mois de trésorerie sont dérivées ; elles utilisent les mêmes données que le budget et le financement. L’historique graphique réutilise `revenueHistory` avec périodes `YYYY-MM`, `observed: true` et `collectedCents` renseigné.


`cashFlowPlan.reservedTaxCents` est une enveloppe déclarée pour une échéance fiscale postérieure à l’achat. Elle reste dans les liquidités et dans la réserve totale ; la réserve libre dérivée la retranche séparément. Elle ne crée pas de flux ni de paiement anticipé. Le seuil de validation historique porte sur la réserve totale ; l’interface signale séparément une réserve libre sous l’objectif.

L’annexe graphique complète les deux dernières années de réalisé avec les périodes `forecast`/`invoiced` à `collectionDate`, jusqu’à l’année suivante. Le réalisé mensuel prime ; les prévisions sont hachurées, les rythmes annuels sont exclus. La comparaison des mois communs reste limitée au réalisé.

`cashFlowPlan.entries[].isProvision` distingue une mise de côté fiscale des acomptes/solde prévus dans le tableau mensuel. Les deux réduisent le disponible budgété ; une provision n’est pas présentée comme un prélèvement effectif.
