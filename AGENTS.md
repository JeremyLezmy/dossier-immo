# Consignes de travail — Dossier Immo

## Objet et portée

Ce fichier s'applique à l'intégralité du dépôt. Il constitue le contrat de travail de tout agent IA intervenant sur Dossier Immo. Une instruction explicite donnée par l'utilisateur dans la tâche courante prime ; en cas de doute matériel, demander son accord au lieu d'élargir le périmètre.

Dossier Immo est une application web locale qui aide un particulier français à constituer un dossier bancaire immobilier professionnel. Elle guide la saisie du foyer, des revenus, du patrimoine, des dettes, du projet, des scénarios et des budgets, puis produit un aperçu et un PDF bancaire déterministe de treize pages. Elle ne fournit pas de conseil financier personnalisé.

Techniquement, il s'agit d'une PWA statique local-first en React, TypeScript et Vite. Zod et JSON Schema portent le contrat persistant ; les calculs métier sont des fonctions TypeScript pures ; le document est rendu en HTML/CSS/SVG puis imprimé par Edge/Chromium ; IndexedDB ne conserve qu'un brouillon de récupération. Aucun backend, compte, stockage distant, télémétrie ou transmission de données n'est requis. Le fichier `.dossier-immo.json` exporté par l'utilisateur est la sauvegarde canonique.

## Documents à lire avant d'agir

Lire seulement ce qui est utile à la tâche, mais respecter cet ordre pour toute modification transverse :

1. `AGENTS.md` — permissions, méthode et invariants du projet ;
2. `docs/PRODUCT_SPEC.md` — objectif fonctionnel, parcours et hors-périmètre ;
3. `docs/ARCHITECTURE.md` et `docs/WEB_APP_DIRECTION.md` — frontières techniques durables ;
4. `docs/DATA_MODEL.md` et `docs/schema/dossier.json` — contrat persistant `schemaVersion: 3` ;
5. `docs/MAINTENANCE_GUIDE.md` — règles d'évolution du domaine, des calculs, du document et de l'interface ;
6. `docs/DEVELOPER_GUIDE.md` — environnement, lancement et suite de validation ;
7. `docs/DEPENDENCY_SECURITY.md` et `docs/dependency-trust-exclusions.json` — chaîne d'approvisionnement, exceptions et réévaluation ;
8. `.github/PULL_REQUEST_TEMPLATE.md` — contenu obligatoire à lire et compléter avant toute pull request ;
9. `README.md` — vue d'ensemble et commandes essentielles.

Pour une modification ciblée, lire aussi le `package.json`, les tests et les modules directement concernés. Le code et les contrats exécutables priment sur une documentation manifestement périmée ; corriger alors la documentation dans la même modification.

## Invariants fonctionnels et techniques

- Conserver une application GUI-first utilisable sans éditer de configuration.
- Rester local-first : aucune donnée de dossier ne quitte le navigateur.
- Ne pas introduire de backend, compte, base distante, synchronisation, analytics, télémétrie, CDN d'exécution ou service tiers sans décision explicite de l'utilisateur.
- Ne jamais stocker de justificatif binaire dans l'application. Seul leur inventaire fait partie du dossier.
- Conserver `.dossier-immo.json` comme autorité portable ; IndexedDB reste un brouillon récupérable.
- Ne pas persister un total calculable. Séparer strictement déclaré, hypothèse, calculé et présentation.
- Garder `packages/calculations` pur et indépendant de React, du DOM, du navigateur et des fichiers.
- Garder `packages/document` indépendant des composants React et alimenté uniquement par des données validées et dérivées.
- Préserver les montants en centimes entiers, les taux en points de base, les dates ISO et les références par identifiants stables.
- Ne pas changer `schemaVersion: 3` sans plan explicite de compatibilité, migration, tests de lecture et documentation.
- Les fixtures versionnées doivent être riches, réalistes dans leur couverture et entièrement fictives.
- Ne pas restaurer le code legacy ni réécrire l'historique Git sans demande explicite.
- La PWA doit conserver `base: "./"`, ses chemins relatifs et sa compatibilité avec un sous-chemin GitHub Pages.

