// Données de test (compte démo + séances + historique) : npm run db:seed
// Relançable à volonté : le compte démo est supprimé puis recréé.
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

const DEMO_EMAIL    = "demo@yassgym.fr";
const DEMO_PASSWORD = "demo1234";

// Copie de quelques exercices du catalogue (src/components/Exercisespage.js, EXERCISES_HOMME)
const EX = {
  squat:    { id:"h1",  name:"Squat barre",         cat:"Jambes",   emoji:"🏋️", diff:"Intermédiaire", calPerRep:0.35, muscles:["Quadriceps","Fessiers","Ischio-jambiers"], zones:["legs"],             benefits:["Force des jambes","Hormones anabolisantes","Posture"], desc:"Barre sur les trapèzes, descendez cuisses parallèles au sol." },
  deadlift: { id:"h2",  name:"Soulevé de terre",    cat:"Dos",      emoji:"🏗️", diff:"Avancé",        calPerRep:0.45, muscles:["Dos","Fessiers","Ischio-jambiers","Trapèze"], zones:["back","legs"],   benefits:["Force brute totale","Chaîne postérieure","Testostérone"], desc:"Barre au sol, dos droit, poussez avec les jambes." },
  bench:    { id:"h3",  name:"Développé couché",    cat:"Poitrine", emoji:"💪", diff:"Intermédiaire", calPerRep:0.32, muscles:["Pectoraux","Triceps","Épaules"],             zones:["chest","arms"],    benefits:["Pectoraux épais","Force de poussée","Haut du corps"], desc:"Allongé sur banc, descendez la barre jusqu'à la poitrine." },
  pullup:   { id:"h4",  name:"Traction pronation",  cat:"Dos",      emoji:"🔝", diff:"Avancé",        calPerRep:0.38, muscles:["Grand dorsal","Biceps","Trapèze"],           zones:["back","arms"],     benefits:["Dos en V","Prise de force","Posture droite"], desc:"Barre prise large, tirez jusqu'au menton au-dessus." },
  ohp:      { id:"h5",  name:"Développé militaire", cat:"Épaules",  emoji:"🎯", diff:"Intermédiaire", calPerRep:0.30, muscles:["Deltoïdes","Triceps","Trapèze"],             zones:["shoulders","arms"],benefits:["Épaules larges","Force fonctionnelle","Stabilité"], desc:"Poussez la barre au-dessus de la tête en position debout." },
  row:      { id:"h7",  name:"Rowing barre",        cat:"Dos",      emoji:"🚣", diff:"Intermédiaire", calPerRep:0.28, muscles:["Grand dorsal","Rhomboïdes","Biceps"],        zones:["back","arms"],     benefits:["Dos épais","Posture","Équilibre musculaire"], desc:"Buste penché à 45°, tirez la barre vers le nombril." },
  curl:     { id:"h9",  name:"Curl barre",          cat:"Bras",     emoji:"💪", diff:"Débutant",      calPerRep:0.20, muscles:["Biceps","Brachial","Avant-bras"],            zones:["arms"],            benefits:["Biceps volumineux","Masse bras","Force préhension"], desc:"Barre en supination, fléchissez sans balancer le buste." },
  triceps:  { id:"h10", name:"Extension triceps câble", cat:"Bras", emoji:"📏", diff:"Débutant",      calPerRep:0.18, muscles:["Triceps"],                                   zones:["arms"],            benefits:["Triceps définis","Isolation","Volume bras"], desc:"Câble en hauteur, poussez vers le bas en gardant les coudes fixes." },
  legpress: { id:"h11", name:"Leg press lourd",     cat:"Jambes",   emoji:"🦿", diff:"Débutant",      calPerRep:0.28, muscles:["Quadriceps","Fessiers","Mollets"],           zones:["legs"],            benefits:["Force jambes","Sécurisé dos","Charge maximale"], desc:"Machine inclinée, poussez avec les pieds, ne verrouillez pas les genoux." },
  plank:    { id:"h17", name:"Planche",             cat:"Abdos",    emoji:"⚡", diff:"Débutant",      calPerRep:0.15, muscles:["Core","Épaules","Fessiers"],                 zones:["core"],            benefits:["Gainage total","Dos protégé","Stabilité"], desc:"Avant-bras au sol, corps aligné, contractez tout." },
};

