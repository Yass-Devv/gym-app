import React, { useRef, useState } from "react";
import { api } from "../api";
import { Avatar, HealthLogo, Mark, SENSITIVE_AREAS, fromKg, unitLabel } from "./Shell";

const APP_VERSION = "1.0.0";
const fr = (n) => String(n).replace(".", ",");

// ─── Textes légaux (brouillons à faire relire avant publication) ─────────────
const DOCS = {
  privacy: {
    title: "Politique de confidentialité",
    parts: [
      ["Données enregistrées", "Ton prénom, ton e-mail, ton mot de passe (stocké sous forme chiffrée, illisible), ton profil sportif (sexe, année de naissance, taille, poids, activités, objectif, niveau, zones sensibles), ta photo de profil si tu en ajoutes une, tes séances et ton historique d'entraînement."],
      ["À quoi elles servent", "Uniquement à faire fonctionner l'application : te connecter, adapter les exercices proposés, calculer tes statistiques et afficher ta progression."],
      ["Partage", "Tes données ne sont ni vendues ni transmises à des tiers. Aucune publicité, aucun traceur publicitaire."],
      ["Apple Santé", "Aucune donnée n'est lue ni écrite dans Apple Santé pour le moment. Si la synchronisation est proposée plus tard, elle te sera demandée explicitement et restera désactivable."],
      ["Tes droits", "Tu peux modifier ton profil à tout moment depuis les réglages. Pour obtenir une copie de tes données ou supprimer ton compte, contacte l'éditeur de l'application."],
    ],
  },
  terms: {
    title: "Conditions d'utilisation",
    parts: [
      ["Objet", "YASS-GYM est un carnet d'entraînement : il permet de préparer des séances, de noter ses performances et de suivre sa progression."],
      ["Santé", "Les exercices, les estimations de calories et l'indice de masse corporelle sont donnés à titre indicatif. Ils ne remplacent pas l'avis d'un médecin ou d'un coach diplômé. En cas de douleur, arrête l'exercice et consulte un professionnel de santé."],
      ["Zones sensibles", "Le signalement « zone sensible » est une aide visuelle fondée sur les grandes zones du corps sollicitées. Il ne constitue pas un avis médical et ne garantit pas qu'un exercice non signalé soit sans risque pour toi."],
      ["Compte", "Tu es responsable de la confidentialité de ton mot de passe et des informations que tu saisis."],
    ],
  },
};

// ─── Recadrage de la photo de profil ─────────────────────────────────────────
const VIEW = 260;  // taille de la zone de cadrage à l'écran
const OUT  = 320;  // taille de l'image enregistrée

