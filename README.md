# Dossier Immo

Application local-first de création d'un dossier bancaire immobilier français. Elle guide la saisie du foyer, des revenus, du patrimoine, des dettes, du projet et des budgets, puis produit une synthèse PDF déterministe pouvant compter jusqu'à treize pages selon les sections réellement renseignées.

Les données restent dans le navigateur. Le fichier `.dossier-immo.json` téléchargé par l'utilisateur est la sauvegarde officielle ; IndexedDB fournit uniquement un brouillon de récupération. Il n'existe ni compte, backend, télémétrie ni stockage distant.

## Démarrage rapide

Prérequis : Git, un Node hôte `>=22.13` incluant Corepack, et Microsoft Edge pour les tests E2E locaux. Le dépôt isole pnpm 11.13.1 et le runtime Node 24.18.0 ; aucune installation globale de pnpm n'est nécessaire.

```powershell
corepack install
corepack pnpm install --frozen-lockfile
corepack pnpm runtime:check
corepack pnpm dev
```

Sous PowerShell, utiliser `corepack.cmd` si la stratégie d'exécution bloque les scripts `.ps1`. Le guide complet pour un laptop vierge, un `git pull`, les tests et le dépannage se trouve dans [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

## Fonctionnalités

- onze étapes de saisie avec aide contextuelle ;
- guide détaillé en rubriques repliables couvrant chaque étape, ses impacts et ses contrôles utiles ;
- trois exemples fictifs complets et dossier vierge ;
- validation Zod avec erreurs localisées ;
- calculs TypeScript purs, montants en centimes et taux en points de base ;
- scénarios de financement simples ou composés, durées saisissables en années/mois, différé par phases et budgets fondés sur la mensualité maximale ;
- autosauvegarde IndexedDB, reprise et import strict du contrat courant ;
- export JSON portable, aperçu repliable ou plein écran et PDF pouvant compter jusqu'à treize pages ;
- actions et état d'autosauvegarde accessibles sur mobile, tablette et desktop ;
- accès direct à l'aperçu depuis l'en-tête mobile et thèmes repliés par défaut sur petit écran ;
- navigation responsive libellée, progression et erreurs actionnables jusqu'au champ concerné ;
- écrans métier adaptatifs, dont un comparatif budgétaire empilé sur mobile et tablette ;
- fiches créées par l'utilisateur repliables avec état mémorisé et duplication contrôlée des scénarios de financement ;
- PWA hors ligne sans télémétrie ni stockage de justificatifs.

## Vérifications principales

```powershell
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm deps:policy
corepack pnpm deps:trust-exclusions
corepack pnpm deps:audit
```

La résolution impose une fenêtre de maturité glissante de 72 heures, une politique de non-régression de provenance et une allowlist explicite des scripts de build. Deux exceptions transitives exactes, approuvées et re-sondées chaque semaine, sont documentées dans [docs/DEPENDENCY_SECURITY.md](docs/DEPENDENCY_SECURITY.md).

## Architecture

```text
apps/web                  interface React, PWA et persistance locale
packages/schema           contrat Zod courant et JSON Schema
packages/domain           libellés et logique de présentation du domaine
packages/calculations     moteur métier pur TypeScript
packages/document         HTML/CSS/SVG print et graphiques
packages/fixtures         dossiers fictifs et cas de conformité
tests/contracts           conformité des schémas et artefacts
tests/e2e                 parcours, responsive, PDF et snapshots
tools                     validation, génération et politiques de dépendances
```

Le modèle, les calculs et le document ne dépendent pas de React. L'interface orchestre la saisie, mais ne constitue jamais une source de vérité métier.

## Confidentialité

- Exemple fictif principal : [config.example/dossier.json](config.example/dossier.json)
- Catalogue des trois profils : [config.example/dossiers](config.example/dossiers) et [docs/DEMO_DOSSIERS.md](docs/DEMO_DOSSIERS.md)
- JSON Schema : [docs/schema/dossier.json](docs/schema/dossier.json)

Ne jamais committer `private/`, `output/`, les justificatifs, PDF ou exports réels. Les exemples inclus sont volontairement fictifs et ne doivent jamais être remplacés par un dossier réel.

## Documentation essentielle

- [Consignes pour les agents IA](AGENTS.md)
- [Spécification produit](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Modèle de données](docs/DATA_MODEL.md)
- [Guide développeur](docs/DEVELOPER_GUIDE.md)
- [Guide de maintenance](docs/MAINTENANCE_GUIDE.md)
- [Sécurité des dépendances](docs/DEPENDENCY_SECURITY.md)
- [Direction de l'application web](docs/WEB_APP_DIRECTION.md)