## Permissions et limites d'autonomie

- Ne jamais créer de commit, pousser, ouvrir ou modifier une pull request, fusionner, taguer, publier une release, déployer, modifier un workflow CI/CD ou modifier un remote sans feu vert explicite de l'utilisateur pour l'action concernée.
- Ne jamais réécrire l'historique, forcer un push, exécuter `git reset --hard`, supprimer une branche ou effacer des changements utilisateur sans autorisation explicite.
- Ne rien indexer avec `git add` sans demande explicite. Toujours laisser un état de travail lisible et signaler les fichiers modifiés.
- Ne jamais installer ou activer globalement un outil sur l'ordinateur sans feu vert explicite : pas de `npm -g`, `pnpm -g`, `corepack enable`, `winget`, Chocolatey, modification du `PATH`, du registre, d'un service ou d'une configuration système.
- L'utilisation approuvée de Corepack peut télécharger pnpm et le runtime Node dans ses caches utilisateur ou le stockage local du projet. Elle ne vaut pas autorisation d'une activation globale.
- Ne pas ouvrir ni piloter un navigateur graphique. Utiliser les commandes CLI et Playwright/Edge en mode automatisé. Si une information externe est indispensable, demander à l'utilisateur ou consulter la CI distante via CLI après autorisation pertinente.
- Ne pas lire, copier, afficher, transformer ou supprimer les données de `private/`, des justificatifs ou exports réels sans demande explicite et ciblée.
- Ne jamais exposer de secret, jeton, donnée personnelle ou contenu privé dans les logs, fixtures, captures, rapports, commandes, CI ou artefacts.
- Une demande d'audit autorise l'inspection et le compte rendu, pas l'implémentation. Présenter les constats et obtenir le feu vert avant les corrections, sauf si la demande autorise déjà explicitement leur mise en œuvre.
- Si une étape est bloquée, tenter des contrôles non destructifs et les étapes indépendantes suivantes. Ne pas contourner une permission ni masquer l'incertitude.

## Workflow Git et pull requests

- Ne jamais développer directement sur `main`. Avant la première modification, vérifier la branche courante et créer une branche de travail si nécessaire, uniquement dans le périmètre autorisé.
- Utiliser un nom de branche conventionnel, court et descriptif : `feature/...`, `fix/...`, `docs/...`, `chore/...`, `refactor/...`, `test/...`, `perf/...` ou `ci/...`. Éviter les noms opaques, personnels ou numérotés sans sens métier.
- Le parcours obligatoire est : branche de travail → feu vert de commit → commit(s) propre(s) → feu vert de push → push de la branche → feu vert de création de PR → PR en draft → CI verte → revue → feu vert explicite de merge → merge dans GitHub.
- Aucun push direct sur `main`, même si les protections GitHub l'autorisent techniquement. Aucun merge local contournant la PR.
- Une PR est créée en draft par défaut. La passer « Ready for review » ou la modifier substantiellement exige le périmètre d'autorisation approprié.
- Lire intégralement `.github/PULL_REQUEST_TEMPLATE.md` avant toute création de PR. Compléter toutes les sections applicables, y compris la synthèse vulgarisée, les validations réellement exécutées, les risques et les limites. Ne jamais déclarer un test vert sans preuve.
- Une CI rouge interdit le merge. Diagnostiquer la cause ; ne pas neutraliser un contrôle, modifier un snapshot ou assouplir une politique uniquement pour obtenir du vert.
- La CI verte est nécessaire mais non suffisante : attendre le feu vert explicite de l'utilisateur avant le merge GitHub.
- Après merge, supprimer la branche distante et/ou locale seulement avec un feu vert explicite de nettoyage. Vérifier que la branche a bien été fusionnée avant toute suppression.
- Les permissions sont granulaires : un feu vert pour modifier les fichiers ne vaut pas feu vert de commit ; un feu vert de commit ne vaut pas push ; un push autorisé ne vaut pas PR ; une PR autorisée ne vaut pas merge ; un merge autorisé ne vaut pas nettoyage.

