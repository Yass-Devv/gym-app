import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth, validId } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Les identifiants doivent correspondre à CHALLENGES dans src/data/challenges.js
const TYPES = ["sucre", "course", "masse", "rattrapage", "boxe", "gainage", "pas", "eau", "regularite"];
const MAX_PER_USER = 60; // défis gardés par compte, terminés compris
const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

// Réglages : un petit objet à plat (textes courts, nombres, booléens)
const validConfig = (c) => c !== null && typeof c === "object" && !Array.isArray(c)
  && Object.keys(c).length <= 12
  && Object.entries(c).every(([k, v]) => k.length <= 30
    && ((typeof v === "string" && v.length <= 40) || (typeof v === "number" && Number.isFinite(v)) || typeof v === "boolean"));

const toJson = (c) => ({
  id: c.id, type: c.type, config: c.config, days: c.days, status: c.status, log: c.log,
  // La date reste un texte « AAAA-MM-JJ » : pas de décalage de fuseau
  startedOn: c.started_on,
});
const COLS = "id, type, config, to_char(started_on, 'YYYY-MM-DD') AS started_on, days, status, log";

// GET /api/challenges — défis en cours puis terminés
router.get("/", async (req, res) => {
  const { rows } = await query(
    `SELECT ${COLS} FROM challenges WHERE user_id = $1 ORDER BY (status = 'active') DESC, id DESC`,
    [req.user.id]
  );
  res.json(rows.map(toJson));
});

// POST /api/challenges  { type, config, days, date }
router.post("/", async (req, res) => {
  const { type, config = {}, days, date } = req.body ?? {};
  if (!TYPES.includes(type))                              return res.status(400).json({ error: "Défi inconnu." });
  if (!validConfig(config))                               return res.status(400).json({ error: "Réglages invalides." });
  if (!Number.isInteger(days) || days < 1 || days > 366)  return res.status(400).json({ error: "Durée invalide." });
  if (!isDate(date))                                      return res.status(400).json({ error: "Date invalide." });

  const { rows: mine } = await query("SELECT type, status FROM challenges WHERE user_id = $1", [req.user.id]);
  if (mine.some((c) => c.type === type && c.status === "active")) {
    return res.status(409).json({ error: "Ce défi est déjà en cours." });
  }
  if (mine.length >= MAX_PER_USER) return res.status(400).json({ error: "Trop de défis enregistrés : supprime-en d'anciens." });

  const { rows } = await query(
    `INSERT INTO challenges (user_id, type, config, started_on, days) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
    [req.user.id, type, JSON.stringify(config), date, days]
  );
  res.status(201).json(toJson(rows[0]));
});

// PATCH /api/challenges/:id  { date, value }  → note un jour (value null = effacer)
//                            { status }       → terminer ou abandonner
router.patch("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Défi introuvable" });
  const { date, value, status } = req.body ?? {};
  let sql;
  let params;

  if (status !== undefined) {
    if (!["done", "abandoned"].includes(status)) return res.status(400).json({ error: "Statut invalide." });
    sql = "status = $1"; params = [status];
  } else {
    if (!isDate(date)) return res.status(400).json({ error: "Date invalide." });
    const ok = value === null || typeof value === "boolean" || (typeof value === "number" && value >= 0 && value <= 1000000);
    if (!ok) return res.status(400).json({ error: "Valeur invalide." });
    if (value === null) { sql = "log = log - $1::text"; params = [date]; }
    else { sql = "log = jsonb_set(log, ARRAY[$1::text], $2::jsonb)"; params = [date, JSON.stringify(value)]; }
  }

  const { rows } = await query(
    `UPDATE challenges SET ${sql} WHERE id = $${params.length + 1} AND user_id = $${params.length + 2} RETURNING ${COLS}`,
    [...params, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Défi introuvable" });
  res.json(toJson(rows[0]));
});

// DELETE /api/challenges/:id
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Défi introuvable" });
  const { rowCount } = await query("DELETE FROM challenges WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  if (!rowCount) return res.status(404).json({ error: "Défi introuvable" });
  res.status(204).end();
});

export default router;
