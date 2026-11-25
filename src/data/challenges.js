// ─── Défis ───────────────────────────────────────────────────────────────────
// Catalogue des défis et calcul de leur avancement. Un défi lancé est enregistré côté serveur
// (table challenges) : { id, type, config, startedOn, days, status, log }.
//   config → réglages choisis au lancement (durée, niveau, distance…)
//   log    → ce que la personne note jour par jour : { "2026-11-16": true | false | nombre }
// Certains défis se remplissent tout seuls : la prise de masse lit les repas, le rattrapage et la régularité
// lisent les séances enregistrées.
// Les identifiants doivent correspondre à TYPES dans server/src/routes/challenges.js
import { EXERCISES, CATEGORIES } from "./exercises";
import { maintenanceKcal } from "../goals";

// ─── Dates : toujours des textes « AAAA-MM-JJ » à l'heure de l'appareil ─────
export const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const toDate = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = toDate(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
export const dayLabel = (k) => toDate(k).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

const fr  = (n) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");
const nf  = (n) => Math.round(n).toLocaleString("fr-FR");
const mmss = (s) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? " " + String(s % 60).padStart(2, "0") : ""}` : `${s} s`);
const weeksOpt = (list) => ({ key: "weeks", label: "Durée", choices: list.map((v) => ({ v, label: `${v} semaines` })) });
const daysOpt  = (list) => ({ key: "days", label: "Durée", choices: list.map((v) => ({ v, label: `${v} jours` })) });

const CAT_OF = Object.fromEntries(EXERCISES.map((e) => [e.name, e.cat]));
// Groupes musculaires qu'on peut rattraper (catégories du catalogue, hors cardio et mobilité)
const MUSCLE_CATS = CATEGORIES.filter((c) => !["Cardio", "Mobilité"].includes(c));
const FULL_SESSION = 3; // exercices du groupe pour qu'une séance compte comme « complète »

// Course : la sortie longue grandit d'environ 10 % par semaine (règle classique pour progresser sans se blesser)
const runWeeks  = (c) => Math.max(2, Math.ceil(Math.log(c.targetKm / c.startKm) / Math.log(1.1)) + 1);
const runTarget = (c, w) => Math.min(c.targetKm, Math.round(c.startKm * 1.1 ** w * 10) / 10);

// Gainage : la durée à tenir monte chaque jour, avec un jour de repos par semaine
const PLANK = { debutant: [20, 120], intermediaire: [30, 210], avance: [60, 300] };
const plankRest   = (i) => i % 7 === 6;
const plankTarget = (c, i) => {
  const [a, b] = PLANK[c.level] || PLANK.debutant;
  return Math.round((a + ((b - a) * i) / 29) / 5) * 5;
};

// Boxe : de plus en plus de rounds, puis des rounds plus longs
const BOX = { debutant: { r: [4, 6], m: [2, 3] }, intermediaire: { r: [6, 9], m: [2, 3] }, avance: { r: [8, 12], m: [3, 3] } };
const boxWeek = (c, w) => {
  const lvl = BOX[c.level] || BOX.debutant;
  const f = c.weeks > 1 ? w / (c.weeks - 1) : 1;
  return { rounds: Math.round(lvl.r[0] + (lvl.r[1] - lvl.r[0]) * f), minutes: f < 0.5 ? lvl.m[0] : lvl.m[1] };
};

// Écarts déjà notés plus tôt dans la même semaine du défi (défi sucre, mode « réduire »)
const slipsBefore = (ch, i) => {
  let n = 0;
  for (let j = i - (i % 7); j < i; j++) if (ch.log[addDays(ch.startedOn, j)] === false) n++;
  return n;
};

/* Chaque défi décrit :
   img      → photo de public/images/da
   options  → réglages proposés au lancement ; defaults → valeurs de départ
   check(c, user) → message si les réglages ne permettent pas de lancer le défi
   prepare(c, user) → réglages calculés au lancement (ex. calories visées)
   days(c)  → durée en jours ; unit → "day" (un objectif par jour) ou "week" (des séances par semaine)
   goal(c, i) → l'objectif du jour ou de la semaine numéro i, en clair
   Défi au jour  : day(ch, i, key, ctx) → { state: "ok" | "ko" | "tol" | "rest" | null, input }
   Défi à la semaine : perWeek(c), session → saisie d'une séance, sessions(ch, ctx) si elles sont lues ailleurs,
                       weekOk(c, w, sessions) si le nombre de séances ne suffit pas */
export const CHALLENGES = [
  {
    id: "sucre", title: "Zéro sucre", tag: "Nutrition", img: "defi-sucre",
    pitch: "Coupe les sucres ajoutés : sodas, bonbons, pâtisseries, sucre dans le café.",
    why: "Moins de sucre ajouté, c'est moins de fringales, une énergie plus stable dans la journée et une sèche plus facile. Les fruits et les féculents ne sont pas concernés.",
    rules: [
      "Pas de soda, jus, bonbons, gâteaux, glaces ni sucre ajouté dans les boissons.",
      "Les fruits entiers, le lait et les féculents restent autorisés.",
      "Chaque soir, note si tu as tenu ou si tu as fait un écart.",
    ],
    options: [
      { key: "mode", label: "Niveau", choices: [
        { v: "zero", label: "Zéro sucre", hint: "aucun écart" },
        { v: "reduire", label: "Réduire", hint: "quelques écarts par semaine" },
      ] },
      { key: "ecarts", label: "Écarts autorisés par semaine", when: (c) => c.mode === "reduire",
        choices: [1, 2, 3].map((v) => ({ v, label: String(v) })) },
      daysOpt([7, 14, 21, 30]),
    ],
    defaults: { mode: "zero", ecarts: 2, days: 14 },
    days: (c) => c.days, unit: "day",
    goal: (c) => (c.mode === "reduire" ? `Pas de sucre ajouté (${c.ecarts} écart${c.ecarts > 1 ? "s" : ""} toléré${c.ecarts > 1 ? "s" : ""} par semaine)` : "Aucun sucre ajouté aujourd'hui"),
    day: (ch, i, key) => {
      const v = ch.log[key];
      const tolerated = ch.config.mode === "reduire" && slipsBefore(ch, i) < ch.config.ecarts;
      return { state: v === true ? "ok" : v === false ? (tolerated ? "tol" : "ko") : null, input: { type: "bool", yes: "Tenu", no: "Écart" } };
    },
  },
  {
    id: "course", title: "Course : plus loin chaque semaine", short: "Course à pied", tag: "Endurance", img: "course",
    pitch: "Allonge ta sortie longue semaine après semaine, jusqu'à ta distance cible.",
    why: "On progresse en course en augmentant la distance petit à petit : environ 10 % de plus par semaine. C'est assez pour s'améliorer, et assez doux pour laisser le corps s'adapter.",
    rules: [
      "Chaque semaine, fais le nombre de sorties prévu.",
      "L'une d'elles doit atteindre la distance de la semaine : c'est ta sortie longue.",
      "Cours à une allure où tu peux encore parler. Note tes kilomètres après chaque sortie.",
    ],
    options: [
      { key: "startKm", label: "Ce que tu cours déjà sans t'arrêter", choices: [1, 2, 3, 5, 8].map((v) => ({ v, label: `${v} km` })) },
      { key: "targetKm", label: "Distance visée", choices: [[5, "5 km"], [10, "10 km"], [15, "15 km"], [21.1, "Semi"]].map(([v, label]) => ({ v, label })) },
      { key: "perWeek", label: "Sorties par semaine", choices: [2, 3, 4].map((v) => ({ v, label: String(v) })) },
    ],
    defaults: { startKm: 2, targetKm: 5, perWeek: 3 },
    check: (c) => (c.startKm >= c.targetKm ? "Choisis une distance visée plus grande que ce que tu cours déjà." : ""),
    summary: (c) => `${runWeeks(c)} semaines pour passer de ${fr(c.startKm)} à ${fr(c.targetKm)} km`,
    days: (c) => runWeeks(c) * 7, unit: "week",
    perWeek: (c) => c.perWeek,
    goal: (c, w) => `${c.perWeek} sorties, dont une de ${fr(runTarget(c, w))} km`,
    session: { type: "number", unit: "km", step: "0.1", max: 100, verb: "Sortie" },
    weekOk: (c, w, sessions) => sessions.length >= c.perWeek && sessions.some((s) => s.value >= runTarget(c, w)),
    sessionLabel: (s) => `${fr(s.value)} km`,
  },
  {
    id: "masse", title: "Prise de masse", tag: "Nutrition", img: "musculation",
    pitch: "Atteins chaque jour tes calories et tes protéines pour construire du muscle.",
    why: "Pour prendre du muscle, il faut manger un peu plus que ce que tu dépenses et assez de protéines, tous les jours. Le défi calcule tes deux cibles à partir de ton profil.",
    rules: [
      "Note tes repas dans l'onglet Repas : le défi se remplit tout seul.",
      "Un jour est réussi quand tu atteins tes calories et tes protéines (à 5 % près).",
      "Garde tes séances de musculation : sans entraînement, le surplus ne devient pas du muscle.",
    ],
    options: [
      { key: "surplus", label: "Rythme", choices: [
        { v: 300, label: "Progressif", hint: "+300 kcal" },
        { v: 500, label: "Soutenu", hint: "+500 kcal" },
      ] },
      weeksOpt([4, 8, 12]),
    ],
    defaults: { surplus: 300, weeks: 8 },
    prepare: (c, user) => ({
      kcal: maintenanceKcal(user) + c.surplus,
      protein: user?.weightKg ? Math.round((user.weightKg * 1.8) / 5) * 5 : 120,
    }),
    summary: (c, user) => {
      const t = CHALLENGE_BY_ID.masse.prepare(c, user);
      return `Tes cibles : ${nf(t.kcal)} kcal et ${t.protein} g de protéines par jour`;
    },
    days: (c) => c.weeks * 7, unit: "day", needs: "meals",
    goal: (c) => `${nf(c.kcal)} kcal et ${c.protein} g de protéines`,
    day: (ch, i, key, ctx) => {
      const eaten = ctx.meals[key] || { kcal: 0, protein: 0 };
      const ok = eaten.kcal >= ch.config.kcal * 0.95 && eaten.protein >= ch.config.protein * 0.95;
      return { state: ok ? "ok" : null, input: { type: "meals", eaten } };
    },
  },
  {
    id: "rattrapage", title: "Rattraper un point faible", short: "Point faible", tag: "Musculation", img: "curl",
    pitch: "Un groupe musculaire en retard ? Deux séances complètes par semaine, rien que pour lui.",
    why: "Un muscle en retard a surtout besoin d'être travaillé plus souvent. Deux séances par semaine au lieu d'une, c'est le moyen le plus simple de le faire rattraper le reste.",
    rules: [
      `Une séance compte quand elle contient au moins ${FULL_SESSION} exercices du groupe choisi.`,
      "Laisse au moins 48 h entre deux séances du même groupe.",
      "Enregistre tes séances dans l'onglet Séances : le défi se remplit tout seul.",
    ],
    options: [
      { key: "cat", label: "Groupe à rattraper", choices: MUSCLE_CATS.map((v) => ({ v, label: v })) },
      { key: "perWeek", label: "Séances par semaine", choices: [2, 3].map((v) => ({ v, label: String(v) })) },
      weeksOpt([4, 6, 8]),
    ],
    defaults: { cat: "Bras", perWeek: 2, weeks: 6 },
    days: (c) => c.weeks * 7, unit: "week", needs: "workouts",
    perWeek: (c) => c.perWeek,
    goal: (c) => `${c.perWeek} séances ${c.cat.toLowerCase()} complètes`,
    name: (c) => `Rattrapage ${c.cat.toLowerCase()}`,
    sessions: (ch, ctx) => ctx.workouts
      .filter((w) => (w.exercises || []).filter((e) => CAT_OF[e.name] === ch.config.cat).length >= FULL_SESSION)
      .map((w) => ({ key: dayKey(new Date(w.ts)), value: w.seanceName || "Séance" })),
    sessionLabel: (s) => s.value,
  },
  {
    id: "boxe", title: "Cardio boxe", tag: "Cardio", img: "gants",
    pitch: "Des rounds de plus en plus nombreux, puis de plus en plus longs.",
    why: "La boxe se joue par rounds : effort intense, courte récupération, et on repart. En ajoutant des rounds chaque semaine, ton cœur récupère plus vite et tu tiens plus longtemps.",
    rules: [
      "Chaque séance : le nombre de rounds de la semaine, 1 minute de repos entre chaque.",
      "Alterne corde à sauter, shadow boxing, sac de frappe et burpees.",
      "Le dernier round se fait à fond. Note chaque séance terminée.",
    ],
    options: [
      { key: "level", label: "Niveau", choices: [
        { v: "debutant", label: "Débutant", hint: "4 à 6 rounds" },
        { v: "intermediaire", label: "Intermédiaire", hint: "6 à 9 rounds" },
        { v: "avance", label: "Avancé", hint: "8 à 12 rounds" },
      ] },
      { key: "perWeek", label: "Séances par semaine", choices: [2, 3, 4].map((v) => ({ v, label: String(v) })) },
      weeksOpt([4, 6, 8]),
    ],
    defaults: { level: "debutant", perWeek: 3, weeks: 6 },
    days: (c) => c.weeks * 7, unit: "week",
    perWeek: (c) => c.perWeek,
    goal: (c, w) => { const k = boxWeek(c, w); return `${c.perWeek} séances de ${k.rounds} rounds de ${k.minutes} min`; },
    session: { type: "bool", verb: "Séance" },
    sessionLabel: () => "Séance faite",
  },
  {
    id: "gainage", title: "30 jours de gainage", short: "Gainage 30 jours", tag: "Abdos", img: "abdos",
    pitch: "Une planche par jour, un peu plus longue à chaque fois.",
    why: "Le gainage renforce la sangle abdominale et protège le dos. En tenant quelques secondes de plus chaque jour, tu multiplies ton temps de planche en un mois.",
    rules: [
      "Chaque jour, tiens la planche le temps indiqué, en une fois ou en plusieurs.",
      "Corps aligné des épaules aux talons, ventre et fessiers serrés.",
      "Un jour de repos par semaine est prévu : profites-en.",
    ],
    options: [
      { key: "level", label: "Niveau", choices: [
        { v: "debutant", label: "Débutant", hint: "20 s → 2 min" },
        { v: "intermediaire", label: "Intermédiaire", hint: "30 s → 3 min 30" },
        { v: "avance", label: "Avancé", hint: "1 min → 5 min" },
      ] },
    ],
    defaults: { level: "debutant" },
    days: () => 30, unit: "day",
    goal: (c, i) => (plankRest(i) ? "Jour de repos" : `Tenir la planche ${mmss(plankTarget(c, i))}`),
    day: (ch, i, key) => {
      if (plankRest(i)) return { state: "rest", input: { type: "rest" } };
      const target = plankTarget(ch.config, i);
      const v = ch.log[key];
      return { state: typeof v === "number" ? (v >= target ? "ok" : "ko") : null, input: { type: "number", unit: "secondes", target, max: 3600 } };
    },
  },
  {
    id: "pas", title: "10 000 pas par jour", short: "Pas quotidiens", tag: "Activité", img: "escaliers",
    pitch: "Marche plus, tous les jours : le socle de toute perte de poids.",
    why: "La marche est la dépense la plus facile à ajouter : elle ne fatigue pas et ne gêne pas la récupération. Ton téléphone ou ta montre compte tes pas pour toi.",
    needs: "steps",
    rules: [
      "Atteins ton nombre de pas chaque jour.",
      "Avec le podomètre de l'appli Android, tes pas sont comptés tout seuls. Sinon, relève le total le soir sur ton téléphone ou ta montre et note-le ici.",
      "Astuces : escaliers, appels en marchant, descendre un arrêt plus tôt.",
    ],
    options: [
      { key: "steps", label: "Objectif par jour", choices: [6000, 8000, 10000, 12000].map((v) => ({ v, label: nf(v) })) },
      daysOpt([14, 21, 30]),
    ],
    defaults: { steps: 10000, days: 21 },
    name: (c) => `${nf(c.steps)} pas par jour`,
    days: (c) => c.days, unit: "day",
    goal: (c) => `${nf(c.steps)} pas aujourd'hui`,
    // Un total noté à la main l'emporte ; sinon on prend le podomètre (ctx.steps)
    day: (ch, i, key, ctx) => {
      const auto = ctx.steps?.[key];
      const v = typeof ch.log[key] === "number" ? ch.log[key] : auto;
      return {
        state: typeof v === "number" ? (v >= ch.config.steps ? "ok" : key === ctx.today ? null : "ko") : null,
        input: { type: "number", unit: "pas", target: ch.config.steps, max: 100000, auto },
      };
    },
  },
  {
    id: "eau", title: "Hydratation", tag: "Santé", img: "defi-eau",
    pitch: "Bois assez d'eau chaque jour, sans y penser au bout de quelques semaines.",
    why: "Bien hydraté, tu récupères mieux, tu es plus performant à l'entraînement et tu confonds moins la soif avec la faim.",
    rules: [
      "Bois ta quantité d'eau dans la journée, répartie du matin au soir.",
      "L'eau, le thé et le café sans sucre comptent. Les sodas et les jus ne comptent pas.",
      "Garde une gourde avec toi et note chaque soir si c'est fait.",
    ],
    options: [
      { key: "litres", label: "Objectif par jour", choices: [1.5, 2, 2.5, 3].map((v) => ({ v, label: `${fr(v)} L` })) },
      daysOpt([14, 21, 30]),
    ],
    defaults: { litres: 2, days: 21 },
    days: (c) => c.days, unit: "day",
    goal: (c) => `Boire ${fr(c.litres)} L d'eau`,
    day: (ch, i, key) => {
      const v = ch.log[key];
      return { state: v === true ? "ok" : v === false ? "ko" : null, input: { type: "bool", yes: "C'est bu", no: "Pas assez" } };
    },
  },
  {
    id: "regularite", title: "Régularité", tag: "Discipline", img: "halteres-rack",
    pitch: "Ne rate plus une semaine : un nombre de séances à tenir, quoi qu'il arrive.",
    why: "Ce qui fait progresser, ce n'est pas la séance parfaite : c'est de revenir chaque semaine. Ce défi installe l'habitude.",
    rules: [
      "Fais ton nombre de séances chaque semaine du défi.",
      "Toute séance enregistrée dans l'onglet Séances compte.",
      "Une semaine ratée ne se rattrape pas : la suivante repart de zéro.",
    ],
    options: [
      { key: "perWeek", label: "Séances par semaine", choices: [2, 3, 4, 5].map((v) => ({ v, label: String(v) })) },
      weeksOpt([4, 8, 12]),
    ],
    defaults: { perWeek: 3, weeks: 4 },
    days: (c) => c.weeks * 7, unit: "week", needs: "workouts",
    perWeek: (c) => c.perWeek,
    goal: (c) => `${c.perWeek} séances cette semaine`,
    sessions: (ch, ctx) => ctx.workouts.map((w) => ({ key: dayKey(new Date(w.ts)), value: w.seanceName || "Séance" })),
    sessionLabel: (s) => s.value,
  },
];

