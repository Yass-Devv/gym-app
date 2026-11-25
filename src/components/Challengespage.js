import React, { useEffect, useState } from "react";
import { api } from "../api";
import { syncSteps } from "../steps";
import { Logo, Back, Icon, photo } from "./Shell";
import { CHALLENGES, CHALLENGE_BY_ID, challengeName, evaluate, dayKey, addDays, diffDays, dayLabel } from "../data/challenges";

const nf = (n) => Math.round(n).toLocaleString("fr-FR");
const pctText = (p) => `${Math.round(p * 100)} %`;
const durationText = (days) => (days % 7 === 0 && days >= 28 ? `${days / 7} semaines` : `${days} jours`);
const unitWord = (ev, n) => (ev.unit === "day" ? `jour${n > 1 ? "s" : ""}` : `semaine${n > 1 ? "s" : ""}`);
const SUCCESS = 0.8; // part d'unités réussies à partir de laquelle le défi est « réussi »

// Où en est le défi, en une ligne
const statusLine = (ch, ev) =>
  ch.status === "abandoned" ? "Abandonné"
    : ch.status === "done" || ev.finished ? (ev.pct >= SUCCESS ? "Défi réussi" : "Terminé")
    : ev.unit === "day" ? `Jour ${ev.index + 1} sur ${ev.total}` : `Semaine ${ev.index + 1} sur ${ev.total}`;

// ─── Vignette d'un défi du catalogue ─────────────────────────────────────────
function Tile({ def, active, wide, onClick }) {
  return (
    <button type="button" className={"df-tile" + (wide ? " wide" : "")} onClick={onClick}>
      <img className="ph" src={photo(def.img)} alt="" loading="lazy" />
      {active && <span className="df-badge mono">En cours</span>}
      <span className="df-tile-txt">
        <span className="mono acc">{def.tag}</span>
        <span className="disp">{def.short || def.title}</span>
        {wide && <span className="df-pitch">{def.pitch}</span>}
      </span>
    </button>
  );
}

