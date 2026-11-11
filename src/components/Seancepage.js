import React, { useState } from "react";
import { ls, histKey, statsKey, workoutKey } from "../storage";

const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const seancesKey = (email) => `yassgym_seances_${email}`;

const JOUR_COLOR = {
  Lundi:"#3b82f6", Mardi:"#8b5cf6", Mercredi:"#22c55e",
  Jeudi:"#f59e0b", Vendredi:"#f97316", Samedi:"#ec4899", Dimanche:"#ef4444"
};

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

// ─── MODAL AJOUT EXERCICES ────────────────────────────────────────────────────
function ExercisePickerModal({ gender, alreadyAdded, onAdd, onClose }) {
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
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
    }} onClick={onClose}>
      <div style={{
        background:"var(--surface)", borderRadius:"20px 20px 0 0",
        border:"1px solid var(--primaryBorder)",
        width:"100%", maxWidth:600, maxHeight:"80vh",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -10px 40px rgba(0,0,0,0.5)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"16px 18px 0", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, color:"var(--text)", margin:0 }}>
              ➕ Ajouter des exercices
            </h3>
            <button onClick={onClose} style={{
              background:"var(--surface2)", border:"1px solid var(--border2)",
              borderRadius:8, padding:"4px 10px", color:"var(--textMuted)", cursor:"pointer", fontSize:18,
            }}>✕</button>
          </div>
          <input
            className="gy-input"
            style={{ marginBottom:10 }}
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingBottom:12, overflowX:"auto" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                background: filter===c ? "var(--primary)" : "var(--surface2)",
                border:`1px solid ${filter===c ? "var(--primary)" : "var(--border2)"}`,
                borderRadius:16, padding:"4px 12px", color: filter===c ? "#fff" : "var(--textMuted)",
                fontSize:11, cursor:"pointer", whiteSpace:"nowrap",
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Liste scrollable */}
        <div style={{ overflowY:"auto", flex:1, padding:"8px 12px" }}>
          {filtered.map(ex => {
            const isAdded = addedIds.includes(ex.id);
            return (
              <div key={ex.id} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"10px 12px", borderRadius:10, marginBottom:6,
                background: isAdded ? "rgba(34,197,94,0.08)" : "var(--surface2)",
                border:`1px solid ${isAdded ? "rgba(34,197,94,0.3)" : "var(--border2)"}`,
                transition:"all .15s",
              }}>
                <span style={{ fontSize:22, width:32, textAlign:"center" }}>{ex.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700, color:"var(--text)" }}>
                    {ex.name}
                  </div>
                  <div style={{ color:"var(--textFaint)", fontSize:11 }}>{ex.cat} · 🔥 {ex.calPerRep} cal/rép</div>
                </div>
                <button onClick={() => !isAdded && onAdd(ex)} style={{
                  background: isAdded ? "rgba(34,197,94,0.15)" : "var(--primaryBg)",
                  border:`1px solid ${isAdded ? "rgba(34,197,94,0.4)" : "var(--primaryBorder)"}`,
                  borderRadius:8, padding:"6px 12px",
                  color: isAdded ? "#22c55e" : "var(--primary)",
                  fontSize:12, fontWeight:600, cursor: isAdded ? "default" : "pointer",
                  minWidth:70, textAlign:"center",
                }}>
                  {isAdded ? "✓ Ajouté" : "+ Ajouter"}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)" }}>
          <button className="btn-orange" style={{ width:"100%" }} onClick={onClose}>
            Confirmer ({alreadyAdded.length} exercice{alreadyAdded.length!==1?"s":""})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL CREATION / EDITION ────────────────────────────────────────────────
