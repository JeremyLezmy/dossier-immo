# Architecture de l'application local-first

## Décision

La cible est une application statique TypeScript/React/Vite, installable comme PWA et publiable ultérieurement sur GitHub Pages. Aucun backend, compte ou stockage distant n'est requis.

```text
GUI React
   ↓
Dossier validé par Zod
   ↓
Moteur de calcul TypeScript pur
   ↓
DerivedDossier + provenance
   ↓
Moteur documentaire HTML/CSS print
   ↓
Aperçu et impression PDF Chromium
```

Le fichier `.dossier-immo.json` est la sauvegarde autoritative. IndexedDB ne conserve qu'un brouillon local récupérable.

## Frontières

- `packages/schema` définit types, contraintes, références et JSON Schema ;
- `packages/calculations` ne dépend ni de React ni du rendu ;
- `packages/document` reçoit uniquement un dossier validé et des résultats dérivés ;
- `packages/fixtures` contient exclusivement des données fictives ;
- `apps/web` orchestre formulaires, stockage local, aperçu et fichier.

## Représentation métier

Les montants sont des centimes entiers et les taux des points de base. Les dates restent des chaînes ISO. Les identifiants, et non les libellés, lient personnes, activités, revenus, actifs, passifs et snapshots.

Les valeurs importantes exposent une provenance : formule, identifiants sources, scénario et date d'observation lorsqu'elle s'applique.

## Persistance

La GUI autosauvegarde le formulaire, y compris invalide, dans IndexedDB après une temporisation. Au rechargement, le dernier brouillon est repris avant toute nouvelle écriture. Une sauvegarde officielle n'est possible qu'après validation complète et produit le JSON canonique.

L'import valide strictement le format courant avant de remplacer le formulaire. Les fichiers de plus de 10 Mo, les JSON invalides et les contrats non conformes sont rejetés.

## Document

Le moteur produit treize sections A4, dont une page paysage pour le Sankey. Les dimensions sont fixes en impression pour empêcher les débordements silencieux. La version de référence est testée avec Edge/Chromium, une locale française et le fuseau Europe/Paris.

## Déploiement futur

Le build `apps/web/dist` est entièrement statique et utilise des chemins relatifs. La PWA précache uniquement le code et les assets applicatifs ; les dossiers privés restent dans IndexedDB ou dans les fichiers choisis par l'utilisateur.

Avant un déploiement public, vérifier la liste des fichiers suivis, les secrets et les données personnelles. Les exemples doivent rester entièrement fictifs.
