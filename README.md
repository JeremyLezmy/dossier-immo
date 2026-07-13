# Dossier Immo

Application local-first de création d’un dossier bancaire immobilier français. Elle guide la saisie du foyer, des revenus, du patrimoine, des dettes, du projet et des budgets, puis produit une synthèse PDF de treize pages.

Les données restent dans le navigateur. Le fichier `.dossier-immo.json` téléchargé par l’utilisateur est la sauvegarde officielle ; IndexedDB fournit uniquement un brouillon de récupération.

## Démarrage

Prérequis : Node.js 22 ou plus récent.

```powershell
npm install
npm run dev
```

Le build statique est produit avec :

```powershell
npm run build
```

## Fonctionnalités

- onze étapes de saisie et aide contextuelle ;
- exemple fictif complet et dossier vierge ;
- validation Zod avec erreurs localisées ;
- calculs TypeScript purs, montants en centimes et taux en points de base ;
- comparaison de scénarios prix, taux, durée et apport ;
- budgets central et stress reliés par identifiants stables ;
- autosauvegarde IndexedDB et reprise après rechargement ;
- import strict des sauvegardes au format courant ;
- export JSON portable, aperçu de treize pages et génération PDF ;
- PWA hors ligne, sans télémétrie ni stockage de justificatifs.

## Vérifications

```powershell
npm run contracts:export
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
```

Les contrôles couvrent le schéma, les références croisées, les calculs, les fixtures, l’ordre documentaire, le PDF, les captures visuelles, l’import/export, la reprise IndexedDB, l’accessibilité de base et le mode hors ligne.

## Architecture

```text
apps/web                  interface React, PWA et persistance locale
packages/schema           contrat Zod courant et JSON Schema
packages/domain           libellés et logique de présentation du domaine
packages/calculations     moteur métier pur TypeScript
packages/document         HTML/CSS/SVG print et graphiques
packages/fixtures         dossiers fictifs et cas de conformité
tests/contracts           conformité des schémas et artefacts
tests/e2e                 parcours navigateur, PDF et snapshots
tools                     validation, génération PDF et contrôle de mise en page
```

Le modèle, les calculs et le document ne dépendent pas de React. L’interface orchestre la saisie, mais ne constitue jamais une source de vérité métier.

## Configuration et confidentialité

- [Exemple complet](config.example/dossier.json)
- [JSON Schema](docs/schema/dossier.json)

Ne jamais committer `private/`, `output/`, les justificatifs, PDF ou exports réels. L’exemple inclus est volontairement fictif et ne doit jamais être remplacé par un dossier réel.

## Documentation

- [Spécification produit](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Modèle de données](docs/DATA_MODEL.md)
- [Guide de maintenance](docs/MAINTENANCE_GUIDE.md)
- [Direction de l’application web](docs/WEB_APP_DIRECTION.md)