## Méthode de travail attendue

1. Reformuler brièvement l'objectif technique et fonctionnel lorsqu'il est ambigu ou transverse.
2. Inspecter l'état Git et les changements existants avant d'éditer. Tout changement non créé par l'agent appartient à l'utilisateur et doit être préservé.
3. Pour une tâche substantielle, annoncer un plan complet, sans raccourci, et maintenir l'utilisateur informé pendant l'exécution.
4. Chercher la cause racine et les consommateurs d'un comportement avant de modifier le code.
5. Faire des hypothèses seulement si elles sont réversibles, localisées et cohérentes avec les invariants ; expliciter celles qui influencent le résultat.
6. Appliquer des changements petits, cohérents et relisibles. Éviter les refontes opportunistes sans lien avec la tâche.
7. Vérifier à un niveau proportionné au risque, puis documenter les commandes réellement exécutées, résultats, limites et travaux restants.
8. Mettre à jour la documentation lorsqu'une commande, une architecture, une politique, un parcours ou une procédure change.

## Qualité de développement

- Produire du code de qualité production : typage strict, noms explicites, modules ciblés, erreurs traitées, états asynchrones visibles et comportement déterministe.
- Ne pas laisser de code mort, doublon, contournement temporaire silencieux, placeholder, journal de debug, dépendance inutilisée, `any` évitable ou TODO sans propriétaire et justification.
- Préférer les primitives existantes et la bibliothèque standard à une nouvelle dépendance. Toute dépendance ajoutée doit avoir un besoin démontré, une maintenance crédible, une licence compatible, une empreinte acceptable et passer les politiques de sécurité.
- Couvrir toute correction de bug par un test de non-régression pertinent.
- Une évolution métier requiert des tests unitaires déterministes et, si pertinent, des tests de propriétés et de contrats.
- Ne jamais recalculer dans l'interface ou le renderer une valeur dont `packages/calculations` est l'autorité.
- Préserver l'accessibilité clavier, les libellés, rôles, annonces sémantiques, contrastes, zones tactiles et focus visibles.
- Vérifier au minimum les largeurs représentatives : mobile 360×800 et 390×844, tablette 768×1024, desktop 1920×1080 et grand écran 2560×1440. Aucun contrôle critique ne doit devenir inaccessible, tronqué ou superposé.
- L'interface peut évoluer ; le design du PDF est hors périmètre sauf demande explicite.

## Frontière de non-régression PDF

- Le PDF validé de treize pages est un oracle fonctionnel pendant les refactors de l'application.
- Comparer nombre et ordre des pages, structure, texte, géométrie et rendu visuel. Ne pas comparer uniquement le hash binaire : les métadonnées Chromium rendent les octets non déterministes.
- Ne jamais mettre à jour automatiquement un snapshot pour faire disparaître un échec.
- `test:e2e:update` exige une intention explicite, puis une revue visuelle des captures et du PDF avant de relancer `test:e2e` sans mise à jour.
- Toute modification volontaire du renderer ou du CSS d'impression doit être isolée, justifiée et documentée.

## Sécurité défensive et confidentialité

