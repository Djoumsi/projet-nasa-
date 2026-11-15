"use strict";
/* FlameLens — visualisations.
   Tout est en SVG inline, sans dépendance. Aucune valeur tracée n'est inventée :
   chaque point provient des chiffres de l'énoncé, et ce qui n'est pas spécifié
   est dessiné comme non spécifié (trait discontinu, zone vide, annotation). */

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- 1. La flamme : 1 g contre microgravité ---------- */
function flameComparison() {
  return `
<figure class="flames">
  <div class="flame-cell">
    <svg viewBox="0 0 160 190" role="img" aria-label="Flamme de bougie en gravité terrestre : forme de larme allongée vers le haut">
      <defs><radialGradient id="g1g" cx="50%" cy="78%" r="62%">
        <stop offset="0%" stop-color="#fff6d8"/><stop offset="32%" stop-color="#ffc24a"/>
        <stop offset="70%" stop-color="#ff7b1c"/><stop offset="100%" stop-color="#b33505" stop-opacity=".15"/>
      </radialGradient></defs>
      <g class="flame-1g">
        <path d="M80 182 C44 182 36 146 48 118 C58 94 72 86 80 44 C88 86 102 94 112 118 C124 146 116 182 80 182 Z" fill="url(#g1g)"/>
        <ellipse cx="80" cy="158" rx="13" ry="20" fill="#5fc8ff" opacity=".55"/>
      </g>
      <rect x="62" y="182" width="36" height="7" rx="3" fill="#2b4663"/>
    </svg>
    <figcaption><b>1 g</b><span>La poussée d'Archimède évacue les gaz chauds vers le haut. La flamme s'allonge, vacille, et l'air frais est aspiré par le bas.</span></figcaption>
  </div>
  <div class="flame-vs" aria-hidden="true">contre</div>
  <div class="flame-cell">
    <svg viewBox="0 0 160 190" role="img" aria-label="Flamme en microgravité : sphère bleue alimentée par diffusion">
      <defs><radialGradient id="gug" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#eaf9ff"/><stop offset="38%" stop-color="#7fd9ff"/>
        <stop offset="76%" stop-color="#2f7ae0"/><stop offset="100%" stop-color="#14306b" stop-opacity=".2"/>
      </radialGradient></defs>
      <g class="flame-ug">
        <circle class="diffuse d1" cx="80" cy="112" r="46" fill="none" stroke="#6fd4ff" stroke-opacity=".28"/>
        <circle class="diffuse d2" cx="80" cy="112" r="46" fill="none" stroke="#6fd4ff" stroke-opacity=".2"/>
        <circle cx="80" cy="112" r="34" fill="url(#gug)"/>
      </g>
      <rect x="62" y="182" width="36" height="7" rx="3" fill="#2b4663"/>
    </svg>
    <figcaption><b>Microgravité</b><span>Sans convection, l'oxygène n'arrive plus que par diffusion. La flamme devient une sphère bleue, plus froide, plus lente — et plus difficile à éteindre.</span></figcaption>
  </div>
</figure>`;
}

/* ---------- 2. Carte inflammabilité : concentration O₂ x pression ---------- */
const MAP = { x0: 64, x1: 534, y0: 28, y1: 300, psiMax: 16 };
const mx = (o2) => MAP.x0 + (o2 / 100) * (MAP.x1 - MAP.x0);
const my = (psi) => MAP.y1 - (psi / MAP.psiMax) * (MAP.y1 - MAP.y0);

