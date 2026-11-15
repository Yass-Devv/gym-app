import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Logo, Icon, Close } from "./Shell";
import { GoalsSheet } from "./Goals";
import { goalsFor, goalHint } from "../goals";
import { FOODS, foodImg } from "../data/foods";

// ─── Repas : ce qu'on mange dans la journée, en calories et en macros ────────

// Les identifiants doivent correspondre à MEALS dans server/src/routes/meals.js
const MEALS = [
  { id: "petit-dej", label: "Petit-déjeuner" },
  { id: "dejeuner",  label: "Déjeuner" },
  { id: "diner",     label: "Dîner" },
  { id: "collation", label: "Collation" },
];

const plain = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const nf    = (n) => Math.round(n).toLocaleString("fr-FR");
const one   = (n) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Les trois macros suivies, avec leur objectif dans goalsFor(user)
const MACROS = [["protein", "Protéines"], ["carbs", "Glucides"], ["fat", "Lipides"]];

// Vignette d'un aliment : sa photo (en couleur), ou les couverts quand il n'en a pas
function FoodThumb({ img, small = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={"th food" + (small ? " small" : "")}>
      {img && !failed
        ? <img src={img} alt="" loading="lazy" onError={() => setFailed(true)} />
        : <Icon name="repas" size={small ? 16 : 24} stroke={1.6} />}
    </span>
  );
}