- Limiter le travail de cybersécurité à l'identification, la prévention, la réduction et la correction de risques dans ce dépôt. Ne pas produire de procédure d'exploitation offensive ni sonder des systèmes externes.
- Appliquer le moindre privilège, les entrées strictement validées, l'encodage de sortie, les limites de taille, les dépendances verrouillées et l'absence de secret côté client.
- Pour les imports, rejeter explicitement fichier trop volumineux, JSON invalide, version inconnue et références incohérentes sans écraser le brouillon courant.
- Pour les exports et le PDF, ne pas injecter de HTML non maîtrisé, ne pas charger de ressource distante et ne pas écrire hors de la destination choisie.
- Examiner régulièrement les fichiers suivis, `.gitignore`, les workflows, les logs et artefacts afin d'empêcher la publication de données privées.
- Toute constatation de sécurité doit décrire impact, preuve locale minimale, recommandation défensive et niveau de confiance, sans détail d'exploitation inutile.

## Chaîne d'approvisionnement future-proof

- Le projet fixe `pnpm@11.13.1` dans `packageManager` et l'utilise via Corepack, sans shim global.
- Le runtime des scripts est Node `24.18.0`, géré localement par `devEngines`; un Node hôte `>=22.13` sert uniquement à amorcer Corepack.
- `pnpm-lock.yaml` est l'unique lockfile. Ne pas recréer `package-lock.json`, `yarn.lock` ou un autre lockfile.
- La fenêtre de maturité est de 4320 minutes, soit 72 heures, avec `minimumReleaseAgeStrict: true`. Elle est glissante : une version trop récente aujourd'hui devient éligible après 72 heures si les autres contrôles restent satisfaits.
- `trustPolicy: no-downgrade` est un contrôle distinct de la fenêtre de 72 heures. Le temps écoulé ne lève pas automatiquement une baisse de provenance.
- Les exclusions de confiance doivent être exactes `nom@version`, minimales, justifiées, verrouillées par intégrité, reliées à leurs parents, datées et assorties d'une condition de retrait. Aucune wildcard, plage ou exclusion globale.
- La liste machine-readable `docs/dependency-trust-exclusions.json` doit rester synchronisée avec `pnpm-workspace.yaml`.
- Exécuter `pnpm deps:policy` à chaque modification de dépendances et `pnpm deps:trust-exclusions` au moins chaque semaine et avant toute mise à niveau. La CI planifiée doit échouer si une exception devient retirable, périme ou diverge.
- Une exclusion devenue inutile doit être supprimée, le lockfile régénéré, puis l'audit et toute la suite relancés. Ne jamais reconduire une date de revue sans refaire le sondage.
- Les scripts de build sont refusés par défaut ; `allowBuilds` doit rester une allowlist nominative. Toute nouvelle entrée exige inspection et justification.
- Contrôler avis de sécurité, arbre, versions obsolètes et SBOM. Une montée majeure est une migration dédiée, jamais un lot automatique.
- Les sous-dépendances dépréciées documentées sont suivies jusqu'à leur parent. Ne pas imposer d'override incompatible seulement pour faire disparaître un avertissement.

## Commandes de référence

Utiliser toujours `corepack pnpm ...`, y compris dans les scripts chaînés du `package.json`. Ne jamais supposer qu'un exécutable `pnpm` nu est présent dans le `PATH` : la CI n'active volontairement aucun shim global avec `corepack enable`.

```powershell
corepack install
corepack pnpm install --frozen-lockfile
corepack pnpm runtime:check
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm deps:policy
corepack pnpm deps:trust-exclusions
corepack pnpm deps:audit
```

Sous PowerShell si la stratégie d'exécution bloque les shims `.ps1`, utiliser `corepack.cmd`. Ne pas résoudre ce cas par une modification globale de la stratégie d'exécution.

## Définition de terminé

Une tâche n'est terminée que lorsque : le besoin demandé est couvert ; le code est propre et cohérent avec les frontières ; les tests pertinents passent ; les variations responsive et l'accessibilité concernées sont vérifiées ; la non-régression PDF est contrôlée si touchée ; les politiques de dépendances passent si concernées ; la documentation est à jour ; `git status` a été relu ; les limites sont signalées ; et aucune opération Git distante ou installation globale non autorisée n'a été effectuée.
