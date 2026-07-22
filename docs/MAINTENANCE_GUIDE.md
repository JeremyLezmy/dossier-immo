# Guide de maintenance

## Règle d’exploitation

L’application est entièrement locale. IndexedDB contient seulement un brouillon de confort ; le fichier `.dossier-immo.json` téléchargé par l’utilisateur est la sauvegarde canonique. Aucun compte, serveur applicatif ou envoi de justificatif n’est requis.

Les données réelles restent dans `private/` ou hors du dépôt. `config.example/dossier.json` et `config.example/dossiers/` sont entièrement fictifs et constituent les seuls exemples publiables.

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
- `corepack pnpm test:e2e` exécute les parcours réels sous Edge/Chromium et contrôle le PDF complet de référence de 13 pages ;
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

Le financement multi-prêts repose sur une chronologie mensuelle unique dans `packages/calculations`. `durationMonths` désigne l’amortissement et `deferredMonths` la période préalable ; aucune couche ne doit interpréter la durée comme incluant le différé. Pendant celui-ci, le capital reste constant, avec paiement nul hors assurance à taux zéro ou intérêts seuls à taux positif. Les budgets, le Sankey, le taux d’effort et le document consomment la mensualité maximale assurance comprise. L’assurance reste constante et fondée sur le capital initial total.

L’interface peut convertir une saisie en années vers des mois, mais le schéma et le fichier canonique conservent uniquement des mois entiers. Ne jamais ajouter une unité persistée ou un échéancier au dossier pour répondre à un besoin de présentation.

## Faire évoluer le document

`packages/document` rend jusqu'à treize sections A4 déterministes depuis le dossier validé et le résultat calculé. La fixture complète en produit treize ; une page ou un sous-bloc sans donnée métier doit être omis, sans tableau vide ni mention artificielle « non concerné ». Le CSS écran et le CSS d’impression appartiennent au même renderer. Un changement volontaire suit ce protocole :

1. lancer `corepack pnpm test:e2e:update` ;
2. ouvrir les captures produites et le PDF de test ;
3. vérifier portrait, page paysage, ruptures, tableaux, pied de page et caractères accentués ;
4. relancer `corepack pnpm test:e2e` sans mise à jour ;
5. documenter la décision de design.

Le contrôle automatisé de mise en page s’exécute avec `corepack pnpm check:layout -- config.example/dossier.json`. La génération ponctuelle d’un PDF se fait avec `corepack pnpm generate:pdf -- <dossier.json> <sortie.pdf>` et ne remplace pas la revue visuelle de toutes les pages effectivement produites.

## Import, sauvegarde et reprise

- l’import valide strictement la structure courante ;
- une erreur est affichée avec son chemin, sans écraser le brouillon courant ;
- le premier accès exige un choix entre session privée sans persistance du dossier et reprise locale 24 heures ;
- le mode session purge les brouillons IndexedDB et n'écrit aucune donnée métier dans `localStorage` ;
- l’autosauvegarde IndexedDB ne fonctionne qu'après consentement au mode local et reprend le dernier brouillon non expiré après rechargement ;
- toute écriture ou prolongation manuelle repousse `expiresAt` de 24 heures ; une échéance passée est purgée immédiatement ou à la prochaine ouverture ;
- à moins d'une heure de l'échéance, une bannière non bloquante propose « Prolonger de 24 h », « Exporter le JSON » et « Ignorer » ; ignorer masque seulement l'avertissement courant et ne modifie jamais `expiresAt` ;
- une migration d'ancien brouillon accorde 24 heures à partir de la migration, sans changer `schemaVersion: 3` ;
- l'état de l'autosauvegarde reste visible sur mobile, tablette et desktop ;
- sous 1050 px, la navigation compacte conserve le libellé complet de l'étape, sa position, les commandes précédent/suivant et le nombre de points à corriger ;
- la synthèse de validation ouvre l'étape concernée, déplie sa sous-section et place le focus sur le contrôle invalide ;
- chaque contrôle invalide expose sémantiquement son état et le message associé ;
- « Sauvegarder le dossier » produit le fichier canonique transportable ;
- le menu « Actions du dossier » garde l’ouverture et la sauvegarde accessibles sur les écrans étroits ;
- un bouton d'en-tête ouvre directement l'aperçu sur mobile ; dans l'étape finale, le sélecteur de thèmes est replié par défaut sous 760 px et le plein écran le referme pour maximiser la surface du document ;
- « Effacer les brouillons » demande confirmation avant de supprimer l’état local de l’application ;
- succès, avertissements et erreurs utilisent des retours visuels et sémantiques distincts ;
- la génération du PDF verrouille son action jusqu'à la fin de l'opération.

Les vues métier longues doivent se replier sans masquer leurs actions. Leurs cartes accordéon et chaque fiche créée par l'utilisateur sont fermées par défaut, puis mémorisent leur état ouvert ou fermé pendant toute la session d'édition, y compris après un changement d'étape. Utiliser un identifiant métier stable pour cette mémoire ; un libellé modifiable ne doit jamais servir de clé. Le comparatif budgétaire utilise une grille sur grand écran et des cartes empilées sous 900 px ; il ne doit jamais imposer un défilement horizontal à l'ensemble de la page.

Un scénario de financement peut être dupliqué depuis sa fiche dépliée. La copie reçoit de nouveaux identifiants pour le scénario et ses prêts complémentaires, conserve les hypothèses éditables et n'est jamais marquée automatiquement comme scénario principal.

Les infobulles d'aide restent ancrées à leur déclencheur, basculent au-dessus lorsque l'espace inférieur manque et demeurent contenues dans le viewport. Ne pas réintroduire de position verticale fixe commune à toutes les infobulles mobiles.

Une évolution future du stockage doit préserver la récupération sûre des brouillons, le consentement explicite et la purge en mode session. Le fichier exporté demeure l’autorité indépendante du navigateur. Ne jamais promettre une isolation entre applications partageant la même origine : les stockages navigateur sont cloisonnés par origine, pas par chemin.

## Contrôles avant diffusion d’un PDF

Vérifier identités et dates, revenus et périodes, apport et réserve, dettes et échéances, taux/assurance/frais, durées d’amortissement, différés, mensualité maximale, budget central et stress, absence de placeholder ou de bloc vide, lisibilité de toutes les pages produites et liste des justificatifs. Les hypothèses financières restent qualifiées d’indicatives et les PTZ estimatifs doivent être confirmés par le professionnel.

## Confidentialité et publication

Ne jamais committer `private/`, `output/`, PDF, relevés, justificatifs ou exports réels. Vérifier `git status`, la liste des fichiers suivis et les motifs sensibles avant chaque publication. La fixture doit conserver des identités, métiers, lieux, dates et montants manifestement fictifs.
