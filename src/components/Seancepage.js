import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Logo, SensitiveBadge, catPhoto, plural, unitLabel } from "./Shell";

const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const todayName = () => JOURS[(new Date().getDay() + 6) % 7];

// ─── EXERCISES DATA (importée inline pour éviter les dépendances circulaires) ─
const EXERCISES_HOMME = [
  { id:"h1",  name:"Squat barre",           cat:"Jambes",    emoji:"🏋️", calPerRep:0.35, muscles:["Quadriceps","Fessiers"], zones:["legs"] },
  { id:"h2",  name:"Soulevé de terre",       cat:"Dos",       emoji:"🏗️", calPerRep:0.45, muscles:["Dos","Fessiers"], zones:["back","legs"] },
  { id:"h3",  name:"Développé couché",       cat:"Poitrine",  emoji:"💪", calPerRep:0.32, muscles:["Pectoraux","Triceps"], zones:["chest","arms"] },
  { id:"h4",  name:"Traction pronation",     cat:"Dos",       emoji:"🔝", calPerRep:0.38, muscles:["Grand dorsal","Biceps"], zones:["back","arms"] },
  { id:"h5",  name:"Développé militaire",    cat:"Épaules",   emoji:"🎯", calPerRep:0.30, muscles:["Deltoïdes","Triceps"], zones:["shoulders","arms"] },
  { id:"h6",  name:"Squat avant",            cat:"Jambes",    emoji:"🦵", calPerRep:0.34, muscles:["Quadriceps","Core"], zones:["legs","core"] },
  { id:"h7",  name:"Rowing barre",           cat:"Dos",       emoji:"🚣", calPerRep:0.28, muscles:["Grand dorsal","Biceps"], zones:["back","arms"] },
  { id:"h8",  name:"Dips lestés",            cat:"Poitrine",  emoji:"⬇️", calPerRep:0.32, muscles:["Pectoraux","Triceps"], zones:["chest","arms"] },
  { id:"h9",  name:"Curl barre",             cat:"Bras",      emoji:"💪", calPerRep:0.20, muscles:["Biceps"], zones:["arms"] },
  { id:"h10", name:"Extension triceps",      cat:"Bras",      emoji:"📏", calPerRep:0.18, muscles:["Triceps"], zones:["arms"] },
  { id:"h11", name:"Leg press",              cat:"Jambes",    emoji:"🦿", calPerRep:0.28, muscles:["Quadriceps","Fessiers"], zones:["legs"] },
  { id:"h12", name:"Hack squat",             cat:"Jambes",    emoji:"⚙️", calPerRep:0.30, muscles:["Quadriceps"], zones:["legs"] },
  { id:"h13", name:"Burpees",                cat:"Cardio",    emoji:"🔥", calPerRep:0.50, muscles:["Corps entier"], zones:["legs","chest","core"] },
  { id:"h14", name:"Pompes diamant",         cat:"Bras",      emoji:"💎", calPerRep:0.25, muscles:["Triceps","Pectoraux"], zones:["arms","chest"] },
  { id:"h15", name:"Arnold press",           cat:"Épaules",   emoji:"🌀", calPerRep:0.26, muscles:["Deltoïdes"], zones:["shoulders","arms"] },
  { id:"h16", name:"Face pull",              cat:"Épaules",   emoji:"🎗️", calPerRep:0.16, muscles:["Deltoïdes post."], zones:["shoulders","back"] },
  { id:"h17", name:"Planche",                cat:"Abdos",     emoji:"⚡", calPerRep:0.15, muscles:["Core"], zones:["core"] },
  { id:"h18", name:"Crunch câble",           cat:"Abdos",     emoji:"🔄", calPerRep:0.14, muscles:["Abdominaux"], zones:["core"] },
  { id:"h19", name:"Box jump",               cat:"Cardio",    emoji:"📦", calPerRep:0.42, muscles:["Quadriceps","Fessiers"], zones:["legs"] },
  { id:"h20", name:"Kettlebell swing",       cat:"Cardio",    emoji:"🔔", calPerRep:0.28, muscles:["Fessiers","Core"], zones:["legs","core"] },
  { id:"h21", name:"Rowing haltère",         cat:"Dos",       emoji:"🚣", calPerRep:0.27, muscles:["Grand dorsal"], zones:["back","arms"] },
  { id:"h22", name:"Leg curl",               cat:"Jambes",    emoji:"🦵", calPerRep:0.22, muscles:["Ischio-jambiers"], zones:["legs"] },
  { id:"h23", name:"Extension quadriceps",   cat:"Jambes",    emoji:"🦿", calPerRep:0.20, muscles:["Quadriceps"], zones:["legs"] },
  { id:"h24", name:"Shrugs haltères",        cat:"Épaules",   emoji:"🤷", calPerRep:0.18, muscles:["Trapèze"], zones:["shoulders"] },
  { id:"h25", name:"Dumbbell fly",           cat:"Poitrine",  emoji:"🦅", calPerRep:0.24, muscles:["Pectoraux"], zones:["chest"] },
  { id:"h26", name:"Corde à sauter",         cat:"Cardio",    emoji:"🪢", calPerRep:0.12, muscles:["Mollets"], zones:["legs"] },
  { id:"h27", name:"Hollow body",            cat:"Abdos",     emoji:"🛸", calPerRep:0.20, muscles:["Core"], zones:["core"] },
  { id:"h28", name:"Leg raise suspendu",     cat:"Abdos",     emoji:"🔼", calPerRep:0.22, muscles:["Abdominaux bas"], zones:["core"] },
  { id:"h29", name:"Incliné développé",      cat:"Poitrine",  emoji:"📐", calPerRep:0.30, muscles:["Pectoraux sup."], zones:["chest","arms"] },
  { id:"h30", name:"Decline développé",      cat:"Poitrine",  emoji:"📉", calPerRep:0.30, muscles:["Pectoraux inf."], zones:["chest","arms"] },
  { id:"h31", name:"Bulgarian squat",        cat:"Jambes",    emoji:"🇧🇬", calPerRep:0.32, muscles:["Quadriceps","Fessiers"], zones:["legs"] },
  { id:"h32", name:"Good morning",           cat:"Dos",       emoji:"🌅", calPerRep:0.25, muscles:["Ischio-jambiers","Dos"], zones:["back","legs"] },
  { id:"h33", name:"Dips triceps banc",      cat:"Bras",      emoji:"🪑", calPerRep:0.22, muscles:["Triceps"], zones:["arms"] },
  { id:"h34", name:"Curl concentré",         cat:"Bras",      emoji:"🎯", calPerRep:0.17, muscles:["Biceps"], zones:["arms"] },
  { id:"h35", name:"Mountain climbers",      cat:"Cardio",    emoji:"🧗", calPerRep:0.22, muscles:["Core","Jambes"], zones:["core","legs"] },
  { id:"h36", name:"Tirage vertical",        cat:"Dos",       emoji:"⬇️", calPerRep:0.25, muscles:["Grand dorsal"], zones:["back","arms"] },
  { id:"h37", name:"Peck deck",              cat:"Poitrine",  emoji:"🦁", calPerRep:0.20, muscles:["Pectoraux"], zones:["chest"] },
  { id:"h38", name:"Élévations latérales",   cat:"Épaules",   emoji:"✈️", calPerRep:0.16, muscles:["Deltoïdes lat."], zones:["shoulders"] },
  { id:"h39", name:"Sprint intervalles",     cat:"Cardio",    emoji:"🏃", calPerRep:0.60, muscles:["Jambes","Core"], zones:["legs","core"] },
  { id:"h40", name:"Farmer walk",            cat:"Cardio",    emoji:"👨‍🌾", calPerRep:0.35, muscles:["Avant-bras","Core"], zones:["back","legs","core"] },
];

