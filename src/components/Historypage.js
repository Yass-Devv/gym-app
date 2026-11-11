import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Logo, plural, fromKg, unitLabel } from "./Shell";

const toKg = (w, unit) => (unit === "lbs" ? w * 0.453592 : w);
const nf   = (n) => Math.round(n).toLocaleString("fr-FR");
const DAY  = 86400000;

// ─── CALCUL EVOLUTION ────────────────────────────────────────────────────────
// Pour un exercice donné dans une séance, on cherche la dernière fois
// qu'il a été fait dans une séance PRÉCÉDENTE et on compare le poids
function getEvolution(hist, sessionIndex, exName, currentWeight, currentUnit) {
  const currentKg = toKg(currentWeight, currentUnit);

  // hist[0] = plus récent : les séances plus anciennes ont un index plus grand
  for (let i = sessionIndex + 1; i < hist.length; i++) {
    const prevEx = hist[i].exercises?.find(e => e.name === exName);
    if (prevEx && prevEx.weight > 0) {
      const diffKg   = currentKg - toKg(prevEx.weight, prevEx.unit || "kg");
      const diffDisp = currentUnit === "lbs" ? +(diffKg / 0.453592).toFixed(1) : +diffKg.toFixed(1);
      if (diffKg > 0) return { type:"up",   diff: diffDisp, unit: currentUnit };
      if (diffKg < 0) return { type:"down", diff: Math.abs(diffDisp), unit: currentUnit };
      return { type:"same" };
    }
  }
  return null; // Première fois cet exercice
}

// ─── ÉVOLUTION (texte) ───────────────────────────────────────────────────────
function Evo({ evo }) {
  if (!evo) return null;
  if (evo.type === "same") return <span className="evo">=</span>;
  const up = evo.type === "up";
  return (
    <span className={"evo" + (up ? " up" : "")}>
      {up ? "▲ +" : "▼ −"}{String(evo.diff).replace(".", ",")} {unitLabel(evo.unit)}
    </span>
  );
}

