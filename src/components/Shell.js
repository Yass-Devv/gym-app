import React from "react";
import { exPhotos } from "../data/exercises";

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

// Pictogramme « Podomètre » : deux empreintes de pas sur une tuile orange
export function StepsLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Podomètre">
      <rect width="64" height="64" rx="15" fill="var(--acc)" />
      <g fill="#0b0b0b">
        <ellipse cx="24" cy="25" rx="6.2" ry="9.5" transform="rotate(-8 24 25)" />
        <ellipse cx="25.5" cy="40" rx="4.6" ry="3.6" transform="rotate(-8 25.5 40)" />
        <ellipse cx="40" cy="31" rx="6.2" ry="9.5" transform="rotate(8 40 31)" />
        <ellipse cx="38.5" cy="46" rx="4.6" ry="3.6" transform="rotate(8 38.5 46)" />
      </g>
    </svg>
  );
}

// ─── Pictogrammes ────────────────────────────────────────────────────────────
// Dessinés au trait, extrémités arrondies, dans l'esprit de l'haltère du logo
const ICONS = {
  accueil: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.8 9.8V20h12.4V9.8" /><path d="M10 20v-5.2h4V20" /></>,
  exercises: <><path d="M7.2 12h9.6" /><rect x="3.8" y="6.8" width="3.4" height="10.4" rx="1.6" /><rect x="16.8" y="6.8" width="3.4" height="10.4" rx="1.6" /><path d="M1.6 10v4M22.4 10v4" /></>,
  seance: <><rect x="3.8" y="5" width="16.4" height="15.2" rx="3.6" /><path d="M8 3v4M16 3v4" /><path d="m8.4 13.2 2.6 2.6 4.8-5.4" /></>,
  history: <><path d="m3 16.5 5.4-5.4 3.8 3.2L20.5 6" /><path d="M15.2 6h5.3v5.3" /><path d="M3 20.5h18" /></>,
  repas: <><path d="M6 3v6.2a2.5 2.5 0 0 0 5 0V3" /><path d="M8.5 3v18" /><path d="M17.5 21v-7.5h-3c0-4.4 1-8 3-10.5z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  back: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  next: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  play: <path d="M8 5.200v13.600L18.8 12z" fill="currentColor" />,
  pause: <path d="M8.5 5.500v13M15.5 5.500v13" />,
  reset: <><path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" /><path d="M4.5 4.500v4.200h4.2" /></>,
  sound: <><path d="M4 9.500v5h3.500l4.5 4v-13l-4.5 4z" /><path d="M15.5 9.200a4.2 4.2 0 0 1 0 5.600M18.2 6.500a7.8 7.8 0 0 1 0 11" /></>,
  mute: <><path d="M4 9.500v5h3.500l4.5 4v-13l-4.5 4z" /><path d="m16 9.5 5 5M21 9.500l-5 5" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.500M12 7.600v.1" /></>,
  check: <path d="m5.5 12.5 4.2 4.2 8.8-9.4" />,
  close: <path d="m6.5 6.5 11 11M17.5 6.500l-11 11" />,
  arrow: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  user: <><circle cx="12" cy="8.2" r="3.7" /><path d="M4.8 20c.8-3.700 3.700-5.600 7.200-5.600s6.400 1.900 7.200 5.600" /></>,
};

export function Icon({ name, size = 24, stroke = 2 }) {
  return (
    <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// Bouton de retour : une pastille bien visible, avec un chevron
export function Back({ label = "Retour", onClick }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      <Icon name="back" size={18} stroke={2.8} /><span>{label}</span>
    </button>
  );
}

// Bouton de fermeture : une croix dans un rond, qui pivote au survol
export function Close({ onClick }) {
  return (
    <button type="button" className="close" aria-label="Fermer" title="Fermer" onClick={onClick}>
      <Icon name="close" size={18} stroke={2.6} />
    </button>
  );
}

// Flèche d'un raccourci : un rond où la flèche sort à droite et revient par la gauche au survol
export function Go() {
  return (
    <span className="go" aria-hidden="true">
      <Icon name="arrow" size={18} stroke={2.4} /><Icon name="arrow" size={18} stroke={2.4} />
    </span>
  );
}

// Entrée vers la connexion : une pastille avec la silhouette du compte
export function LoginPill({ onClick }) {
  return (
    <button type="button" className="login-pill" onClick={onClick}>
      <span className="login-pill-ic"><Icon name="user" size={16} stroke={2.4} /></span>
      <span>Connexion</span>
      <Icon name="next" size={15} stroke={2.8} />
    </button>
  );
}

// Vignette d'un exercice : sa photo, ou l'haltère quand il n'en a pas encore
export function ExThumb({ ex }) {
  const [failed, setFailed] = React.useState(false);
  const photos = exPhotos(ex);
  return (
    <span className="th">
      {photos && !failed
        ? <img className="ph" src={photos[0]} alt="" loading="lazy" onError={() => setFailed(true)} />
        : <Icon name="exercises" size={26} stroke={1.6} />}
    </span>
  );
}

const TABS = [
  ["accueil", "Accueil"], ["exercises", "Exercices"], ["seance", "Séances"], ["repas", "Repas"], ["history", "Suivi"],
];

export function TabBar({ page, onNav }) {
  return (
    <nav className="tabs" aria-label="Navigation principale">
      {TABS.map(([id, label]) => (
        <button key={id} type="button" className={page === id ? "on" : ""} aria-label={label} title={label}
          aria-current={page === id ? "page" : undefined} onClick={() => onNav(id)}>
          <span><Icon name={id} /></span>
        </button>
      ))}
    </nav>
  );
}
