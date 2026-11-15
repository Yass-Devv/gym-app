import React from "react";
import { SensitiveBadge, Close, clean, sensitiveHits } from "./Shell";
import { CATEGORIES, SPORTS, exPhotos, exMatches, fullEx } from "../data/exercises";
import MuscleMap from "./MuscleMap";

// ─── Morceaux partagés entre le catalogue et les séances ─────────────────────

// ─── Exercices recommandés ───────────────────────────────────────────────────
// Sélection faite pour la personne à partir de son profil : niveau, objectif, activités, zones sensibles.
const STRENGTH = ["Jambes", "Dos", "Poitrine", "Épaules", "Bras", "Fessiers"];
const LEVEL_OF = { debutant: 0, intermediaire: 1, avance: 2 };
const DIFF_OF  = { "Débutant": 0, "Intermédiaire": 1, "Avancé": 2 };
// Catégories favorisées par chaque objectif
const GOAL_CATS = {
  "perte-poids":  { Cardio: 3, Jambes: 1, Fessiers: 1, Abdos: 1 },
  "prise-muscle": { Jambes: 3, Dos: 3, Poitrine: 3, "Épaules": 3, Bras: 3, Fessiers: 2 },
  forme:          { "Mobilité": 2, Abdos: 2, Cardio: 1, Jambes: 1, Dos: 1 },
  endurance:      { Cardio: 3, Abdos: 1, Jambes: 1 },
};
const RECO_MAX = 60;

export const hasReco = (user) => Boolean(user?.goal || user?.level || user?.activities?.length);

export function recommendedFor(list, user) {
  const level = LEVEL_OF[user?.level] ?? 1;
  const acts  = user?.activities || [];
  const cats  = GOAL_CATS[user?.goal] || {};
  const scored = [];
  list.forEach((e, i) => {
    const diff = DIFF_OF[e.diff] ?? 0;
    // On écarte ce qui dépasse le niveau et ce qui sollicite une zone sensible
    if (diff > level || sensitiveHits(e, user).length > 0) return;
    let score = (cats[e.cat] || 0) + (diff === level ? 2 : 1);
    if ((e.sports || []).some((s) => acts.includes(s))) score += 3;
    if (acts.includes("musculation") && STRENGTH.includes(e.cat)) score += 2;
    if (acts.includes("cardio") && e.cat === "Cardio") score += 2;
    if (user?.gender === "femme" && e.f) score += 1;
    if (exPhotos(e)) score += 1; // à valeur égale, un exercice illustré passe devant
    scored.push({ e, i, score });
  });
  // Les mieux notés d'abord ; à égalité, l'ordre du catalogue
  return scored.sort((a, b) => b.score - a.score || a.i - b.i).slice(0, RECO_MAX).map((x) => x.e);
}

// Pastilles de filtre : « Tout », « Recommandé », les sports que la personne pratique (mis en avant), les catégories, puis les autres sports
export const chipsFor = (user) => {
  const sport = (mine) => (s) => ({ id: "sport:" + s.id, label: s.label, sport: true, mine });
  const practiced = (s) => (user?.activities || []).includes(s.id);
  return [
    { id: "Tous", label: "Tout" },
    ...(hasReco(user) ? [{ id: "reco", label: "Recommandé", reco: true }] : []),
    ...SPORTS.filter(practiced).map(sport(true)),
    ...CATEGORIES.map((c) => ({ id: c, label: c })),
    ...SPORTS.filter((s) => !practiced(s)).map(sport(false)),
  ];
};

// Exercices d'une pastille. Pour un sport, ceux qui lui sont propres (sans équivalent ailleurs) passent en premier.
export function filterEx(list, chip, search, user) {
  if (chip === "reco") return recommendedFor(list, user).filter((e) => exMatches(e, search));
  const sport = chip.startsWith("sport:") ? chip.slice(6) : null;
  const hits = list.filter((e) =>
    (chip === "Tous" || (sport ? (e.sports || []).includes(sport) : e.cat === chip)) && exMatches(e, search));
  return sport ? [...hits.filter((e) => e.id.startsWith("s-")), ...hits.filter((e) => !e.id.startsWith("s-"))] : hits;
}

export function ExChips({ user, value, onChange }) {
  return (
    <div className="chips" role="tablist" aria-label="Catégories">
      {chipsFor(user).map((c) => (
        <button type="button" key={c.id} role="tab" aria-selected={value === c.id}
          className={(value === c.id ? "on" : "") + (c.sport ? " sport" : "") + (c.mine ? " mine" : "") + (c.reco ? " reco" : "")} onClick={() => onChange(c.id)}>{c.label}</button>
      ))}
    </div>
  );
}

// Fiche d'un exercice : démonstration, consigne, muscles, bienfaits
export function ExInfo({ ex: given, user }) {
  const ex = fullEx(given);
  const photos = exPhotos(ex);
  return (
    <>
      {/* Les deux photos (départ, arrivée) s'enchaînent pour montrer le mouvement */}
      {photos && (
        <div className="ex-photo demo" role="img" aria-label={`${ex.name} : position de départ puis d'arrivée`}>
          <img className="ph" src={photos[0]} alt="" />
          {photos[1] && <img className="ph" src={photos[1]} alt="" onError={(e) => e.currentTarget.remove()} />}
        </div>
      )}
      <SensitiveBadge ex={ex} user={user} full />
      {ex.desc && <p className="ex-desc">{clean(ex.desc)}</p>}
      <MuscleMap ex={ex} />
      <div className="ex-split">
        <div>
          <h4>Muscles ciblés</h4>
          <ul>{(ex.muscles || []).map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
        {ex.benefits && (
          <div>
            <h4>Bienfaits</h4>
            <ul>{ex.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        )}
      </div>
      <p className="mono dim" style={{ marginBottom: 14 }}>
        {[ex.diff, ex.equip, `Environ ${String(ex.calPerRep).replace(".", ",")} kcal par répétition`].filter(Boolean).join(" · ")}
      </p>
    </>
  );
}

// La même fiche dans une fenêtre, ouverte depuis une séance
export function ExSheet({ ex, user, onClose }) {
  return (
    <div className="sheet-bg top" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={ex.name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sec" style={{ margin: 0 }}>
            <span className="mono acc">{ex.cat}</span>
            <Close onClick={onClose} />
          </div>
          <h3 className="disp" style={{ margin: "2px 0 12px" }}>{ex.name}</h3>
        </div>
        <div className="sheet-scroll"><ExInfo ex={ex} user={user} /></div>
      </div>
    </div>
  );
}
