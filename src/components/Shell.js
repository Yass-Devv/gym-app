import React from "react";

// ─── Éléments partagés par tous les écrans ───────────────────────────────────

// Photos locales (public/images/da), toutes affichées en noir et blanc via la classe .ph
export const photo = (name) => `${process.env.PUBLIC_URL}/images/da/${name}.jpg`;

// Photo d'illustration par catégorie d'exercice
const CAT_PHOTO = {
  Jambes: "musculation", Dos: "dos", Poitrine: "halteres-rack", "Épaules": "rack",
  Bras: "curl", Abdos: "abdos", Cardio: "cardio", Fessiers: "cours-collectif", "Mobilité": "yoga",
};
export const catPhoto = (cat) => photo(CAT_PHOTO[cat] || "haltere-main");

// Les anciennes descriptions contiennent des émojis : on les retire à l'affichage
export const clean = (text = "") =>
  text.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{23E9}-\u{23FF}️‍]/gu, "")
      .replace(/\s{2,}/g, " ").trim();

export const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

// ─── Unités de poids ─────────────────────────────────────────────────────────
// La valeur stockée est "kg" ou "lbs" ; on affiche "lb".
export const LB = 0.453592;
export const unitLabel = (unit) => (unit === "lbs" ? "lb" : "kg");
export const fromKg = (kg, unit) => (unit === "lbs" ? kg / LB : kg);

// ─── Zones sensibles ─────────────────────────────────────────────────────────
// Chaque zone du corps est reliée aux grandes zones utilisées par les exercices (ex.zones).
// Les identifiants doivent correspondre à SENSITIVE dans server/src/routes/auth.js
export const SENSITIVE_AREAS = [
  { id: "cou",       label: "Cou",        zones: ["shoulders"] },
  { id: "epaules",   label: "Épaules",    zones: ["shoulders"] },
  { id: "coudes",    label: "Coudes",     zones: ["arms"] },
  { id: "poignets",  label: "Poignets",   zones: ["arms"] },
  { id: "dos",       label: "Haut du dos", zones: ["back"] },
  { id: "lombaires", label: "Bas du dos", zones: ["back", "core"] },
  { id: "hanches",   label: "Hanches",    zones: ["legs"] },
  { id: "genoux",    label: "Genoux",     zones: ["legs"] },
  { id: "chevilles", label: "Chevilles",  zones: ["legs"] },
];

// Zones sensibles de l'utilisateur sollicitées par un exercice (libellés), ou [] si aucune
export const sensitiveHits = (ex, user) => {
  const mine = user?.sensitiveZones || [];
  const zones = ex?.zones || [];
  return SENSITIVE_AREAS
    .filter((a) => mine.includes(a.id) && a.zones.some((z) => zones.includes(z)))
    .map((a) => a.label);
};

export function SensitiveBadge({ ex, user, full = false }) {
  const hits = sensitiveHits(ex, user);
  if (hits.length === 0) return null;
  return (
    <span className="warn" title={`Sollicite : ${hits.join(", ")}`}>
      <i aria-hidden="true">!</i>
      {full ? `Attention, zone sensible : ${hits.join(", ").toLowerCase()}` : "Zone sensible"}
    </span>
  );
}

// ─── Identité ────────────────────────────────────────────────────────────────
// Logo texte : YASS, un haltère orange, GYM
export function Logo() {
  return (
    <span className="logo" role="img" aria-label="YASS-GYM">
      YASS
      <svg viewBox="0 0 60 28" aria-hidden="true">
        <g transform="skewX(-8) translate(4 0)" fill="currentColor">
          <rect x="13" y="12" width="34" height="4" />
          <rect x="8" y="2" width="7" height="24" rx="3" /><rect x="1" y="6" width="5" height="16" rx="2.5" />
          <rect x="45" y="2" width="7" height="24" rx="3" /><rect x="54" y="6" width="5" height="16" rx="2.5" />
        </g>
      </svg>
      GYM
    </span>
  );
}

// Sigle de l'appli : un Y dont les branches portent des haltères, sur tuile orange
export function Mark({ size = 48 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="YASS-GYM">
      <rect width="512" height="512" rx="112" fill="#ff6a00" />
      <g fill="none" stroke="#0d0f12" strokeLinecap="round">
        <path d="M256 400V270" strokeWidth="38" />
        <path d="M256 270L165 157M256 270L347 157" strokeWidth="36" />
        <path d="M126 188L204 126M121 154L171 114M386 188L308 126M391 154L341 114" strokeWidth="28" />
      </g>
    </svg>
  );
}

export function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  return user?.avatar
    ? <img className="avatar" style={style} src={user.avatar} alt="" />
    : <span className="avatar" style={style} aria-hidden="true">{(user?.name || "?").trim().charAt(0).toUpperCase()}</span>;
}

// Pictogramme « Santé » : un cœur sur une tuile blanche
export function HealthLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Apple Santé">
      <defs>
        <linearGradient id="health-heart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5f8f" />
          <stop offset="1" stopColor="#ff2d55" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#fff" />
      <path fill="url(#health-heart)" d="M44.2 13.5c-3.3 0-6 1.6-7.7 4.1-1.7-2.5-4.4-4.1-7.7-4.1-5 0-8.8 4-8.8 9 0 6.600 6.200 11.300 16.500 19.600 10.300-8.300 16.500-13 16.500-19.600 0-5-3.800-9-8.800-9z" />
    </svg>
  );
}

const TABS = [
  ["accueil", "Accueil"], ["exercises", "Exercices"], ["seance", "Séances"], ["history", "Suivi"],
];

export function TabBar({ page, onNav }) {
  return (
    <nav className="tabs" aria-label="Navigation principale">
      {TABS.map(([id, label]) => (
        <button key={id} type="button" className={page === id ? "on" : ""}
          aria-current={page === id ? "page" : undefined} onClick={() => onNav(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}
