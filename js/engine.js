"use strict";
/* FlameLens — moteur.
   Trois briques, toutes explicables et calculées localement :
   1. atmosphere()  : arithmétique de pression partielle, sur les valeurs de l'énoncé.
   2. rank()        : score de pertinence documentaire, contributions détaillées.
   3. search()      : BM25 sur le corpus embarqué. Pas de modèle de langue, pas d'API.
*/

/* ============ 1. Atmosphère ============ */
const EARTH_O2 = 21, EARTH_PSI = 14.7;

function atmosphere(atmosId) {
  if (!atmosId || !ATMOS[atmosId]) return null;
  const a = ATMOS[atmosId];
  const out = { ...a, ppo2: null, ppo2Ratio: null, o2Ratio: null };
  if (a.o2 != null && a.psi != null) {
    out.ppo2 = (a.o2 / 100) * a.psi;
    out.ppo2Ratio = out.ppo2 / ((EARTH_O2 / 100) * EARTH_PSI);
  }
  if (a.o2 != null) out.o2Ratio = a.o2 / EARTH_O2;
  return out;
}

/* Le constat central, dérivé des seuls chiffres de l'énoncé :
   une atmosphère d'exploration garde une pression partielle d'oxygène proche de
   celle du niveau de la mer — même oxygène pour l'équipage — tout en augmentant
   fortement la concentration, qui est le paramètre dont dépend l'inflammabilité. */
function oxygenInsight(atmosId) {
  const a = atmosphere(atmosId);
  if (!a) return null;
  if (a.ppo2 == null) {
    return { kind: "partial", text: "La pression associée n'est pas précisée par les sources de ce défi : la pression partielle d'oxygène n'est donc pas calculée ici." };
  }
  const ppDelta = (a.ppo2Ratio - 1) * 100;
  const o2Delta = (a.o2Ratio - 1) * 100;
  return {
    kind: "full",
    ppo2: a.ppo2, ppDelta, o2Delta,
    headline: Math.abs(ppDelta) < 10 && o2Delta > 20
      ? "Même oxygène pour l'équipage, beaucoup plus d'oxygène pour le feu."
      : (o2Delta > 0 ? "Concentration en oxygène supérieure à l'air terrestre." : "Concentration en oxygène proche de l'air terrestre."),
    text: `Pression partielle d'O₂ de ${a.ppo2.toFixed(2)} psi, soit ${fmtDelta(ppDelta)} par rapport au niveau de la mer, pour une concentration en oxygène de ${fmtDelta(o2Delta)}. La physiologie suit la pression partielle, l'inflammabilité suit la concentration.`
  };
}

const fmtDelta = (d) => (d >= 0 ? "+" : "−") + Math.abs(d).toFixed(0) + " %";

/* ============ 2. Classement ============ */
function weightsFor(envId, priority) {
  const base = { ...ENVIRONMENTS[envId].weights };
  if (priority === "direct") { base.focus = 0.35; base.atm = base.atm > 0 ? 0.15 : 0; base.direct = 1 - base.focus - base.atm; }
  if (priority === "atmos" && base.atm > 0) { base.focus = 0.30; base.atm = 0.50; base.direct = 0.20; }
  const evidence = priority === "evidence" ? 0.25 : 0;
  const total = base.focus + base.atm + base.direct;
  return { focus: base.focus / total * (1 - evidence), atm: base.atm / total * (1 - evidence), direct: base.direct / total * (1 - evidence), evidence };
}

function scoreStudy(study, envId, objective, priority) {
  const w = weightsFor(envId, priority);
  const parts = [
    { key: "focus",    label: "Adéquation à l'objectif",  raw: study.scores[objective], weight: w.focus },
    { key: "atm",      label: "Adéquation atmosphérique", raw: study.scores.atm,        weight: w.atm },
    { key: "direct",   label: "Lien direct avec l'équipage", raw: study.scores.direct,  weight: w.direct },
    { key: "evidence", label: "Niveau de documentation",  raw: study.scores.evidence,   weight: w.evidence }
  ].filter(p => p.weight > 0);
  parts.forEach(p => { p.points = (p.raw / 5) * 100 * p.weight; });
  const score = Math.round(parts.reduce((s, p) => s + p.points, 0));
  return { score, parts };
}

function rank(envId, objective, priority) {
  return STUDIES
    .map(s => ({ study: s, ...scoreStudy(s, envId, objective, priority), coverage: coverage(s) }))
    .sort((a, b) => b.score - a.score || a.study.name.localeCompare(b.study.name));
}

/* ============ Couverture des données ============ */
const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? null : o[k]), obj);

function coverage(study) {
  const filled = [], missing = [];
  COVERAGE_FIELDS.forEach(([path, label]) => {
    const f = getPath(study, path);
    (f && f.v ? filled : missing).push({ path, label, value: f ? f.v : null, src: f ? f.src : null });
  });
  return { filled, missing, pct: Math.round(filled.length / COVERAGE_FIELDS.length * 100) };
}

