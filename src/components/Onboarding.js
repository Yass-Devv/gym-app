import React, { useState } from "react";
import { api } from "../api";
import { photo, HealthLogo, SENSITIVE_AREAS, LB, unitLabel } from "./Shell";
import "./auth.css";

// Les identifiants doivent correspondre à server/src/routes/auth.js
const ACTIVITIES = [
  { id: "musculation", label: "Musculation" },
  { id: "course",      label: "Course" },
  { id: "cardio",      label: "Cardio" },
  { id: "boxe",        label: "Boxe" },
  { id: "danse",       label: "Danse" },
  { id: "yoga",        label: "Yoga" },
  { id: "velo",        label: "Vélo" },
  { id: "natation",    label: "Natation" },
  { id: "crossfit",    label: "CrossFit" },
  { id: "sports-co",   label: "Sports co" },
];

const GOALS = [
  { id: "perte-poids",  label: "Perdre du poids",     desc: "Brûler des calories, s'affiner" },
  { id: "prise-muscle", label: "Prendre du muscle",   desc: "Force et masse musculaire" },
  { id: "forme",        label: "Rester en forme",     desc: "Bouger régulièrement, se sentir bien" },
  { id: "endurance",    label: "Gagner en endurance", desc: "Souffle, cardio, résistance" },
];

const LEVELS = [
  { id: "debutant",      label: "Débutant",      desc: "Je commence ou je reprends" },
  { id: "intermediaire", label: "Intermédiaire", desc: "Je m'entraîne régulièrement" },
  { id: "avance",        label: "Avancé",        desc: "Plusieurs années de pratique" },
];

const STEPS = ["gender", "age", "height", "weight", "activities", "goal", "level", "zones", "health", "recap"];
const THIS_YEAR = new Date().getFullYear();
const two = (n) => String(n).padStart(2, "0");
const fr  = (n) => String(n).replace(".", ",");

const bmiLabel = (bmi) =>
  bmi < 18.5 ? "Insuffisance pondérale" : bmi < 25 ? "Corpulence normale" : bmi < 30 ? "Surpoids" : "Obésité";

