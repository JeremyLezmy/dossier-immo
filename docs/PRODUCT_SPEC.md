# Spécification produit — application Dossier Immo

## Vision

Permettre à un particulier français de constituer, comprendre, sauvegarder et exporter un dossier bancaire immobilier de qualité professionnelle sans éditer de fichier de configuration et sans transmettre ses données à un serveur.

## Utilisateurs

- personne seule ou foyer avec plusieurs co-emprunteurs ;
- salarié, fonctionnaire, indépendant, profession libérale ou revenus mixtes ;
- utilisateur non technique préparant une résidence principale ;
- courtier ou conseiller utilisant le fichier exporté avec l'accord de l'utilisateur.

## Principes non négociables

- fonctionnement local-first ;
- fichier `.dossier-immo.json` comme sauvegarde autoritative ;
- choix initial explicite entre session privée sans persistance du dossier et brouillon navigateur récupérable pendant 24 heures ;
- aucun compte ni base serveur ;
- aucune télémétrie ;
- distinction déclaré / hypothèse / calculé ;
- validation avant export ;
- rendu bancaire déterministe et testé ;
- catalogue de trois exemples fictifs complets couvrant collectivement toutes les sections ;
- accessibilité clavier et responsive mobile/tablette/desktop ;
- aperçu direct depuis l'en-tête mobile, sélecteur de thèmes repliable et mode plein écran ;
- accès permanent à l'ouverture, à la sauvegarde officielle et à l'état d'autosauvegarde, quelle que soit la taille d'écran ;
- avertissement non bloquant une heure avant l'expiration locale, avec prolongation, export officiel ou choix explicite d'ignorer.

## Parcours principal

1. choisir le mode session privée recommandé ou la reprise locale 24 heures ;
2. choisir l'un des trois exemples complets ou un dossier vierge ;
3. renseigner le foyer ;
4. décrire activités et revenus ;
5. ajouter historique des indépendants ;
6. renseigner actifs et passifs ;
7. compléter historique mensuel ;
8. définir projet et critères du bien ;
9. comparer les scénarios de financement ;
10. définir budgets central et stress ;
11. suivre les justificatifs ;
12. corriger les erreurs de complétude ;
13. prévisualiser le dossier ;
14. imprimer ou enregistrer le PDF ;
15. télécharger le fichier de sauvegarde.

Les scénarios peuvent ventiler le capital entre un prêt principal et des tranches complémentaires, par exemple un prêt employeur ou un PTZ estimatif. Les durées sont saisissables en années ou en mois. Un différé précède l’amortissement ; la pré-analyse expose la mensualité initiale et le pic futur, puis retient ce pic assurance comprise pour l’effort et les budgets. Le montage demeure indicatif et doit être confirmé par la banque ou le courtier.

## États fonctionnels

L'application distingue :

- session privée sans donnée de dossier persistée ;
- brouillon local non validé, expirant 24 heures après sa dernière modification ;
- dossier valide mais incomplet éditorialement ;
- dossier prêt pour pré-analyse ;
- dossier exporté ;
- dossier importé au contrat courant ;
- dossier invalide ou contrat inconnu.

## Sections documentaires obligatoires

Couverture, lettre, foyer, revenus, stabilité, patrimoine, apport, réserve, projet, scénarios, taux d'effort, assurance, Sankey, budget post-achat, justificatifs et annexe des indépendants.

## Hors périmètre

- authentification ;
- synchronisation cloud ;
- stockage de justificatifs binaires ;
- conseil financier personnalisé ;
- connexion bancaire ;
- redesign du PDF.
- simulation exhaustive d’une offre de prêt, lissage, prêt relais ou éligibilité réglementaire au PTZ.
