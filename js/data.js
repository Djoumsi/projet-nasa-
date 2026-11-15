"use strict";
/* FlameLens — base de connaissances.
   Règle de ce fichier : aucun chiffre inventé.
   - F(valeur, source) = champ renseigné, avec sa provenance.
   - null              = champ non renseigné, à extraire de PSI. Affiché comme tel.
*/

const F = (v, src) => ({ v, src });

const SOURCES = {
  brief:    { label: "Énoncé du défi NASA Space Apps", url: "" },
  psi:      { label: "NASA PSI — recherche « combustion »", url: "https://psi.nasa.gov/physci/repo/search?q=combustion" },
  glenn:    { label: "NASA Glenn — Combustion Science", url: "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/" },
  guide:    { label: "A Researcher's Guide to ISS Combustion Science", url: "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/" },
  cast:     { label: "NASA ScienceCasts — Combustion on the ISS (vidéo, 3 min 36)", url: "https://www.youtube.com/watch?v=W1oXykoz9zg" },
  apollo1:  { label: "NASA SMA — Apollo 1", url: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1" },
  apollo13: { label: "NASA SMA — Apollo 13", url: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13" },
  mir:      { label: "NASA History — Fire aboard Mir (1997)", url: "https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/" },
  spDetect: { label: "NASA Spinoff — Fire Detector", url: "https://spinoff.nasa.gov/node/9407" },
  spTanks:  { label: "NASA Spinoff — Fireman's Air Tanks", url: "https://spinoff.nasa.gov/node/9582" },
  spAttire: { label: "NASA Spinoff — New Technology for the Fire Attire", url: "https://spinoff.nasa.gov/node/9918" }
};

/* ---- Matériel, tel que regroupé par l'énoncé ---- */
const HARDWARE = {
  CIR_ACME: { id: "CIR_ACME", label: "Matériel modulaire ACME", host: "Combustion Integrated Rack (CIR)",
    note: "Les six expériences du projet ACME partagent le même ensemble modulaire dans le CIR.", src: "brief" },
  CIR_MDCA: { id: "CIR_MDCA", label: "Multi-user Droplet Combustion Apparatus (MDCA)", host: "Combustion Integrated Rack (CIR)",
    note: "FLEX, FLEX-2 et CFI ont tous brûlé des gouttelettes de combustible liquide avec le MDCA.", src: "brief" },
  MSG_DUCT: { id: "MSG_DUCT", label: "Conduit à flux ventilé construit pour SPICE", host: "Microgravity Science Glovebox (MSG)",
    note: "BASS, BASS-II, SPICE et SLICE ont utilisé ce même conduit modulaire dans le MSG.", src: "brief" },
  VEHICLE:  { id: "VEHICLE", label: "Module d'essai à bord d'un véhicule cargo", host: "Véhicule spatial, hors station",
    note: "Saffire permet des échantillons bien plus grands que ceux admissibles dans un module habité.", src: "glenn" },
  ISS_CIR:  { id: "ISS_CIR", label: "Matériel SoFIE", host: "Combustion Integrated Rack (CIR)", note: null, src: "glenn" },
  GROUND:   { id: "GROUND", label: "Essais comparés sol / faible gravité", host: "Plateformes multiples", note: null, src: "glenn" }
};

/* ---- Atmosphères de référence ---- */
const ATMOS = {
  earth:   { id: "earth",  label: "Air terrestre / cabine type ISS", o2: 21,  psi: 14.7, kind: "ref", src: "brief" },
  moon:    { id: "moon",   label: "Base lunaire et rover pressurisé", o2: 30, psi: 10.2, kind: "envelope", o2Min: true, psiMax: true, src: "brief" },
  suit:    { id: "suit",   label: "Combinaison spatiale", o2: 100, psi: 4.3, kind: "ref", src: "brief" },
  apollo1: { id: "apollo1", label: "Apollo 1, essai au sol (1967)", o2: 100, psi: null, kind: "history",
             note: "Cabine remplie d'oxygène lors de l'essai avant lancement. La pression de l'essai n'est pas donnée par les sources de ce défi.", src: "apollo1" },
  cfig:    { id: "cfig",   label: "Condition d'essai CFI-G (microgravité)", o2: 85, psi: null, kind: "test",
             note: "Mélange oxygène-azote jusqu'à 85 % d'O₂ débité par le brûleur sphérique. Pression non précisée par l'énoncé.", src: "brief" }
};

/* ---- Environnements sélectionnables ---- */
const ENVIRONMENTS = {
  moon_base: { label: "Base lunaire pressurisée", atmos: "moon", gravity: 0.166,
    note: "Pour raccourcir la pré-respiration et faciliter les sorties, l'énoncé retient une concentration d'O₂ de 30 % ou plus et une pression de 10,2 psi ou moins.",
    weights: { focus: 0.45, atm: 0.30, direct: 0.25 }, specified: true, src: "brief" },
  rover: { label: "Rover lunaire pressurisé", atmos: "moon", gravity: 0.166,
    note: "L'énoncé place la base lunaire et les rovers pressurisés dans la même enveloppe atmosphérique intermédiaire.",
    weights: { focus: 0.45, atm: 0.30, direct: 0.25 }, specified: true, src: "brief" },
  station: { label: "Station ou véhicule pressurisé", atmos: "earth", gravity: 0,
    note: "Environnement de cabine à l'air, celui des investigations menées à bord de l'ISS.",
    weights: { focus: 0.55, atm: 0.15, direct: 0.30 }, specified: true, src: "brief" },
  suit: { label: "Atmosphère de combinaison", atmos: "suit", gravity: 0.166,
    note: "100 % d'oxygène à 4,3 psi, pour garder la combinaison souple. C'est l'atmosphère la plus exigeante du point de vue de l'inflammabilité.",
    weights: { focus: 0.35, atm: 0.45, direct: 0.20 }, specified: true, src: "brief" },
  mars: { label: "Habitat martien", atmos: null, gravity: 0.38,
    note: "Ni l'énoncé ni les sources fournies ne spécifient l'atmosphère d'un habitat martien. Aucune composition n'est donc supposée ici, et l'adéquation atmosphérique est neutralisée dans le calcul.",
    weights: { focus: 0.60, atm: 0.00, direct: 0.40 }, specified: false, src: "brief" }
};

const OBJECTIVES = {
  prevention: { label: "Prévenir", full: "Prévention : maîtrise des sources d'allumage et sélection des matériaux" },
  detection:  { label: "Détecter", full: "Détection : fumées, aérosols, discrimination des poussières" },
  suppression:{ label: "Éteindre", full: "Suppression : dilution de l'atmosphère, agents extincteurs" },
  modeling:   { label: "Modéliser", full: "Modélisation prédictive de l'inflammabilité et des scénarios d'incendie" },
  equipment:  { label: "Équiper", full: "Contrôles et équipements de sécurité incendie de nouvelle génération" }
};

const PRIORITIES = {
  balanced: { label: "Équilibrée" },
  direct:   { label: "Applicabilité directe à l'équipage" },
  atmos:    { label: "Adéquation atmosphérique" },
  evidence: { label: "Niveau de documentation" }
};

/* ---- Investigations ----
   conditions, fuels.geometry, fuels.size, diagnostics, variables :
   renseignés seulement si une source de ce défi l'établit. Sinon null.
*/
const STUDIES = [
  {
    id: "BASS", name: "BASS & BASS-II", long: "Burning and Suppression of Solids",
    project: null, platform: "ISS", hardware: "MSG_DUCT", status: "past",
    pillars: ["prevention", "suppression"],
    objective: F("Étudier la combustion et la suppression de matériaux solides en microgravité, avec variation de la concentration en oxygène et de l'écoulement d'air.", "brief"),
    why: "L'énoncé désigne BASS et Saffire comme les investigations d'inflammabilité des matériaux solides, socle de la prévention par sélection des matériaux.",
    fuels: { state: F("Solide", "brief"), examples: F("Tissus et plastiques", "brief"), geometry: null, size: null },
    conditions: { o2: F("Variable, valeurs à extraire de PSI", "brief"), flow: F("Écoulement variable en conduit ventilé, vitesses à extraire de PSI", "brief"), pressure: null },
    diagnostics: null,
    variables: { varied: F("Concentration en oxygène et vitesse d'écoulement", "brief"), held: null },
    scores: { prevention: 5, detection: 1, suppression: 4, modeling: 4, equipment: 3, atm: 4, direct: 5, evidence: 4 },
    tags: ["matériaux solides", "inflammabilité", "écoulement"]
  },
  {
    id: "SAFFIRE", name: "Saffire-I, -II, -III", long: "Spacecraft Fire Safety Demonstration",
    project: null, platform: "Véhicule cargo", hardware: "VEHICLE", status: "past",
    pillars: ["prevention", "detection"],
    objective: F("Démontrer le comportement du feu sur des matériaux solides à une échelle représentative d'un véhicule spatial.", "brief"),
    why: "Seule série d'essais à grande échelle du corpus : elle teste des scénarios d'incendie qu'aucun module habité ne permettrait.",
    fuels: { state: F("Solide", "brief"), examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null,
    variables: { varied: null, held: null },
    scores: { prevention: 5, detection: 2, suppression: 1, modeling: 4, equipment: 2, atm: 4, direct: 5, evidence: 4 },
    tags: ["grande échelle", "véhicule spatial", "scénario d'incendie"]
  },
  {
    id: "SAME", name: "SAME & SAME-R", long: "Smoke and Aerosol Measurement Experiment",
    project: null, platform: "ISS", hardware: null, status: "past",
    pillars: ["detection", "equipment"],
    objective: F("Mesurer les fumées et aérosols produits en microgravité afin d'éclairer la détection d'incendie.", "brief"),
    why: "L'énoncé en fait l'investigation de référence pour la détection. Les propriétés des particules en microgravité conditionnent le choix et le placement des détecteurs.",
    fuels: { state: F("Produits de combustion : fumées et aérosols", "brief"), examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: F("Instrumentation de mesure de particules ; l'un de ses instruments a été réutilisé dans DAFT", "brief"),
    variables: { varied: null, held: null },
    scores: { prevention: 1, detection: 5, suppression: 0, modeling: 2, equipment: 5, atm: 2, direct: 4, evidence: 4 },
    tags: ["fumées", "aérosols", "détection"]
  },
  {
    id: "DAFT", name: "DAFT & DAFT-2", long: "Dust and Aerosol Measurement Feasibility Test",
    project: null, platform: "ISS", hardware: null, status: "past",
    pillars: ["detection"],
    objective: F("Évaluer la faisabilité de la mesure des poussières en microgravité, en réutilisant un instrument de SAME.", "brief"),
    why: "Distinguer une fumée de combustion d'une poussière ambiante est le cœur du problème des fausses alarmes, à bord comme au sol.",
    fuels: { state: F("Poussières et aérosols, hors combustion", "brief"), examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: F("Instrument de mesure de particules repris de SAME", "brief"),
    variables: { varied: null, held: null },
    scores: { prevention: 1, detection: 4, suppression: 0, modeling: 1, equipment: 4, atm: 1, direct: 3, evidence: 3 },
    tags: ["poussières", "fausses alarmes", "capteurs"]
  },
  {
    id: "FLEX", name: "FLEX & FLEX-2", long: "Flame Extinguishment Experiment",
    project: null, platform: "ISS", hardware: "CIR_MDCA", status: "past",
    pillars: ["suppression"],
    objective: F("Étudier l'extinction de flammes de gouttelettes par dilution de l'atmosphère de la chambre au dioxyde de carbone et à l'hélium.", "brief"),
    why: "L'énoncé en fait l'investigation de référence pour la suppression : CO₂ et hélium y sont tous deux étudiés comme agents suppresseurs.",
    fuels: { state: F("Gouttelettes de combustible liquide", "brief"), examples: null, geometry: F("Gouttelette", "brief"), size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null,
    variables: { varied: F("Agent de dilution : dioxyde de carbone, hélium", "brief"), held: null },
    scores: { prevention: 2, detection: 0, suppression: 5, modeling: 3, equipment: 4, atm: 3, direct: 4, evidence: 5 },
    tags: ["extinction", "CO₂", "hélium", "gouttelettes"]
  },
  {
    id: "CFI", name: "CFI", long: "Cool Flames Investigation",
    project: null, platform: "ISS", hardware: "CIR_MDCA", status: "past",
    pillars: ["modeling"],
    objective: F("Étudier les flammes froides sur des gouttelettes de combustible liquide.", "brief"),
    why: "Régime de combustion à basse température, qui fragilise l'hypothèse selon laquelle une flamme éteinte est un feu éteint.",
    fuels: { state: F("Gouttelettes de combustible liquide", "brief"), examples: null, geometry: F("Gouttelette", "brief"), size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null, variables: { varied: null, held: null },
    scores: { prevention: 2, detection: 0, suppression: 2, modeling: 4, equipment: 1, atm: 3, direct: 3, evidence: 4 },
    tags: ["flammes froides", "gouttelettes"]
  },
  {
    id: "CFIG", name: "CFI-G", long: "Cool Flames Investigation with Gases",
    project: "ACME", platform: "ISS", hardware: "CIR_ACME", status: "past",
    pillars: ["prevention", "modeling"],
    objective: F("Étudier la combustion de gaz à très forte concentration en oxygène : chambre remplie d'azote et d'un gaz inflammable, par exemple du propane, l'oxygène étant débité par un brûleur sphérique pour créer une flamme inversée.", "brief"),
    why: "Ce sont les essais en microgravité conduits aux plus fortes concentrations d'oxygène du corpus. C'est le seul point d'ancrage expérimental vers les atmosphères enrichies de l'exploration.",
    fuels: { state: F("Gaz, par exemple du propane", "brief"), examples: F("Propane", "brief"), geometry: F("Brûleur sphérique, flamme inversée", "brief"), size: null },
    conditions: { o2: F("Jusqu'à 85 % d'O₂ dans le mélange oxygène-azote débité", "brief"), flow: null, pressure: null },
    diagnostics: null,
    variables: { varied: F("Concentration en oxygène du flux débité", "brief"), held: F("Mélange azote et gaz inflammable dans la chambre", "brief") },
    scores: { prevention: 4, detection: 0, suppression: 1, modeling: 4, equipment: 2, atm: 5, direct: 4, evidence: 4 },
    tags: ["oxygène élevé", "85 % O₂", "flamme inversée"]
  },
  {
    id: "BRE", name: "BRE", long: "Burning Rate Emulator",
    project: "ACME", platform: "ISS", hardware: "CIR_ACME", status: "past",
    pillars: ["prevention", "modeling"],
    objective: F("Brûler des combustibles gazeux pour étudier l'inflammabilité des matériaux en atmosphère calme, en fonction des propriétés du matériau.", "brief"),
    why: "L'énoncé souligne le point clé : bien qu'il brûle du gaz, BRE est une étude d'inflammabilité des matériaux. C'est le pont entre propriétés mesurables et comportement au feu.",
    fuels: { state: F("Gaz, en émulation de matériaux solides", "brief"), examples: null, geometry: F("Brûleur émulant un matériau", "brief"), size: null },
    conditions: { o2: null, flow: F("Atmosphère calme, sans écoulement forcé", "brief"), pressure: null },
    diagnostics: null,
    variables: { varied: F("Propriétés du matériau émulé", "brief"), held: F("Atmosphère calme", "brief") },
    scores: { prevention: 5, detection: 0, suppression: 1, modeling: 5, equipment: 3, atm: 3, direct: 4, evidence: 3 },
    tags: ["propriétés matériaux", "atmosphère calme", "modélisation"]
  },
  {
    id: "EFIELD", name: "E-FIELD Flames", long: "Electric-Field Effects on Laminar Diffusion Flames",
    project: "ACME", platform: "ISS", hardware: "CIR_ACME", status: "past",
    pillars: ["modeling"],
    objective: F("Agir par champ électrique sur les ions naturellement présents dans la flamme, afin de reproduire certains effets de la gravité partielle.", "brief"),
    why: "En l'absence totale de données en gravité partielle dans PSI, c'est le seul analogue expérimental disponible pour approcher les conditions lunaires et martiennes.",
    fuels: { state: F("Gaz", "brief"), examples: null, geometry: F("Flamme de diffusion laminaire", "brief"), size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null,
    variables: { varied: F("Champ électrique appliqué", "brief"), held: null },
    scores: { prevention: 2, detection: 0, suppression: 1, modeling: 5, equipment: 1, atm: 2, direct: 3, evidence: 3 },
    tags: ["analogue gravité partielle", "champ électrique"]
  },
  {
    id: "ACME_OTHER", name: "Autres expériences ACME", long: "Advanced Combustion via Microgravity Experiments",
    project: "ACME", platform: "ISS", hardware: "CIR_ACME", status: "past",
    pillars: ["modeling"],
    objective: F("Le projet ACME compte six expériences de flammes de combustibles gazeux, toutes menées avec le même matériel modulaire dans le CIR.", "brief"),
    why: "Pertinence réelle mais moins directe pour la sécurité d'un habitat : l'apport est d'abord fondamental et sert la modélisation.",
    fuels: { state: F("Gaz", "brief"), examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null, variables: { varied: null, held: F("Matériel ACME commun aux six expériences", "brief") },
    scores: { prevention: 1, detection: 0, suppression: 1, modeling: 3, equipment: 1, atm: 2, direct: 2, evidence: 3 },
    tags: ["recherche fondamentale", "flammes gazeuses"]
  },
  {
    id: "SPICE", name: "SPICE", long: "Smoke Point In Co-flow Experiment",
    project: null, platform: "ISS", hardware: "MSG_DUCT", status: "past",
    pillars: ["detection", "modeling"],
    objective: F("Étudier le point de fumée de flammes en co-écoulement. Le conduit ventilé modulaire construit pour SPICE a ensuite servi à BASS, BASS-II et SLICE.", "brief"),
    why: "Le point de fumée relie les conditions de combustion à la production de suie, donc à ce qu'un détecteur voit réellement.",
    fuels: { state: F("Gaz", "brief"), examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: F("Co-écoulement dans le conduit ventilé du MSG", "brief"), pressure: null },
    diagnostics: null, variables: { varied: null, held: null },
    scores: { prevention: 1, detection: 3, suppression: 0, modeling: 3, equipment: 2, atm: 2, direct: 2, evidence: 3 },
    tags: ["point de fumée", "suie", "co-écoulement"]
  },
  {
    id: "SLICE", name: "SLICE", long: "Structure & Liftoff In Combustion Experiment",
    project: null, platform: "ISS", hardware: "MSG_DUCT", status: "past",
    pillars: ["modeling"],
    objective: F("Étudier la structure des flammes et leur décrochage, dans le conduit ventilé du MSG.", "brief"),
    why: "Apport fondamental sur la stabilité des flammes, utile à la modélisation plutôt qu'à une décision directe de sécurité.",
    fuels: { state: F("Gaz", "brief"), examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: F("Conduit ventilé du MSG", "brief"), pressure: null },
    diagnostics: null, variables: { varied: null, held: null },
    scores: { prevention: 1, detection: 0, suppression: 1, modeling: 3, equipment: 1, atm: 2, direct: 2, evidence: 3 },
    tags: ["structure de flamme", "décrochage"]
  },
  {
    id: "SOFIE", name: "SoFIE", long: "Solid Fuel Ignition and Extinction",
    project: null, platform: "ISS", hardware: "ISS_CIR", status: "current",
    pillars: ["prevention", "suppression"],
    objective: F("Étudier l'allumage, la croissance et l'extinction du feu sur des combustibles solides à bord de l'ISS.", "glenn"),
    why: "Couvre le cycle complet allumage, croissance, extinction sur des solides, ce qui en fait un appui direct aux critères de sélection des matériaux.",
    fuels: { state: F("Solide", "glenn"), examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null, variables: { varied: null, held: null },
    scores: { prevention: 5, detection: 1, suppression: 4, modeling: 4, equipment: 3, atm: 4, direct: 5, evidence: 3 },
    tags: ["allumage", "extinction", "combustibles solides"]
  },
  {
    id: "LUCI", name: "LUCI", long: "Lunar-g Combustion Investigation",
    project: null, platform: "À venir", hardware: "GROUND", status: "future",
    pillars: ["prevention", "modeling"],
    objective: F("Investigation annoncée sur la combustion en gravité lunaire. Aucune donnée en gravité partielle n'est aujourd'hui disponible dans PSI.", "brief"),
    why: "C'est la source qui comblera le trou de données au cœur de ce tableau de bord. À suivre, pas encore à exploiter.",
    fuels: { state: null, examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null, variables: { varied: null, held: null },
    scores: { prevention: 3, detection: 0, suppression: 1, modeling: 3, equipment: 1, atm: 3, direct: 3, evidence: 0 },
    tags: ["gravité lunaire", "à venir"]
  },
  {
    id: "FM2", name: "FM2", long: "Flammability of Materials on the Moon",
    project: null, platform: "À venir", hardware: "GROUND", status: "future",
    pillars: ["prevention"],
    objective: F("Investigation annoncée sur l'inflammabilité des matériaux à la surface lunaire. Données non encore présentes dans PSI.", "brief"),
    why: "Visera directement la question que ce tableau de bord ne peut aujourd'hui qu'encadrer : quels matériaux dans une base lunaire.",
    fuels: { state: null, examples: null, geometry: null, size: null },
    conditions: { o2: null, flow: null, pressure: null },
    diagnostics: null, variables: { varied: null, held: null },
    scores: { prevention: 4, detection: 0, suppression: 1, modeling: 3, equipment: 2, atm: 4, direct: 4, evidence: 0 },
    tags: ["inflammabilité lunaire", "à venir"]
  }
];

/* ---- Incidents réels, chacun relié au domaine de recherche qu'il a motivé ---- */
const INCIDENTS = [
  { year: "1967", title: "Apollo 1", pillar: "prevention", severity: "crew",
    text: "Un incendie éclate lors d'un essai avant lancement dans une cabine remplie d'oxygène. L'équipage est perdu.",
    lesson: "Concentration d'oxygène et sélection des matériaux : la combinaison des deux devient un critère de conception.",
    src: "apollo1" },
  { year: "1970", title: "Apollo 13", pillar: "equipment", severity: "survived",
    text: "L'explosion d'un réservoir d'oxygène met l'équipage en danger de mort en route vers la Lune.",
    lesson: "Intégrité des systèmes d'oxygène et capacité à diagnostiquer une défaillance loin de toute assistance.",
    src: "apollo13" },
  { year: "1997", title: "Station Mir", pillar: "suppression", severity: "survived",
    text: "Un feu provoqué par la défaillance d'un générateur d'oxygène se déclare à bord. L'équipage multinational survit.",
    lesson: "Suppression et évacuation des fumées dans un volume habité, sans possibilité de sortir.",
    src: "mir" },
  { year: "Artemis II", title: "Alarme incendie en vol", pillar: "detection", severity: "alarm",
    text: "Une alarme incendie se déclenche en vol. Le commandant résume l'effet : « make the fire alarm go off in your spacecraft », à environ 80 000 miles de la Terre.",
    lesson: "Détection fiable et discrimination des fausses alarmes : une alarme qu'on ne sait pas interpréter est un danger en soi.",
    src: "brief" }
];

/* ---- Retombées terrestres ---- */
const EARTH_APPS = [
  { title: "Détecteur de fumée discriminant fumée et poussière", decade: "années 1970",
    text: "Développé pour la navette, ce détecteur réduit les fausses alarmes en distinguant la fumée de la poussière. Applications industrielles, notamment dans les exploitations minières.",
    link: ["SAME", "DAFT"], src: "spDetect" },
  { title: "Bouteilles d'air et équipement respiratoire des pompiers", decade: "années 1970",
    text: "Adaptation des technologies de combinaison spatiale aux appareils respiratoires des pompiers.",
    link: [], src: "spTanks" },
  { title: "Tenues d'intervention", decade: "années 1980",
    text: "Application des matériaux de combinaison spatiale aux vêtements de protection des pompiers.",
    link: [], src: "spAttire" },
  { title: "Extincteurs à brume d'eau fine", decade: "ISS",
    text: "Développés pour un usage à bord de l'ISS, ils trouvent des applications pratiques au sol.",
    link: ["FLEX"], src: "brief" }
];

const GRAVITY_POINTS = [
  { g: 0,     label: "Microgravité",       data: "available", note: "Corpus PSI : investigations menées à bord de l'ISS et de véhicules spatiaux." },
  { g: 0.166, label: "Lune",               data: "missing",   note: "Aucune donnée de combustion en gravité partielle dans PSI. LUCI et FM2 sont annoncés." },
  { g: 0.38,  label: "Mars",               data: "missing",   note: "Aucune donnée. L'atmosphère d'un habitat martien n'est pas spécifiée non plus." },
  { g: 1,     label: "Gravité terrestre",  data: "available", note: "Essais au sol et normes d'inflammabilité existantes." }
];

const COVERAGE_FIELDS = [
  ["fuels.geometry", "Forme de l'échantillon ou du brûleur"],
  ["fuels.size", "Taille de l'échantillon"],
  ["conditions.o2", "Concentration en oxygène"],
  ["conditions.flow", "Vitesse d'écoulement"],
  ["conditions.pressure", "Pression"],
  ["diagnostics", "Capteurs et mesures"],
  ["variables.varied", "Variables testées"],
  ["variables.held", "Paramètres constants"]
];
