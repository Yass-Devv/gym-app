import React, { useState } from "react";
import { ls, histKey, statsKey } from "../storage";

// ─── CALCUL EVOLUTION ────────────────────────────────────────────────────────
// Pour un exercice donné dans une séance, on cherche la dernière fois
// qu'il a été fait dans une séance PRÉCÉDENTE et on compare le poids
function getEvolution(hist, sessionIndex, exName, currentWeight, currentUnit) {
  // Convertit tout en kg pour comparer
  const toKg = (w, unit) => unit === "lbs" ? w * 0.453592 : w;
  const currentKg = toKg(currentWeight, currentUnit);

  // Cherche dans les séances plus anciennes (index > sessionIndex = plus ancien car hist[0] = plus récent)
  for (let i = sessionIndex + 1; i < hist.length; i++) {
    const prevSession = hist[i];
    const prevEx = prevSession.exercises?.find(e => e.name === exName);
    if (prevEx && prevEx.weight > 0) {
      const prevKg   = toKg(prevEx.weight, prevEx.unit || "kg");
      const diffKg   = currentKg - prevKg;
      const diffDisp = currentUnit === "lbs"
        ? +(diffKg / 0.453592).toFixed(1)
        : +diffKg.toFixed(1);
      if (diffKg > 0)  return { type:"up",   diff: diffDisp, unit: currentUnit };
      if (diffKg < 0)  return { type:"down", diff: Math.abs(diffDisp), unit: currentUnit };
      return { type:"same" };
    }
  }
  return null; // Première fois cet exercice
}

