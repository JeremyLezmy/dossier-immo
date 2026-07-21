# Dossiers fictifs de démonstration

L'application propose trois dossiers intégralement synthétiques. Aucun nom, métier, lieu, récit ou montant ne provient d'un dossier réel, de `private/` ou des utilisateurs du projet. Les adresses électroniques utilisent le domaine réservé `example.invalid` et aucun justificatif binaire n'est inclus.

## Profils proposés

| Exemple                          | Situation                                                 | Projet                              | Fonctions particulièrement illustrées                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Première acquisition en solo     | Salariée en CDI, sans personne à charge                   | Appartement neuf à Tours            | salaire fixe, prime exclue de la capacité, prêt étudiant, prêt employeur amorti sur 20 ans, budget personnalisé, critères requis/préférés/exclus                      |
| Famille à revenus mixtes         | Couple marié, deux enfants, CDI et profession libérale    | Maison existante autour de Grenoble | historique libéral sur trois exercices, vente du logement actuel, passifs multiples, PTZ estimatif différé 5 ans puis amorti 20 ans, stress sur le revenu indépendant |
| Retraités investisseurs locatifs | Couple retraité, propriétaire sans crédit de sa résidence | Deux-pièces locatif à La Rochelle   | pensions, revenu foncier décoté, loyer futur exclu, patrimoine diversifié, vacance locative, réserve travaux et santé                                                 |

## Couverture attendue

Chaque dossier couvre toutes les sections pertinentes pour son histoire, les scénarios de financement, les budgets actuel/central/stress, l'inventaire des pièces, les textes éditoriaux et les états de réserve. La famille à revenus mixtes produit les treize pages ; les profils sans revenu indépendant omettent automatiquement l'annexe correspondante. Aucun titre, tableau ou page vide n'est conservé pour atteindre artificiellement un nombre de pages. Chaque profil comprend notamment une lettre bancaire structurée d'au moins 250 mots, des facteurs de stabilité argumentés et des introductions, encadrés ou conclusions propres à chaque page. Le catalogue couvre collectivement les projets `new-build`, `primary-residence` et `rental-investment`, les foyers seul/couple, les revenus salarié/libéral/pension/locatif, les actifs liquides et illiquides, ainsi que les prêts simples et complémentaires.

Le PTZ de démonstration reste une hypothèse à confirmer : son différé ne constitue ni une règle d’éligibilité ni une offre bancaire. Le document affiche son absence de paiement hors assurance pendant 60 mois, puis son amortissement, et retient la mensualité maximale du scénario pour l’effort et le budget.

Les modèles de rémunération ou catégories très rares qui rendraient ces trois récits incohérents restent couverts par les tests unitaires du schéma. La démonstration vise un dossier bancaire crédible, pas une juxtaposition artificielle de toutes les valeurs d'énumération.

## Sources versionnées

- `packages/fixtures/src/demo-dossiers.ts` est l'autorité applicative.
- `config.example/dossier.json` reste l'alias du dossier complet utilisé par les tests de document.
- `config.example/dossiers/` contient les trois exports JSON publics, régénérés avec `corepack pnpm contracts:export`.

Toute évolution d'un profil doit préserver la validation du schéma, les références par identifiants, la cohérence de la réserve, la calculabilité et l'absence de page ou sous-bloc vide dans le document.
