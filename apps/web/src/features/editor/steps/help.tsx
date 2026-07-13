import { SectionIntro } from "../../../components/fields";

const topics = [
  ["Démarrer et sauvegarder", "Nouveau dossier crée une base vide. Ouvrir charge un fichier JSON Dossier Immo. Sauvegarder crée le fichier officiel ; le brouillon automatique du navigateur sert seulement à récupérer une saisie interrompue. Charger l’exemple fictif remplace temporairement le formulaire par un cas de démonstration sans lien avec vos données."],
  ["Foyer", "Décrivez uniquement les personnes concernées par le projet. Les dates, courriels et téléphones sont facultatifs. Les événements futurs servent aux stress tests ; ils ne créent jamais une personne à charge actuelle."],
  ["Activités, revenus et historique", "Une activité décrit le statut professionnel et son mode de rémunération. Un flux de revenu indique le montant mensuel retenu par la banque et l’hypothèse prudente. L’historique documente les périodes observées et alimente le graphique de l’annexe des indépendants ; il ne remplace pas les justificatifs."],
  ["Patrimoine et historique mensuel", "Les actifs décrivent la situation à la date d’observation. L’historique mensuel est facultatif : il sert à montrer l’évolution réelle des liquidités, revenus et mensualités dans le temps. Il n’est pas additionné une seconde fois aux actifs courants."],
  ["Crédits et passifs", "Sélectionnez clairement chaque emprunteur avec les boutons nominatifs. La mensualité et la date de fin déterminent si le crédit pèse encore à la date d’achat. Le libellé doit être court ; les précisions vont dans la note."],
  ["Projet et réserve", "Les montants du projet alimentent tous les scénarios de financement. Les critères décrivent le bien recherché et apparaissent dans le PDF. La réserve minimale est un garde-fou ; les poches expliquent ce que vous souhaitez conserver après l’achat."],
  ["Financement", "Chaque scénario fixe durée, taux, assurance et éventuelles dérogations de prix ou d’apport. Le scénario mis en avant structure la synthèse. Les résultats restent indicatifs jusqu’à confirmation par une banque ou un courtier."],
  ["Budgets et Sankey", "Le budget central et le stress test sont appariés poste par poste. Le revenu après impôt et le scénario de financement peuvent différer. Afficher dans le Sankey ajoute le poste au graphique ; Ajustable indique une dépense modulable, sans modifier automatiquement son montant."],
  ["Justificatifs", "La liste suit les pièces attendues, leur responsable et leur statut. Aucun fichier sensible n’est importé dans l’application. Transmettez les pièces par le portail sécurisé de l’établissement."],
  ["Textes et thèmes", "Les champs acceptent du texte simple : utilisez des paragraphes, sans Markdown ni code. Le thème applique une combinaison cohérente de couleurs et de typographie au PDF. Les textes par page sont facultatifs et leur destination est indiquée."],
  ["Aperçu et PDF", "L’aperçu reproduit les pages A4 finales. Le bouton Imprimer / PDF dans l’en-tête ouvre la boîte d’impression. Choisissez Enregistrer au format PDF, activez les arrière-plans et désactivez les en-têtes et pieds de page du navigateur."],
  ["Confidentialité et limites", "Les données restent sur cet appareil. Le fichier JSON contient vos informations : conservez-le dans un emplacement protégé. Les calculs sont des pré-analyses, pas une offre de prêt ni un conseil juridique, fiscal ou financier."],
] as const;

export function HelpStep() {
  return <><SectionIntro title="Guide complet" description="Mode d’emploi du dossier, rôle de chaque section et destination des données." />
    <div className="wiki-content">{topics.map(([title, body], index) => <section id={`guide-${index + 1}`} key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></section>)}</div>
  </>;
}
