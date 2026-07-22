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

Le fichier `.dossier-immo.json` est la sauvegarde autoritative. IndexedDB ne conserve qu'un brouillon local récupérable lorsque l'utilisateur active explicitement cette option.

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

Au premier accès, la GUI exige un choix entre `session` et `local`. Le mode est la seule préférence conservée dans `localStorage` ; aucune donnée métier n'y est écrite. Le mode `session`, recommandé, purge IndexedDB et conserve le formulaire uniquement en mémoire. Le mode `local` autosauvegarde le formulaire, y compris invalide, après une temporisation. Chaque écriture fixe `expiresAt` à 24 heures après la modification ; une prolongation manuelle produit le même effet. Une heure avant l'échéance, une bannière non bloquante permet de prolonger, d'exporter le JSON canonique ou d'ignorer l'avertissement courant. La purge intervient à l'échéance lorsque l'application est ouverte, ou à la prochaine ouverture sinon. Les enregistrements antérieurs à cette politique reçoivent 24 heures à partir de leur migration afin d'éviter une suppression silencieuse.

Au rechargement en mode local, le dernier brouillon non expiré est repris avant toute nouvelle écriture. Une sauvegarde officielle n'est possible qu'après validation complète et produit le JSON canonique. Ce mécanisme ne modifie pas le contrat `schemaVersion: 3` du fichier métier.

L'import valide strictement le format courant avant de remplacer le formulaire. Les fichiers de plus de 10 Mo, les JSON invalides et les contrats non conformes sont rejetés.

## Document

Le moteur peut produire jusqu'à treize sections A4, dont une page paysage pour le Sankey. Une section demandée mais dépourvue de données métier n'est pas rendue ; une sous-partie vide ne produit jamais de titre, tableau ou encadré orphelin. Les dimensions sont fixes en impression pour empêcher les débordements silencieux. La version complète de référence est testée avec Edge/Chromium, une locale française et le fuseau Europe/Paris.

## Déploiement futur

Le build `apps/web/dist` est entièrement statique et utilise des chemins relatifs. La PWA précache uniquement le code et les assets applicatifs ; les dossiers privés restent en mémoire, dans l'IndexedDB optionnelle ou dans les fichiers choisis par l'utilisateur.

Le stockage navigateur est isolé par origine web, pas par chemin. Plusieurs applications GitHub Pages publiées sous la même origine peuvent donc techniquement partager `localStorage` et IndexedDB. Le mode session réduit ce risque et doit rester recommandé tant que Dossier Immo ne dispose pas de sa propre origine. La reprise locale ne doit jamais être présentée comme une isolation cryptographique.

Avant un déploiement public, vérifier la liste des fichiers suivis, les secrets et les données personnelles. Les exemples doivent rester entièrement fictifs.