// [exercice, séries, reps, poids de départ (kg), progression par semaine (kg)]
const PROGRAMME = [
  { nom: "Push", jour: "Lundi", items: [
    [EX.bench, 4, 8, 60, 2.5], [EX.ohp, 3, 10, 35, 1.25], [EX.triceps, 3, 12, 20, 1.25],
  ]},
  { nom: "Pull", jour: "Mercredi", items: [
    [EX.deadlift, 3, 5, 90, 5], [EX.pullup, 4, 8, 0, 0], [EX.row, 3, 10, 50, 2.5], [EX.curl, 3, 12, 25, 1.25],
  ]},
  { nom: "Legs", jour: "Vendredi", items: [
    [EX.squat, 4, 8, 70, 2.5], [EX.legpress, 3, 12, 120, 5], [EX.plank, 3, 1, 0, 0],
  ]},
];

// Même formule que Seancepage.js (calcCal)
const calcCal = (ex, sets, reps, weight) => Math.round((ex.calPerRep + weight * 0.005) * reps * sets);

const WEEKS = 6;
const DAY = 86400000;

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("DELETE FROM users WHERE email = $1", [DEMO_EMAIL]);

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { rows: [user] } = await client.query(
    `INSERT INTO users (name, email, password_hash, gender, birth_year, height_cm, weight_kg,
                        activities, goal, level, days_per_week, onboarded_at)
     VALUES ($1, $2, $3, 'homme', 1998, 180, 78.5, $4, 'prise-muscle', 'intermediaire', 3, now())
     RETURNING id`,
    ["Démo", DEMO_EMAIL, hash, JSON.stringify(["musculation", "course"])]
  );

  // Séances programmées (format front : { ex, sets, reps, weight } en chaînes)
  for (const s of PROGRAMME) {
    const exercises = s.items.map(([ex, sets, reps, weight, inc]) => ({
      ex, sets: String(sets), reps: String(reps), weight: weight ? String(weight + inc * (WEEKS - 1)) : "",
    }));
    await client.query(
      "INSERT INTO seances (user_id, nom, jour, exercises) VALUES ($1, $2, $3, $4)",
      [user.id, s.nom, s.jour, JSON.stringify(exercises)]
    );
  }

  // Historique : 3 séances/semaine sur WEEKS semaines, poids en progression, la dernière hier
  const today = new Date();
  today.setHours(18, 30, 0, 0);
  const lastTs = today.getTime() - DAY;
  const total = WEEKS * 3;
  let count = 0;
  for (let i = 0; i < total; i++) {
    const week = Math.floor(i / 3);
    const s = PROGRAMME[i % 3];
    const offsetDays = (total - 1 - i) * 2 + Math.floor((total - 1 - i) / 3); // ~ lun / mer / ven
    const performedAt = new Date(lastTs - offsetDays * DAY);

    const exercises = s.items.map(([ex, sets, reps, weight, inc]) => {
      const w = weight ? weight + inc * week : 0;
      return { name: ex.name, sets, reps, weight: w, unit: "kg", calories: calcCal(ex, sets, reps, w) };
    });
    const totalCal = exercises.reduce((sum, e) => sum + e.calories, 0);

    await client.query(
      `INSERT INTO workouts (user_id, seance_name, exercises, total_cal, performed_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, s.nom, JSON.stringify(exercises), totalCal, performedAt]
    );
    count++;
  }

  await client.query("COMMIT");
  console.log(`✅ Compte démo créé : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`   ${PROGRAMME.length} séances programmées, ${count} entraînements dans l'historique`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("❌ Erreur de seed :", err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