// ─── Réglages avant de lancer un défi ────────────────────────────────────────
function Setup({ def, user, today, onStart, onBack }) {
  const [cfg, setCfg]       = useState(def.defaults);
  const [saving, setSaving] = useState(false);
  const problem = def.check ? def.check(cfg, user) : "";
  const days    = def.days(cfg);

  const start = async () => {
    setSaving(true);
    try {
      await onStart({ type: def.id, config: { ...cfg, ...(def.prepare ? def.prepare(cfg, user) : {}) }, days, date: today });
    } finally { setSaving(false); }
  };

  return (
    <div className="screen">
      <div className="cover">
        <img className="ph" src={photo(def.img)} alt="" />
        <header className="bar"><Back label="Défis" onClick={onBack} /></header>
      </div>
      <div className="pad df-body">
        <div className="lift">
          <span className="mono acc">{def.tag}</span>
          <h1 className="disp h1" style={{ margin: "4px 0 10px" }}>{def.title}</h1>
        </div>
        <p className="ex-desc">{def.why}</p>

        <span className="lbl" style={{ marginTop: 4 }}>Comment ça marche</span>
        <ol className="df-rules">{def.rules.map((r) => <li key={r}>{r}</li>)}</ol>

        {def.options.filter((o) => !o.when || o.when(cfg)).map((o) => (
          <div key={o.key}>
            <span className="lbl">{o.label}</span>
            <div className="pills">
              {o.choices.map((c) => (
                <button type="button" key={String(c.v)} className={cfg[o.key] === c.v ? "on" : ""} aria-pressed={cfg[o.key] === c.v}
                  onClick={() => setCfg({ ...cfg, [o.key]: c.v })}>
                  {c.label}{c.hint ? <span> · {c.hint}</span> : null}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="df-sum">
          <span className="mono dim">Ton défi</span>
          <b>{problem || (def.summary ? def.summary(cfg, user) : durationText(days))}</b>
          {!problem && <span className="mono dim">{durationText(days)} · objectif de départ : {def.goal({ ...cfg, ...(def.prepare ? def.prepare(cfg, user) : {}) }, 0).toLowerCase()}</span>}
        </div>

        <button type="button" className="btn" onClick={start} disabled={Boolean(problem) || saving}>
          <span>Lancer le défi</span><span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Saisie d'un nombre (pas, secondes, kilomètres) ──────────────────────────
function NumberEntry({ input, value, onSave }) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => { setText(value ?? ""); }, [value]);
  const n = parseFloat(String(text).replace(",", "."));
  const valid = Number.isFinite(n) && n > 0 && n <= (input.max || 1000000);
  return (
    <form className="df-num" onSubmit={(e) => { e.preventDefault(); if (valid) onSave(n); }}>
      <input className="num" type="number" inputMode="decimal" min="0" max={input.max} step={input.step || "1"}
        placeholder={input.target ? String(input.target) : "0"} aria-label={input.unit}
        value={text} onChange={(e) => setText(e.target.value)} />
      <span className="mono dim">{input.unit}</span>
      <button type="submit" className="btn center" disabled={!valid}>Noter</button>
    </form>
  );
}

// ─── Un défi lancé : avancement, saisie du jour, calendrier ──────────────────
function Run({ ch, ctx, onLog, onEnd, onDelete, onRestart, onBack }) {
  const ev  = evaluate(ch, ctx);
  const def = ev.def;
  const lastDay = addDays(ch.startedOn, ch.days - 1);
  const maxDay  = ctx.today < lastDay ? ctx.today : lastDay;
  const [day, setDay]         = useState(maxDay);
  const [confirm, setConfirm] = useState(false);

  const live  = ch.status === "active" && !ev.finished;
  const i     = diffDays(ch.startedOn, day);         // numéro du jour choisi
  const w     = Math.floor(i / 7);                   // et de sa semaine
  const info  = def.unit === "day" ? def.day(ch, i, day, ctx) : null;
  const week  = def.unit === "week" ? ev.weeks[w] : null;
  const value = ch.log[day];
  const goal  = def.goal(ch.config, def.unit === "day" ? i : w);

  return (
    <div className="screen">
      <div className="cover">
        <img className="ph" src={photo(def.img)} alt="" />
        <header className="bar"><Back label="Défis" onClick={onBack} /></header>
      </div>
      <div className="pad df-body">
        <div className="lift">
          <span className="mono acc">{statusLine(ch, ev)}</span>
          <h1 className="disp h1" style={{ margin: "4px 0 6px" }}>{challengeName(ch)}</h1>
        </div>

        <div className="disp big">{ev.done}<span> / {ev.total} {unitWord(ev, ev.total)}</span></div>
        <div className="goal" style={{ marginTop: 8 }}>
          <div className="goal-top mono"><span>{unitWord(ev, ev.done)} réussi{ev.done > 1 ? "s" : ""}</span><span>{pctText(ev.pct)}</span></div>
          <div className="goal-track"><i style={{ width: `${ev.pct * 100}%` }} /></div>
        </div>

        {live && (
          <section className="df-check">
            <div className="df-check-head">
              <span className="mono dim">{def.unit === "day" ? "Objectif du jour" : `Objectif de la semaine ${w + 1}`}</span>
              <div className="day-nav">
                <button type="button" onClick={() => setDay(addDays(day, -1))} disabled={day <= ch.startedOn} aria-label="Jour précédent"><Icon name="back" size={18} stroke={2.6} /></button>
                <span>{day === ctx.today ? "Aujourd'hui" : dayLabel(day)}</span>
                <button type="button" onClick={() => setDay(addDays(day, 1))} disabled={day >= maxDay} aria-label="Jour suivant"><Icon name="next" size={18} stroke={2.6} /></button>
              </div>
            </div>
            <b className="title df-goal">{goal}</b>

            {/* Défi au jour le jour */}
            {info?.input.type === "bool" && (
              <div className="df-yn">
                <button type="button" className={value === true ? "on" : ""} aria-pressed={value === true}
                  onClick={() => onLog(day, value === true ? null : true)}><Icon name="check" size={20} stroke={2.8} />{info.input.yes}</button>
                <button type="button" className={value === false ? "on no" : "no"} aria-pressed={value === false}
                  onClick={() => onLog(day, value === false ? null : false)}><Icon name="close" size={18} stroke={2.8} />{info.input.no}</button>
              </div>
            )}
            {info?.input.type === "number" && (
              <>
                <NumberEntry input={info.input} value={typeof value === "number" ? value : null} onSave={(n) => onLog(day, n)} />
                {typeof value === "number" ? (
                  <p className="hint">{value >= info.input.target ? "Objectif atteint." : `Noté : ${nf(value)} ${info.input.unit}. Il en manque ${nf(info.input.target - value)}.`}</p>
                ) : typeof info.input.auto === "number" && (
                  <p className="hint">
                    Podomètre : {nf(info.input.auto)} {info.input.unit}.{" "}
                    {info.input.auto >= info.input.target ? "Objectif atteint." : `Il en manque ${nf(info.input.target - info.input.auto)}.`}
                  </p>
                )}
              </>
            )}
            {info?.input.type === "rest" && <p className="hint">Rien à faire aujourd'hui : le repos fait partie du défi.</p>}
            {info?.input.type === "meals" && (
              <>
                {[["kcal", "Calories", "kcal"], ["protein", "Protéines", "g"]].map(([k, label, unit]) => (
                  <div className="goal" key={k} style={{ margin: "12px 0 0" }}>
                    <div className="goal-top mono"><span>{label}</span><span>{nf(info.input.eaten[k])} / {nf(ch.config[k])} {unit}</span></div>
                    <div className="goal-track"><i style={{ width: `${Math.min(100, (info.input.eaten[k] / ch.config[k]) * 100)}%` }} /></div>
                  </div>
                ))}
                <p className="hint">{info.state === "ok" ? "Journée réussie." : "Compté automatiquement d'après l'onglet Repas."}</p>
              </>
            )}

            {/* Défi à la semaine */}
            {week && (
              <>
                {def.session?.type === "number" && (
                  <NumberEntry input={def.session} value={typeof value === "number" ? value : null} onSave={(n) => onLog(day, n)} />
                )}
                {def.session?.type === "bool" && (
                  <div className="df-yn one">
                    <button type="button" className={value === true ? "on" : ""} aria-pressed={value === true}
                      onClick={() => onLog(day, value === true ? null : true)}>
                      <Icon name="check" size={20} stroke={2.8} />{value === true ? "Séance notée" : "J'ai fait ma séance"}
                    </button>
                  </div>
                )}
                {week.sessions.map((s) => (
                  <div className="hist-line" key={s.key + s.value}>
                    <span>{dayLabel(s.key)}</span>
                    <span className="meal-kcal">
                      <span className="mono">{def.sessionLabel(s)}</span>
                      {def.session && <button type="button" className="link dim" onClick={() => onLog(s.key, null)}>Retirer</button>}
                    </span>
                  </div>
                ))}
                <p className="hint">
                  {week.ok ? "Semaine réussie." : `${week.sessions.length} séance${week.sessions.length > 1 ? "s" : ""} sur ${week.need} cette semaine.`}
                  {!def.session && " Compté automatiquement d'après tes séances enregistrées."}
                </p>
              </>
            )}
          </section>
        )}

        <span className="lbl">{def.unit === "day" ? "Jour par jour" : "Semaine par semaine"}</span>
        <div className={"df-cells" + (def.unit === "week" ? " weeks" : "")}>
          {ev.cells.map((c, n) => <i key={n} className={c.state} title={c.label}>{c.state === "rest" ? "R" : c.label}</i>)}
        </div>
        <div className="df-legend mono dim">
          <span><i className="ok" />Réussi</span><span><i className="ko" />Manqué</span>
          {ev.cells.some((c) => c.state === "tol") && <span><i className="tol" />Écart toléré</span>}
          {ev.cells.some((c) => c.state === "rest") && <span><i className="rest" />Repos</span>}
        </div>

        <span className="lbl">Les règles</span>
        <ol className="df-rules">{def.rules.map((r) => <li key={r}>{r}</li>)}</ol>

        {live ? (
          confirm ? (
            <div className="sheet-foot" style={{ padding: "16px 0 0", border: 0 }}>
              <button type="button" className="btn ghost center" onClick={() => setConfirm(false)}>Continuer</button>
              <button type="button" className="btn" onClick={() => onEnd("abandoned")}><span>Abandonner</span><span aria-hidden="true">×</span></button>
            </div>
          ) : (
            <button type="button" className="link dim" style={{ marginTop: 18 }} onClick={() => setConfirm(true)}>Abandonner ce défi</button>
          )
        ) : (
          <>
            <button type="button" className="btn" style={{ marginTop: 20 }} onClick={onRestart}><span>Relancer ce défi</span><span aria-hidden="true">→</span></button>
            <button type="button" className="link dim" style={{ marginTop: 8 }} onClick={onDelete}>Supprimer de mes défis</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PAGE DÉFIS ──────────────────────────────────────────────────────────────
function ChallengesPage({ user, onBack }) {
  const [list, setList]         = useState(null);   // null = chargement
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals]       = useState({});
  const [steps, setSteps]       = useState({});
  const [view, setView]         = useState(null);   // { setup: type } ou { run: id }
  const [error, setError]       = useState("");
  const [toast, setToast]       = useState("");

  const today = dayKey(new Date());
  const ctx   = { today, workouts, meals, steps };
  const fail  = (err) => (err.status ? err.message : "Serveur injoignable.");
  const say   = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const put   = (ch) => setList((cur) => cur.map((x) => (x.id === ch.id ? ch : x)));

  useEffect(() => {
    Promise.all([api.getChallenges(), api.getHistory()])
      .then(async ([rows, hist]) => {
        setWorkouts(hist);
        // Les défis arrivés au bout de leur durée passent en « terminé »
        const closed = await Promise.all(rows.map((c) =>
          (c.status === "active" && diffDays(c.startedOn, dayKey(new Date())) >= c.days ? api.endChallenge(c.id, "done").catch(() => c) : c)));
        setList(closed);
      })
      .catch((err) => { setList([]); setError(fail(err)); });
  }, []);

  // Les défis de nutrition lisent les repas, du premier jour du plus ancien jusqu'à aujourd'hui
  const mealsFrom = (list || []).filter((c) => CHALLENGE_BY_ID[c.type]?.needs === "meals").map((c) => c.startedOn).sort()[0];
  useEffect(() => {
    if (!mealsFrom) return;
    api.getMealSummary(mealsFrom, dayKey(new Date()))
      .then((rows) => setMeals(Object.fromEntries(rows.map((r) => [r.day, r]))))
      .catch(() => {});
  }, [mealsFrom]);

  // Le défi des pas lit le podomètre (pas envoyés par le téléphone)
  const stepsFrom = (list || []).filter((c) => CHALLENGE_BY_ID[c.type]?.needs === "steps").map((c) => c.startedOn).sort()[0];
  useEffect(() => {
    if (!stepsFrom) return;
    syncSteps().catch(() => null)
      .then(() => api.getSteps(stepsFrom, dayKey(new Date())))
      .then((rows) => setSteps(Object.fromEntries(rows.map((r) => [r.day, r.steps]))))
      .catch(() => {});
  }, [stepsFrom]);

  const start = async (body) => {
    try {
      const ch = await api.startChallenge(body);
      setList((cur) => [ch, ...cur]);
      setView({ run: ch.id });
      window.scrollTo(0, 0);
      say("Défi lancé. À toi de jouer.");
    } catch (err) { say(fail(err)); }
  };
  const log = async (ch, day, value) => {
    try { put(await api.logChallenge(ch.id, day, value)); } catch (err) { say(fail(err)); }
  };
  const end = async (ch, status) => {
    try { put(await api.endChallenge(ch.id, status)); setView(null); say("Défi arrêté."); } catch (err) { say(fail(err)); }
  };
  const remove = async (ch) => {
    try { await api.deleteChallenge(ch.id); setList((cur) => cur.filter((x) => x.id !== ch.id)); setView(null); } catch (err) { say(fail(err)); }
  };
  const open = (v) => { setView(v); window.scrollTo(0, 0); };

  const known  = (list || []).filter((c) => CHALLENGE_BY_ID[c.type]);
  const active = known.filter((c) => c.status === "active");
  const past   = known.filter((c) => c.status !== "active");
  const toastEl = toast && <div className="toast" role="status" style={{ bottom: "calc(18px + env(safe-area-inset-bottom))" }}>{toast}</div>;

  const running = view?.run && known.find((c) => c.id === view.run);
  if (running) {
    return (
      <>
        <Run key={running.id} ch={running} ctx={ctx} onBack={() => open(null)}
          onLog={(day, value) => log(running, day, value)} onEnd={(status) => end(running, status)}
          onDelete={() => remove(running)} onRestart={() => open({ setup: running.type })} />
        {toastEl}
      </>
    );
  }
  if (view?.setup) {
    return (
      <>
        <Setup def={CHALLENGE_BY_ID[view.setup]} user={user} today={today} onStart={start} onBack={() => open(null)} />
        {toastEl}
      </>
    );
  }

  return (
    <div className="screen">
      <header className="bar"><Back label="Accueil" onClick={onBack} /><Logo /></header>
      <div className="pad df-body">
        <h1 className="disp h1" style={{ margin: "6px 0 6px" }}>Défis</h1>
        <p className="hint" style={{ marginTop: 0 }}>Choisis un défi, règle-le à ton niveau et tiens-le jusqu'au bout.</p>
        {error && <div className="alert" role="alert">{error}</div>}

        {active.length > 0 && (
          <>
            <div className="sec"><span className="mono dim">En cours</span></div>
            {active.map((ch) => {
              const ev = evaluate(ch, ctx);
              return (
                <button type="button" className="row" key={ch.id} onClick={() => open({ run: ch.id })}>
                  <span className="th"><img className="ph" src={photo(ev.def.img)} alt="" /></span>
                  <span>
                    <b>{challengeName(ch)}</b>
                    <span className="mono dim">{statusLine(ch, ev)} · {ev.goal}</span>
                    <span className="goal-track" style={{ display: "block", marginTop: 7 }}><i style={{ width: `${ev.pct * 100}%` }} /></span>
                  </span>
                  <span className="mono acc">{pctText(ev.pct)}</span>
                </button>
              );
            })}
          </>
        )}

        <div className="sec"><span className="mono dim">Tous les défis</span><span className="mono dim">{CHALLENGES.length}</span></div>
        <div className="df-grid">
          {CHALLENGES.map((def, n) => {
            const mine = active.find((c) => c.type === def.id);
            return <Tile key={def.id} def={def} wide={n === 0} active={Boolean(mine)} onClick={() => open(mine ? { run: mine.id } : { setup: def.id })} />;
          })}
        </div>

        {past.length > 0 && (
          <>
            <div className="sec"><span className="mono dim">Terminés</span></div>
            {past.map((ch) => {
              const ev = evaluate(ch, ctx);
              return (
                <button type="button" className="row no-th" key={ch.id} onClick={() => open({ run: ch.id })}>
                  <span><b>{challengeName(ch)}</b><span className="mono dim">{statusLine(ch, ev)} · {ev.done} / {ev.total} {unitWord(ev, ev.total)}</span></span>
                  <span className="mono dim">{pctText(ev.pct)}</span>
                </button>
              );
            })}
          </>
        )}
      </div>
      {toastEl}
    </div>
  );
}

export default ChallengesPage;
