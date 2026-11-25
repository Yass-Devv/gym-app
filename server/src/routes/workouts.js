import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { validExercises } from "./seances.js";

const router = Router();
router.use(requireAuth);

const TZ = "Europe/Paris";

// GET /api/workouts — historique (100 derniers), même format que l'ancien localStorage
router.get("/", async (req, res) => {
  const { rows } = await query(
    `SELECT id, seance_name, exercises, total_cal, performed_at
     FROM workouts WHERE user_id = $1 ORDER BY performed_at DESC LIMIT 100`,
    [req.user.id]
  );
  res.json(rows.map((w) => ({
    id:         w.id,
    seanceName: w.seance_name,
    exercises:  w.exercises,
    totalCal:   w.total_cal,
    ts:         w.performed_at.getTime(),
    date:       w.performed_at.toLocaleDateString("fr-FR", { timeZone: TZ }),
    time:       w.performed_at.toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }),
  })));
});

// POST /api/workouts  { seanceName, exercises, totalCal }
router.post("/", async (req, res) => {
  const { seanceName = null, exercises = [], totalCal = 0 } = req.body ?? {};
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: "Ajoute des exercices d'abord !" });
  }
  if (!validExercises(exercises)) return res.status(400).json({ error: "Liste d'exercices invalide." });
  if (seanceName !== null && (typeof seanceName !== "string" || seanceName.length > 100)) {
    return res.status(400).json({ error: "Nom de séance invalide." });
  }
  const cal = Number(totalCal);
  if (!Number.isFinite(cal) || cal < 0 || cal > 100000) return res.status(400).json({ error: "Calories invalides." });
  const { rows } = await query(
    `INSERT INTO workouts (user_id, seance_name, exercises, total_cal)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [req.user.id, seanceName, JSON.stringify(exercises), Math.round(cal)]
  );
  res.status(201).json({ id: rows[0].id });
});

// GET /api/workouts/stats — { totalCal, totalSessions, streak, stepsKcal }
router.get("/stats", async (req, res) => {
  const { rows: [totals] } = await query(
    `SELECT COALESCE(SUM(total_cal), 0)::int AS "totalCal", COUNT(*)::int AS "totalSessions"
     FROM workouts WHERE user_id = $1`,
    [req.user.id]
  );

  // Série = jours consécutifs avec au moins une séance, se terminant aujourd'hui ou hier.
  // Le calcul se fait entièrement en SQL (jours en heure de Paris) pour éviter les soucis de fuseau.
  const { rows: [{ streak }] } = await query(
    `WITH days AS (
       SELECT DISTINCT (performed_at AT TIME ZONE '${TZ}')::date AS day
       FROM workouts WHERE user_id = $1
     ),
     numbered AS (
       SELECT day, day + (ROW_NUMBER() OVER (ORDER BY day DESC))::int AS grp FROM days
     ),
     latest AS (
       SELECT grp FROM numbered ORDER BY day DESC LIMIT 1
     )
     SELECT CASE
       WHEN (SELECT MAX(day) FROM days) >= (now() AT TIME ZONE '${TZ}')::date - 1
       THEN (SELECT COUNT(*) FROM numbered WHERE grp = (SELECT grp FROM latest))
       ELSE 0
     END::int AS streak`,
    [req.user.id]
  );

  // Calories des pas (podomètre), comptées à part
  const { rows: [{ stepsKcal }] } = await query(
    'SELECT COALESCE(SUM(kcal), 0)::int AS "stepsKcal" FROM steps WHERE user_id = $1', [req.user.id]
  );

  res.json({ ...totals, streak, stepsKcal });
});

export default router;