// Très grand chiffre, boutons − / + et curseur
function NumberPicker({ value, onChange, min, max, step = 1, unit }) {
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="ob-number">
      <div className="ob-number-row">
        <button type="button" className="ob-step" onClick={() => onChange(clamp(value - step))}
          disabled={value <= min} aria-label="Diminuer">−</button>
        <div className="disp ob-number-value">{step < 1 ? fr(value.toFixed(1)) : value}<span>{unit}</span></div>
        <button type="button" className="ob-step" onClick={() => onChange(clamp(value + step))}
          disabled={value >= max} aria-label="Augmenter">+</button>
      </div>
      <input type="range" className="ob-range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} aria-label={unit} />
      <div className="ob-range-ends mono"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

// Liste numérotée à choix unique
function Options({ items, value, onPick }) {
  return items.map((it, i) => (
    <button type="button" key={it.id} className={"ob-opt" + (value === it.id ? " on" : "")}
      aria-pressed={value === it.id} onClick={() => onPick(it.id)}>
      <span className="mono">{two(i + 1)}</span>
      <span><b>{it.label}</b><small>{it.desc}</small></span>
      <i aria-hidden="true" />
    </button>
  ));
}

function Onboarding({ user, onDone, onLogout, onClose }) {
  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [p, setP] = useState(() => ({
    gender:      user?.gender || null,
    age:         user?.birthYear ? THIS_YEAR - user.birthYear : 25,
    heightCm:    user?.heightCm || 172,
    weightKg:    user?.weightKg || 70,
    activities:  user?.activities || [],
    goal:        user?.goal || null,
    level:       user?.level || null,
    daysPerWeek: user?.daysPerWeek || 3,
    healthOptin: user?.healthOptin || false,
    unit:        user?.unit || "kg",
    sensitiveZones: user?.sensitiveZones || [],
  }));

  const id   = STEPS[step];
  const last = step === STEPS.length - 1;
  const upd  = (patch) => setP((cur) => ({ ...cur, ...patch }));

  const canContinue =
    id === "gender"     ? Boolean(p.gender) :
    id === "activities" ? p.activities.length > 0 :
    id === "goal"       ? Boolean(p.goal) :
    id === "level"      ? Boolean(p.level) : true;

  const toggleActivity = (a) =>
    upd({ activities: p.activities.includes(a) ? p.activities.filter((x) => x !== a) : [...p.activities, a] });

  const toggleZone = (z) =>
    upd({ sensitiveZones: p.sensitiveZones.includes(z) ? p.sensitiveZones.filter((x) => x !== z) : [...p.sensitiveZones, z] });

  // Le poids est toujours gardé en kg ; en livres on convertit à l'affichage
  const lb = p.unit === "lbs";
  const shownWeight = lb ? Math.round(p.weightKg / LB) : p.weightKg;
  const setWeight = (v) => upd({ weightKg: lb ? Math.round(v * LB * 10) / 10 : v });

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateProfile({
        gender: p.gender,
        birthYear: THIS_YEAR - p.age,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        activities: p.activities,
        goal: p.goal,
        level: p.level,
        daysPerWeek: p.daysPerWeek,
        healthOptin: p.healthOptin,
        unit: p.unit,
        sensitiveZones: p.sensitiveZones,
        onboarded: true,
      });
      onDone(updated);
    } catch (err) {
      setError(err.status ? err.message : "Serveur injoignable. Réessaie dans un instant.");
      setSaving(false);
    }
  };

  const next = () => (last ? finish() : setStep(step + 1));
  const back = () => { setError(""); setStep(step - 1); };
  const bmi  = p.weightKg / (p.heightCm / 100) ** 2;

  const cta =
    id === "activities" && p.activities.length > 0 ? `${p.activities.length} choisie${p.activities.length > 1 ? "s" : ""}` : "→";

  return (
    <div className="screen ob-screen">
      <header className="bar">
        {step > 0
          ? <button type="button" className="link" onClick={back}>← Retour</button>
          : onClose
            ? <button type="button" className="link" onClick={onClose}>← Fermer</button>
            : <span className="mono dim">Ton profil</span>}
        <span className="mono dim">{two(step + 1)} / {two(STEPS.length)}</span>
      </header>
      <div className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
        <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <main className="ob-body" key={id}>
        {id === "gender" && (
          <>
            <h1 className="disp h1">Bienvenue<br />{user?.name}.</h1>
            <p className="ob-sub">Quelques questions pour régler l'appli sur toi. Tu es…</p>
            <div className="ob-tiles">
              {[["homme", "Un homme", "hero-dos"], ["femme", "Une femme", "barre-nb"]].map(([g, label, img]) => (
                <button type="button" key={g} className={"ob-tile tall" + (p.gender === g ? " on" : "")}
                  aria-pressed={p.gender === g} onClick={() => upd({ gender: g })}>
                  <img className="ph" src={photo(img)} alt="" /><span>{label}</span>
                </button>
              ))}
            </div>
            <p className="ob-hint">Sert à choisir le catalogue d'exercices proposé.</p>
          </>
        )}

        {id === "age" && (
          <>
            <h1 className="disp h1">Quel âge<br />as-tu ?</h1>
            <NumberPicker value={p.age} onChange={(age) => upd({ age })} min={13} max={90} unit="ans" />
          </>
        )}

        {id === "height" && (
          <>
            <h1 className="disp h1">Ta taille ?</h1>
            <NumberPicker value={p.heightCm} onChange={(heightCm) => upd({ heightCm })} min={120} max={220} unit="cm" />
          </>
        )}

        {id === "weight" && (
          <>
            <h1 className="disp h1">Ton poids ?</h1>
            <div className="seg" role="group" aria-label="Unité de poids" style={{ marginTop: 18 }}>
              {[["kg", "Kilogrammes"], ["lbs", "Livres"]].map(([u, label]) => (
                <button type="button" key={u} className={p.unit === u ? "on" : ""} aria-pressed={p.unit === u}
                  onClick={() => upd({ unit: u })}>{label}</button>
              ))}
            </div>
            {lb
              ? <NumberPicker key="lb" value={shownWeight} onChange={setWeight} min={77} max={440} unit="lb" />
              : <NumberPicker key="kg" value={shownWeight} onChange={setWeight} min={35} max={200} step={0.5} unit="kg" />}
            <p className="ob-hint">L'unité choisie sera utilisée partout dans l'appli. Tu pourras la changer dans les réglages.</p>
          </>
        )}

        {id === "activities" && (
          <>
            <h1 className="disp h1">Tu pratiques<br />quoi ?</h1>
            <p className="ob-sub">Une ou plusieurs activités.</p>
            <div className="ob-tiles">
              {ACTIVITIES.map((a) => {
                const on = p.activities.includes(a.id);
                return (
                  <button type="button" key={a.id} className={"ob-tile" + (on ? " on" : "")}
                    aria-pressed={on} onClick={() => toggleActivity(a.id)}>
                    <img className="ph" src={photo(a.id)} alt="" loading="lazy" /><span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {id === "goal" && (
          <>
            <h1 className="disp h1">Ton objectif ?</h1>
            <p className="ob-sub">Un seul, le plus important pour toi.</p>
            <Options items={GOALS} value={p.goal} onPick={(goal) => upd({ goal })} />
          </>
        )}

        {id === "level" && (
          <>
            <h1 className="disp h1">Ton niveau ?</h1>
            <p className="ob-sub">Sois honnête, personne ne regarde.</p>
            <Options items={LEVELS} value={p.level} onPick={(level) => upd({ level })} />
            <span className="mono ob-h2">Séances par semaine</span>
            <div className="days">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button type="button" key={d} className={p.daysPerWeek === d ? "on" : ""}
                  aria-pressed={p.daysPerWeek === d} onClick={() => upd({ daysPerWeek: d })}>{d}</button>
              ))}
            </div>
          </>
        )}

        {id === "zones" && (
          <>
            <h1 className="disp h1">Une zone<br />sensible ?</h1>
            <p className="ob-sub">Si tu as mal quelque part, indique-le : les exercices qui sollicitent cette zone seront signalés. Sinon, continue.</p>
            <div className="pills">
              {SENSITIVE_AREAS.map((a) => {
                const on = p.sensitiveZones.includes(a.id);
                return (
                  <button type="button" key={a.id} className={on ? "on" : ""} aria-pressed={on}
                    onClick={() => toggleZone(a.id)}>{a.label}<span aria-hidden="true">{on ? " ×" : " +"}</span></button>
                );
              })}
            </div>
            <p className="ob-hint">Ce signalement est une aide, pas un avis médical. Tu pourras modifier ces zones dans les réglages.</p>
          </>
        )}

        {id === "health" && (
          <>
            <HealthLogo size={72} />
            <h1 className="disp h1" style={{ marginTop: 18 }}>Apple<br />Santé.</h1>
            <p className="ob-sub">
              Pas, fréquence cardiaque, calories actives : la synchronisation avec Santé
              arrivera avec la version iPhone de YASS-GYM. Elle n'est pas encore disponible.
            </p>
            <button type="button" className={"ob-toggle" + (p.healthOptin ? " on" : "")}
              aria-pressed={p.healthOptin} onClick={() => upd({ healthOptin: !p.healthOptin })}>
              <span><b>Activer dès que possible</b><small>On reliera Santé à ton compte à la sortie de l'app iPhone</small></span>
              <span className="mono">{p.healthOptin ? "Oui" : "Non"}</span>
            </button>
            <p className="ob-hint">En attendant, tes séances et tes calories sont suivies ici.</p>
          </>
        )}

        {id === "recap" && (
          <div className="ob-recap">
            <h1 className="disp h1">C'est noté.</h1>
            <p className="ob-sub">Vérifie, puis lance-toi.</p>
            <div className="kpis">
              <div><b className="disp">{p.age}<span>ans</span></b></div>
              <div><b className="disp">{p.heightCm}<span>cm</span></b></div>
              <div><b className="disp">{fr(shownWeight)}<span>{unitLabel(p.unit)}</span></b></div>
            </div>
            <dl>
              <div><dt>IMC</dt><dd>{fr(bmi.toFixed(1))} — {bmiLabel(bmi)}</dd></div>
              <div><dt>Objectif</dt><dd>{GOALS.find((g) => g.id === p.goal)?.label}</dd></div>
              <div><dt>Niveau</dt><dd>{LEVELS.find((l) => l.id === p.level)?.label}</dd></div>
              <div><dt>Rythme</dt><dd>{p.daysPerWeek} séance{p.daysPerWeek > 1 ? "s" : ""} par semaine</dd></div>
              <div><dt>Activités</dt><dd>{p.activities.map((a) => ACTIVITIES.find((x) => x.id === a)?.label).join(", ")}</dd></div>
              <div><dt>Zones sensibles</dt><dd>{p.sensitiveZones.length ? p.sensitiveZones.map((z) => SENSITIVE_AREAS.find((a) => a.id === z)?.label).join(", ") : "Aucune"}</dd></div>
              <div><dt>Apple Santé</dt><dd>{p.healthOptin ? "À activer à la sortie de l'app" : "Non"}</dd></div>
            </dl>
            <p className="ob-hint">L'IMC est un repère indicatif : il ne tient pas compte de la masse musculaire.</p>
          </div>
        )}
      </main>

      <footer className="ob-foot">
        {error && <div className="alert" role="alert">{error}</div>}
        <button type="button" className="btn" onClick={next} disabled={!canContinue || saving}>
          {saving
            ? <span className="spin" aria-label="Enregistrement" />
            : <><span>{last ? "Enregistrer" : "Continuer"}</span><span aria-hidden="true">{last ? "→" : cta}</span></>}
        </button>
        {step === 0 && !onClose && onLogout && (
          <button type="button" className="link" onClick={onLogout}>Se déconnecter</button>
        )}
      </footer>
    </div>
  );
}

export default Onboarding;
