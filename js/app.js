"use strict";
/* FlameLens — assemblage de l'interface. */

const $ = (id) => document.getElementById(id);
const srcTag = (key) => {
  const s = SOURCES[key];
  if (!s) return "";
  return s.url
    ? `<a class="src" href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a>`
    : `<span class="src">${esc(s.label)}</span>`;
};

const state = { env: "moon_base", objective: "prevention", priority: "balanced", open: null, compare: new Set() };

/* ---------- Sélecteurs ---------- */
function buildControls() {
  $("env").innerHTML = Object.entries(ENVIRONMENTS).map(([k, v]) =>
    `<option value="${k}"${k === state.env ? " selected" : ""}>${esc(v.label)}</option>`).join("");
  $("objective").innerHTML = Object.entries(OBJECTIVES).map(([k, v]) =>
    `<option value="${k}"${k === state.objective ? " selected" : ""}>${esc(v.full)}</option>`).join("");
  $("priority").innerHTML = Object.entries(PRIORITIES).map(([k, v]) =>
    `<option value="${k}"${k === state.priority ? " selected" : ""}>${esc(v.label)}</option>`).join("");
}

/* ---------- Scénario : atmosphère et constat oxygène ---------- */
function renderScenario() {
  const env = ENVIRONMENTS[state.env];
  const atm = atmosphere(env.atmos);
  const insight = oxygenInsight(env.atmos);

  $("scenarioNote").innerHTML = `${esc(env.note)} ${srcTag(env.src)}`;

  if (!atm) {
    $("atmosReadout").innerHTML = `<div class="warn"><b>Atmosphère non spécifiée.</b> Aucune composition n'est supposée pour cet environnement.
      Le critère d'adéquation atmosphérique est retiré du calcul — son poids est redistribué sur les deux autres critères.</div>`;
  } else {
    const cells = [
      ["Concentration O₂", (atm.o2Min ? "≥ " : "") + atm.o2 + " %"],
      ["Pression totale", atm.psi == null ? "non spécifiée" : (atm.psiMax ? "≤ " : "") + String(atm.psi).replace(".", ",") + " psi"],
      ["Pression partielle O₂", atm.ppo2 == null ? "non calculable" : atm.ppo2.toFixed(2) + " psi"],
      ["O₂ vs air terrestre", atm.o2Ratio == null ? "—" : "×" + atm.o2Ratio.toFixed(2)]
    ];
    $("atmosReadout").innerHTML =
      `<div class="readout">${cells.map(([k, v]) => `<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}</div>` +
      (insight && insight.kind === "full"
        ? `<div class="insight-box"><p class="headline">${esc(insight.headline)}</p><p>${esc(insight.text)}</p></div>`
        : `<div class="warn">${esc(insight ? insight.text : "")}</div>`);
  }
  $("mapWrap").innerHTML = flammabilityMap(env.atmos);
}

/* ---------- Classement ---------- */
function renderRanking() {
  const results = rank(state.env, state.objective, state.priority);
  const env = ENVIRONMENTS[state.env];
  const top = results.slice(0, 3);

  $("verdictTitle").textContent = `${OBJECTIVES[state.objective].label} — ${env.label}`;
  $("verdictBody").innerHTML =
    `<p class="callout">Commence par <b>${top.map(r => esc(r.study.name)).join("</b>, <b>")}</b>. ${esc(top[0].study.why)}</p>` +
    (env.specified ? "" : `<p class="warn">Environnement non spécifié par les sources : ce classement est une orientation documentaire, pas une validation pour cet environnement.</p>`);

  $("ranking").innerHTML = results.map((r, i) => {
    const s = r.study, hw = s.hardware ? HARDWARE[s.hardware] : null;
    const isOpen = state.open === s.id;
    return `<article class="study${isOpen ? " open" : ""}${s.status === "future" ? " future" : ""}">
      <button class="study-head" data-open="${s.id}" aria-expanded="${isOpen}">
        <span class="rankno">${i + 1}</span>
        <span class="study-id">
          <strong>${esc(s.name)}</strong>
          <span class="long">${esc(s.long)}</span>
          <span class="chips">${s.pillars.map(p => `<span class="chip chip-${p}">${esc(OBJECTIVES[p].label)}</span>`).join("")}
            ${s.status === "future" ? '<span class="chip chip-future">données à venir</span>' : ""}
            ${s.project ? `<span class="chip chip-proj">${esc(s.project)}</span>` : ""}</span>
        </span>
        <span class="study-score"><b>${r.score}</b><em>/100</em>${coverageBar(r.coverage.pct, true)}</span>
      </button>
      ${isOpen ? detailPanel(r, hw) : ""}
    </article>`;
  }).join("");

  $("ranking").querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
    state.open = state.open === b.dataset.open ? null : b.dataset.open;
    renderRanking();
  });
  $("ranking").querySelectorAll("[data-cmp]").forEach(b => b.onclick = () => {
    const id = b.dataset.cmp;
    state.compare.has(id) ? state.compare.delete(id) : state.compare.add(id);
    if (state.compare.size > 3) state.compare.delete(state.compare.values().next().value);
    renderRanking(); renderCompare();
  });
  $("mStudies").textContent = STUDIES.length;
  $("mCoverage").textContent = corpusCoverage().pct + " %";
}

function attrRow(label, field) {
  if (field && field.v) {
    return `<tr><th>${esc(label)}</th><td>${esc(field.v)}</td><td class="prov">${srcTag(field.src)}</td></tr>`;
  }
  return `<tr class="gap"><th>${esc(label)}</th><td><span class="todo">non renseigné</span></td>
    <td class="prov"><a class="src" href="${SOURCES.psi.url}" target="_blank" rel="noopener">à extraire de PSI</a></td></tr>`;
}

function detailPanel(r, hw) {
  const s = r.study;
  return `<div class="detail">
    <p class="obj">${esc(s.objective.v)} ${srcTag(s.objective.src)}</p>
    <div class="detail-grid">
      <div>
        <h4>Attributs d'essai</h4>
        <table class="attrs"><tbody>
          ${attrRow("État du combustible", s.fuels.state)}
          ${attrRow("Combustibles", s.fuels.examples)}
          ${attrRow("Forme de l'échantillon ou du brûleur", s.fuels.geometry)}
          ${attrRow("Taille de l'échantillon", s.fuels.size)}
          ${attrRow("Concentration en oxygène", s.conditions.o2)}
          ${attrRow("Vitesse d'écoulement", s.conditions.flow)}
          ${attrRow("Pression", s.conditions.pressure)}
          ${attrRow("Capteurs et mesures", s.diagnostics)}
          ${attrRow("Variables testées", s.variables.varied)}
          ${attrRow("Paramètres constants", s.variables.held)}
        </tbody></table>
        <p class="small">Couverture des attributs : ${r.coverage.filled.length} sur ${COVERAGE_FIELDS.length}. Les lignes manquantes sont la feuille de route d'extraction, pas une estimation.</p>
      </div>
      <div>
        <h4>Décomposition du score</h4>
        ${scoreBreakdown(r.parts)}
        <p class="small">Les notes sur 5 sont des appréciations qualitatives saisies dans ce prototype, pas des mesures PSI.</p>
        ${hw ? `<h4>Matériel</h4><p class="small"><b>${esc(hw.label)}</b><br>${esc(hw.host)}${hw.note ? "<br>" + esc(hw.note) : ""} ${srcTag(hw.src)}</p>` : ""}
        <div class="btnrow">
          <button class="btn secondary" data-cmp="${s.id}">${state.compare.has(s.id) ? "Retirer du comparateur" : "Ajouter au comparateur"}</button>
          <a class="btn secondary" href="${SOURCES.psi.url}" target="_blank" rel="noopener">Ouvrir PSI</a>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------- Comparateur ---------- */
function renderCompare() {
  const items = STUDIES.filter(s => state.compare.has(s.id));
  $("mCompared").textContent = items.length;
  if (!items.length) { $("compare").innerHTML = `<p class="small">Ouvre une investigation et ajoute-la au comparateur. Trois au maximum.</p>`; return; }
  const rows = [
    ["Score", s => scoreStudy(s, state.env, state.objective, state.priority).score + "/100"],
    ["Nom complet", s => s.long],
    ["Projet", s => s.project || "—"],
    ["Plateforme", s => s.platform || "—"],
    ["Matériel", s => s.hardware && HARDWARE[s.hardware] ? HARDWARE[s.hardware].label : "—"],
    ["Piliers", s => s.pillars.map(p => OBJECTIVES[p].label).join(", ")],
    ["Combustible", s => s.fuels.state ? s.fuels.state.v : "non renseigné"],
    ["Concentration O₂", s => s.conditions.o2 ? s.conditions.o2.v : "non renseigné"],
    ["Écoulement", s => s.conditions.flow ? s.conditions.flow.v : "non renseigné"],
    ["Variables testées", s => s.variables.varied ? s.variables.varied.v : "non renseigné"],
    ["Couverture", s => coverage(s).pct + " %"]
  ];
  $("compare").innerHTML = `<div class="tablewrap"><table>
    <thead><tr><th>Critère</th>${items.map(s => `<th>${esc(s.name)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([lab, fn]) => `<tr><th>${esc(lab)}</th>${items.map(s => `<td>${esc(String(fn(s)))}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

/* ---------- Matériel partagé ---------- */
function renderHardware() {
  const groups = Object.values(HARDWARE).map(h => ({ h, studies: STUDIES.filter(s => s.hardware === h.id) })).filter(g => g.studies.length);
  const orphans = STUDIES.filter(s => !s.hardware);
  $("hardware").innerHTML = groups.map(g => `
    <div class="hw">
      <h4>${esc(g.h.label)}</h4>
      <p class="small">${esc(g.h.host)}${g.h.note ? " — " + esc(g.h.note) : ""} ${srcTag(g.h.src)}</p>
      <div class="hw-list">${g.studies.map(s => `<span class="pill">${esc(s.name)}</span>`).join("")}</div>
    </div>`).join("") +
    (orphans.length ? `<div class="hw"><h4>Matériel non identifié dans les sources de ce défi</h4>
      <div class="hw-list">${orphans.map(s => `<span class="pill muted">${esc(s.name)}</span>`).join("")}</div></div>` : "");
}

/* ---------- Incidents ---------- */
function renderIncidents() {
  $("incidents").innerHTML = INCIDENTS.map(i => `
    <li class="inc inc-${i.severity}">
      <span class="inc-year">${esc(i.year)}</span>
      <div>
        <h4>${esc(i.title)} <span class="chip chip-${i.pillar}">${esc(OBJECTIVES[i.pillar].label)}</span></h4>
        <p>${esc(i.text)}</p>
        <p class="lesson">${esc(i.lesson)} ${srcTag(i.src)}</p>
      </div>
    </li>`).join("");
}

/* ---------- Retombées terrestres ---------- */
function renderEarth() {
  $("earth").innerHTML = EARTH_APPS.map(e => `
    <div class="app">
      <span class="decade">${esc(e.decade)}</span>
      <h4>${esc(e.title)}</h4>
      <p>${esc(e.text)}</p>
      ${e.link.length ? `<p class="small">Lien avec le corpus : ${e.link.map(id => `<span class="pill">${esc(id)}</span>`).join(" ")}</p>` : ""}
      ${srcTag(e.src)}
    </div>`).join("");
}

/* ---------- Gravité partielle ---------- */
function renderGravity() {
  $("gravityWrap").innerHTML = gravityGap();
  $("gravityNotes").innerHTML = GRAVITY_POINTS.map(p =>
    `<li><b>${esc(p.label)}</b> — ${esc(p.note)}</li>`).join("");
}

/* ---------- Recherche ---------- */
function runSearch(q) {
  const results = search(q, 6);
  if (!results.length) {
    $("searchResults").innerHTML = `<p class="small">Aucun passage du corpus ne correspond. Essaie : oxygène, gouttelette, hélium, poussière, propane, atmosphère calme, échelle, champ électrique, fausses alarmes.</p>`;
    return;
  }
  $("searchResults").innerHTML = results.map(r => {
    const d = r.doc;
    const title = d.studyId ? `${STUDIES.find(s => s.id === d.studyId).name} · ${d.label}` : d.label;
    return `<article class="hit">
      <header><h4>${esc(title)}</h4><span class="relev" title="Score BM25">${r.score.toFixed(2)}</span></header>
      <p>${esc(d.text)}</p>
      <footer>${d.src ? srcTag(d.src) : ""}<span class="terms">termes retenus : ${r.hits.map(esc).join(", ")}</span></footer>
    </article>`;
  }).join("");
}

/* ---------- Export ---------- */
function download(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = exportRows(state.env, state.objective, state.priority);
  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\r\n");
  download("flamelens-attributs.csv", "text/csv;charset=utf-8", "﻿" + csv);
}

function exportJson() {
  const payload = {
    generated: new Date().toISOString(),
    scenario: { environment: ENVIRONMENTS[state.env].label, objective: OBJECTIVES[state.objective].full, priority: PRIORITIES[state.priority].label },
    disclaimer: "Notes de pertinence qualitatives saisies dans le prototype. Les champs marques a_extraire_de_PSI ne sont pas renseignes par les sources de ce defi.",
    coverage: corpusCoverage(),
    investigations: rank(state.env, state.objective, state.priority).map(r => ({
      id: r.study.id, name: r.study.name, long: r.study.long, project: r.study.project,
      platform: r.study.platform, hardware: r.study.hardware, pillars: r.study.pillars,
      relevance: r.score, breakdown: r.parts.map(p => ({ criterion: p.label, raw: p.raw, weight: p.weight })),
      attributes: COVERAGE_FIELDS.map(([path, label]) => {
        const f = getPath(r.study, path);
        return { attribute: label, value: f ? f.v : null, source: f ? f.src : null, status: f ? "renseigne" : "a_extraire_de_PSI" };
      })
    }))
  };
  download("flamelens-dataset.json", "application/json", JSON.stringify(payload, null, 2));
}

/* ---------- Sources ---------- */
function renderSources() {
  $("sources").innerHTML = Object.values(SOURCES).filter(s => s.url).map(s =>
    `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join("");
}

/* ---------- Démo guidée ---------- */
const TOUR = [
  { env: "station", objective: "detection", priority: "balanced", say: "Cabine à l'air : la détection s'appuie d'abord sur SAME, et DAFT règle la question des poussières." },
  { env: "moon_base", objective: "prevention", priority: "atmos", say: "Base lunaire : la concentration grimpe de plus de 40 % alors que la pression partielle reste proche du niveau de la mer." },
  { env: "suit", objective: "prevention", priority: "atmos", say: "Combinaison : 100 % d'oxygène. CFI-G devient le seul ancrage expérimental, et il s'arrête à 85 %." },
  { env: "mars", objective: "modeling", priority: "direct", say: "Mars : atmosphère non spécifiée et aucune donnée en gravité partielle. Le moteur le dit au lieu de combler." }
];
let tourStep = -1;
function tour() {
  tourStep = (tourStep + 1) % TOUR.length;
  const t = TOUR[tourStep];
  state.env = t.env; state.objective = t.objective; state.priority = t.priority; state.open = null;
  buildControls(); renderAll();
  $("tourSay").textContent = t.say;
  $("tourSay").hidden = false;
  $("tourBtn").textContent = `Étape suivante (${tourStep + 2 > TOUR.length ? 1 : tourStep + 2}/${TOUR.length})`;
}

/* ---------- Boucle ---------- */
function renderAll() { renderScenario(); renderRanking(); renderCompare(); }

function init() {
  $("flames").innerHTML = flameComparison();
  buildControls();
  renderAll(); renderHardware(); renderIncidents(); renderEarth(); renderGravity(); renderSources();
  ["env", "objective", "priority"].forEach(id => $(id).addEventListener("change", e => {
    state[id === "env" ? "env" : id] = e.target.value;
    state.open = null; renderAll();
  }));
  $("searchBtn").onclick = () => runSearch($("searchInput").value);
  $("searchInput").addEventListener("keydown", e => { if (e.key === "Enter") runSearch($("searchInput").value); });
  document.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { $("searchInput").value = b.dataset.q; runSearch(b.dataset.q); });
  $("exportCsv").onclick = exportCsv;
  $("exportJson").onclick = exportJson;
  $("tourBtn").onclick = tour;
  $("clearCompare").onclick = () => { state.compare.clear(); renderRanking(); renderCompare(); };
}

document.addEventListener("DOMContentLoaded", init);