function corpusCoverage() {
  let filled = 0, total = 0;
  STUDIES.forEach(s => { const c = coverage(s); filled += c.filled.length; total += COVERAGE_FIELDS.length; });
  return { filled, total, pct: Math.round(filled / total * 100) };
}

/* ============ 3. Recherche BM25 ============ */
const STOP = new Set(("le la les un une des de du d l et ou a au aux en dans pour par sur avec sans que qui quoi est sont ce cette ces son sa ses il elle on nous vous ils elles " +
  "the a an of in on for to and or is are with without that which what this these").split(" "));

const normalize = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tokenize = (s) => normalize(s).split(/[^a-z0-9₂]+/).filter(t => t.length > 1 && !STOP.has(t));

function buildDocs() {
  const docs = [];
  STUDIES.forEach(s => {
    const push = (field, label, text, src) => { if (text) docs.push({ studyId: s.id, field, label, text: String(text), src: src || null }); };
    push("objective", "Objectif expérimental", s.objective && s.objective.v, s.objective && s.objective.src);
    push("why", "Pertinence pour la sécurité incendie", s.why, "engine");
    push("fuels", "Combustible", [s.fuels.state, s.fuels.examples, s.fuels.geometry, s.fuels.size].filter(Boolean).map(f => f.v).join(" · "), "brief");
    push("conditions", "Conditions d'essai", [s.conditions.o2, s.conditions.flow, s.conditions.pressure].filter(Boolean).map(f => f.v).join(" · "), "brief");
    push("diagnostics", "Capteurs et mesures", s.diagnostics && s.diagnostics.v, s.diagnostics && s.diagnostics.src);
    push("variables", "Variables", [s.variables.varied, s.variables.held].filter(Boolean).map(f => f.v).join(" · "), "brief");
    push("identity", "Identification", `${s.name} ${s.long} ${s.project || ""} ${s.platform || ""} ${s.tags.join(" ")}`, "brief");
    if (s.hardware && HARDWARE[s.hardware]) {
      const h = HARDWARE[s.hardware];
      push("hardware", "Matériel", `${h.label} · ${h.host}${h.note ? " · " + h.note : ""}`, h.src);
    }
  });
  INCIDENTS.forEach(i => docs.push({ studyId: null, incident: i, field: "incident", label: `Incident · ${i.title} (${i.year})`, text: `${i.title} ${i.text} ${i.lesson}`, src: i.src }));
  EARTH_APPS.forEach(e => docs.push({ studyId: null, earth: e, field: "earth", label: `Retombée terrestre · ${e.title}`, text: `${e.title} ${e.text}`, src: e.src }));
  return docs;
}

const DOCS = buildDocs();
const INDEX = (() => {
  const df = new Map();
  const docTokens = DOCS.map(d => {
    const toks = tokenize(d.text);
    new Set(toks).forEach(t => df.set(t, (df.get(t) || 0) + 1));
    return toks;
  });
  const avgLen = docTokens.reduce((s, t) => s + t.length, 0) / (docTokens.length || 1);
  return { df, docTokens, avgLen, N: DOCS.length };
})();

function search(query, limit = 6) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  const k1 = 1.2, b = 0.75;
  const scored = DOCS.map((doc, i) => {
    const toks = INDEX.docTokens[i];
    if (!toks.length) return { doc, score: 0, hits: [] };
    const len = toks.length, tf = new Map(), hits = [];
    toks.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    let score = 0;
    qTokens.forEach(q => {
      let f = tf.get(q) || 0;
      if (!f) { for (const [t, c] of tf) { if (t.startsWith(q) && q.length > 3) { f += c; break; } } }
      if (!f) return;
      const n = INDEX.df.get(q) || 0;
      const idf = Math.log(1 + (INDEX.N - n + 0.5) / (n + 0.5));
      score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * len / INDEX.avgLen));
      hits.push(q);
    });
    return { doc, score, hits };
  });
  return scored.filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}

/* Export au niveau test : une ligne par champ d'attribut, renseigné ou non.
   C'est le format utile à la modélisation prédictive, et il rend le manque visible. */
function exportRows(envId, objective, priority) {
  const ranked = rank(envId, objective, priority);
  const rows = [["investigation", "nom_long", "projet", "plateforme", "materiel", "piliers", "score_pertinence", "attribut", "valeur", "source", "statut_donnee"]];
  ranked.forEach(r => {
    const s = r.study, hw = s.hardware && HARDWARE[s.hardware] ? HARDWARE[s.hardware].label : "";
    const base = [s.id, s.long, s.project || "", s.platform || "", hw, s.pillars.join("|"), r.score];
    COVERAGE_FIELDS.forEach(([path, label]) => {
      const f = getPath(s, path);
      rows.push([...base, label, f ? f.v : "", f ? (SOURCES[f.src] ? SOURCES[f.src].label : f.src) : "", f ? "renseigne" : "a_extraire_de_PSI"]);
    });
  });
  return rows;
}