// ─── FENÊTRE : AJOUTER UN ALIMENT ────────────────────────────────────────────
function AddFood({ meal, onAdd, onClose }) {
  const [search, setSearch]     = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [food, setFood]         = useState(null);   // aliment choisi, en attente de quantité
  const [grams, setGrams]       = useState("");
  const [manual, setManual]     = useState(null);   // saisie libre : { name, kcal }
  const [saving, setSaving]     = useState(false);

  const local = search.trim().length < 2
    ? FOODS.slice(0, 12)
    : FOODS.filter((f) => plain(f.name).includes(plain(search.trim())));

  // Recherche en ligne, déclenchée après une courte pause de frappe
  useEffect(() => {
    const q = search.trim();
    setProducts([]);
    if (q.length < 3) return undefined;
    let stale = false; // une frappe plus récente a remplacé cette recherche
    const timer = setTimeout(() => {
      setLoading(true);
      api.searchFoods(q)
        .then((rows) => !stale && setProducts(rows.map((f) => ({ ...f, portion: 100, product: true }))))
        .catch(() => {})
        .finally(() => !stale && setLoading(false));
    }, 450);
    return () => { stale = true; clearTimeout(timer); setLoading(false); };
  }, [search]);

  const pick = (f) => { setFood(f); setGrams(String(f.portion)); };
  const g = parseFloat(String(grams).replace(",", ".")) || 0;
  const ratio = g / 100;

  const send = async (entry) => {
    setSaving(true);
    try { await onAdd(entry); } finally { setSaving(false); }
  };
  const addFood = () => send({
    name: food.name.slice(0, 150), grams: g, kcal: Math.round(food.kcal * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10, carbs: Math.round(food.carbs * ratio * 10) / 10, fat: Math.round(food.fat * ratio * 10) / 10,
  });
  const manualKcal = parseInt(manual?.kcal, 10) || 0;
  const addManual = () => send({ name: manual.name.trim().slice(0, 150), kcal: manualKcal });

  const row = (f, key) => (
    <button type="button" key={key} className="row" onClick={() => pick(f)}>
      <FoodThumb img={f.img} />
      <span><b>{f.name}</b><span className="mono dim">{nf(f.kcal)} kcal / 100 g{f.product ? " · produit" : ""}</span></span>
      <span className="sq" aria-hidden="true">+</span>
    </button>
  );

  return (
    <div className="sheet-bg top" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={`Ajouter au ${meal.label.toLowerCase()}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sec" style={{ margin: 0 }}>
            <span className="mono acc">{meal.label}</span>
            <Close onClick={onClose} />
          </div>
          <h3 className="disp" style={{ margin: "2px 0 8px" }}>{food ? "Quelle quantité ?" : manual ? "Saisie libre" : "Ajouter"}</h3>
          {!food && !manual && (
            <input className="search" type="search" placeholder="Aliment, plat ou produit" aria-label="Rechercher un aliment"
              value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          )}
        </div>

        {food ? (
          <>
            <div className="sheet-scroll">
              {food.img && <div className="food-hero"><img src={food.img} alt="" onError={(e) => e.currentTarget.parentNode.remove()} /></div>}
              <span className="title" style={{ fontSize: 20, marginTop: 6 }}>{food.name}</span>
              <span className="mono dim">{nf(food.kcal)} kcal pour 100 g</span>
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="food-grams"><span>Quantité (grammes ou ml)</span></label>
                <input id="food-grams" type="number" inputMode="decimal" min="1" max="5000" value={grams}
                  onChange={(e) => setGrams(e.target.value)} autoFocus />
              </div>
              <div className="pills" style={{ marginBottom: 16 }}>
                {[50, 100, 150, 200, 300].map((q) => (
                  <button type="button" key={q} className={g === q ? "on" : ""} onClick={() => setGrams(String(q))}>{q} g</button>
                ))}
              </div>
              <div className="kpis">
                <div><b className="disp">{nf(food.kcal * ratio)}</b><span className="mono dim">Kcal</span></div>
                <div><b className="disp">{one(food.protein * ratio)}</b><span className="mono dim">Protéines (g)</span></div>
                <div><b className="disp">{one(food.carbs * ratio)}</b><span className="mono dim">Glucides (g)</span></div>
              </div>
            </div>
            <div className="sheet-foot">
              <button type="button" className="btn ghost center" onClick={() => setFood(null)}>Retour</button>
              <button type="button" className="btn" onClick={addFood} disabled={g <= 0 || g > 5000 || saving}>
                <span>Ajouter</span><span>{nf(food.kcal * ratio)} kcal</span>
              </button>
            </div>
          </>
        ) : manual ? (
          <>
            <div className="sheet-scroll">
              <p className="hint">Pour un plat maison ou au restaurant dont tu connais les calories.</p>
              <div className="field">
                <label htmlFor="manual-name"><span>Nom</span></label>
                <input id="manual-name" maxLength={150} placeholder="Gratin de maman" value={manual.name}
                  onChange={(e) => setManual({ ...manual, name: e.target.value })} autoFocus />
              </div>
              <div className="field">
                <label htmlFor="manual-kcal"><span>Calories (kcal)</span></label>
                <input id="manual-kcal" type="number" inputMode="numeric" min="1" max="10000" placeholder="450" value={manual.kcal}
                  onChange={(e) => setManual({ ...manual, kcal: e.target.value })} />
              </div>
            </div>
            <div className="sheet-foot">
              <button type="button" className="btn ghost center" onClick={() => setManual(null)}>Retour</button>
              <button type="button" className="btn" onClick={addManual} disabled={!manual.name.trim() || manualKcal <= 0 || manualKcal > 10000 || saving}>
                <span>Ajouter</span><span>{nf(manualKcal)} kcal</span>
              </button>
            </div>
          </>
        ) : (
          <div className="sheet-scroll">
            {local.map((f) => row(f, "l-" + f.name))}
            {products.length > 0 && <span className="lbl" style={{ marginBottom: 4 }}>Produits du commerce (Open Food Facts)</span>}
            {products.map((f, i) => row(f, "p-" + i))}
            {loading && <p className="hint">Recherche de produits…</p>}
            {local.length === 0 && products.length === 0 && !loading && (
              <div className="empty">Rien trouvé pour « {search.trim()} ».</div>
            )}
            <button type="button" className="row no-th" onClick={() => setManual({ name: search.trim(), kcal: "" })}>
              <span><b>Saisie libre</b><span className="mono dim">Entrer un nom et ses calories</span></span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE REPAS ──────────────────────────────────────────────────────────────
function MealsPage({ user, onUser }) {
  const [day, setDay]       = useState(() => new Date());
  const [items, setItems]   = useState([]);
  const [error, setError]   = useState("");
  const [addTo, setAddTo]   = useState(null);
  const [toast, setToast]   = useState("");
  const [editGoals, setEditGoals] = useState(false);
  const loadId = useRef(0);

  const key = dayKey(day);
  const isToday = key === dayKey(new Date());
  const fail = (err) => setError(err.status ? err.message : "Serveur injoignable.");

  useEffect(() => {
    const id = ++loadId.current; // on ignore la réponse d'un jour qu'on a déjà quitté
    setError("");
    api.getMeals(key)
      .then((rows) => id === loadId.current && setItems(rows))
      .catch((err) => id === loadId.current && (setItems([]), fail(err)));
  }, [key]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const shift = (n) => setDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() + n));

  const add = async (entry) => {
    try {
      const saved = await api.addMeal({ ...entry, date: key, meal: addTo.id });
      setItems((cur) => [...cur, saved]);
      setAddTo(null);
      say(`${saved.name} ajouté : ${nf(saved.kcal)} kcal.`);
    } catch (err) {
      say(err.status ? err.message : "Serveur injoignable.");
    }
  };

  const remove = async (item) => {
    try {
      await api.deleteMeal(item.id);
      setItems((cur) => cur.filter((x) => x.id !== item.id));
    } catch (err) {
      say(err.status ? err.message : "Serveur injoignable.");
    }
  };

  const sum   = (k, list = items) => list.reduce((s, x) => s + (x[k] || 0), 0);
  const goals = goalsFor(user);
  const goal  = goals.kcal;
  const eaten = sum("kcal");
  const rest  = goal - eaten;

  return (
    <div className="screen with-tabs">
      <header className="bar">
        <Logo />
        <div className="day-nav">
          <button type="button" onClick={() => shift(-1)} aria-label="Jour précédent"><Icon name="back" size={18} stroke={2.6} /></button>
          <span>{isToday ? "Aujourd'hui" : day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
          <button type="button" onClick={() => shift(1)} disabled={isToday} aria-label="Jour suivant"><Icon name="next" size={18} stroke={2.6} /></button>
        </div>
      </header>

      <div className="pad">
        <h1 className="disp h1" style={{ margin: "6px 0 4px" }}>Repas</h1>
        {error && <div className="alert" role="alert">{error}</div>}

        <div className="disp big">{nf(eaten)}<span> kcal</span></div>
        <div className="goal" style={{ marginTop: 10 }}>
          <div className="goal-top mono">
            <span>Objectif : {nf(goal)} kcal</span>
            <span className={rest < 0 ? "acc" : ""}>{rest >= 0 ? `Reste ${nf(rest)}` : `Dépassé de ${nf(-rest)}`}</span>
          </div>
          <div className="goal-track"><i style={{ width: `${Math.min(100, (eaten / goal) * 100)}%` }} /></div>
        </div>

        <div className="goal-edit">
          <span className="mono dim">{user.goals?.kcal ? "Objectif choisi par toi" : goalHint(user)}</span>
          <button type="button" className="edit-pill" onClick={() => setEditGoals(true)}>
            <Icon name="edit" size={14} stroke={2.4} /><span>Modifier</span>
          </button>
        </div>

        <div className="kpis macros" style={{ marginTop: 14 }}>
          {MACROS.map(([k, label]) => (
            <div key={k}>
              <b className="disp">{nf(sum(k))}</b>
              <span className="mono dim">{label} (g)</span>
              <span className="mono macro-goal">Objectif {nf(goals[k])} g</span>
              <span className="goal-track"><i style={{ width: `${Math.min(100, (sum(k) / goals[k]) * 100)}%` }} /></span>
            </div>
          ))}
        </div>

        {MEALS.map((m) => {
          const list = items.filter((x) => x.meal === m.id);
          return (
            <section className="meal" key={m.id}>
              <div className="meal-head">
                <div>
                  <span className="title" style={{ fontSize: 20 }}>{m.label}</span>
                  <span className="mono dim">{list.length ? `${nf(sum("kcal", list))} kcal` : "Rien pour l'instant"}</span>
                </div>
                <button type="button" className="meal-add" onClick={() => setAddTo(m)} aria-label={`Ajouter au ${m.label.toLowerCase()}`}>
                  <Icon name="plus" size={22} stroke={3} />
                </button>
              </div>
              {list.map((x) => (
                <div className="hist-line" key={x.id}>
                  <span className="meal-food"><FoodThumb img={foodImg(x.name)} small />
                    <span>{x.name}{x.grams ? <span className="dim"> · {one(x.grams)} g</span> : null}</span>
                  </span>
                  <span className="meal-kcal">
                    <span className="mono">{nf(x.kcal)} kcal</span>
                    <button type="button" className="link dim" onClick={() => remove(x)} aria-label={`Retirer ${x.name}`}>Retirer</button>
                  </span>
                </div>
              ))}
            </section>
          );
        })}

        <p className="hint" style={{ marginTop: 22 }}>
          Les objectifs sont estimés à partir de ton profil (âge, taille, poids, rythme, objectif) et tu peux les modifier.
          Ce n'est pas un avis médical. Les valeurs des aliments sont des moyennes.
        </p>
      </div>

      {addTo && <AddFood meal={addTo} onAdd={add} onClose={() => setAddTo(null)} />}
      {editGoals && <GoalsSheet user={user} keys={["kcal", "protein", "carbs", "fat"]} onUser={onUser} onClose={() => setEditGoals(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default MealsPage;