// ─── BADGE EVOLUTION ─────────────────────────────────────────────────────────
function EvoBadge({ evo }) {
  if (!evo) return null;
  if (evo.type === "same") return (
    <span style={{
      background:"rgba(100,116,139,0.15)", border:"1px solid rgba(100,116,139,0.3)",
      borderRadius:6, padding:"2px 7px", fontSize:11, color:"#94a3b8", marginLeft:6,
    }}>= même poids</span>
  );
  const isUp = evo.type === "up";
  return (
    <span style={{
      background: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
      border: `1px solid ${isUp ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
      borderRadius:6, padding:"2px 8px", fontSize:11,
      color: isUp ? "#22c55e" : "#ef4444",
      fontWeight:700, marginLeft:6, display:"inline-flex", alignItems:"center", gap:3,
    }}>
      {isUp ? "▲" : "▼"} {isUp ? "+" : "-"}{evo.diff}{evo.unit}
    </span>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ user, gender, onBack }) {
  const [tab, setTab] = useState("seances"); // "seances" | "progres"

  if (!user) {
    return (
      <div>
        <div className="gy-header">
          <div className="gy-logo">⚡ YASS-GYM</div>
          <button className="btn-ghost" onClick={onBack}>← Accueil</button>
        </div>
        <div className="empty-box">
          <div className="empty-icon">🔒</div>
          <p>Connecte-toi pour voir ton historique</p>
        </div>
      </div>
    );
  }

  const hist  = ls.get(histKey(user.email), []);
  const stats = ls.get(statsKey(user.email), { totalCal:0, totalSessions:0, streak:0 });

  const weekCals  = hist.filter(h => Date.now() - h.ts < 7  * 86400000).reduce((s,h) => s + h.totalCal, 0);
  const monthCals = hist.filter(h => Date.now() - h.ts < 30 * 86400000).reduce((s,h) => s + h.totalCal, 0);
  const GOAL = 2000;
  const pct  = Math.min(100, Math.round((monthCals / GOAL) * 100));

  // ─── CALCUL PROGRESSION PAR EXERCICE ──────────────────────────────────────
  // Regroupe toutes les occurrences de chaque exercice par nom
  const progressMap = {};
  hist.forEach((session, sIdx) => {
    session.exercises?.forEach(ex => {
      if (!ex.weight || ex.weight === 0) return;
      if (!progressMap[ex.name]) progressMap[ex.name] = [];
      progressMap[ex.name].push({
        date:    session.date,
        ts:      session.ts,
        sets:    ex.sets,
        reps:    ex.reps,
        weight:  ex.weight,
        unit:    ex.unit || "kg",
        calories:ex.calories,
        sIdx,
      });
    });
  });

  const statCards = [
    { icon:"🔥", val:stats.totalCal.toLocaleString(), unit:"kcal",    label:"Total calories",  color:"#f97316" },
    { icon:"🏋️", val:stats.totalSessions,            unit:"séances", label:"Séances totales", color:"#3b82f6" },
    { icon:"⚡", val:stats.streak,                   unit:"jours",   label:"Streak actuel",   color:"#f59e0b" },
    { icon:"📅", val:weekCals.toLocaleString(),      unit:"kcal",    label:"Cette semaine",   color:"#22c55e" },
  ];

  return (
    <div>
      <div className="gy-header">
        <div className="gy-logo">⚡ YASS-GYM</div>
        <button className="btn-ghost" onClick={onBack}>← Accueil</button>
      </div>

      <div className="gy-content">
        <h2 className="gy-page-title">📈 Mon Historique</h2>

        {/* Stats */}
        <div className="stats-grid">
          {statCards.map(s => (
            <div className="stat-card" key={s.label} style={{ borderColor:s.color+"44" }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
              <div className="stat-unit">{s.unit}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Objectif mensuel */}
        <div className="progress-box">
          <div className="progress-label">
            <span>Objectif mensuel ({GOAL} kcal)</span>
            <span>{monthCals} / {GOAL} kcal · {pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width:pct+"%" }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", border:"1px solid var(--border2)", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
          {[["seances","🗓️ Séances"],["progres","📊 Progression"]].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex:1, background: tab===key ? "var(--primary)" : "none",
              border:"none", padding:"10px", cursor:"pointer",
              color: tab===key ? "#fff" : "var(--textFaint)",
              fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700,
              transition:"all .2s",
            }}>{label}</button>
          ))}
        </div>

        {/* ── TAB SEANCES ── */}
        {tab === "seances" && (
          hist.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">💪</div>
              <p>Aucune séance enregistrée.<br/>Lance-toi !</p>
            </div>
          ) : hist.map((h, i) => (
            <div className="hist-card" key={i}>
              <div className="hist-top">
                <div>
                  {h.seanceName && (
                    <div style={{
                      display:"inline-block", background:"var(--primaryBg)",
                      border:"1px solid var(--primaryBorder)", borderRadius:6,
                      padding:"2px 10px", fontSize:11, color:"var(--primary)",
                      fontWeight:700, marginBottom:4,
                    }}>🏃 {h.seanceName}</div>
                  )}
                  <div className="hist-date">📅 {h.date} à {h.time}</div>
                  <div className="hist-cals">🔥 {h.totalCal} calories brûlées</div>
                </div>
                <div className="hist-count">{h.exercises.length} ex.</div>
              </div>
              <div className="hist-ex-list">
                {h.exercises.map((e, j) => {
                  const evo = getEvolution(hist, i, e.name, e.weight, e.unit||"kg");
                  return (
                    <div className="hist-ex-item" key={j}>
                      <span className="hist-ex-name">{e.name}</span>
                      <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end", gap:4 }}>
                        <span className="hist-ex-detail">
                          {e.sets}×{e.reps} · {e.weight}{e.unit} · {e.calories} cal
                        </span>
                        <EvoBadge evo={evo} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* ── TAB PROGRESSION ── */}
        {tab === "progres" && (
          Object.keys(progressMap).length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">📊</div>
              <p>Fais des séances avec des poids pour voir ta progression ici !</p>
            </div>
          ) : (
            Object.entries(progressMap).map(([exName, entries]) => {
              // Trie du plus ancien au plus récent pour le graphe
              const sorted  = [...entries].sort((a,b) => a.ts - b.ts);
              const first   = sorted[0];
              const last    = sorted[sorted.length - 1];
              const toKg    = (w, u) => u === "lbs" ? w * 0.453592 : w;
              const totalDiff = toKg(last.weight, last.unit) - toKg(first.weight, first.unit);
              const isPos   = totalDiff > 0;
              const isNeg   = totalDiff < 0;
              const maxW    = Math.max(...sorted.map(e => toKg(e.weight, e.unit)));

              return (
                <div key={exName} style={{
                  background:"var(--surface)", border:"1px solid var(--border)",
                  borderRadius:14, padding:"16px 18px", marginBottom:12,
                }}>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17, fontWeight:700, color:"var(--text)" }}>
                        {exName}
                      </div>
                      <div style={{ color:"var(--textFaint)", fontSize:11 }}>{entries.length} séance{entries.length>1?"s":""}</div>
                    </div>
                    {sorted.length > 1 && (
                      <div style={{
                        background: isPos ? "rgba(34,197,94,0.15)" : isNeg ? "rgba(239,68,68,0.15)" : "rgba(100,116,139,0.15)",
                        border: `1px solid ${isPos?"rgba(34,197,94,0.4)":isNeg?"rgba(239,68,68,0.4)":"rgba(100,116,139,0.3)"}`,
                        borderRadius:8, padding:"6px 12px", textAlign:"center",
                      }}>
                        <div style={{
                          fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700,
                          color: isPos ? "#22c55e" : isNeg ? "#ef4444" : "#94a3b8",
                        }}>
                          {isPos ? "▲ +" : isNeg ? "▼ -" : "="}{Math.abs(+totalDiff.toFixed(1))}kg
                        </div>
                        <div style={{ color:"var(--textFaint)", fontSize:10 }}>progression totale</div>
                      </div>
                    )}
                  </div>

                  {/* Mini graphe barres */}
                  <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:50, marginBottom:8 }}>
                    {sorted.map((e, idx) => {
                      const h = maxW > 0 ? Math.max(8, (toKg(e.weight,e.unit) / maxW) * 50) : 8;
                      const isLast = idx === sorted.length - 1;
                      return (
                        <div key={idx} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                          <div style={{ fontSize:9, color:"var(--textFaint)" }}>{e.weight}{e.unit}</div>
                          <div style={{
                            width:"100%", height:h,
                            background: isLast ? "var(--primary)" : "var(--surface2)",
                            border: `1px solid ${isLast ? "var(--primaryBorder)" : "var(--border2)"}`,
                            borderRadius:"4px 4px 0 0",
                            transition:"all .3s",
                          }}/>
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline des entrées */}
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {sorted.map((e, idx) => {
                      const prev = idx > 0 ? sorted[idx-1] : null;
                      let evo = null;
                      if (prev) {
                        const toKgV = (w,u) => u==="lbs"?w*0.453592:w;
                        const diff  = toKgV(e.weight,e.unit) - toKgV(prev.weight,prev.unit);
                        if (diff > 0)  evo = { type:"up",   diff:+diff.toFixed(1), unit:"kg" };
                        if (diff < 0)  evo = { type:"down", diff:+Math.abs(diff).toFixed(1), unit:"kg" };
                        if (diff === 0) evo = { type:"same" };
                      }
                      return (
                        <div key={idx} style={{
                          display:"flex", justifyContent:"space-between", alignItems:"center",
                          background:"var(--surface2)", borderRadius:8, padding:"6px 10px",
                        }}>
                          <span style={{ color:"var(--textFaint)", fontSize:11 }}>📅 {e.date}</span>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ color:"var(--textMuted)", fontSize:12, fontWeight:600 }}>
                              {e.sets}×{e.reps} · {e.weight}{e.unit}
                            </span>
                            <EvoBadge evo={evo} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}

export default HistoryPage;