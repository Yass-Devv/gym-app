import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Logo, SensitiveBadge, ExThumb, plural } from "./Shell";
import { ExChips, ExInfo, filterEx, hasReco, recommendedFor } from "./ExParts";
import { catalogFor } from "../data/exercises";

// ─── LIGNE D'EXERCICE (dépliable) ─────────────────────────────────────────────
function ExCard({ ex, user, featured, open, onToggle, onAdd }) {
  return (
    <>
      <button type="button" className="row" aria-expanded={open} onClick={onToggle}>
        <ExThumb ex={ex} />
        <span>
          <b>{ex.name}</b>
          <span className="mono dim">{ex.cat} · {ex.diff}{featured && <span className="acc"> · Recommandé</span>}</span>
          <SensitiveBadge ex={ex} user={user} />
        </span>
        <span className={"sq" + (open ? " on" : "")} aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="ex-body">
          <ExInfo ex={ex} user={user} />
          <button type="button" className="btn" onClick={onAdd}>
            <span>Ajouter à une séance</span><span aria-hidden="true">+</span>
          </button>
        </div>
      )}
    </>
  );
}

// ─── PAGE EXERCICES ───────────────────────────────────────────────────────────
function ExercisesPage({ user, gender, onGoSeance }) {
  const [filter,   setFilter]   = useState("Tous");
  const [search,   setSearch]   = useState("");
  const [toast,    setToast]    = useState("");
  const [openId,   setOpenId]   = useState(null);
  const [pickerId, setPickerId] = useState(null);
  const [seances,  setSeances]  = useState([]);

  const allExercises = catalogFor(gender);
  const filtered = filterEx(allExercises, filter, search, user);
  const recoIds  = new Set(hasReco(user) ? recommendedFor(allExercises, user).map((e) => e.id) : []);

  useEffect(() => {
    if (!user) return;
    api.getSeances().then(setSeances).catch((err) => console.error(err));
  }, [user]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const addTo = async (ex, seance) => {
    setPickerId(null);
    if ((seance.exercises || []).find((it) => it.ex.id === ex.id)) {
      return say(`${ex.name} est déjà dans « ${seance.nom} ».`);
    }
    try {
      const saved = await api.updateSeance(seance.id, {
        exercises: [...(seance.exercises || []), { ex, sets: "3", reps: "", weight: "" }],
      });
      setSeances((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      say(`${ex.name} ajouté à « ${seance.nom} ».`);
    } catch (err) {
      say(err.status ? err.message : "Serveur injoignable.");
    }
  };

  return (
    <div className="screen with-tabs">
      <header className="bar">
        <Logo />
        <span className="mono dim">{plural(allExercises.length, "exercice")}</span>
      </header>

      <div className="pad">
        <h1 className="disp h1" style={{ margin: "6px 0 10px" }}>Exercices</h1>
        <input className="search" type="search" placeholder="Exercice, muscle ou matériel" aria-label="Rechercher un exercice"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExChips user={user} value={filter} onChange={setFilter} />
        {filter === "reco" && <p className="hint" style={{ margin: "12px 0 2px" }}>Choisis pour toi d'après ton niveau, ton objectif et tes activités.</p>}

        {filtered.length === 0 && (
          <div className="empty"><b className="disp">Rien trouvé</b>Essaie un autre mot ou une autre catégorie.</div>
        )}

        {filtered.map((ex) => (
          <div key={ex.id}>
            <ExCard ex={ex} user={user} featured={recoIds.has(ex.id)} open={openId === ex.id}
              onToggle={() => { setOpenId(openId === ex.id ? null : ex.id); setPickerId(null); }}
              onAdd={() => setPickerId(ex.id)} />

            {pickerId === ex.id && (
              <div className="picker">
                <div className="mono acc">Ajouter à quelle séance ?</div>
                {seances.map((s) => (
                  <button type="button" key={s.id} className="row no-th" onClick={() => addTo(ex, s)}>
                    <span><b>{s.nom}</b><span className="mono dim">{s.jour} · {plural((s.exercises || []).length, "exercice")}</span></span>
                    <span aria-hidden="true">+</span>
                  </button>
                ))}
                {seances.length === 0 && (
                  <button type="button" className="row no-th" onClick={() => onGoSeance(null)}>
                    <span><b>Aucune séance pour l'instant</b><span className="mono dim">Créer ma première séance</span></span>
                    <span aria-hidden="true">→</span>
                  </button>
                )}
                <button type="button" className="link dim" onClick={() => setPickerId(null)}>Annuler</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default ExercisesPage;
