# Synthèse vulgarisée

<!-- Expliquer en langage simple ce qui change, pour qui, pourquoi, et ce qui ne change pas. Éviter le jargon ou l'expliquer. -->

## Statut de la PR

- [ ] PR créée en draft
- [ ] Prête pour revue humaine
- [ ] CI entièrement verte
- [ ] Feu vert explicite de merge reçu

## Contexte et problème

<!-- Décrire le besoin utilisateur, le comportement observé, la cause identifiée et les contraintes. Lier l'issue ou la tâche si elle existe. -->

## Objectif et périmètre

### Inclus

<!-- Lister précisément ce que cette PR traite. -->

### Hors périmètre

<!-- Lister ce qui est volontairement différé ou inchangé, en particulier le PDF si la PR ne concerne que l'app. -->

## Changements fonctionnels

<!-- Décrire les parcours, états, messages, erreurs, imports/exports ou comportements utilisateur modifiés. -->

## Changements techniques

<!-- Décrire les modules, contrats, flux de données, choix d'architecture et migrations. Justifier les compromis non triviaux. -->

## UI, UX, responsive et accessibilité

<!-- Décrire les écrans touchés et les contrôles réalisés. Ajouter N/A avec justification si non applicable. -->

- Formats contrôlés :
  - [ ] 360×800
  - [ ] 390×844
  - [ ] 768×1024
  - [ ] 1920×1080
  - [ ] 2560×1440
- [ ] Navigation clavier et focus visible
- [ ] Noms accessibles, rôles et annonces sémantiques
- [ ] Contrastes, zones tactiles, absence de troncature/superposition

## Données, confidentialité et sécurité

<!-- Expliquer l'impact sur le modèle local-first, IndexedDB, fichiers, validation des entrées, secrets et données privées. -->

- [ ] Aucune donnée réelle, sauvegarde privée, pièce justificative ou secret ajouté
- [ ] Aucun nouvel envoi réseau, backend, compte, stockage distant ou télémétrie
- [ ] Entrées, imports et sorties concernés validés défensivement
- [ ] `schemaVersion` inchangée, ou plan de compatibilité documenté

## Dépendances et chaîne d'approvisionnement

<!-- Lister toute dépendance ajoutée, supprimée ou mise à jour, avec raison, version, licence/maintenance et impact du lockfile. -->

- [ ] Aucun autre lockfile que `pnpm-lock.yaml`
- [ ] Fenêtre de maturité de 72 h respectée
- [ ] `trustPolicy: no-downgrade` respectée
- [ ] Scripts de build nouveaux ou modifiés explicitement examinés
- [ ] Exclusions exactes absentes, ou approuvées, datées et documentées
- [ ] Sous-dépendances dépréciées examinées

## Non-régression du document et du PDF

<!-- Préciser si le renderer est touché. Décrire nombre/ordre des pages, structure, texte et revue visuelle. Ne pas utiliser un simple hash binaire. -->

- [ ] PDF de treize pages préservé
- [ ] Ordre, contenu, géométrie et page paysage vérifiés
- [ ] Snapshots non mis à jour pour masquer une régression
- [ ] Toute évolution visuelle volontaire du PDF est isolée et expliquée

## Validation effectuée

<!-- Conserver uniquement les commandes réellement exécutées et joindre le résultat. Ne jamais cocher sur la base d'une intention. -->

```text
corepack pnpm runtime:check
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm deps:policy
corepack pnpm deps:trust-exclusions
corepack pnpm deps:audit
```

- Tests unitaires :
- Tests E2E :
- Audit de dépendances :
- Contrôles manuels/visuels :
- Contrôles non exécutés et raison :

## Captures et preuves

<!-- Ajouter les captures avant/après utiles, rapports, extraits de logs non sensibles et chemins d'artefacts. Supprimer la section si réellement sans objet. -->

## Risques, limites et retour arrière

<!-- Décrire les risques résiduels, cas non couverts, surveillance nécessaire et procédure de rollback sûre. -->

## Documentation

- [ ] `README.md` à jour si les commandes ou capacités changent
- [ ] `AGENTS.md` à jour si les règles de travail changent
- [ ] Guides développeur/maintenance à jour
- [ ] Documentation de sécurité et registre d'exclusions à jour si nécessaire
- [ ] Aucun document important n'est laissé volontairement incohérent

## CI/CD et déploiement

<!-- Toute modification de workflow ou tout déploiement doit avoir reçu un feu vert explicite. -->

- [ ] Aucun workflow CI/CD modifié, ou feu vert explicite obtenu
- [ ] CI verte sur le dernier commit de la branche
- [ ] Aucun push direct sur `main`
- [ ] Aucun déploiement effectué sans autorisation

## Checklist finale avant demande de merge

- [ ] Diff relu intégralement
- [ ] Aucun code mort, log de debug, placeholder ou TODO injustifié
- [ ] État Git et fichiers suivis contrôlés
- [ ] Aucun changement utilisateur écrasé
- [ ] PR toujours cohérente avec son titre et son périmètre
- [ ] Commentaires de revue traités ou explicitement discutés
- [ ] Feu vert explicite de merge demandé, mais pas présumé

## Suivi après merge

<!-- Lister les travaux différés et les éventuels contrôles post-merge. Le nettoyage des branches reste soumis à feu vert. -->
