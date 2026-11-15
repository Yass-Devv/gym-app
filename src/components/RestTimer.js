import React, { useState, useEffect, useRef } from "react";
import { Icon } from "./Shell";

// ─── Chronomètre de repos entre deux séries ──────────────────────────────────
// À la fin : 5 secondes de bips (sauf si le son est coupé) et de vibrations, puis retour à la durée de départ.

const ALARM_MS = 5000;
const STEP = 15;
const MIN_REST = 15;
const MAX_REST = 600;

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Un seul contexte audio pour toute l'appli, créé au premier appui (les navigateurs l'exigent)
let audioCtx = null;
const unlockAudio = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && Ctx) audioCtx = new Ctx();
    if (audioCtx?.state === "suspended") audioCtx.resume();
  } catch { /* pas de son sur cet appareil */ }
};

// Série de bips sur 5 secondes ; renvoie la fonction qui les arrête
function playBeeps() {
  if (!audioCtx) return () => {};
  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  gain.connect(audioCtx.destination);
  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 880;
  osc.connect(gain);
  const t0 = audioCtx.currentTime;
  for (let t = 0; t < ALARM_MS / 1000; t += 0.5) {
    gain.gain.setValueAtTime(0.25, t0 + t);
    gain.gain.setValueAtTime(0, t0 + t + 0.25);
  }
  osc.start(t0);
  osc.stop(t0 + ALARM_MS / 1000);
  return () => { try { osc.stop(); } catch { /* déjà arrêté */ } gain.disconnect(); };
}

const vibrate = (pattern) => { try { navigator.vibrate?.(pattern); } catch { /* non pris en charge */ } };

function RestTimer({ sets, total, onTotal, muted, onMute }) {
  const [left, setLeft]   = useState(total);
  const [state, setState] = useState("idle"); // idle | run | pause | alarm
  const [done, setDone]   = useState(0);       // repos terminés = séries faites
  const endAt     = useRef(0);
  const stopSound = useRef(() => {});
  const alarmEnd  = useRef(null);
  const mutedRef  = useRef(muted);
  mutedRef.current = muted;

  // Au repos, le chrono suit la durée choisie (elle est commune à tous les exercices)
  useEffect(() => { if (state === "idle") setLeft(total); }, [total, state]);

  const stopAlarm = () => {
    stopSound.current();
    stopSound.current = () => {};
    vibrate(0);
    clearTimeout(alarmEnd.current);
    setState("idle");
  };

  // Décompte calé sur l'heure de fin : reste juste même si l'onglet passe en arrière-plan
  useEffect(() => {
    if (state !== "run") return undefined;
    const tick = () => {
      const s = Math.ceil((endAt.current - Date.now()) / 1000);
      if (s > 0) return setLeft(s);
      setLeft(0);
      setDone((d) => d + 1);
      setState("alarm");
      if (!mutedRef.current) stopSound.current = playBeeps();
      vibrate(Array.from({ length: 10 }, (_, i) => (i % 2 ? 150 : 350)));
      alarmEnd.current = setTimeout(stopAlarm, ALARM_MS);
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Couper le son pendant la sonnerie l'arrête tout de suite
  useEffect(() => { if (muted) { stopSound.current(); stopSound.current = () => {}; } }, [muted]);

  // En quittant l'écran, on arrête tout
  useEffect(() => () => { stopSound.current(); vibrate(0); clearTimeout(alarmEnd.current); }, []);

  const toggle = () => {
    if (state === "alarm") return stopAlarm();
    if (state === "run") { setLeft(Math.max(1, Math.ceil((endAt.current - Date.now()) / 1000))); return setState("pause"); }
    unlockAudio();
    if (state === "idle" && done >= sets) setDone(0); // toutes les séries étaient faites : on repart de la première
    endAt.current = Date.now() + left * 1000;
    setState("run");
  };

  const reset = () => { setState("idle"); setLeft(total); };
  const adjust = (d) => onTotal(Math.min(MAX_REST, Math.max(MIN_REST, total + d)));

  const active = state === "run" || state === "pause";
  const label =
    state === "alarm" ? "Repos terminé, c'est reparti" :
    done >= sets      ? "Toutes les séries sont faites" :
                        `Repos après la série ${done + 1} sur ${sets}`;

  return (
    <div className={"rest " + state}>
      <button type="button" className="rest-go" onClick={toggle}
        aria-label={state === "run" ? "Mettre le chrono en pause" : state === "alarm" ? "Arrêter la sonnerie" : "Lancer le chrono de repos"}>
        <Icon name={state === "run" ? "pause" : state === "alarm" ? "check" : "play"} size={22} stroke={2.6} />
      </button>

      <div className="rest-main">
        <b className="rest-time" role="timer" aria-live="off">{mmss(left)}</b>
        <span className="rest-label">{label}</span>
      </div>

      {active ? (
        <button type="button" className="rest-btn" onClick={reset} aria-label="Remettre le chrono à zéro">
          <Icon name="reset" size={20} />
        </button>
      ) : state === "idle" && (
        <div className="rest-adj" role="group" aria-label="Durée du repos">
          <button type="button" onClick={() => adjust(-STEP)} disabled={total <= MIN_REST} aria-label={`Retirer ${STEP} secondes`}>−</button>
          <button type="button" onClick={() => adjust(STEP)} disabled={total >= MAX_REST} aria-label={`Ajouter ${STEP} secondes`}>+</button>
        </div>
      )}

      <button type="button" className={"rest-btn" + (muted ? " off" : "")} onClick={() => onMute(!muted)}
        aria-pressed={muted} aria-label={muted ? "Remettre le son" : "Couper le son"} title={muted ? "Son coupé" : "Son activé"}>
        <Icon name={muted ? "mute" : "sound"} size={20} />
      </button>

      <i className="rest-bar" style={{ width: `${state === "alarm" ? 100 : active ? (1 - left / total) * 100 : 0}%` }} />
    </div>
  );
}

export default RestTimer;
