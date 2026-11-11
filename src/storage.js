// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
export const ls = {
  get: (k, fallback = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)    => { try { localStorage.removeItem(k); } catch {} },
};

export const SESSION_KEY = "yassgym_session";
export const USERS_KEY   = "yassgym_users";

export const histKey    = (email) => `yassgym_hist_${email}`;
export const statsKey   = (email) => `yassgym_stats_${email}`;
export const workoutKey = (email) => `yassgym_workout_${email}`;

// ─── THEME ───────────────────────────────────────────────────────────────────
export const THEMES = {
  homme: {
    primary:     "#f97316",
    primaryDark: "#ea580c",
    primaryBg:   "rgba(249,115,22,0.12)",
    primaryBorder:"rgba(249,115,22,0.4)",
    bg:          "#020817",
    surface:     "#0f172a",
    surface2:    "#1e293b",
    border:      "#1e293b",
    border2:     "#334155",
    text:        "#e2e8f0",
    textMuted:   "#94a3b8",
    textFaint:   "#64748b",
    gradient:    "linear-gradient(135deg,#f97316,#ea580c)",
    glow:        "rgba(249,115,22,0.12)",
  },
  femme: {
    primary:     "#ec4899",
    primaryDark: "#db2777",
    primaryBg:   "rgba(236,72,153,0.12)",
    primaryBorder:"rgba(236,72,153,0.4)",
    bg:          "#0d0a0f",
    surface:     "#1a0f1e",
    surface2:    "#2d1f35",
    border:      "#2d1f35",
    border2:     "#4a3057",
    text:        "#fce7f3",
    textMuted:   "#d8b4cc",
    textFaint:   "#9f6b8a",
    gradient:    "linear-gradient(135deg,#ec4899,#db2777)",
    glow:        "rgba(236,72,153,0.12)",
  },
};