// ─── PAGE SUIVI ───────────────────────────────────────────────────────────────
function HistoryPage({ user }) {
  const [tab, setTab]         = useState("seances"); // "seances" | "progres"
  const [hist,    setHist]    = useState([]);
  const [stats,   setStats]   = useState({ totalCal:0, totalSessions:0, streak:0 });
  const [loading, setLoading] = useState(!!user);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([api.getHistory(), api.getStats()])
      .then(([h, s]) => { setHist(h); setStats(s); })
      .catch(err => setError(err.status ? err.message : "Serveur injoignable."))
      .finally(() => setLoading(false));
  }, [user]);

  const now = Date.now();
  const month = hist.filter(h => now - h.ts < 30 * DAY);
  const monthCals = month.reduce((s, h) => s + h.totalCal, 0);

  // Charge totale soulevée sur 30 jours : séries × répétitions × poids
  const monthVolume = month.reduce((sum, h) =>
    sum + (h.exercises || []).reduce((s, e) => s + (e.sets || 0) * (e.reps || 0) * toKg(e.weight || 0, e.unit), 0), 0);

  // Calories par jour sur les 7 derniers jours (aujourd'hui à droite)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const start = today.getTime() - (6 - i) * DAY;
    const cal = hist.filter(h => h.ts >= start && h.ts < start + DAY).reduce((s, h) => s + h.totalCal, 0);
    return { cal, label: new Date(start).toLocaleDateString("fr-FR", { weekday: "narrow" }) };
  });
  const maxCal = Math.max(...last7.map(d => d.cal), 1);

  const GOAL = 2000;
  const pct  = Math.min(100, Math.round((monthCals / GOAL) * 100));

  // Progression par exercice : toutes les occurrences avec un poids
  const progressMap = {};
  hist.forEach(session => {
    session.exercises?.forEach(ex => {
      if (!ex.weight) return;
      (progressMap[ex.name] = progressMap[ex.name] || []).push({
        date: session.date, ts: session.ts, sets: ex.sets, reps: ex.reps,
        weight: ex.weight, unit: ex.unit || "kg",
      });
    });
  });

  return (
    <div className="screen with-tabs">
      <header className="bar">
        <Logo />
        <span className="mono dim">30 derniers jours</span>
      </header>

      <div className="pad">
        {loading ? (
          <div className="empty">Chargement du suivi…</div>
        ) : error ? (
          <div className="alert" role="alert">{error}</div>
        ) : (
          <>
            <div className="mono dim" style={{ marginTop: 6 }}>Charge soulevée</div>
            <div className="disp big">{nf(fromKg(monthVolume, user.unit))}<span> {unitLabel(user.unit)}</span></div>

            <div className="bars" aria-label="Calories dépensées sur les 7 derniers jours">
              {last7.map((d, i) => (
                <i key={i} className={i === 6 ? "hi" : ""} style={{ height: `${(d.cal / maxCal) * 100}%` }}
                  title={`${d.cal} kcal`} />
              ))}
            </div>
            <div className="axis mono">{last7.map((d, i) => <span key={i}>{d.label}</span>)}</div>

            <div className="kpis" style={{ marginTop: 22 }}>
              <div><b className="disp">{stats.totalSessions}</b><span className="mono dim">Séance{stats.totalSessions > 1 ? "s" : ""}</span></div>
              <div><b className="disp">{nf(stats.totalCal)}</b><span className="mono dim">Kcal au total</span></div>
              <div><b className="disp">{stats.streak}</b><span className="mono dim">Jour{stats.streak > 1 ? "s" : ""} de suite</span></div>
            </div>

            <div className="goal">
              <div className="goal-top mono"><span>Objectif du mois</span><span>{nf(monthCals)} / {nf(GOAL)} kcal</span></div>
              <div className="goal-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <i style={{ width: pct + "%" }} />
              </div>
            </div>

            <div className="chips" role="tablist">
              {[["seances", "Séances"], ["progres", "Progression"]].map(([key, label]) => (
                <button type="button" key={key} role="tab" aria-selected={tab === key}
                  className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>

            {/* ── Séances passées ── */}
            {tab === "seances" && (
              hist.length === 0 ? (
                <div className="empty"><b className="disp">Rien encore</b>Termine une séance pour la retrouver ici.</div>
              ) : hist.map((h, i) => (
                <div className="hist" key={h.id ?? i} style={i === 0 ? { borderTop: 0 } : undefined}>
                  <div className="hist-top">
                    <div>
                      <span className="mono dim">{h.date} · {h.time}</span>
                      <span className="title" style={{ fontSize: 21, marginTop: 2 }}>{h.seanceName || "Séance libre"}</span>
                    </div>
                    <span className="mono acc">{nf(h.totalCal)} kcal</span>
                  </div>
                  {h.exercises.map((e, j) => (
                    <div className="hist-line" key={j}>
                      <span>{e.name}</span>
                      <span className="mono">
                        {e.sets} × {e.reps}{e.weight > 0 ? ` · ${String(e.weight).replace(".", ",")} ${unitLabel(e.unit)}` : ""}
                        <Evo evo={getEvolution(hist, i, e.name, e.weight, e.unit || "kg")} />
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}

            {/* ── Progression par exercice ── */}
            {tab === "progres" && (
              Object.keys(progressMap).length === 0 ? (
                <div className="empty"><b className="disp">Pas de charges</b>Note un poids dans tes séances pour suivre ta progression.</div>
              ) : Object.entries(progressMap).map(([exName, entries], n) => {
                const sorted = [...entries].sort((a, b) => a.ts - b.ts);
                const first  = sorted[0];
                const last   = sorted[sorted.length - 1];
                const total  = toKg(last.weight, last.unit) - toKg(first.weight, first.unit);
                const maxW   = Math.max(...sorted.map(e => toKg(e.weight, e.unit)));

                return (
                  <div className="hist" key={exName} style={n === 0 ? { borderTop: 0 } : undefined}>
                    <div className="hist-top">
                      <div>
                        <span className="mono dim">{plural(entries.length, "séance")}</span>
                        <span className="title" style={{ fontSize: 21, marginTop: 2 }}>{exName}</span>
                      </div>
                      {sorted.length > 1 && (
                        <span className={"mono" + (total > 0 ? " acc" : " dim")}>
                          {total > 0 ? "▲ +" : total < 0 ? "▼ −" : "= "}{String(Math.abs(+total.toFixed(1))).replace(".", ",")} kg
                        </span>
                      )}
                    </div>

                    <div className="mini" aria-hidden="true">
                      {sorted.map((e, idx) => (
                        <div key={idx}>
                          {e.weight}
                          <i style={{ height: Math.max(4, (toKg(e.weight, e.unit) / maxW) * 38) }} />
                        </div>
                      ))}
                    </div>

                    {sorted.map((e, idx) => {
                      const prev = sorted[idx - 1];
                      let evo = null;
                      if (prev) {
                        const diff = toKg(e.weight, e.unit) - toKg(prev.weight, prev.unit);
                        evo = diff > 0 ? { type:"up", diff:+diff.toFixed(1), unit:"kg" }
                            : diff < 0 ? { type:"down", diff:+Math.abs(diff).toFixed(1), unit:"kg" }
                            : { type:"same" };
                      }
                      return (
                        <div className="hist-line" key={idx}>
                          <span className="mono dim">{e.date}</span>
                          <span className="mono">
                            {e.sets} × {e.reps} · {String(e.weight).replace(".", ",")} {unitLabel(e.unit)}
                            <Evo evo={evo} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