function SeanceModal({ seance, gender, onSave, onClose }) {
  const [nom,          setNom]          = useState(seance?.nom  || "");
  const [jour,         setJour]         = useState(seance?.jour || "Lundi");
  const [exercises,    setExercises]    = useState(seance?.exercises || []);
  const [showPicker,   setShowPicker]   = useState(false);

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
      <div style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }} onClick={onClose}>
        <div style={{
          background:"var(--surface)", border:"1px solid var(--primaryBorder)",
          borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:440,
          maxHeight:"90vh", overflowY:"auto",
          boxShadow:"0 25px 60px rgba(0,0,0,0.5)",
        }} onClick={e => e.stopPropagation()}>

          <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, color:"var(--text)", marginBottom:20, letterSpacing:1 }}>
            {seance?.id ? "✏️ Modifier la séance" : "➕ Nouvelle séance"}
          </h3>

          {/* Nom */}
          <label style={{ color:"var(--textFaint)", fontSize:12, fontWeight:600, display:"block", marginBottom:6 }}>
            Nom de la séance
          </label>
          <input className="gy-input" placeholder="Ex: Push Day, Jambes, Full Body..."
            value={nom} onChange={e => setNom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()} autoFocus />

          {/* Jour */}
          <label style={{ color:"var(--textFaint)", fontSize:12, fontWeight:600, display:"block", marginBottom:8 }}>
            Jour de la semaine
          </label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
            {JOURS.map(j => (
              <button key={j} onClick={() => setJour(j)} style={{
                background: jour===j ? "var(--primary)" : "var(--surface2)",
                border:`1px solid ${jour===j ? "var(--primary)" : "var(--border2)"}`,
                borderRadius:8, padding:"6px 10px",
                color: jour===j ? "#fff" : "var(--textMuted)",
                fontSize:12, cursor:"pointer", fontWeight: jour===j ? 700 : 400,
              }}>{j}</button>
            ))}
          </div>

          {/* Exercices */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <label style={{ color:"var(--textFaint)", fontSize:12, fontWeight:600 }}>
              Exercices ({exercises.length})
            </label>
            <button onClick={() => setShowPicker(true)} style={{
              background:"var(--primaryBg)", border:"1px solid var(--primaryBorder)",
              borderRadius:8, padding:"5px 12px", color:"var(--primary)",
              fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5,
            }}>
              <span style={{ fontSize:16, fontWeight:700 }}>+</span> Exercices
            </button>
          </div>

          {/* Liste exercices ajoutés */}
          {exercises.length === 0 ? (
            <div style={{
              border:"1px dashed var(--border2)", borderRadius:10, padding:"16px",
              textAlign:"center", color:"var(--textFaint)", fontSize:13, marginBottom:20,
            }}>
              Aucun exercice · Clique sur <strong style={{ color:"var(--primary)" }}>+ Exercices</strong>
            </div>
          ) : (
            <div style={{ marginBottom:20 }}>
              {exercises.map((it, i) => (
                <div key={it.ex.id} style={{
                  display:"flex", alignItems:"center", gap:10,
                  background:"var(--surface2)", borderRadius:8, padding:"8px 12px", marginBottom:6,
                  animation:"fadeIn .2s ease both", animationDelay:`${i*0.04}s`,
                }}>
                  <span style={{ fontSize:18 }}>{it.ex.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, color:"var(--text)" }}>
                      {it.ex.name}
                    </div>
                    <div style={{ color:"var(--textFaint)", fontSize:10 }}>{it.ex.cat}</div>
                  </div>
                  <button onClick={() => removeExercise(it.ex.id)} style={{
                    background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                    borderRadius:6, width:26, height:26, cursor:"pointer", color:"#ef4444", fontSize:12,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Boutons */}
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" onClick={onClose} style={{ flex:1 }}>Annuler</button>
            <button className="btn-orange" onClick={save} style={{ flex:2 }} disabled={!nom.trim()}>
              {seance?.id ? "Enregistrer ✓" : "Créer la séance →"}
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <ExercisePickerModal
          gender={gender}
          alreadyAdded={exercises}
          onAdd={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ─── VUE DETAIL SEANCE ────────────────────────────────────────────────────────
function SeanceDetail({ seance, user, gender, onBack, onUpdate }) {
  const [unit,          setUnit]          = useState("kg");
  const [toast,         setToast]         = useState("");
  const [showPicker,    setShowPicker]    = useState(false);
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

  const finish = () => {
    if (!user) return showToast("⚠️ Connecte-toi d'abord !");
    if (items.length === 0) return showToast("Ajoute des exercices d'abord !");

    const entry = {
      date: new Date().toLocaleDateString("fr-FR"),
      time: new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" }),
      ts: Date.now(), seanceName: seance.nom,
      exercises: items.map(it => ({
        name: it.ex.name, sets: parseInt(it.sets)||1,
        reps: parseInt(it.reps)||0, weight: parseFloat(it.weight)||0,
        unit, calories: calcCal(it),
      })),
      totalCal: totalCals,
    };

    const hist  = ls.get(histKey(user.email), []);
    hist.unshift(entry);
    ls.set(histKey(user.email), hist.slice(0, 100));

    const stats = ls.get(statsKey(user.email), { totalCal:0, totalSessions:0, streak:0, lastDate:"" });
    stats.totalCal      += totalCals;
    stats.totalSessions += 1;
    const today     = new Date().toLocaleDateString("fr-FR");
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("fr-FR");
    if (stats.lastDate !== today) {
      stats.streak   = stats.lastDate === yesterday ? stats.streak + 1 : 1;
      stats.lastDate = today;
    }
    ls.set(statsKey(user.email), stats);
    showToast(`🎉 Séance terminée ! +${totalCals} cal brûlées`);
  };

  return (
    <div>
      <div className="gy-header">
        <div className="gy-logo">⚡ YASS-GYM</div>
        <button className="btn-ghost" onClick={onBack}>← Mes séances</button>
      </div>

      <div className="gy-content">
        <div className="seance-header">
          <div>
            <h2 className="gy-page-title">🏃 {seance.nom}</h2>
            <p style={{ color:"var(--textFaint)", fontSize:13, margin:0 }}>
              📅 {seance.jour} · {items.length} exercice{items.length!==1?"s":""}
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={() => setShowPicker(true)} style={{
              background:"var(--primaryBg)", border:"1px solid var(--primaryBorder)",
              borderRadius:8, padding:"7px 14px", color:"var(--primary)",
              fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5,
            }}>
              <span style={{ fontSize:16, fontWeight:700 }}>+</span> Exercices
            </button>
            <div className="unit-toggle">
              {["kg","lbs"].map(u => (
                <button key={u} className={`unit-btn${unit===u?" active":""}`} onClick={() => setUnit(u)}>{u}</button>
              ))}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">🏋️</div>
            <p>Aucun exercice.<br/>Clique sur <strong style={{ color:"var(--primary)" }}>+ Exercices</strong> pour en ajouter !</p>
          </div>
        ) : (
          <>
            {items.map((it, idx) => (
              <div className="seance-item" key={idx} style={{ animationDelay:`${idx*0.05}s` }}>
                <div className="seance-item-top">
                  <span className="ex-emoji">{it.ex.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div className="ex-name">{it.ex.name}</div>
                    <div style={{ color:"var(--textFaint)", fontSize:11 }}>{it.ex.cat}</div>
                  </div>
                  <button className="btn-danger" onClick={() => remove(idx)}>✕</button>
                </div>
                <div className="seance-controls">
                  <div className="seance-field">
                    <label className="field-label">Séries</label>
                    <input className="num-input" type="number" min="1" max="20"
                      value={it.sets||""} placeholder="3"
                      onChange={e => changeField(idx,"sets",e.target.value)} />
                  </div>
                  <div className="seance-field">
                    <label className="field-label">Reps</label>
                    <input className="num-input" type="number" min="1" max="200"
                      value={it.reps||""} placeholder="12"
                      onChange={e => changeField(idx,"reps",e.target.value)} />
                  </div>
                  <div className="seance-field">
                    <label className="field-label">Poids ({unit})</label>
                    <input className="num-input" type="number" min="0" step="0.5"
                      value={it.weight||""} placeholder="0"
                      onChange={e => changeField(idx,"weight",e.target.value)} />
                  </div>
                  <div className="cal-estimate">🔥 {calcCal(it)} cal</div>
                </div>
              </div>
            ))}
            <div className="total-bar">
              <div>
                <div className="total-cal-label">Total estimé</div>
                <div className="total-cal-val">🔥 {totalCals} calories</div>
              </div>
              <button className="btn-finish" onClick={finish}>Terminer la séance ✓</button>
            </div>
          </>
        )}
      </div>

      {showPicker && (
        <ExercisePickerModal
          gender={gender}
          alreadyAdded={items}
          onAdd={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ─── PAGE PRINCIPALE SEANCES ──────────────────────────────────────────────────
function SeancePage({ user, gender, seanceItems, setSeanceItems, onSave, onBack }) {
  const [seances,      setSeances]      = useState(() => user ? ls.get(seancesKey(user.email), []) : []);
  const [showModal,    setShowModal]    = useState(false);
  const [editSeance,   setEditSeance]   = useState(null);
  const [activeSeance, setActiveSeance] = useState(null);

  const saveSeances = (updated) => {
    setSeances(updated);
    if (user) ls.set(seancesKey(user.email), updated);
  };

  const createOrUpdate = (s) => {
    const updated = s.id
      ? seances.map(x => x.id === s.id ? s : x)
      : [...seances, { ...s, id: Date.now() }];
    saveSeances(updated);
    setShowModal(false);
    setEditSeance(null);
  };

  const deleteSeance = (id) => {
    if (window.confirm("Supprimer cette séance ?"))
      saveSeances(seances.filter(s => s.id !== id));
  };

  const updateActiveSeance = (updated) => {
    saveSeances(seances.map(s => s.id === updated.id ? updated : s));
    setActiveSeance(updated);
  };

  if (activeSeance) {
    return (
      <SeanceDetail
        seance={activeSeance} user={user} gender={gender}
        onBack={() => setActiveSeance(null)}
        onUpdate={updateActiveSeance}
      />
    );
  }

  return (
    <div>
      <div className="gy-header">
        <div className="gy-logo">⚡ YASS-GYM</div>
        <button className="btn-ghost" onClick={onBack}>← Accueil</button>
      </div>

      <div className="gy-content">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 className="gy-page-title" style={{ margin:0 }}>🏃 Mes Séances</h2>
          <button onClick={() => { setEditSeance(null); setShowModal(true); }} style={{
            background:"var(--gradient)", border:"none", borderRadius:10,
            width:40, height:40, fontSize:22, color:"#fff", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 15px var(--glow)", fontWeight:700,
          }}>+</button>
        </div>

        {seances.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">📋</div>
            <p>Aucune séance créée.<br/>
              Clique sur <strong style={{ color:"var(--primary)" }}>+</strong> pour créer ta première séance !</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {seances.map(s => (
              <div key={s.id} style={{
                background:"var(--surface)", border:"1px solid var(--border)",
                borderRadius:14, padding:"16px 18px", cursor:"pointer", transition:"all .2s",
              }}
                onClick={() => setActiveSeance(s)}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--primaryBorder)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}
              >
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{
                    background:(JOUR_COLOR[s.jour]||"var(--primary)")+"22",
                    border:`1px solid ${JOUR_COLOR[s.jour]||"var(--primary)"}`,
                    borderRadius:10, padding:"6px 12px", minWidth:80, textAlign:"center",
                  }}>
                    <div style={{ color:JOUR_COLOR[s.jour]||"var(--primary)", fontSize:11, fontWeight:700 }}>{s.jour}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:"var(--text)" }}>{s.nom}</div>
                    <div style={{ color:"var(--textFaint)", fontSize:12, marginTop:2 }}>
                      {(s.exercises||[]).length} exercice{(s.exercises||[]).length!==1?"s":""}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditSeance(s); setShowModal(true); }} style={{
                      background:"var(--surface2)", border:"1px solid var(--border2)",
                      borderRadius:8, width:34, height:34, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
                    }}>✏️</button>
                    <button onClick={() => deleteSeance(s.id)} style={{
                      background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                      borderRadius:8, width:34, height:34, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
                    }}>🗑️</button>
                  </div>
                </div>
                {(s.exercises||[]).length > 0 && (
                  <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6 }}>
                    {(s.exercises||[]).slice(0,4).map((it,i) => (
                      <span key={i} style={{
                        background:"var(--surface2)", border:"1px solid var(--border2)",
                        borderRadius:6, padding:"2px 8px", fontSize:11, color:"var(--textMuted)",
                      }}>{it.ex.emoji} {it.ex.name}</span>
                    ))}
                    {(s.exercises||[]).length > 4 && (
                      <span style={{ color:"var(--textFaint)", fontSize:11, padding:"2px 4px" }}>
                        +{(s.exercises||[]).length - 4} autres
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <SeanceModal
          seance={editSeance} gender={gender}
          onSave={createOrUpdate}
          onClose={() => { setShowModal(false); setEditSeance(null); }}
        />
      )}
    </div>
  );
}

export default SeancePage;