function CropSheet({ img, onCancel, onSave, saving }) {
  const base = VIEW / Math.min(img.naturalWidth, img.naturalHeight); // l'image couvre toute la zone
  const [zoom, setZoom] = useState(1);
  const [pos, setPos]   = useState({
    x: (VIEW - img.naturalWidth * base) / 2,
    y: (VIEW - img.naturalHeight * base) / 2,
  });
  const drag = useRef(null);

  const clamp = (p, z) => {
    const w = img.naturalWidth * base * z, h = img.naturalHeight * base * z;
    return { x: Math.min(0, Math.max(VIEW - w, p.x)), y: Math.min(0, Math.max(VIEW - h, p.y)) };
  };

  // Le zoom garde le centre de la zone au même endroit de l'image
  const changeZoom = (z) => {
    const k = z / zoom, c = VIEW / 2;
    setPos(clamp({ x: c - (c - pos.x) * k, y: c - (c - pos.y) * k }, z));
    setZoom(z);
  };

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  };
  const move = (e) => {
    if (!drag.current) return;
    const d = drag.current;
    setPos(clamp({ x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }, zoom));
  };
  const up = () => { drag.current = null; };

  const save = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = OUT;
    const k = OUT / VIEW, s = base * zoom;
    canvas.getContext("2d").drawImage(img, pos.x * k, pos.y * k, img.naturalWidth * s * k, img.naturalHeight * s * k);
    onSave(canvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <div className="sheet-bg" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-label="Cadrer la photo" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head"><h3 className="disp">Cadre ta photo</h3></div>
        <div className="sheet-scroll" style={{ textAlign: "center" }}>
          <div className="crop" style={{ width: VIEW, height: VIEW }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <img src={img.src} alt="" draggable="false" style={{
              width: img.naturalWidth * base * zoom, height: img.naturalHeight * base * zoom,
              transform: `translate(${pos.x}px, ${pos.y}px)`,
            }} />
          </div>
          <p className="mono dim" style={{ margin: "14px 0 6px" }}>Glisse pour déplacer · curseur pour zoomer</p>
          <input type="range" className="ob-range" min="1" max="3" step="0.01" value={zoom}
            aria-label="Zoom" onChange={(e) => changeZoom(Number(e.target.value))} />
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn ghost center" onClick={onCancel}>Annuler</button>
          <button type="button" className="btn" onClick={save} disabled={saving}>
            {saving ? <span className="spin" aria-label="Enregistrement" /> : <><span>Enregistrer</span><span aria-hidden="true">→</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page Profil et réglages ─────────────────────────────────────────────────
function Settings({ user, theme, onTheme, onUser, onBack, onEditProfile, onLogout }) {
  const [doc, setDoc]       = useState(null);   // "privacy" | "terms"
  const [crop, setCrop]     = useState(null);   // image en cours de cadrage
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState("");
  const fileRef = useRef(null);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  // Enregistre une partie du profil et met à jour l'utilisateur en mémoire
  const save = async (patch) => {
    setSaving(true);
    try {
      onUser(await api.updateProfile(patch));
      return true;
    } catch (err) {
      say(err.status ? err.message : "Serveur injoignable.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => setCrop(img);
    img.onerror = () => { URL.revokeObjectURL(url); say("Cette image ne peut pas être lue."); };
    img.src = url;
  };
  const closeCrop = () => { if (crop) URL.revokeObjectURL(crop.src); setCrop(null); };

  const zones = user.sensitiveZones || [];
  const toggleZone = (id) =>
    save({ sensitiveZones: zones.includes(id) ? zones.filter((z) => z !== id) : [...zones, id] });

  // ── Texte légal ──
  if (doc) {
    const d = DOCS[doc];
    return (
      <div className="screen">
        <header className="bar">
          <button type="button" className="link" onClick={() => setDoc(null)}>← Réglages</button>
        </header>
        <div className="pad legal">
          <h1 className="disp h1">{d.title}</h1>
          {d.parts.map(([t, body]) => (
            <section key={t}><h2 className="mono acc">{t}</h2><p>{body}</p></section>
          ))}
        </div>
      </div>
    );
  }

  const age = user.birthYear ? new Date().getFullYear() - user.birthYear : null;
  const summary = [
    age && `${age} ans`,
    user.heightCm && `${user.heightCm} cm`,
    user.weightKg && `${fr(Math.round(fromKg(user.weightKg, user.unit) * 10) / 10)} ${unitLabel(user.unit)}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="screen">
      <header className="bar">
        <button type="button" className="link" onClick={onBack}>← Retour</button>
        <span className="mono dim">Profil et réglages</span>
      </header>

      <div className="pad">
        {/* ── Identité ── */}
        <div className="me">
          <button type="button" className="me-photo" onClick={() => fileRef.current.click()}
            aria-label="Changer la photo de profil">
            <Avatar user={user} size={104} />
            <span className="me-edit" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
              </svg>
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
          <h1 className="disp" style={{ fontSize: 40, marginTop: 14 }}>{user.name}</h1>
          <span className="mono dim">{user.email}</span>
          {user.avatar && (
            <button type="button" className="link dim" onClick={() => save({ avatar: null })}>Retirer la photo</button>
          )}
        </div>

        {/* ── Profil sportif ── */}
        <span className="lbl">Profil sportif</span>
        <button type="button" className="row no-th" onClick={onEditProfile}>
          <span><b>Mes informations</b><span className="mono dim">{summary || "À compléter"}</span></span>
          <span aria-hidden="true">→</span>
        </button>

        {/* ── Zones sensibles ── */}
        <span className="lbl">Zones sensibles</span>
        <p className="hint">Touche une zone pour l'ajouter ou l'enlever. Les exercices qui la sollicitent seront signalés.</p>
        <div className="pills">
          {SENSITIVE_AREAS.map((a) => {
            const on = zones.includes(a.id);
            return (
              <button type="button" key={a.id} className={on ? "on" : ""} aria-pressed={on}
                disabled={saving} onClick={() => toggleZone(a.id)}>
                {a.label}<span aria-hidden="true">{on ? " ×" : " +"}</span>
              </button>
            );
          })}
        </div>

        {/* ── Préférences ── */}
        <span className="lbl">Unité de poids</span>
        <div className="seg" role="group" aria-label="Unité de poids">
          {[["kg", "Kilogrammes (kg)"], ["lbs", "Livres (lb)"]].map(([u, label]) => (
            <button type="button" key={u} className={user.unit === u ? "on" : ""} aria-pressed={user.unit === u}
              disabled={saving} onClick={() => user.unit !== u && save({ unit: u })}>{label}</button>
          ))}
        </div>

        <span className="lbl">Apparence</span>
        <div className="seg" role="group" aria-label="Apparence">
          {[["sombre", "Sombre"], ["clair", "Clair"]].map(([t, label]) => (
            <button type="button" key={t} className={theme === t ? "on" : ""} aria-pressed={theme === t}
              onClick={() => onTheme(t)}>{label}</button>
          ))}
        </div>

        <span className="lbl">Connexions</span>
        <button type="button" className="row" style={{ gridTemplateColumns: "44px 1fr auto" }} disabled={saving}
          aria-pressed={user.healthOptin} onClick={() => save({ healthOptin: !user.healthOptin })}>
          <HealthLogo size={44} />
          <span><b>Apple Santé</b><span className="mono dim">Disponible avec l'app iPhone</span></span>
          <span className={"tag" + (user.healthOptin ? " on" : "")}>{user.healthOptin ? "Me prévenir" : "Non"}</span>
        </button>

        {/* ── À propos ── */}
        <span className="lbl">À propos</span>
        <button type="button" className="row no-th" onClick={() => setDoc("privacy")}>
          <span><b>Politique de confidentialité</b></span><span aria-hidden="true">→</span>
        </button>
        <button type="button" className="row no-th" onClick={() => setDoc("terms")}>
          <span><b>Conditions d'utilisation</b></span><span aria-hidden="true">→</span>
        </button>
        <div className="row" style={{ gridTemplateColumns: "44px 1fr auto" }}>
          <Mark size={44} />
          <span><b>YASS-GYM</b><span className="mono dim">Carnet d'entraînement</span></span>
          <span className="mono dim">v{APP_VERSION}</span>
        </div>

        <button type="button" className="btn ghost center" style={{ margin: "28px 0 40px" }} onClick={onLogout}>
          Déconnexion
        </button>
      </div>

      {crop && (
        <CropSheet img={crop} saving={saving} onCancel={closeCrop}
          onSave={async (dataUrl) => { if (await save({ avatar: dataUrl })) closeCrop(); }} />
      )}
      {toast && <div className="toast" role="status" style={{ bottom: 24 }}>{toast}</div>}
    </div>
  );
}

export default Settings;
