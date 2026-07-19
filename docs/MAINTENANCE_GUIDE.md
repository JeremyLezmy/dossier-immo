# Guide de maintenance

## Règle d’exploitation

L’application est entièrement locale. IndexedDB contient seulement un brouillon de confort ; le fichier `.dossier-immo.json` téléchargé par l’utilisateur est la sauvegarde canonique. Aucun compte, serveur applicatif ou envoi de justificatif n’est requis.

Les données réelles restent dans `private/` ou hors du dépôt. `config.example/dossier.json` est entièrement fictif et constitue l’unique exemple publiable.

## Commandes courantes

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm contracts:export
corepack pnpm build
corepack pnpm test:e2e
```

- `corepack pnpm dev` lance l’éditeur local ;
- `corepack pnpm contracts:export` régénère le JSON Schema et l’exemple depuis leurs sources TypeScript ;
- `corepack pnpm build` enchaîne typage strict, tests unitaires/contractuels et build PWA ;
- `corepack pnpm test:e2e` exécute les parcours réels sous Edge/Chromium et contrôle le PDF de 13 pages ;
- `corepack pnpm test:e2e:update` ne s’utilise qu’après revue visuelle volontaire pour accepter de nouvelles captures.

## Chaîne d’approvisionnement Corepack/pnpm

Le dépôt fixe pnpm 11.13.1 via Corepack et le runtime de ses scripts à Node 24.18.0 via `devEngines`. Un Node hôte `>=22.13` amorce Corepack, sans modifier les autres projets. Ne pas installer pnpm globalement et ne pas lancer `corepack enable`.

`minimumReleaseAge: 4320` et `minimumReleaseAgeStrict: true` refusent les versions de moins de 72 heures. Cette fenêtre est glissante. `trustPolicy: no-downgrade` est distinct : le temps écoulé ne lève pas automatiquement une provenance insuffisante. Les exceptions exactes sont documentées et re-sondées dans `docs/DEPENDENCY_SECURITY.md`.

Avant une mise à jour de dépendances :

```powershell
corepack pnpm deps:outdated
corepack pnpm deps:policy
corepack pnpm deps:trust-exclusions
corepack pnpm deps:audit
corepack pnpm deps:tree
```

Le contrôleur de politique vérifie fenêtre, provenance, intégrités et échéances des exceptions. `pnpm audit` contrôle les avis de sécurité et `pnpm list` expose l’arbre effectivement verrouillé. Les montées de version majeures restent des migrations dédiées avec build, tests E2E et contrôle du PDF ; elles ne sont jamais appliquées en bloc uniquement parce que `pnpm outdated` les signale.

## Faire évoluer le domaine

1. Modifier le schéma dans `packages/schema` et documenter le contrat courant.
2. Adapter le corpus fictif riche et les cas limites dans `packages/fixtures`.
3. Régénérer les artefacts avec `corepack pnpm contracts:export`.
4. Adapter calculs, formulaire et document en conservant la séparation données déclarées / valeurs calculées.
5. Exécuter la suite complète et relire le PDF.

Les montants sont des centimes entiers, les taux des points de base entiers et les dates des chaînes ISO. Les identifiants sont stables et servent aux références croisées. Aucun total dérivé ne doit être persisté dans le dossier.

## Faire évoluer un calcul

Les fonctions de `packages/calculations` restent pures : aucune lecture du navigateur, du DOM ou d’un fichier. Toute modification d’arrondi ou de formule exige :

- un test unitaire ciblé ;
- des cas déterministes et, lorsque pertinent, des tests de propriétés ;
- une revue des pages PDF qui consomment le résultat.

Le résultat calculé conserve une provenance pour les agrégats critiques. Le renderer ne doit pas recalculer une mensualité, une réserve ou un ratio.

## Faire évoluer le document

`packages/document` rend treize sections A4 déterministes depuis le dossier validé et le résultat calculé. Le CSS écran et le CSS d’impression appartiennent au même renderer. Un changement volontaire suit ce protocole :

1. lancer `corepack pnpm test:e2e:update` ;
2. ouvrir les captures produites et le PDF de test ;
3. vérifier portrait, page paysage, ruptures, tableaux, pied de page et caractères accentués ;
4. relancer `corepack pnpm test:e2e` sans mise à jour ;
5. documenter la décision de design.

Le contrôle automatisé de mise en page s’exécute avec `corepack pnpm check:layout -- config.example/dossier.json`. La génération ponctuelle d’un PDF se fait avec `corepack pnpm generate:pdf -- <dossier.json> <sortie.pdf>` et ne remplace pas la revue visuelle des treize pages.

## Import, sauvegarde et reprise

- l’import valide strictement la structure courante ;
- une erreur est affichée avec son chemin, sans écraser le brouillon courant ;
- l’autosauvegarde IndexedDB reprend l’édition après rechargement ;
- l’état de l’autosauvegarde reste visible sur mobile, tablette et desktop ;
- « Sauvegarder le dossier » produit le fichier canonique transportable ;
- le menu « Actions du dossier » garde l’ouverture et la sauvegarde accessibles sur les écrans étroits ;
- « Effacer les brouillons » demande confirmation avant de supprimer l’état local de l’application ;
- succès, avertissements et erreurs utilisent des retours visuels et sémantiques distincts ;
- la génération du PDF verrouille son action jusqu’à la fin de l’opération.

Une évolution future du stockage doit préserver la récupération sûre des brouillons. Le fichier exporté demeure l’autorité indépendante du navigateur.

## Contrôles avant diffusion d’un PDF

Vérifier identités et dates, revenus et périodes, apport et réserve, dettes et échéances, taux/assurance/frais, budget central et stress, absence de placeholder, lisibilité des treize pages et liste des justificatifs. Les hypothèses financières restent qualifiées d’indicatives.

## Confidentialité et publication

Ne jamais committer `private/`, `output/`, PDF, relevés, justificatifs ou exports réels. Vérifier `git status`, la liste des fichiers suivis et les motifs sensibles avant chaque publication. La fixture doit conserver des identités, métiers, lieux, dates et montants manifestement fictifs.
