import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const COLS = "id, nom, jour, exercises";

// GET /api/seances
router.get("/", async (req, res) => {
  const { rows } = await query(`SELECT ${COLS} FROM seances WHERE user_id = $1 ORDER BY id`, [req.user.id]);
  res.json(rows);
});

// POST /api/seances  { nom, jour, exercises }
router.post("/", async (req, res) => {
  const { nom, jour = "Lundi", exercises = [] } = req.body ?? {};
  if (!nom?.trim()) return res.status(400).json({ error: "Le nom est requis." });
  const { rows } = await query(
    `INSERT INTO seances (user_id, nom, jour, exercises) VALUES ($1, $2, $3, $4) RETURNING ${COLS}`,
    [req.user.id, nom.trim(), jour, JSON.stringify(exercises)]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/seances/:id  { nom?, jour?, exercises? }
router.put("/:id", async (req, res) => {
  const { nom, jour, exercises } = req.body ?? {};
  const { rows } = await query(
    `UPDATE seances SET
       nom        = COALESCE($1, nom),
       jour       = COALESCE($2, jour),
       exercises  = COALESCE($3, exercises),
       updated_at = now()
     WHERE id = $4 AND user_id = $5
     RETURNING ${COLS}`,
    [nom?.trim() || null, jour || null, exercises ? JSON.stringify(exercises) : null, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Séance introuvable" });
  res.json(rows[0]);
});

// DELETE /api/seances/:id
router.delete("/:id", async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM seances WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: "Séance introuvable" });
  res.status(204).end();
});

export default router;
