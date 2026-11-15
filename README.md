# FlameLens — Intelligence Engine

Prototype autonome (un seul fichier HTML, sans dépendance ni API externe) d'aide à la
décision sur la sécurité incendie en microgravité, construit à partir des investigations
NASA documentées (BASS, Saffire, SAME, DAFT, FLEX, CFI, ACME, SoFIE, FLARE).

## Ce que fait l'outil

- Classe 11 investigations NASA selon un **environnement cible** (habitat lunaire, rover,
  habitat martien, station / véhicule spatial, combinaison) et un **objectif de sécurité**
  (prévention, détection, extinction, modélisation, choix d'équipements).
- Explique chaque score : moteur de règles pondéré, entièrement explicable.
- Comparateur de 3 études côte à côte et export du classement en CSV.
- Assistant scientifique intégré (FR / EN) qui répond localement à partir de la base
  de connaissances embarquée.

## Utilisation

Ouvrir `index.html` dans un navigateur. Aucune installation, aucun serveur, aucune
requête réseau.

## Limites

Les notes de pertinence sont qualitatives et saisies dans le prototype : ce ne sont pas
des mesures brutes issues de NASA PSI. L'outil ne prédit ni la probabilité ni la
propagation d'un incendie, et ne remplace ni analyse de risque certifiée ni essai de
qualification.

## Sources

- [NASA Physical Sciences Informatics — combustion](https://psi.nasa.gov/physci/repo/search?q=combustion)
- [NASA Glenn — Combustion Science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/)
- [Researcher's Guide to ISS Combustion Science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/)
- [NASA Spinoff — smoke detection](https://spinoff.nasa.gov/node/9407)
