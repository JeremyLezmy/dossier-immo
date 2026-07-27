# Sécurité et maintenance des dépendances

## Modèle retenu

Le dépôt utilise Corepack pour sélectionner `pnpm@11.13.1` depuis le champ `packageManager`. Aucun `pnpm -g` ni `corepack enable` n'est nécessaire. Un Node hôte `>=22.13` amorce Corepack ; pnpm télécharge Node `24.18.0` comme runtime local des scripts selon `devEngines`.

`pnpm-lock.yaml` verrouille les versions et intégrités. Une installation reproductible se fait avec `corepack pnpm install --frozen-lockfile`.

## Deux contrôles indépendants

`minimumReleaseAge: 4320` impose 4320 minutes, soit 72 heures, avant qu'une nouvelle version puisse entrer dans une résolution. `minimumReleaseAgeStrict: true` applique cette fenêtre aux dépendances directes et transitives. Cette fenêtre est glissante : une version refusée au jour J peut devenir éligible trois jours plus tard.

`trustPolicy: no-downgrade` refuse qu'une chaîne abandonne un niveau de provenance déjà disponible. Ce contrôle n'expire pas après 72 heures. Une version ancienne peut donc encore nécessiter une décision explicite de confiance.

Les autres garde-fous sont : dépendances exotiques transitives bloquées, intégrité du store vérifiée, exécution refusée si les dépendances ne correspondent plus, cycles de workspace interdits et scripts d'installation soumis à `allowBuilds`.

## Registre des exceptions et adaptations de sécurité

La source de vérité détaillée est `docs/dependency-trust-exclusions.json`. Elle couvre les exclusions de confiance et les overrides de sécurité. Chaque entrée contient : version exacte, date d'introduction, dernière et prochaine revue, parents, raison, intégrité du lockfile et condition de retrait.

Exceptions approuvées le 19 juillet 2026 :

- `semver@6.3.1`, imposé par Babel 7 dans le graphe actuel ;
- `@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1`, imposé exactement par `workbox-build@7.4.1` via `vite-plugin-pwa@1.3.0`.

Ces exceptions ne déclarent pas les paquets « sûrs pour toujours ». Elles acceptent un risque résiduel étroit et vérifiable afin de conserver une chaîne compatible. Leurs archives sont verrouillées par les intégrités du lockfile.

Le sondage du 27 juillet 2026 a confirmé que les deux exclusions restaient nécessaires. Leur prochaine revue est fixée au 3 août 2026.

Deux transitifs dépréciés proviennent également de Workbox : `glob@11.1.0` et `source-map@0.8.0-beta.0`. Ils ne sont pas exclus des contrôles de confiance. Ils restent documentés pour être éliminés dès qu'une chaîne Workbox compatible le permet, sans override hors contrat.

Le 27 juillet 2026, l'avis `GHSA-mh99-v99m-4gvg` a été détecté sur `brace-expansion`. La branche compatible de `minimatch@10.2.5` converge vers le correctif `brace-expansion@5.0.8`. La seconde branche vulnérable venait uniquement de la dépendance de ligne de commande `Jake` d'EJS 3, alors que le plugin PWA appelle seulement l'API CommonJS `ejs.render`. Un override limité à ce parent sélectionne EJS 6.0.1, qui conserve cette API sans la chaîne inutilisée `Jake > filelist > minimatch@5 > brace-expansion@2`.

Ces overrides ne sont pas des exceptions d'audit : les versions vulnérables sont absentes du lockfile et `pnpm audit` ne remonte plus d'avis. Le build PWA passe et ses artefacts sont restés identiques octet pour octet lors de la substitution. Le contrôleur vérifie la synchronisation YAML/JSON, les intégrités, les parents, l'absence des versions retirées, les dates de revue et les conditions de retrait.

## Revue périodique

Exécuter chaque semaine, avant une montée de dépendances et après toute modification de la PWA :

```powershell
corepack pnpm deps:trust-exclusions
```

Le contrôleur vérifie la concordance YAML/JSON des exclusions et overrides, les versions exactes, les intégrités, les parents, l'absence des versions vulnérables retirées, la date de prochaine revue et la fenêtre de 72 heures. Puis il crée une copie temporaire minimale par exclusion de confiance, retire uniquement cette exclusion et demande à pnpm de réévaluer le lockfile. Les copies sont supprimées à la fin.

Une revue échue reste une erreur bloquante. En mode de sondage, elle n'interrompt toutefois plus le contrôleur avant les requêtes pnpm : toutes les exceptions sont sondées, les résultats sont affichés, puis la commande échoue tant que le registre n'a pas été mis à jour. La CI exécute donc les sondages avant le contrôle statique afin de toujours fournir la preuve nécessaire au maintien ou au retrait d'une exception.

Résultats :

- « exclusion encore nécessaire » : mettre à jour `lastReviewedOn` et `nextReviewOn` uniquement après avoir réellement exécuté et relu le sondage ;
- installation réussie sans l'exclusion : la CI échoue, retirer l'exception, régénérer le lockfile et relancer toute la validation ;
- autre erreur : ne pas prolonger l'exception à l'aveugle ; diagnostiquer le registre, Corepack ou la politique.

La CI `dependency-health.yml` exécute ce sondage chaque lundi et à chaque pull request. Une cadence plus fréquente peut être ajoutée, jamais moins fréquente que les sept jours encodés dans le registre.

## Mise à jour contrôlée

1. Vérifier `corepack pnpm deps:outdated` et identifier les mises à jour réellement utiles.
2. Attendre que les versions ciblées aient franchi les 72 heures, sauf décision de sécurité explicitement documentée.
3. Modifier une famille cohérente à la fois ; traiter toute majeure comme une migration dédiée.
4. Régénérer `pnpm-lock.yaml` sans relâcher les politiques.
5. Relire le diff du manifeste et du lockfile, les nouveaux scripts de build, mainteneurs et chaînes transitives.
6. Exécuter `deps:policy`, `deps:trust-exclusions`, `deps:audit`, `deps:tree` et produire un SBOM si la livraison le requiert.
7. Exécuter typage, tests unitaires, build, E2E, responsive, PWA et contrôle PDF.
8. Mettre à jour ce document et le registre si la chaîne ou les exceptions changent.

Ne jamais désactiver globalement la fenêtre, `no-downgrade`, l'intégrité ou `strictDepBuilds` pour débloquer une installation. Une exception urgente doit rester exacte, temporaire, approuvée et documentée.