function flammabilityMap(activeAtmosId) {
  const ppEarth = (EARTH_O2 / 100) * EARTH_PSI;
  let iso = "";
  for (let o2 = Math.ceil((ppEarth / MAP.psiMax) * 100); o2 <= 100; o2 += 1) {
    const psi = (ppEarth / (o2 / 100));
    iso += `${iso ? "L" : "M"}${mx(o2).toFixed(1)} ${my(psi).toFixed(1)} `;
  }
  const pts = [
    { a: ATMOS.earth, cls: "pt-earth" },
    { a: ATMOS.moon, cls: "pt-moon" },
    { a: ATMOS.suit, cls: "pt-suit" }
  ];
  const xticks = [0, 20, 40, 60, 80, 100].map(t =>
    `<line x1="${mx(t)}" y1="${MAP.y1}" x2="${mx(t)}" y2="${MAP.y1 + 5}" stroke="#55708d"/><text x="${mx(t)}" y="${MAP.y1 + 19}" text-anchor="middle">${t} %</text>`).join("");
  const yticks = [0, 4, 8, 12, 16].map(t =>
    `<line x1="${MAP.x0 - 5}" y1="${my(t)}" x2="${MAP.x1}" y2="${my(t)}" stroke="#2a4058" stroke-dasharray="2 4"/><text x="${MAP.x0 - 10}" y="${my(t) + 4}" text-anchor="end">${t}</text>`).join("");

  return `
<svg class="chart" viewBox="0 0 570 348" role="img"
  aria-label="Carte des atmosphères : concentration en oxygène en abscisse, pression totale en ordonnée, avec la courbe d'iso-pression partielle d'oxygène du niveau de la mer">
  ${yticks}${xticks}
  <rect x="${mx(30)}" y="${MAP.y0}" width="${mx(100) - mx(30)}" height="${my(0) - MAP.y0}" fill="#ffb45c" opacity=".055"/>
  <rect x="${mx(30)}" y="${my(10.2)}" width="${mx(100) - mx(30)}" height="${my(0) - my(10.2)}" fill="#ffb45c" opacity=".10"/>
  <text x="${mx(31)}" y="${my(9.2)}" class="zone">Enveloppe d'exploration : ≥ 30 % O₂, ≤ 10,2 psi</text>
  <path d="${iso}" fill="none" stroke="#64e0e5" stroke-width="1.6" stroke-dasharray="6 4"/>
  <text x="${mx(63)}" y="${my(5.6)}" class="iso">Iso-pression partielle d'O₂ du niveau de la mer (${ppEarth.toFixed(2)} psi)</text>
  <line x1="${mx(85)}" y1="${MAP.y0}" x2="${mx(85)}" y2="${MAP.y1}" stroke="#ff8585" stroke-width="1.3" stroke-dasharray="4 4"/>
  <text x="${mx(85) - 8}" y="${MAP.y0 + 12}" text-anchor="end" class="zone r">Essais CFI-G : jusqu'à 85 % O₂</text>
  ${pts.map(p => {
    const on = activeAtmosId === p.a.id;
    return `<g class="pt ${p.cls} ${on ? "on" : ""}">
      <circle cx="${mx(p.a.o2)}" cy="${my(p.a.psi)}" r="${on ? 9 : 6}"/>
      <text x="${mx(p.a.o2) + (p.a.o2 > 70 ? -12 : 13)}" y="${my(p.a.psi) + 4}" text-anchor="${p.a.o2 > 70 ? "end" : "start"}">${esc(p.a.label)}</text>
    </g>`;
  }).join("")}
  <line x1="${MAP.x0}" y1="${MAP.y1}" x2="${MAP.x1}" y2="${MAP.y1}" stroke="#55708d"/>
  <line x1="${MAP.x0}" y1="${MAP.y0}" x2="${MAP.x0}" y2="${MAP.y1}" stroke="#55708d"/>
  <text x="${MAP.x0}" y="${MAP.y1 + 38}" class="axis">Concentration en oxygène →</text>
  <text x="14" y="${MAP.y0 - 10}" class="axis">Pression totale (psi)</text>
</svg>
<p class="small">Apollo 1 se situerait à l'extrême droite de cette carte — cabine remplie d'oxygène pur — mais la pression de l'essai avant lancement n'est pas donnée par les sources de ce défi, le point n'est donc pas tracé.</p>`;
}

/* ---------- 3. Le trou de données en gravité partielle ---------- */
function gravityGap() {
  const gx = (g) => 70 + g * 450;
  const base = 118;
  return `
<svg class="chart" viewBox="0 0 570 196" role="img"
  aria-label="Disponibilité des données de combustion selon le niveau de gravité : données en microgravité et en gravité terrestre, aucune donnée en gravité lunaire ou martienne">
  <rect x="${gx(0.045)}" y="${base - 56}" width="${gx(0.5) - gx(0.045)}" height="56" fill="url(#hatch)"/>
  <defs><pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="7" stroke="#ff8585" stroke-opacity=".32" stroke-width="2"/></pattern></defs>
  <rect x="${gx(0) - 16}" y="${base - 56}" width="32" height="56" rx="4" fill="#64e0e5" opacity=".75"/>
  <rect x="${gx(1) - 16}" y="${base - 56}" width="32" height="56" rx="4" fill="#64e0e5" opacity=".75"/>
  <line x1="${gx(0)}" y1="${base}" x2="${gx(1)}" y2="${base}" stroke="#55708d"/>
  ${GRAVITY_POINTS.map(p => `
    <g class="gp ${p.data}">
      <line x1="${gx(p.g)}" y1="${base}" x2="${gx(p.g)}" y2="${base + 7}" stroke="#55708d"/>
      <text x="${gx(p.g)}" y="${base + 23}" text-anchor="middle">${esc(p.label)}</text>
      <text x="${gx(p.g)}" y="${base + 38}" text-anchor="middle" class="gsub">${p.data === "available" ? "données" : "aucune donnée"}</text>
    </g>`).join("")}
  <text x="${gx(0.27)}" y="${base - 66}" text-anchor="middle" class="zone r">Lune et Mars : zone non mesurée</text>
  <text x="${gx(0.27)}" y="${base - 26}" text-anchor="middle" class="gsub">µg et 1 g encadrent cet intervalle</text>
</svg>`;
}

/* ---------- 4. Barre de couverture ---------- */
function coverageBar(pct, small) {
  return `<div class="cov ${small ? "cov-s" : ""}" role="img" aria-label="Couverture des attributs : ${pct} pour cent">
    <i style="width:${pct}%"></i><span>${pct} %</span></div>`;
}

/* ---------- 5. Décomposition d'un score ---------- */
function scoreBreakdown(parts) {
  return `<div class="brk">${parts.map(p => `
    <div class="brk-row">
      <span class="brk-lab">${esc(p.label)}</span>
      <span class="brk-bar"><i style="width:${(p.raw / 5) * 100}%"></i></span>
      <span class="brk-num">${p.raw}/5 × ${(p.weight * 100).toFixed(0)} % = ${p.points.toFixed(1)}</span>
    </div>`).join("")}</div>`;
}
