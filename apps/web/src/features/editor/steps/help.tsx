import { EditorDisclosure } from "../../../components/EditorDisclosure";
import { SectionIntro } from "../../../components/fields";

interface GuideBlock {
  readonly title: string;
  readonly items: readonly string[];
}

interface GuideTopic {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly blocks: readonly GuideBlock[];
}

const topics = [
  {
    id: "start",
    title: "Bien démarrer",
    summary:
      "Choisir le bon point de départ et suivre un ordre de saisie efficace.",
    blocks: [
      {
        title: "Choisir une base",
        items: [
          "Nouveau dossier crée une base minimale à compléter ; Charger l’exemple fictif ouvre trois profils synthétiques pour explorer les fonctions sans utiliser de données réelles.",
          "Ouvrir un dossier importe un fichier .dossier-immo.json existant après validation stricte de son format.",
          "Avant de remplacer un dossier en cours, exportez-le si vous souhaitez disposer d’une sauvegarde indépendante du navigateur.",
        ],
      },
      {
        title: "Ordre conseillé",
        items: [
          "Commencez par le foyer, les revenus, le patrimoine et les passifs : ces données alimentent les références proposées dans les étapes suivantes.",
          "Décrivez ensuite le projet, les financements et les budgets, puis terminez par les pièces et les textes éditoriaux.",
          "Consultez régulièrement la Synthèse ; elle centralise la progression et les corrections nécessaires avant l’export.",
        ],
      },
      {
        title: "Repères d’interface",
        items: [
          "Les cards sont fermées par défaut. Leur chevron indique leur état et l’application mémorise les ouvertures pendant la session d’édition.",
          "Les aides contextuelles expliquent la donnée attendue et restent ancrées au contrôle concerné.",
          "Sur mobile et tablette, le sélecteur d’étape et les boutons Précédent et Continuer remplacent le rail latéral.",
        ],
      },
    ],
  },
  {
    id: "overview",
    title: "Synthèse et validation",
    summary:
      "Mesurer l’avancement et corriger directement les données invalides.",
    blocks: [
      {
        title: "Ce que montre la synthèse",
        items: [
          "La progression porte sur les neuf étapes métier qui participent au dossier ; le Guide, la Synthèse et l’Aperçu ne sont pas comptés comme des données à valider.",
          "Les indicateurs résument les revenus retenus, l’apport, la réserve et le scénario principal à partir des calculs du dossier.",
          "Un dossier peut être éditable tout en restant invalide : l’export officiel et le PDF ne sont disponibles qu’après validation complète.",
        ],
      },
      {
        title: "Corriger un point",
        items: [
          "Chaque erreur indique son chemin de donnée et l’étape concernée ; sélectionnez-la pour ouvrir la bonne section et placer le focus sur le champ.",
          "Le contrôle invalide est signalé visuellement et son message est annoncé aux technologies d’assistance.",
          "Corrigez d’abord les identifiants ou références manquantes, puis les incohérences de montants et de dates qui peuvent en dépendre.",
        ],
      },
    ],
  },
  {
    id: "household",
    title: "Foyer",
    summary:
      "Identifier les personnes concernées par le projet et leurs évolutions prévisibles.",
    blocks: [
      {
        title: "Personnes à renseigner",
        items: [
          "Ajoutez les emprunteurs, co-emprunteurs et personnes à charge utiles à la compréhension du projet.",
          "Le nom affiché sert dans l’interface et le document ; courriel, téléphone et date de naissance restent facultatifs.",
          "Les identifiants techniques relient chaque personne à ses revenus, actifs, passifs et justificatifs : utilisez les sélecteurs plutôt que de répéter les noms dans les notes.",
        ],
      },
      {
        title: "Événements futurs",
        items: [
          "Un événement décrit une évolution datée susceptible d’affecter les hypothèses du dossier, par exemple un congé ou un changement familial.",
          "Il ne modifie pas automatiquement les revenus, charges ou personnes à charge : reportez explicitement l’impact dans les scénarios concernés.",
          "Ne conservez que les événements utiles et documentables afin de garder une lecture bancaire factuelle.",
        ],
      },
    ],
  },
  {
    id: "income",
    title: "Revenus",
    summary:
      "Séparer activité professionnelle, revenu retenu et historique observé.",
    blocks: [
      {
        title: "Activités professionnelles",
        items: [
          "Une activité décrit le statut, le métier, les dates et le mode réel de rémunération d’une personne.",
          "Choisissez le modèle de rémunération correspondant à la situation : salaire, taux journalier, consultation, chiffre d’affaires, taux horaire, commission ou autre.",
          "Les repères du parcours professionnel sont facultatifs. Ils sont enregistrés, mais ne sont pas encore repris dans les calculs ni dans le PDF.",
        ],
      },
      {
        title: "Flux de revenus",
        items: [
          "Un flux est rattaché à une personne et, si pertinent, à une activité. Il représente un revenu mensuel retenu dans les calculs.",
          "Le montant central porte l’hypothèse bancaire de référence ; le montant prudent sert au test de robustesse et ne doit pas être une simple copie automatique.",
          "Le montant après impôt alimente les budgets lorsqu’il est renseigné. L’option Inclus dans la capacité d’emprunt contrôle la participation du flux aux agrégats de financement.",
        ],
      },
      {
        title: "Historique documenté",
        items: [
          "Chaque période est reliée à un flux et affiche la personne associée pour éviter les ambiguïtés.",
          "Distinguez chiffre d’affaires facturé, montant encaissé, dépenses et résultat calculé ; une situation intermédiaire peut utiliser une période AAAA-MM.",
          "Seules les données marquées comme observées alimentent l’annexe des revenus indépendants. La source décrit le justificatif, sans importer le fichier lui-même.",
        ],
      },
    ],
  },
  {
    id: "assets",
    title: "Patrimoine",
    summary:
      "Décrire les actifs actuels, leur disponibilité pour l’apport et leur évolution.",
    blocks: [
      {
        title: "Situation actuelle",
        items: [
          "Renseignez chaque actif avec ses titulaires, sa valeur à la date d’observation et une catégorie cohérente.",
          "Disponible pour l’apport indique qu’une partie de l’actif peut financer l’acquisition ; le montant mobilisable peut être inférieur à sa valeur totale.",
          "Un actif exclu de l’apport ne doit pas porter de montant mobilisable. Cette incohérence bloque la validation.",
        ],
      },
      {
        title: "Historique mensuel",
        items: [
          "Les instantanés sont facultatifs et servent à illustrer une trajectoire réelle de liquidités, revenus et mensualités.",
          "Ils ne sont jamais additionnés aux actifs courants : chaque ligne représente une observation à une date donnée.",
          "Utilisez des périodes comparables et des sources cohérentes pour que la tendance reste lisible dans le document.",
        ],
      },
    ],
  },
  {
    id: "liabilities",
    title: "Passifs",
    summary:
      "Recenser les engagements existants encore actifs à la date d’achat.",
    blocks: [
      {
        title: "Informations déterminantes",
        items: [
          "Reliez chaque passif à tous ses emprunteurs et indiquez capital restant dû, mensualité et date de fin lorsque ces données existent.",
          "La date de fin détermine si la mensualité pèsera encore au moment de l’achat cible.",
          "Le libellé doit rester court et identifiable ; utilisez la note pour expliquer un remboursement anticipé, une prise en charge ou une particularité.",
        ],
      },
      {
        title: "Vérifications utiles",
        items: [
          "Ne mélangez pas un crédit existant avec une future ligne de financement du projet : celle-ci appartient à l’étape Financement.",
          "Vérifiez que la mensualité déclarée correspond bien à l’engagement complet et non à la seule part d’un emprunteur.",
          "Conservez les preuves en dehors de l’application et référencez-les dans l’inventaire des pièces.",
        ],
      },
    ],
  },
  {
    id: "project",
    title: "Projet et réserve",
    summary:
      "Fixer le coût du projet, les critères recherchés et la trésorerie conservée.",
    blocks: [
      {
        title: "Cadre financier",
        items: [
          "Le prix cible, les frais d’acquisition, les travaux et l’apport alimentent tous les scénarios de financement.",
          "La date d’achat cible sert notamment à déterminer les passifs encore actifs et la projection de liquidité disponible.",
          "Le plafond exceptionnel est un garde-fou distinct du prix cible ; il doit rester cohérent avec la stratégie décrite.",
        ],
      },
      {
        title: "Critères du bien",
        items: [
          "Les critères structurent la recherche et apparaissent dans le PDF : localisation, surface, caractéristiques indispensables ou souhaitables.",
          "Séparez les exigences réellement bloquantes des préférences afin de ne pas présenter une recherche artificiellement rigide.",
          "Les notes complémentaires servent à expliquer une contrainte qui ne peut pas être représentée par un champ structuré.",
        ],
      },
      {
        title: "Réserve après achat",
        items: [
          "La réserve minimale est le seuil à ne pas franchir ; la réserve cible décrit le niveau que le foyer souhaite conserver.",
          "Les poches de réserve expliquent l’affectation prévue, sans créer de nouveaux actifs ni augmenter la trésorerie disponible.",
          "Le total des poches ne peut pas dépasser la réserve cible et la trésorerie projetée doit couvrir apport, installation et minimum conservé.",
        ],
      },
    ],
  },
  {
    id: "financing",
    title: "Financement",
    summary: "Comparer des hypothèses de prix, d’apport, de taux et de durée.",
    blocks: [
      {
        title: "Scénarios",
        items: [
          "Chaque scénario peut reprendre le prix et l’apport du projet ou définir ses propres dérogations.",
          "Un seul scénario principal structure la synthèse. Afficher dans le tableau principal contrôle sa présence dans le comparatif du PDF.",
          "La duplication crée une hypothèse indépendante avec de nouveaux identifiants, sans remplacer automatiquement le scénario principal.",
        ],
      },
      {
        title: "Composition multi-prêts",
        items: [
          "Un prêt complémentaire ventile une partie du même capital vers une ligne distincte, par exemple un PTZ ou un prêt employeur.",
          "Son montant est retiré du prêt principal puis calculé avec son propre taux et sa propre durée d’amortissement ; le capital total du projet ne doit pas augmenter.",
          "Les durées peuvent être saisies en années ou en mois. Le fichier conserve toujours un nombre entier de mois afin que tous les calculs utilisent la même unité.",
        ],
      },
      {
        title: "Différé avant amortissement",
        items: [
          "Le différé précède la durée d’amortissement : une tranche différée 5 ans puis amortie 20 ans s’étend donc sur 25 ans au total.",
          "À taux zéro, aucun paiement hors assurance n’est dû pendant le différé. À taux positif, seuls les intérêts sont payés et le capital reste inchangé.",
          "La mensualité maximale estimée, assurance comprise, sert au taux d’effort et aux budgets pour ne pas sous-estimer une phase future plus élevée.",
          "L’assurance reste une estimation constante sur le capital initial total. Le montage, le PTZ estimatif et les conditions doivent être confirmés par la banque ou le courtier.",
        ],
      },
    ],
  },
  {
    id: "budgets",
    title: "Budgets et Sankey",
    summary:
      "Comparer le quotidien central avec une hypothèse de stress cohérente.",
    blocks: [
      {
        title: "Deux lectures du budget",
        items: [
          "Le budget central décrit le fonctionnement attendu ; le stress test mesure une situation volontairement moins favorable.",
          "Chaque budget référence ses revenus après impôt et son scénario de financement. Ces références peuvent différer entre central et stress.",
          "Les postes appariés doivent conserver le même rôle métier pour que les écarts restent compréhensibles.",
        ],
      },
      {
        title: "Postes et graphique",
        items: [
          "Afficher dans le Sankey ajoute le poste au diagramme sans modifier son montant.",
          "Dépense ajustable qualifie une charge modulable ; l’application ne la réduit jamais automatiquement dans le stress test.",
          "Le libellé court du Sankey doit rester immédiatement lisible, tandis que le libellé complet peut être plus descriptif dans le tableau.",
        ],
      },
      {
        title: "Contrôle de cohérence",
        items: [
          "Vérifiez loyers ou charges de logement, transport, famille, impôts, épargne et dépenses courantes sans double comptage.",
          "Le reste à vivre résulte des données déclarées et des hypothèses choisies ; il ne constitue pas une recommandation personnalisée.",
        ],
      },
    ],
  },
  {
    id: "documents",
    title: "Pièces justificatives",
    summary:
      "Préparer un inventaire de suivi sans stocker les documents sensibles.",
    blocks: [
      {
        title: "Rôle de l’inventaire",
        items: [
          "Une ligne décrit la pièce attendue, son titulaire éventuel, son statut et la période à laquelle elle se rapporte.",
          "Le statut sert à piloter la préparation du dossier ; il ne prouve pas à lui seul que le document est complet ou recevable.",
          "Utilisez des libellés précis pour distinguer deux pièces proches, par exemple avis d’imposition et justificatif de situation déclarative.",
        ],
      },
      {
        title: "Confidentialité des fichiers",
        items: [
          "Aucun PDF, relevé, bulletin ou justificatif binaire n’est importé dans Dossier Immo.",
          "Conservez les fichiers réels dans un emplacement protégé et transmettez-les uniquement par le canal sécurisé de l’établissement destinataire.",
          "Le PDF généré contient l’inventaire et les informations saisies, mais n’embarque pas les pièces elles-mêmes.",
        ],
      },
    ],
  },
  {
    id: "presentation",
    title: "Textes et présentation",
    summary:
      "Adapter le discours bancaire et la présentation sans altérer les calculs.",
    blocks: [
      {
        title: "Paramètres et thèmes",
        items: [
          "Le titre, le sous-titre, l’état du document, le pied de page et la densité pilotent la présentation du PDF.",
          "Un thème applique une palette cohérente à l’ensemble du document ; les changements sont visibles dans l’aperçu sans modifier les données métier.",
          "Chaque section peut être incluse ou exclue explicitement depuis sa card.",
        ],
      },
      {
        title: "Contenus éditoriaux",
        items: [
          "Introduction, encadré et conclusion complètent les données structurées ; évitez d’y recopier des montants déjà calculés.",
          "La barre d’édition accepte paragraphes, gras, italique, listes et tailles contrôlées. Aucun Markdown ou code HTML n’est nécessaire.",
          "Les contenus importés sont nettoyés avant affichage afin d’écarter balises, attributs et ressources non autorisés.",
        ],
      },
      {
        title: "Qualité rédactionnelle",
        items: [
          "Privilégiez des faits vérifiables, des dates et des explications courtes plutôt que des affirmations commerciales.",
          "Expliquez les hypothèses inhabituelles à l’endroit prévu et supprimez les textes facultatifs qui n’apportent aucune information.",
        ],
      },
    ],
  },
  {
    id: "preview",
    title: "Aperçu et PDF",
    summary:
      "Relire les treize pages et produire localement le document bancaire.",
    blocks: [
      {
        title: "Aperçu",
        items: [
          "L’aperçu utilise les mêmes données validées, calculs et moteur documentaire que le PDF final.",
          "Contrôlez les treize pages, les tableaux, les graphiques, les coupures de texte et les sections volontairement masquées.",
          "L’aperçu en direct sert aux vérifications rapides ; l’étape Aperçu offre la lecture finale et le réglage visuel du thème.",
        ],
      },
      {
        title: "Avant de télécharger",
        items: [
          "Vérifiez identités, dates, revenus, dettes, apport, réserve, taux, assurance, budgets et inventaire des pièces.",
          "Résolvez tous les points de validation : le PDF est volontairement bloqué tant que le dossier n’est pas conforme au contrat courant.",
          "Le document est généré entièrement sur l’appareil. Son contenu reste néanmoins sensible et doit être conservé dans un emplacement approprié.",
        ],
      },
    ],
  },
  {
    id: "local-data",
    title: "Sauvegarde locale, confidentialité et limites",
    summary:
      "Distinguer brouillon de récupération, sauvegarde officielle et portée des résultats.",
    blocks: [
      {
        title: "Brouillon et sauvegarde",
        items: [
          "Le mode session privée recommandé ne conserve aucune donnée du dossier : fermer ou recharger l’onglet fait perdre les modifications non exportées.",
          "Si vous activez la reprise locale, IndexedDB conserve la saisie en cours, même invalide, pendant 24 heures après sa dernière modification. Vous pouvez prolonger ce délai manuellement.",
          "Lorsqu’il reste moins d’une heure, une bannière permet de prolonger de 24 heures, d’exporter la sauvegarde JSON ou d’ignorer l’avertissement. Ignorer ne change pas l’échéance.",
          "Une échéance est supprimée immédiatement si l’application est ouverte, ou à la prochaine ouverture sinon. Les données locales peuvent aussi disparaître si les données du site sont effacées.",
          "Le fichier .dossier-immo.json exporté est la seule sauvegarde canonique, portable et indépendante de ce navigateur.",
          "L’interface reprend actuellement le brouillon le plus récent. Un futur gestionnaire local permettra de choisir et administrer plusieurs dossiers.",
        ],
      },
      {
        title: "Import et effacement",
        items: [
          "Un import trop volumineux, invalide, d’une version inconnue ou contenant des références incohérentes est rejeté sans remplacer le brouillon courant.",
          "Effacer les brouillons supprime les états locaux de cet appareil après confirmation ; cette action ne supprime pas les fichiers JSON déjà exportés.",
          "Conservez plusieurs copies maîtrisées des sauvegardes importantes, avec des noms et dates permettant de les identifier.",
        ],
      },
      {
        title: "Périmètre de l’application",
        items: [
          "Aucune donnée du dossier n’est envoyée à un serveur et l’application peut fonctionner hors ligne après son installation.",
          "Le stockage du navigateur est partagé entre les applications utilisant exactement la même adresse web. Sur l’hébergement actuel, n’activez la reprise locale que si vous faites confiance aux autres applications de cette adresse.",
          "Les calculs constituent une pré-analyse documentaire, pas une offre de prêt ni un conseil juridique, fiscal ou financier personnalisé.",
          "La banque, le courtier ou les professionnels compétents restent responsables de la vérification et de la décision finale.",
        ],
      },
    ],
  },
] as const satisfies readonly GuideTopic[];

export function HelpStep() {
  return (
    <>
      <SectionIntro
        title="Guide complet"
        description="Comprendre le rôle de chaque étape, les données attendues, leur impact et les vérifications à effectuer."
      />
      <div className="wiki-content">
        {topics.map((topic, index) => (
          <EditorDisclosure
            className="editor-subsection guide-card"
            disclosureId={`guide-${topic.id}`}
            key={topic.id}
          >
            <summary>
              <span className="guide-card__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{topic.title}</strong>
                <span>{topic.summary}</span>
              </div>
            </summary>
            <div className="editor-subsection__content guide-card__content">
              {topic.blocks.map((block) => (
                <section className="guide-card__block" key={block.title}>
                  <h3>{block.title}</h3>
                  <ul>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </EditorDisclosure>
        ))}
      </div>
    </>
  );
}