const EXERCISES_FEMME = [
  { id:"f1",  name:"Hip thrust",             cat:"Fessiers",  emoji:"🍑", calPerRep:0.28, muscles:["Fessiers"], zones:["legs"] },
  { id:"f2",  name:"Squat sumo",             cat:"Jambes",    emoji:"🦵", calPerRep:0.28, muscles:["Fessiers","Quadriceps"], zones:["legs"] },
  { id:"f3",  name:"Fente arrière",          cat:"Jambes",    emoji:"🚶", calPerRep:0.24, muscles:["Fessiers","Quadriceps"], zones:["legs"] },
  { id:"f4",  name:"Donkey kicks",           cat:"Fessiers",  emoji:"🦵", calPerRep:0.16, muscles:["Fessiers"], zones:["legs"] },
  { id:"f5",  name:"Abduction élastique",    cat:"Fessiers",  emoji:"🔴", calPerRep:0.14, muscles:["Fessiers moyens"], zones:["legs"] },
  { id:"f6",  name:"Glute bridge",           cat:"Fessiers",  emoji:"🌉", calPerRep:0.18, muscles:["Fessiers","Core"], zones:["legs","core"] },
  { id:"f7",  name:"Step-up",                cat:"Jambes",    emoji:"🪜", calPerRep:0.22, muscles:["Fessiers","Quadriceps"], zones:["legs"] },
  { id:"f8",  name:"Squat gobelet",          cat:"Jambes",    emoji:"🏆", calPerRep:0.26, muscles:["Quadriceps","Core"], zones:["legs","core"] },
  { id:"f9",  name:"Pompes genoux",          cat:"Poitrine",  emoji:"💪", calPerRep:0.20, muscles:["Pectoraux","Triceps"], zones:["chest","arms"] },
  { id:"f10", name:"Triceps banc",           cat:"Bras",      emoji:"🪑", calPerRep:0.18, muscles:["Triceps"], zones:["arms"] },
  { id:"f11", name:"Curl haltères",          cat:"Bras",      emoji:"💪", calPerRep:0.16, muscles:["Biceps"], zones:["arms"] },
  { id:"f12", name:"Planche",                cat:"Abdos",     emoji:"⚡", calPerRep:0.15, muscles:["Core"], zones:["core"] },
  { id:"f13", name:"Crunch basique",         cat:"Abdos",     emoji:"🔄", calPerRep:0.12, muscles:["Abdominaux"], zones:["core"] },
  { id:"f14", name:"Bicycle crunch",         cat:"Abdos",     emoji:"🚴", calPerRep:0.16, muscles:["Obliques"], zones:["core"] },
  { id:"f15", name:"Mountain climbers",      cat:"Cardio",    emoji:"🧗", calPerRep:0.22, muscles:["Core","Jambes"], zones:["core","legs"] },
  { id:"f16", name:"Jump rope",              cat:"Cardio",    emoji:"🪢", calPerRep:0.12, muscles:["Mollets"], zones:["legs"] },
  { id:"f17", name:"Burpees modifiés",       cat:"Cardio",    emoji:"🔥", calPerRep:0.38, muscles:["Corps entier"], zones:["legs","chest","core"] },
  { id:"f18", name:"Zumba squats",           cat:"Cardio",    emoji:"💃", calPerRep:0.20, muscles:["Jambes","Fessiers"], zones:["legs"] },
  { id:"f19", name:"Side lunge",             cat:"Jambes",    emoji:"↔️", calPerRep:0.22, muscles:["Adducteurs","Fessiers"], zones:["legs"] },
  { id:"f20", name:"Sumo deadlift",          cat:"Fessiers",  emoji:"🏋️", calPerRep:0.35, muscles:["Fessiers","Ischio-jambiers"], zones:["legs","back"] },
  { id:"f21", name:"Romanian deadlift",      cat:"Fessiers",  emoji:"🌹", calPerRep:0.32, muscles:["Ischio-jambiers","Fessiers"], zones:["legs","back"] },
  { id:"f22", name:"Élévation jambe côté",   cat:"Fessiers",  emoji:"🦵", calPerRep:0.14, muscles:["Fessiers moyens"], zones:["legs"] },
  { id:"f23", name:"Squat pulse",            cat:"Jambes",    emoji:"🔛", calPerRep:0.16, muscles:["Quadriceps","Fessiers"], zones:["legs"] },
  { id:"f24", name:"Fente marchée",          cat:"Jambes",    emoji:"🚶", calPerRep:0.26, muscles:["Fessiers","Quadriceps"], zones:["legs"] },
  { id:"f25", name:"Wall sit",               cat:"Jambes",    emoji:"🧱", calPerRep:0.18, muscles:["Quadriceps"], zones:["legs","core"] },
  { id:"f26", name:"Rowing élastique",       cat:"Dos",       emoji:"🎗️", calPerRep:0.18, muscles:["Grand dorsal"], zones:["back","arms"] },
  { id:"f27", name:"Superman",               cat:"Dos",       emoji:"🦸", calPerRep:0.14, muscles:["Érecteurs","Fessiers"], zones:["back"] },
  { id:"f28", name:"Bird dog",               cat:"Abdos",     emoji:"🐦", calPerRep:0.13, muscles:["Core"], zones:["core","back"] },
  { id:"f29", name:"Dead bug",               cat:"Abdos",     emoji:"🐞", calPerRep:0.16, muscles:["Core profond"], zones:["core"] },
  { id:"f30", name:"Pilates 100",            cat:"Abdos",     emoji:"💆", calPerRep:0.14, muscles:["Core"], zones:["core"] },
  { id:"f31", name:"Clamshell",              cat:"Fessiers",  emoji:"🐚", calPerRep:0.13, muscles:["Fessiers moyens"], zones:["legs"] },
  { id:"f32", name:"Hip circle",             cat:"Fessiers",  emoji:"⭕", calPerRep:0.15, muscles:["Fessiers","Hanches"], zones:["legs","core"] },
  { id:"f33", name:"Kick-boxing cardio",     cat:"Cardio",    emoji:"🥊", calPerRep:0.40, muscles:["Corps entier"], zones:["legs","arms","core"] },
  { id:"f34", name:"Jumping jacks",          cat:"Cardio",    emoji:"⭐", calPerRep:0.10, muscles:["Cardio"], zones:["legs"] },
  { id:"f35", name:"High knees",             cat:"Cardio",    emoji:"🦵", calPerRep:0.18, muscles:["Hip flexors"], zones:["legs","core"] },
  { id:"f36", name:"Triceps overhead",       cat:"Bras",      emoji:"☝️", calPerRep:0.16, muscles:["Triceps"], zones:["arms"] },
  { id:"f37", name:"Curl marteau",           cat:"Bras",      emoji:"🔨", calPerRep:0.16, muscles:["Biceps brachial"], zones:["arms"] },
  { id:"f38", name:"Yoga flow",              cat:"Mobilité",  emoji:"🧘", calPerRep:0.10, muscles:["Flexibilité"], zones:["core"] },
  { id:"f39", name:"Stretching fessiers",    cat:"Mobilité",  emoji:"🌸", calPerRep:0.08, muscles:["Fessiers"], zones:["legs"] },
  { id:"f40", name:"Foam roller jambes",     cat:"Mobilité",  emoji:"🟤", calPerRep:0.08, muscles:["Fascias"], zones:["legs"] },
];

