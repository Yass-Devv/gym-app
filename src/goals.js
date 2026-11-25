// ─── Objectifs personnels ────────────────────────────────────────────────────
// Calculés à partir du profil, puis remplacés un par un par ce que la personne a choisi (user.goals).
// Les bornes doivent correspondre à GOAL_LIMITS dans server/src/routes/auth.js

export const GOAL_FIELDS = {
  kcal:    { label: "Calories par jour",  unit: "kcal", min: 800, max: 6000 },
  protein: { label: "Protéines par jour", unit: "g",    min: 20,  max: 400 },
  carbs:   { label: "Glucides par jour",  unit: "g",    min: 20,  max: 900 },
  fat:     { label: "Lipides par jour",   unit: "g",    min: 10,  max: 300 },
  burn:    { label: "Calories dépensées par mois", unit: "kcal", min: 200, max: 30000 },
};

// Protéines par kilo de poids de corps, selon l'objectif
const PROTEIN_PER_KG = { "perte-poids": 2, "prise-muscle": 1.8, forme: 1.6, endurance: 1.4 };
const step = (n, s) => Math.round(n / s) * s;

// Dépense journalière estimée, sans viser ni prise ni perte : métabolisme de base (Mifflin-St Jeor) × activité
export function maintenanceKcal(user) {
  if (!user?.weightKg || !user?.heightCm || !user?.birthYear) return 2000;
  const age  = new Date().getFullYear() - user.birthYear;
  const base = 10 * user.weightKg + 6.25 * user.heightCm - 5 * age + (user.gender === "femme" ? -161 : 5);
  const days = user.daysPerWeek || 0;
  const activity = days >= 6 ? 1.725 : days >= 3 ? 1.55 : days >= 1 ? 1.375 : 1.2;
  return step(base * activity, 50);
}

// Besoin journalier : la dépense estimée, ajustée selon l'objectif
function dailyKcal(user) {
  if (!user?.weightKg || !user?.heightCm || !user?.birthYear) return 2000;
  const shift = user.goal === "perte-poids" ? -400 : user.goal === "prise-muscle" ? 300 : 0;
  return step(maintenanceKcal(user) + shift, 50);
}

// Calories actives d'une journée de marche type (7 500 pas), même calcul que server/src/routes/steps.js
export function walkDayKcal(user) {
  const heightM = (user?.heightCm || (user?.gender === "femme" ? 165 : 177)) / 100;
  const kg = user?.weightKg || (user?.gender === "femme" ? 62 : 75);
  const km = (7500 * heightM * (user?.gender === "femme" ? 0.413 : 0.415)) / 1000;
  return km * 0.5 * kg;
}

// opts.steps : la personne utilise le podomètre, ses pas comptent dans la dépense du mois
export function autoGoals(user, opts = {}) {
  const kcal = dailyKcal(user);
  const protein = user?.weightKg
    ? step(user.weightKg * (PROTEIN_PER_KG[user.goal] || 1.6), 5)
    : step((kcal * 0.2) / 4, 5);
  const fat   = step((kcal * 0.28) / 9, 5);
  const carbs = Math.max(50, step((kcal - protein * 4 - fat * 9) / 4, 5));

  // Dépense du mois : rythme de la semaine × une séance type, plus soutenue pour perdre du poids ou gagner en endurance
  const push = user?.goal === "perte-poids" || user?.goal === "endurance" ? 1.25 : 1;
  const walk = opts.steps ? 30 * walkDayKcal(user) : 0;
  const burn = Math.min(30000, step((user?.daysPerWeek || 3) * 4.3 * 130 * push + walk, 50));

  return { kcal, protein, carbs, fat, burn };
}

export const goalsFor = (user, opts) => ({ ...autoGoals(user, opts), ...(user?.goals || {}) });

// Ce que vise le calcul, en clair
export const goalHint = (user) =>
  user?.goal === "perte-poids" ? "Calculé pour perdre du poids"
    : user?.goal === "prise-muscle" ? "Calculé pour prendre du muscle"
    : user?.goal === "endurance" ? "Calculé pour gagner en endurance"
    : "Calculé pour garder la forme";
