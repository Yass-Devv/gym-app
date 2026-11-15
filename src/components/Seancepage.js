import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { ls } from "../storage";
import { Logo, SensitiveBadge, ExThumb, Icon, Back, Close, catPhoto, plural, unitLabel } from "./Shell";
import { ExChips, ExSheet, filterEx } from "./ExParts";
import RestTimer from "./RestTimer";
import { catalogFor } from "../data/exercises";

// Réglages du chrono de repos, gardés sur l'appareil et communs à tous les exercices
const REST_KEY = "yassgym_rest";
const MUTE_KEY = "yassgym_rest_mute";

const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const todayName = () => JOURS[(new Date().getDay() + 6) % 7];

const kcal = (n) => String(n).replace(".", ",");

// ─── FENÊTRE : CHOISIR DES EXERCICES ──────────────────────────────────────────
// Un appui ajoute l'exercice, un second le retire
function ExercisePickerModal({ gender, user, alreadyAdded, onAdd, onRemove, onClose }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");

  const addedIds = alreadyAdded.map(it => it.ex.id);
  const filtered = filterEx(catalogFor(gender), filter, search, user);

  return (
    <div className="sheet-bg top" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Ajouter des exercices" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sec" style={{ margin: 0 }}>
            <h3 className="disp">Ajouter</h3>
            <Close onClick={onClose} />
          </div>
          <input className="search" type="search" placeholder="Exercice, muscle ou matériel" aria-label="Rechercher un exercice"
            value={search} onChange={e => setSearch(e.target.value)} />
          <ExChips user={user} value={filter} onChange={setFilter} />
        </div>

        <div className="sheet-scroll">
          {filtered.map(ex => {
            const isAdded = addedIds.includes(ex.id);
            return (
              <button type="button" key={ex.id} className={"row" + (isAdded ? " sel" : "")} aria-pressed={isAdded}
                onClick={() => (isAdded ? onRemove(ex.id) : onAdd(ex))} aria-label={isAdded ? `Retirer ${ex.name}` : `Ajouter ${ex.name}`}>
                <ExThumb ex={ex} />
                <span><b>{ex.name}</b><span className="mono dim">{ex.cat} · {kcal(ex.calPerRep)} kcal / rép.</span><SensitiveBadge ex={ex} user={user} /></span>
                <span className={"sq" + (isAdded ? " on" : "")} aria-hidden="true">{isAdded ? <Icon name="check" size={18} stroke={3} /> : "+"}</span>
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
                <ExThumb ex={it.ex} />
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
          onAdd={addExercise} onRemove={removeExercise} onClose={() => setShowPicker(false)} />
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
  const [infoEx,     setInfoEx]     = useState(null);                              // fiche d'exercice ouverte
  const [rest,       setRest]       = useState(() => ls.get(REST_KEY) || 90);      // durée du repos, en secondes
  const [muted,      setMuted]      = useState(() => ls.get(MUTE_KEY) === true);
  const items = seance.exercises || [];

  const changeRest = (s) => { setRest(s); ls.set(REST_KEY, s); };
  const changeMute = (m) => { setMuted(m); ls.set(MUTE_KEY, m); };

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const updateItems = (newItems) => onUpdate({ ...seance, exercises: newItems });

  const changeField = (idx, field, val) =>
    updateItems(items.map((it, i) => i === idx ? { ...it, [field]: val } : it));

  const remove = (idx) => updateItems(items.filter((_, i) => i !== idx));
  const removeById = (id) => updateItems(items.filter((it) => it.ex.id !== id));

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
          <Back label="Séances" onClick={onBack} />
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
                    <button type="button" className="ex-open" onClick={() => setInfoEx(it.ex)}
                      aria-label={`Voir comment faire : ${it.ex.name}`}>
                      <ExThumb ex={it.ex} />
                      <span><span className="title" style={{ fontSize: 21 }}>{it.ex.name}</span><span className="ex-how"><Icon name="info" size={15} stroke={2.2} />Comment le faire</span></span>
                    </button>
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
                <RestTimer sets={parseInt(it.sets) || 1} total={rest} onTotal={changeRest} muted={muted} onMute={changeMute} />
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
          onAdd={addExercise} onRemove={removeById} onClose={() => setShowPicker(false)} />
      )}
      {infoEx && <ExSheet ex={infoEx} user={user} onClose={() => setInfoEx(null)} />}
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
