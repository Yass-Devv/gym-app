import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Logo, Mark, Avatar, photo, catPhoto, plural } from "./Shell";

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const WEEK  = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// ─── Accueil public : une photo, un titre, une action ────────────────────────
function Landing({ onLoginClick }) {
  return (
    <div className="screen hero">
      <div className="hero-img"><img className="ph" src={photo("hero-dos")} alt="" /></div>
      <div className="shade" />
      <header className="bar">
        <Logo />
        <button type="button" className="link" onClick={onLoginClick}>Connexion</button>
      </header>
      <div className="hero-bottom">
        <Mark size={56} />
        <div className="mono dim" style={{ marginTop: 16 }}>Carnet d'entraînement</div>
        <h1 className="disp hero-title">Soulève.<br />Note.<br />Reviens.</h1>
        <button type="button" className="btn" onClick={onLoginClick}>
          <span>Commencer</span><span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Tableau de bord ─────────────────────────────────────────────────────────
function Dashboard({ user, onGoExercises, onGoSeance, onGoHistory, onGoSettings }) {
  const [seances, setSeances] = useState([]);
  const [hist, setHist]       = useState([]);
  const [stats, setStats]     = useState({ totalCal: 0, totalSessions: 0, streak: 0 });
  const [error, setError]     = useState("");

  useEffect(() => {
    Promise.all([api.getSeances(), api.getHistory(), api.getStats()])
      .then(([s, h, st]) => { setSeances(s); setHist(h); setStats(st); })
      .catch((err) => setError(err.status ? err.message : "Serveur injoignable."));
  }, []);

  const now      = new Date();
  const todayIdx = (now.getDay() + 6) % 7; // lundi = 0
  const monday   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIdx);
  const doneDays = WEEK.map((_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return hist.some((h) => sameDay(new Date(h.ts), d));
  });

  // Séance du jour, sinon la prochaine dans la semaine
  let next = null;
  for (let i = 0; i < 7 && !next; i++) {
    const jour = WEEK[(todayIdx + i) % 7];
    const s = seances.find((x) => x.jour === jour);
    if (s) next = { seance: s, isToday: i === 0 };
  }
  const nextCount = next ? (next.seance.exercises || []).length : 0;
  const nextCat   = next?.seance.exercises?.[0]?.ex?.cat;
  const dateLabel = now.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="screen with-tabs">
      <header className="bar">
        <Logo />
        <button type="button" className="me-btn" onClick={onGoSettings} aria-label="Profil et réglages">
          <Avatar user={user} size={40} />
        </button>
      </header>

      <div className="pad">
        <span className="mono dim">{dateLabel}</span>
        <h1 className="disp h1" style={{ margin: "4px 0 16px" }}>Salut<br />{user.name}.</h1>

        {error && <div className="alert" role="alert">{error}</div>}

        {next ? (
          <button type="button" className="today" onClick={() => onGoSeance(next.seance.id)}>
            <img className="ph" src={nextCat ? catPhoto(nextCat) : photo("crossfit")} alt="" />
            <span className="today-go mono">Ouvrir →</span>
            <span className="today-txt">
              <span className="mono acc">{next.isToday ? "Aujourd'hui" : next.seance.jour}</span>
              <span className="disp" style={{ display: "block" }}>{next.seance.nom}</span>
              <span className="mono" style={{ color: "#c9c4ba" }}>{plural(nextCount, "exercice")}</span>
            </span>
          </button>
        ) : (
          <button type="button" className="today" onClick={() => onGoSeance(null)}>
            <img className="ph" src={photo("halteres-rack")} alt="" />
            <span className="today-go mono">Créer →</span>
            <span className="today-txt">
              <span className="mono acc">{JOURS[now.getDay()]}</span>
              <span className="disp" style={{ display: "block" }}>Aucune séance prévue</span>
              <span className="mono" style={{ color: "#c9c4ba" }}>Programme ta semaine</span>
            </span>
          </button>
        )}

        <div className="week" aria-label="Séances réalisées cette semaine">
          {WEEK.map((j, i) => (
            <div key={j} className={(doneDays[i] ? "done " : "") + (i === todayIdx ? "today-d" : "")}
              title={j + (doneDays[i] ? " : séance faite" : "")}>{j[0]}</div>
          ))}
        </div>

        <div className="kpis">
          <div><b className="disp">{stats.totalSessions}</b><span className="mono dim">Séance{stats.totalSessions > 1 ? "s" : ""}</span></div>
          <div><b className="disp">{stats.totalCal.toLocaleString("fr-FR")}</b><span className="mono dim">Kcal</span></div>
          <div><b className="disp">{stats.streak}</b><span className="mono dim">Jour{stats.streak > 1 ? "s" : ""} de suite</span></div>
        </div>

        <div className="sec"><span className="mono dim">Raccourcis</span></div>
        <button type="button" className="row" onClick={onGoExercises}>
          <span className="th"><img className="ph" src={photo("haltere-main")} alt="" /></span>
          <span><b>Catalogue d'exercices</b><span className="mono dim">Chercher, lire, ajouter</span></span>
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="row" onClick={onGoHistory}>
          <span className="th"><img className="ph" src={photo("coureurs")} alt="" /></span>
          <span><b>Ma progression</b><span className="mono dim">Charges, calories, régularité</span></span>
          <span aria-hidden="true">→</span>
        </button>

      </div>
    </div>
  );
}

function Home({ user, onLoginClick, ...rest }) {
  return user ? <Dashboard user={user} {...rest} /> : <Landing onLoginClick={onLoginClick} />;
}

export default Home;