const kcal = (n) => String(n).replace(".", ",");

// ─── FENÊTRE : CHOISIR DES EXERCICES ──────────────────────────────────────────
function ExercisePickerModal({ gender, user, alreadyAdded, onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");

  const allEx = gender === "femme" ? EXERCISES_FEMME : EXERCISES_HOMME;
  const cats  = ["Tous", ...new Set(allEx.map(e => e.cat))];
  const addedIds = alreadyAdded.map(it => it.ex.id);

  const filtered = allEx.filter(e =>
    (filter === "Tous" || e.cat === filter) &&
    (search === "" || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="sheet-bg top" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Ajouter des exercices" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sec" style={{ margin: 0 }}>
            <h3 className="disp">Ajouter</h3>
            <button type="button" className="link" onClick={onClose}>Fermer</button>
          </div>
          <input className="search" type="search" placeholder="Rechercher un exercice" aria-label="Rechercher un exercice"
            value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          <div className="chips">
            {cats.map(c => (
              <button type="button" key={c} className={filter === c ? "on" : ""} onClick={() => setFilter(c)}>
                {c === "Tous" ? "Tout" : c}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-scroll">
          {filtered.map(ex => {
            const isAdded = addedIds.includes(ex.id);
            return (
              <button type="button" key={ex.id} className="row" disabled={isAdded}
                onClick={() => onAdd(ex)} aria-label={isAdded ? `${ex.name}, déjà ajouté` : `Ajouter ${ex.name}`}>
                <span className="th"><img className="ph" src={catPhoto(ex.cat)} alt="" loading="lazy" /></span>
                <span><b>{ex.name}</b><span className="mono dim">{ex.cat} · {kcal(ex.calPerRep)} kcal / rép.</span><SensitiveBadge ex={ex} user={user} /></span>
                <span className={"sq" + (isAdded ? " on" : "")} aria-hidden="true">{isAdded ? "✓" : "+"}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <div className="empty">Aucun exercice ne correspond.</div>}
        </div>

        <div className="sheet-foot one">
          <button type="button" className="btn" onClick={onClose}>
            <span>Valider</span><span>{plural(alreadyAdded.length, "exercice")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FENÊTRE : CRÉER / MODIFIER UNE SÉANCE ───────────────────────────────────
function SeanceModal({ seance, gender, user, onSave, onClose }) {
  const [nom,        setNom]        = useState(seance?.nom  || "");
  const [jour,       setJour]       = useState(seance?.jour || todayName()); // nouvelle séance : jour courant
  const [exercises,  setExercises]  = useState(seance?.exercises || []);
  const [showPicker, setShowPicker] = useState(false);

  const addExercise = (ex) => {
    if (exercises.find(it => it.ex.id === ex.id)) return;
    setExercises([...exercises, { ex, sets:"3", reps:"", weight:"" }]);
  };

  const removeExercise = (id) => setExercises(exercises.filter(it => it.ex.id !== id));

  const save = () => {
    if (!nom.trim()) return;
    onSave({ ...seance, nom: nom.trim(), jour, exercises });
  };

  return (
    <>
      <div className="sheet-bg" onClick={onClose}>
        <div className="sheet" role="dialog" aria-label={seance?.id ? "Modifier la séance" : "Nouvelle séance"}
          onClick={e => e.stopPropagation()}>
          <div className="sheet-head">
            <h3 className="disp">{seance?.id ? "Modifier" : "Nouvelle séance"}</h3>
          </div>

          <div className="sheet-scroll">
            <div className="field">
              <label htmlFor="seance-nom">Nom de la séance</label>
              <input id="seance-nom" placeholder="Jambes, haut du corps…" maxLength={100}
                value={nom} onChange={e => setNom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && save()} autoFocus />
            </div>

            <span className="lbl">Jour</span>
            <div className="days">
              {JOURS.map(j => (
                <button type="button" key={j} className={jour === j ? "on" : ""} aria-pressed={jour === j}
                  aria-label={j} onClick={() => setJour(j)}>{j.slice(0, 3)}</button>
              ))}
            </div>

            <div className="sec" style={{ marginTop: 0 }}>
              <span className="mono dim">{plural(exercises.length, "exercice")}</span>
              <button type="button" className="link acc" onClick={() => setShowPicker(true)}>+ Ajouter</button>
            </div>

            {exercises.length === 0 ? (
              <div className="empty" style={{ marginTop: 6 }}>Aucun exercice. Tu pourras aussi en ajouter plus tard.</div>
            ) : exercises.map(it => (
              <div className="row" key={it.ex.id}>
                <span className="th"><img className="ph" src={catPhoto(it.ex.cat)} alt="" /></span>
                <span><b>{it.ex.name}</b><span className="mono dim">{it.ex.cat}</span><SensitiveBadge ex={it.ex} user={user} /></span>
                <button type="button" className="link dim" onClick={() => removeExercise(it.ex.id)}
                  aria-label={`Retirer ${it.ex.name}`}>Retirer</button>
              </div>
            ))}
          </div>

          <div className="sheet-foot">
            <button type="button" className="btn ghost center" onClick={onClose}>Annuler</button>
            <button type="button" className="btn" onClick={save} disabled={!nom.trim()}>
              <span>{seance?.id ? "Enregistrer" : "Créer"}</span><span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <ExercisePickerModal gender={gender} user={user} alreadyAdded={exercises}
          onAdd={addExercise} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}

// ─── DÉTAIL D'UNE SÉANCE ──────────────────────────────────────────────────────
function SeanceDetail({ seance, user, gender, onBack, onUpdate }) {
  const [unit,       setUnit]       = useState(user?.unit || "kg"); // unité choisie dans les réglages
  const [toast,      setToast]      = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const items = seance.exercises || [];

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const updateItems = (newItems) => onUpdate({ ...seance, exercises: newItems });

  const changeField = (idx, field, val) =>
    updateItems(items.map((it, i) => i === idx ? { ...it, [field]: val } : it));

  const remove = (idx) => updateItems(items.filter((_, i) => i !== idx));

  const addExercise = (ex) => {
    if (items.find(it => it.ex.id === ex.id)) return;
    updateItems([...items, { ex, sets:"3", reps:"", weight:"" }]);
  };

  const calcCal = (it) => {
    const reps   = parseInt(it.reps)     || 0;
    const sets   = parseInt(it.sets)     || 1;
    const weight = parseFloat(it.weight) || 0;
    const w = unit === "lbs" ? weight * 0.453592 : weight;
    return Math.round((it.ex.calPerRep + w * 0.005) * reps * sets);
  };

  const totalCals = items.reduce((sum, it) => sum + calcCal(it), 0);

  const finish = async () => {
    if (!user) return showToast("Connecte-toi d'abord.");
    if (items.length === 0) return showToast("Ajoute des exercices d'abord.");
    if (saving) return;

    setSaving(true);
    try {
      await api.saveWorkout({
        seanceName: seance.nom,
        exercises: items.map(it => ({
          name: it.ex.name, sets: parseInt(it.sets)||1,
          reps: parseInt(it.reps)||0, weight: parseFloat(it.weight)||0,
          unit, calories: calcCal(it),
        })),
        totalCal: totalCals,
      });
      showToast(`Séance enregistrée : ${totalCals} kcal.`);
    } catch (err) {
      showToast(err.status ? err.message : "Serveur injoignable.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen with-tabs">
      <div className="cover">
        <img className="ph" src={catPhoto(items[0]?.ex.cat)} alt="" />
        <header className="bar">
          <button type="button" className="link" onClick={onBack}>← Séances</button>
          <div className="unit" role="group" aria-label="Unité de poids">
            {["kg","lbs"].map(u => (
              <button type="button" key={u} className={unit === u ? "on" : ""} aria-pressed={unit === u}
                onClick={() => setUnit(u)}>{unitLabel(u)}</button>
            ))}
          </div>
        </header>
      </div>

      <div className="pad">
        <div className="lift">
          <span className="mono acc">{seance.jour}</span>
          <h1 className="disp h1" style={{ margin: "4px 0 6px" }}>{seance.nom}</h1>
        </div>
        <div className="sec" style={{ margin: "0 0 14px" }}>
          <span className="mono dim">{plural(items.length, "exercice")}</span>
          <button type="button" className="link acc" onClick={() => setShowPicker(true)}>+ Ajouter</button>
        </div>

        {items.length === 0 ? (
          <div className="empty"><b className="disp">Séance vide</b>Ajoute tes premiers exercices.</div>
        ) : (
          <>
            {items.map((it, idx) => (
              <div className="block" key={it.ex.id}>
                <div className="block-head">
                  <div>
                    <span className="mono dim">{String(idx + 1).padStart(2, "0")} · {it.ex.cat}</span>
                    <span className="title" style={{ fontSize: 21, marginTop: 2 }}>{it.ex.name}</span>
                    <SensitiveBadge ex={it.ex} user={user} />
                  </div>
                  <button type="button" className="link dim" onClick={() => remove(idx)}
                    aria-label={`Retirer ${it.ex.name}`}>Retirer</button>
                </div>
                <div className="grid3">
                  <div>
                    <label htmlFor={`sets-${idx}`}>Séries</label>
                    <input id={`sets-${idx}`} className="num" type="number" inputMode="numeric" min="1" max="20"
                      value={it.sets||""} placeholder="3" onChange={e => changeField(idx,"sets",e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor={`reps-${idx}`}>Reps</label>
                    <input id={`reps-${idx}`} className="num" type="number" inputMode="numeric" min="1" max="200"
                      value={it.reps||""} placeholder="12" onChange={e => changeField(idx,"reps",e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor={`weight-${idx}`}>Poids ({unitLabel(unit)})</label>
                    <input id={`weight-${idx}`} className="num" type="number" inputMode="decimal" min="0" step="0.5"
                      value={it.weight||""} placeholder="0" onChange={e => changeField(idx,"weight",e.target.value)} />
                  </div>
                </div>
                <div className="mono dim" style={{ marginTop: 8, textAlign: "right" }}>≈ {calcCal(it)} kcal</div>
              </div>
            ))}

            <div className="total">
              <span className="mono dim">Total estimé</span>
              <span className="disp">{totalCals} <span className="mono dim">kcal</span></span>
            </div>
            <button type="button" className="btn" onClick={finish} disabled={saving}>
              {saving
                ? <span className="spin" aria-label="Enregistrement" />
                : <><span>Terminer la séance</span><span aria-hidden="true">✓</span></>}
            </button>
          </>
        )}
      </div>

      {showPicker && (
        <ExercisePickerModal gender={gender} user={user} alreadyAdded={items}
          onAdd={addExercise} onClose={() => setShowPicker(false)} />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

// ─── PAGE PRINCIPALE : MES SÉANCES ────────────────────────────────────────────
function SeancePage({ user, gender, openId, onOpened }) {
  const [seances,      setSeances]      = useState([]);
  const [loading,      setLoading]      = useState(!!user);
  const [error,        setError]        = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [editSeance,   setEditSeance]   = useState(null);
  const [activeSeance, setActiveSeance] = useState(null);

  // Modifications en attente d'envoi (debounce) : { [id]: { timer, seance } }
  const pending = useRef({});

  useEffect(() => {
    if (!user) return;
    api.getSeances()
      .then((list) => {
        setSeances(list);
        // Ouverture directe depuis le tableau de bord
        const target = openId != null && list.find(s => s.id === openId);
        if (target) setActiveSeance(target);
        if (onOpened) onOpened();
      })
      .catch(err => setError(err.status ? err.message : "Serveur injoignable."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sendUpdate = (s) =>
    api.updateSeance(s.id, { nom: s.nom, jour: s.jour, exercises: s.exercises })
      .catch(err => setError(`Sauvegarde impossible : ${err.message}`));

  const flushPending = () => {
    Object.values(pending.current).forEach(({ timer, seance }) => {
      clearTimeout(timer);
      sendUpdate(seance);
    });
    pending.current = {};
  };

  // Envoie les modifs restantes si on quitte la page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => flushPending, []);

  const createOrUpdate = async (s) => {
    setError("");
    try {
      if (s.id) {
        const saved = await api.updateSeance(s.id, { nom: s.nom, jour: s.jour, exercises: s.exercises });
        setSeances(prev => prev.map(x => x.id === saved.id ? saved : x));
      } else {
        const created = await api.createSeance({ nom: s.nom, jour: s.jour, exercises: s.exercises });
        setSeances(prev => [...prev, created]);
      }
      setShowModal(false);
      setEditSeance(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSeance = async (s) => {
    if (!window.confirm(`Supprimer la séance « ${s.nom} » ?`)) return;
    setError("");
    try {
      clearTimeout(pending.current[s.id]?.timer);
      delete pending.current[s.id];
      await api.deleteSeance(s.id);
      setSeances(prev => prev.filter(x => x.id !== s.id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Mise à jour immédiate de l'affichage, envoi à l'API 600 ms après la dernière frappe
  const updateActiveSeance = (updated) => {
    setSeances(prev => prev.map(s => s.id === updated.id ? updated : s));
    setActiveSeance(updated);
    clearTimeout(pending.current[updated.id]?.timer);
    const timer = setTimeout(() => {
      delete pending.current[updated.id];
      sendUpdate(updated);
    }, 600);
    pending.current[updated.id] = { timer, seance: updated };
  };

  if (activeSeance) {
    return (
      <SeanceDetail
        seance={activeSeance} user={user} gender={gender}
        onBack={() => { flushPending(); setActiveSeance(null); }}
        onUpdate={updateActiveSeance}
      />
    );
  }

  // Tri dans l'ordre de la semaine
  const sorted = [...seances].sort((a, b) => JOURS.indexOf(a.jour) - JOURS.indexOf(b.jour));

  return (
    <div className="screen with-tabs">
      <header className="bar">
        <Logo />
        <button type="button" className="link acc" onClick={() => { setEditSeance(null); setShowModal(true); }}>
          + Nouvelle
        </button>
      </header>

      <div className="pad">
        <h1 className="disp h1" style={{ margin: "6px 0 10px" }}>Séances</h1>
        <div className="mono count" style={{ borderBottom: "1px solid var(--trait)", paddingBottom: 12, margin: 0 }}>
          {loading ? "Chargement…" : `${plural(seances.length, "séance")} dans ta semaine`}
        </div>

        {error && <div className="alert" role="alert">{error}</div>}

        {!loading && seances.length === 0 && (
          <div className="empty">
            <b className="disp">Semaine vide</b>
            Crée ta première séance et choisis ses exercices.
            <button type="button" className="btn" style={{ marginTop: 18 }}
              onClick={() => { setEditSeance(null); setShowModal(true); }}>
              <span>Créer une séance</span><span aria-hidden="true">+</span>
            </button>
          </div>
        )}

        {sorted.map(s => {
          const list = s.exercises || [];
          return (
            <div key={s.id} style={{ borderBottom: "1px solid var(--trait)", paddingBottom: 8 }}>
              <button type="button" className="row" style={{ borderBottom: 0 }} onClick={() => setActiveSeance(s)}>
                <span className="th"><img className="ph" src={catPhoto(list[0]?.ex.cat)} alt="" loading="lazy" /></span>
                <span>
                  <span className="mono acc" style={{ margin: 0 }}>{s.jour}</span>
                  <b style={{ fontSize: 20 }}>{s.nom}</b>
                  <span className="mono dim">
                    {list.length === 0 ? "Aucun exercice" : list.slice(0, 3).map(it => it.ex.name).join(" · ") + (list.length > 3 ? ` · +${list.length - 3}` : "")}
                  </span>
                </span>
                <span aria-hidden="true">→</span>
              </button>
              <div className="row-actions" style={{ paddingLeft: 70 }}>
                <button type="button" className="link dim" onClick={() => { setEditSeance(s); setShowModal(true); }}>Modifier</button>
                <button type="button" className="link dim" onClick={() => deleteSeance(s)}>Supprimer</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <SeanceModal
          seance={editSeance} gender={gender} user={user}
          onSave={createOrUpdate}
          onClose={() => { setShowModal(false); setEditSeance(null); }}
        />
      )}
    </div>
  );
}

export default SeancePage;
