# Direction de l’application web

## Décision mise en œuvre

La cible retenue est une PWA statique local-first en TypeScript : React/Vite pour l’interface, Zod et JSON Schema pour le contrat, fonctions TypeScript pures pour les calculs, HTML/CSS/SVG pour le dossier et Playwright pour le PDF.

Cette architecture répond directement au produit : partage par simple URL, fonctionnement hors ligne, aucune base de données, aucune donnée bancaire transmise et déploiement possible sur GitHub Pages. Un backend, FastAPI ou Next.js serveur ajouterait ici de l’exploitation et un risque de confidentialité sans répondre à un besoin fonctionnel actuel.

## Frontières durables

```text
fichier JSON -> validation -> calculs purs -> renderer de 1 à 13 pages pertinentes
                         \-> éditeur React -> brouillon IndexedDB
```

- `packages/schema` est l’autorité du format persistant ;
- `packages/calculations` est l’unique autorité des agrégats ;
- `packages/document` ne reçoit que des données validées et calculées ;
- `apps/web` orchestre l’édition, la reprise locale et les exports.

Les packages ne dépendent pas de l’application. Le document ne dépend pas des composants React. Le stockage n’est pas mélangé au domaine.

## Portabilité

Le build utilise des chemins relatifs et produit des fichiers statiques dans `apps/web/dist`. Il peut être servi par n’importe quel hébergeur statique. Le service worker précache l’application ; les données restent dans le fichier de l’utilisateur et dans l’IndexedDB du navigateur.

Un packaging desktop futur pourrait réutiliser les mêmes packages sans modifier le modèle. Un backend ne deviendrait pertinent que pour une fonctionnalité explicitement multi-utilisateur : collaboration, synchronisation chiffrée ou génération serveur contrôlée.

## Évolutions autorisées

- nouveaux champs intégrés au contrat courant avec tests de conformité ;
- nouveaux scénarios et prêts composites dans le moteur pur ;
- thèmes de présentation sans dépendance du domaine à React ;
- importeurs additionnels comme adaptateurs en bordure ;
- audit WCAG automatisé plus complet lorsque l’outillage dédié est disponible.
