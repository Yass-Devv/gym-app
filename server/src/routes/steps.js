import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
const intBetween = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const MAX_STEPS = 100000; // par jour : au-delà, ce n'est plus plausible (un marathon ≈ 45 000 pas)

// ─── Énergie dépensée en marchant / courant ──────────────────────────────────
// Longueur du pas d'après la taille (marche : ≈ 0,415 × taille chez l'homme, 0,413 chez la femme ;
// course : ≈ 0,58 × taille). Coût énergétique net, sans le métabolisme de repos, d'après les équations
// de l'ACSM : marche 0,1 ml O₂/kg/m, course 0,2 ml O₂/kg/m, avec 1 L d'O₂ ≈ 5 kcal
// → marche ≈ 0,5 kcal par kg et par km, course ≈ 1 kcal par kg et par km.
// Ce sont des « calories actives », comme celles de l'app Forme : ce que le mouvement brûle en plus.
export function stepEnergy({ steps, runSteps }, user) {
  const heightM = (user.height_cm || (user.gender === "femme" ? 165 : 177)) / 100;
  const kg = Number(user.weight_kg) || (user.gender === "femme" ? 62 : 75);
  const walkStride = heightM * (user.gender === "femme" ? 0.413 : 0.415);
  const runStride = heightM * 0.58;
  const walkKm = ((steps - runSteps) * walkStride) / 1000;
  const runKm = (runSteps * runStride) / 1000;
  return {
    km: Math.round((walkKm + runKm) * 100) / 100,
    kcal: Math.round(kg * (walkKm * 0.5 + runKm * 1.0)),
  };
}

const toJson = (r) => ({
  day: r.day, steps: r.steps, runSteps: r.run_steps, rejected: r.rejected,
  km: Number(r.km), kcal: r.kcal,
});

// GET /api/steps?from=2026-11-01&to=2026-11-30
router.get("/", async (req, res) => {
  const { from, to } = req.query;
  if (!isDate(from) || !isDate(to)) return res.status(400).json({ error: "Dates invalides." });
  const { rows } = await query(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, steps, run_steps, rejected, km, kcal
     FROM steps WHERE user_id = $1 AND day BETWEEN $2 AND $3 ORDER BY day`,
    [req.user.id, from, to]
  );
  res.json(rows.map(toJson));
});

// PUT /api/steps  { days: [{ day, steps, runSteps, rejected }] } — totaux du podomètre, jour par jour.
// Le téléphone envoie le total du jour : on remplace la valeur enregistrée.
router.put("/", async (req, res) => {
  const days = req.body?.days;
  if (!Array.isArray(days) || days.length === 0 || days.length > 31) {
    return res.status(400).json({ error: "Liste de jours invalide." });
  }
  const now = Date.now();
  for (const d of days) {
    const t = Date.parse(d?.day);
    if (!isDate(d?.day) || t > now + 2 * 86400000 || t < now - 400 * 86400000) {
      return res.status(400).json({ error: "Date invalide." });
    }
    if (!intBetween(d.steps, 0, MAX_STEPS) || !intBetween(d.runSteps ?? 0, 0, d.steps)
      || !intBetween(d.rejected ?? 0, 0, 10 * MAX_STEPS)) {
      return res.status(400).json({ error: "Nombre de pas invalide." });
    }
  }

  const { rows: [user] } = await query(
    "SELECT gender, height_cm, weight_kg FROM users WHERE id = $1", [req.user.id]
  );
  const saved = [];
  for (const d of days) {
    const runSteps = d.runSteps ?? 0;
    const { km, kcal } = stepEnergy({ steps: d.steps, runSteps }, user);
    const { rows } = await query(
      `INSERT INTO steps (user_id, day, steps, run_steps, rejected, km, kcal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, day) DO UPDATE SET steps = $3, run_steps = $4, rejected = $5, km = $6, kcal = $7, updated_at = now()
       RETURNING to_char(day, 'YYYY-MM-DD') AS day, steps, run_steps, rejected, km, kcal`,
      [req.user.id, d.day, d.steps, runSteps, d.rejected ?? 0, km, kcal]
    );
    saved.push(toJson(rows[0]));
  }
  res.json(saved);
});

export default router;