export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map((d) => [d.id, d]));
export const challengeName = (ch) => {
  const def = CHALLENGE_BY_ID[ch.type];
  return def?.name ? def.name(ch.config) : def?.short || def?.title || "Défi";
};

// Séances d'un défi à la semaine : notées à la main (log) ou lues dans l'historique
const sessionsOf = (def, ch, ctx) => (def.sessions
  ? def.sessions(ch, ctx)
  : Object.entries(ch.log).filter(([, v]) => v !== false && v !== null).map(([key, value]) => ({ key, value }))
).filter((s) => { const i = diffDays(ch.startedOn, s.key); return i >= 0 && i < ch.days; })
 .sort((a, b) => (a.key < b.key ? -1 : 1));

/* Avancement d'un défi.
   ctx = { today, workouts, meals } ; renvoie :
   unit, total (jours ou semaines), index (unité en cours), finished, done (unités réussies), pct,
   cells → une case par unité : { label, state: "ok" | "ko" | "tol" | "rest" | "now" | "todo" }
   goal  → objectif de l'unité en cours ; weeks → pour chaque semaine : { sessions, need, ok } (défis à la semaine) */
export function evaluate(ch, ctx) {
  const def = CHALLENGE_BY_ID[ch.type];
  if (!def) return null;
  const elapsed  = diffDays(ch.startedOn, ctx.today);
  const finished = elapsed >= ch.days;
  const cells = [];
  const weeks = [];

  if (def.unit === "day") {
    const index = Math.min(elapsed, ch.days - 1);
    for (let i = 0; i < ch.days; i++) {
      const { state } = def.day(ch, i, addDays(ch.startedOn, i), ctx);
      cells.push({ label: String(i + 1), state: i > elapsed ? "todo" : state || (i === elapsed ? "now" : "ko") });
    }
    const done = cells.filter((c) => ["ok", "tol", "rest"].includes(c.state)).length;
    return { def, unit: "day", total: ch.days, index, finished, done, pct: done / ch.days, cells, goal: def.goal(ch.config, index), weeks };
  }

  const total = Math.ceil(ch.days / 7);
  const index = Math.min(Math.floor(elapsed / 7), total - 1);
  const all = sessionsOf(def, ch, ctx);
  for (let w = 0; w < total; w++) {
    const list = all.filter((s) => Math.floor(diffDays(ch.startedOn, s.key) / 7) === w);
    const need = def.perWeek(ch.config);
    const ok = def.weekOk ? def.weekOk(ch.config, w, list) : list.length >= need;
    const current = !finished && w === index;
    cells.push({ label: `S${w + 1}`, state: w * 7 > elapsed ? "todo" : ok ? "ok" : current ? "now" : "ko" });
    weeks.push({ sessions: list, need, ok });
  }
  const done = cells.filter((c) => c.state === "ok").length;
  return { def, unit: "week", total, index, finished, done, pct: done / total, cells, goal: def.goal(ch.config, index), weeks };
}
