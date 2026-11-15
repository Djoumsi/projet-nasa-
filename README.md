# FlameLens — Sécurité incendie en exploration spatiale

Tableau de bord d'aide à la décision construit sur les investigations NASA de
combustion en microgravité. Il trie, explique et confronte ce corpus à chaque
environnement habité prévu : station, véhicule, base lunaire, rover pressurisé,
combinaison, habitat martien.

**Démo : https://djoumsi.github.io/projet-nasa-/**

Défi NASA Space Apps traité : tableau de bord interactif qui résume, classe et
interprète les résultats de combustion en microgravité pour en tirer des
enseignements de sécurité incendie.

## Ce que fait l'outil

- **Classe 15 investigations** (BASS, Saffire, SAME, DAFT, FLEX, CFI, CFI-G, BRE,
  E-FIELD, SPICE, SLICE, SoFIE, autres ACME, plus LUCI et FM2 à venir) selon
  l'environnement visé, le besoin de sécurité et la priorité d'analyse.
- **Explique chaque score** : la décomposition des quatre critères pondérés est
  affichée ligne par ligne, avec la note brute et son poids.
- **Attributs d'essai** demandés par le défi — état et forme du combustible, taille
  d'échantillon, concentration en oxygène, vitesse d'écoulement, pression, capteurs,
  variables testées et paramètres constants — avec **la source de chaque valeur**.
- **Arithmétique de l'atmosphère** : pression partielle d'oxygène, rapports à l'air
  terrestre, et le constat qui en découle pour une atmosphère d'exploration.
- **Carte des atmosphères** : concentration en O₂ contre pression totale, avec la
  courbe d'iso-pression partielle du niveau de la mer et l'enveloppe d'exploration.
- **Le trou de données en gravité partielle**, montré tel quel plutôt que comblé.
- **Recherche BM25** sur le corpus embarqué : chaque résultat cite son passage, sa
  source et les termes retenus.
- **Matériel partagé** : regroupement par ACME/CIR, MDCA/CIR et conduit SPICE/MSG.
- **Incidents réels** (Apollo 1, Apollo 13, Mir, Artemis II), chacun rattaché au
  pilier de sécurité qu'il a mis en avant.
- **Retombées terrestres** : détection industrielle, équipement des pompiers,
  brume d'eau fine.
- **Exports** CSV et JSON au niveau attribut, exploitables pour la modélisation.

## Règle de données

Aucun chiffre n'est inventé. Dans `js/data.js`, chaque champ est soit
`F(valeur, source)` — renseigné, avec sa provenance — soit `null`. Un champ `null`
s'affiche comme **non renseigné**, avec un lien direct vers PSI, et il est compté
dans l'indicateur de couverture visible en haut de page. La couverture actuelle est
basse, et c'est volontaire : elle mesure ce qui reste à extraire de PSI au lieu de
le masquer derrière une estimation.

Les notes de pertinence sur 5 sont des appréciations qualitatives saisies dans le
prototype. Elles ne sortent pas des mesures PSI et sont signalées comme telles
partout où elles apparaissent.

## Ce que l'outil n'est pas

Il ne prédit ni la probabilité ni la propagation d'un incendie. Il ne remplace ni
une analyse de risque certifiée, ni un essai de qualification, ni un modèle physique
de combustion. Aucune donnée de combustion en gravité partielle n'existe à ce jour
dans PSI : rien n'est interpolé pour la Lune ou Mars.

## Utilisation

Ouvrir `index.html` dans un navigateur. Aucune installation, aucune dépendance,
aucun appel réseau — les liens externes ne s'ouvrent que si l'utilisateur clique.

```
index.html        structure et sections
css/style.css     feuille de style unique
js/data.js        base de connaissances, provenance par champ
js/engine.js      pression partielle, classement, BM25, exports
js/charts.js      SVG : flammes 1 g / µg, carte atmosphères, trou de gravité
js/app.js         rendu et interactions
```

## Prochaines étapes

1. Importer les métadonnées et séries de mesures PSI pour remplir les attributs
   vides, en conservant la provenance par champ.
2. Rattacher chaque investigation à ses identifiants de jeux de données et à ses
   publications.
3. Intégrer LUCI et FM2 dès publication, pour fermer le trou en gravité partielle.

## Sources

- [NASA PSI — recherche « combustion »](https://psi.nasa.gov/physci/repo/search?q=combustion)
- [NASA Glenn — Combustion Science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/)
- [A Researcher's Guide to ISS Combustion Science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/)
- [NASA ScienceCasts — Combustion on the ISS](https://www.youtube.com/watch?v=W1oXykoz9zg)
- [NASA SMA — Apollo 1](https://sma.nasa.gov/sma-disciplines/accllp/apollo-1) ·
  [Apollo 13](https://sma.nasa.gov/sma-disciplines/accllp/apollo-13) ·
  [Fire aboard Mir](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/)
- Spinoffs : [détecteur de fumée](https://spinoff.nasa.gov/node/9407) ·
  [bouteilles d'air](https://spinoff.nasa.gov/node/9582) ·
  [tenues d'intervention](https://spinoff.nasa.gov/node/9918)
