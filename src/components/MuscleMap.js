import React from "react";
import Model from "react-body-highlighter";

// ─── Carte des muscles travaillés ────────────────────────────────────────────
// Silhouette de face et de dos (bibliothèque libre react-body-highlighter, licence MIT).
// Le muscle principal est en couleur pleine, les muscles secondaires en teinte plus légère.

// Mots-clés (sans accents) → muscles de la silhouette
const KEYWORDS = [
  ["quadri",        ["quadriceps"]],
  ["vmo",           ["quadriceps"]],
  ["rotule",        ["quadriceps"]],
  ["ischio",        ["hamstring"]],
  ["fessiers moy",  ["abductors", "gluteal"]],
  ["fessier",       ["gluteal"]],
  ["abducteur",     ["abductors"]],
  ["hanche",        ["abductors"]],
  ["hip flexor",    ["quadriceps", "abs"]],
  ["adducteur",     ["adductor"]],
  ["mollet",        ["calves"]],
  ["gastrocn",      ["calves"]],
  ["soleaire",      ["calves"]],
  ["cheville",      ["calves"]],
  ["pector",        ["chest"]],
  ["tricep",        ["triceps"]],
  ["bicep",         ["biceps"]],
  ["brachioradial", ["forearm"]],
  ["brachial",      ["biceps"]],
  ["avant-bras",    ["forearm"]],
  ["prise",         ["forearm"]],
  ["deltoides post", ["back-deltoids"]],
  ["deltoide ant",  ["front-deltoids"]],
  ["deltoides ant", ["front-deltoids"]],
  ["epaules ant",   ["front-deltoids"]],
  ["delto",         ["front-deltoids", "back-deltoids"]],
  ["epaule",        ["front-deltoids", "back-deltoids"]],
  ["trap",          ["trapezius"]],
  ["grand dorsal",  ["upper-back"]],
  ["dorsal",        ["upper-back"]],
  ["rhombo",        ["upper-back"]],
  ["serrat",        ["upper-back"]],
  ["erecteur",      ["lower-back"]],
  ["colonne",       ["lower-back"]],
  ["lombaire",      ["lower-back"]],
  ["dos",           ["upper-back", "lower-back"]],
  ["oblique",       ["obliques"]],
  ["taille",        ["obliques"]],
  ["abdo",          ["abs"]],
  ["core",          ["abs", "obliques"]],
  ["stabilisateur", ["abs"]],
  ["corps entier",  ["chest", "abs", "quadriceps", "gluteal", "upper-back", "front-deltoids"]],
  ["jambes",        ["quadriceps", "hamstring", "calves"]],
];

// Repli quand aucun nom de muscle n'est reconnu : on part des grandes zones
const ZONES = {
  legs: ["quadriceps", "hamstring", "gluteal"],
  back: ["upper-back", "lower-back"],
  chest: ["chest"],
  arms: ["biceps", "triceps"],
  shoulders: ["front-deltoids", "back-deltoids"],
  core: ["abs", "obliques"],
};

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const toMuscles = (label) => {
  const n = norm(label);
  const hit = KEYWORDS.find(([key]) => n.includes(key));
  return hit ? hit[1] : [];
};

// Le premier muscle listé pour l'exercice est le principal, les suivants sont secondaires
export function muscleLevels(ex) {
  const names = ex.muscles || [];
  let primary = names.length ? toMuscles(names[0]) : [];
  let secondary = names.slice(1).flatMap(toMuscles);

  if (primary.length === 0) {
    const fromZones = (ex.zones || []).map((z) => ZONES[z] || []);
    primary = fromZones[0] || [];
    secondary = [...secondary, ...fromZones.slice(1).flat()];
  }
  secondary = [...new Set(secondary)].filter((m) => !primary.includes(m));
  return { primary, secondary };
}

function MuscleMap({ ex }) {
  const { primary, secondary } = muscleLevels(ex);
  const data = [
    { name: "principal", muscles: primary, frequency: 2 },
    { name: "secondaire", muscles: secondary, frequency: 1 },
  ].filter((d) => d.muscles.length > 0);

  // Les couleurs suivent le thème (variables CSS lues par le SVG)
  const common = {
    data,
    bodyColor: "var(--body)",
    highlightedColors: ["var(--acc-soft)", "var(--acc)"],
    style: { width: "100%" },
  };

  return (
    <figure className="muscles">
      <div className="muscles-views" role="img"
        aria-label={`Muscles travaillés : ${(ex.muscles || []).join(", ")}`}>
        <Model {...common} type="anterior" />
        <Model {...common} type="posterior" />
      </div>
      <figcaption className="mono">
        <span><i style={{ background: "var(--acc)" }} />Principal</span>
        <span><i style={{ background: "var(--acc-soft)" }} />Secondaire</span>
      </figcaption>
    </figure>
  );
}

export default MuscleMap;
