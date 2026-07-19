# Guide développeur

## Préparer un laptop vierge

Installer Git et une distribution officielle de Node.js `>=22.13` incluant Corepack. Cette version hôte sert uniquement à amorcer les outils du dépôt ; le projet fixe ensuite pnpm 11.13.1 et Node 24.18.0 sans modifier les autres projets.

Vérifier le socle :

```powershell
git --version
node --version
corepack --version
```

Cloner puis entrer dans le dépôt :

```powershell
git clone <url-du-depot>
cd ProjetImmo
```

Préparer le gestionnaire déclaré par le projet et installer exactement le lockfile :

```powershell
corepack install
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm runtime:check
```

Les deux dernières versions attendues sont pnpm `11.13.1` et le runtime projet Node `v24.18.0`. `corepack install` alimente le cache Corepack ; il n'active pas de shim global. Ne pas lancer `corepack enable`, `npm install --global pnpm` ni `pnpm setup` pour ce projet.

Sous PowerShell, si les scripts `.ps1` sont interdits, utiliser `corepack.cmd` dans les mêmes commandes. Ne pas modifier globalement la stratégie d'exécution Windows.

## Lancer l'application

```powershell
corepack pnpm dev
```

Vite affiche l'adresse locale. L'application est une PWA statique : aucune API, base ou variable secrète n'est à démarrer. Les dossiers édités restent dans IndexedDB et dans les fichiers explicitement ouverts ou enregistrés par l'utilisateur.

Pour arrêter le serveur, revenir dans son terminal et saisir `Ctrl+C`.

## Après un `git pull`

```powershell
git pull
corepack install
corepack pnpm install --frozen-lockfile
corepack pnpm runtime:check
corepack pnpm build
```

Relancer `corepack install` est sans danger lorsque `packageManager` n'a pas changé et garantit que la version demandée est disponible dans le cache. `--frozen-lockfile` échoue volontairement si les manifestes et le lockfile divergent.

Si le dépôt contenait un ancien `node_modules` produit par npm, arrêter Vite avant la migration puis relancer l'installation pnpm. Ne pas conserver plusieurs lockfiles. Une suppression locale de `node_modules` peut être nécessaire en cas d'arbre incohérent, mais vérifier la cible exacte et demander l'accord avant toute suppression automatisée.

## Commandes de développement

```powershell
corepack pnpm dev
corepack pnpm contracts:export
corepack pnpm validate:file -- config.example/dossier.json
corepack pnpm check:layout -- config.example/dossier.json
corepack pnpm generate:pdf -- config.example/dossier.json output/dossier.pdf
```

`contracts:export` régénère le JSON Schema et l'exemple publié. Relire leurs diffs ; les données de `config.example` restent fictives.

## Suite de validation

Contrôles rapides pendant le développement :

```powershell
corepack pnpm runtime:check
corepack pnpm typecheck
corepack pnpm test:unit
```

Validation de livraison :

```powershell
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm deps:policy
corepack pnpm deps:trust-exclusions
corepack pnpm deps:audit
corepack pnpm deps:tree
```

`build` relance typage et tests unitaires avant Vite. `test:e2e` reconstruit puis utilise Edge/Chromium via Playwright pour les parcours, le mode hors ligne, les captures et le PDF de treize pages. Il ne faut pas ouvrir manuellement un navigateur pour l'automatisation.

Les captures de référence ne se mettent à jour que pour une évolution visuelle volontaire :

```powershell
corepack pnpm test:e2e:update
```

Après cette commande, inspecter toutes les images modifiées et le PDF, puis relancer `corepack pnpm test:e2e` sans mise à jour. Ne jamais accepter un snapshot uniquement parce que le test échoue.

Vérifier les formats responsive touchés au minimum en 360×800, 390×844, 768×1024, 1920×1080 et 2560×1440. Les scénarios Playwright sont dans `tests/e2e`.

## Dépendances

```powershell
corepack pnpm deps:outdated
corepack pnpm deps:audit
corepack pnpm deps:policy
corepack pnpm deps:trust-exclusions
corepack pnpm deps:sbom
```

La fenêtre de maturité de 72 heures et la politique de provenance sont décrites dans `docs/DEPENDENCY_SECURITY.md`. Ne pas mettre à jour toutes les dépendances en bloc. Une majeure, une nouvelle permission de build ou une nouvelle exclusion est une décision dédiée avec revue du lockfile et suite complète.

## Confidentialité et artefacts

Ne jamais ajouter à Git `private/`, `output/`, un PDF réel, un justificatif, une sauvegarde utilisateur, une capture contenant des données personnelles ou un secret. Avant toute demande de publication, vérifier `git status`, `git diff` et la liste des fichiers suivis. Aucun commit, push, PR ou déploiement ne doit être effectué sans feu vert explicite du propriétaire.

## Dépannage

- Corepack ne trouve pas pnpm : vérifier le champ `packageManager`, puis relancer `corepack install` depuis la racine.
- Mauvaise version dans `runtime:check` : relancer `corepack pnpm install --frozen-lockfile`; ne pas changer le Node global pour contourner le problème.
- Lockfile refusé : ne pas utiliser `--no-frozen-lockfile` en CI. Diagnostiquer le manifeste ou régénérer volontairement le lockfile sous les politiques du dépôt.
- Dépendance refusée car trop récente : attendre la fin de la fenêtre glissante de 72 heures.
- Baisse de confiance : attendre ne suffit pas nécessairement ; examiner la chaîne et suivre la procédure d'exception.
- E2E Edge indisponible : installer le canal Edge demandé par la configuration uniquement avec l'accord nécessaire, ou laisser la CI distante l'exécuter via CLI.
- PWA apparemment périmée : arrêter Vite, relancer le build et le scénario PWA automatisé avant d'incriminer le service worker.
