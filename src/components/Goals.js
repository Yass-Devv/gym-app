import React, { useState } from "react";
import { api } from "../api";
import { Close } from "./Shell";
import { GOAL_FIELDS, autoGoals, goalsFor, goalHint } from "../goals";

// ─── Fenêtre : modifier ses objectifs ────────────────────────────────────────
// keys : objectifs proposés dans cette fenêtre (voir GOAL_FIELDS)
export function GoalsSheet({ user, keys, onUser, onClose }) {
  const auto = autoGoals(user);
  const [vals, setVals]     = useState(() => { const g = goalsFor(user); return Object.fromEntries(keys.map((k) => [k, String(g[k])])); });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const num = (k) => parseInt(vals[k], 10);
  const bad = keys.filter((k) => !(num(k) >= GOAL_FIELDS[k].min && num(k) <= GOAL_FIELDS[k].max));
  const isAuto = keys.every((k) => num(k) === auto[k]);

  const save = async () => {
    // Une valeur égale au calcul n'est pas gardée : l'objectif continue de suivre le profil
    const goals = { ...(user.goals || {}) };
    keys.forEach((k) => { if (num(k) === auto[k]) delete goals[k]; else goals[k] = num(k); });
    setSaving(true);
    setError("");
    try {
      onUser(await api.updateProfile({ goals }));
      onClose();
    } catch (err) {
      setError(err.status ? err.message : "Serveur injoignable.");
      setSaving(false);
    }
  };

  return (
    <div className="sheet-bg top" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Modifier mes objectifs" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sec" style={{ margin: 0 }}>
            <span className="mono acc">{goalHint(user)}</span>
            <Close onClick={onClose} />
          </div>
          <h3 className="disp" style={{ margin: "2px 0 8px" }}>Mes objectifs</h3>
        </div>
        <div className="sheet-scroll">
          {error && <div className="alert" role="alert">{error}</div>}
          {keys.map((k) => {
            const f = GOAL_FIELDS[k];
            return (
              <div className={"field" + (bad.includes(k) ? " err" : "")} key={k}>
                <label htmlFor={"goal-" + k}>
                  <span>{f.label} ({f.unit})</span>
                  <span>Conseillé : {auto[k].toLocaleString("fr-FR")}</span>
                </label>
                <input id={"goal-" + k} type="number" inputMode="numeric" min={f.min} max={f.max} value={vals[k]}
                  onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
              </div>
            );
          })}
          {bad.length > 0 && (
            <p className="field-err">
              {GOAL_FIELDS[bad[0]].label} : entre {GOAL_FIELDS[bad[0]].min.toLocaleString("fr-FR")} et {GOAL_FIELDS[bad[0]].max.toLocaleString("fr-FR")} {GOAL_FIELDS[bad[0]].unit}.
            </p>
          )}
          <p className="hint">
            Les valeurs conseillées viennent de ton profil (âge, taille, poids, rythme, objectif). Ce n'est pas un avis médical.
          </p>
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn ghost center" disabled={isAuto || saving}
            onClick={() => setVals(Object.fromEntries(keys.map((k) => [k, String(auto[k])])))}>Recalculer</button>
          <button type="button" className="btn" onClick={save} disabled={bad.length > 0 || saving}>
            <span>Enregistrer</span><span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
