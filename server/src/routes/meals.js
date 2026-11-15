import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Les identifiants doivent correspondre à MEALS dans src/components/Mealspage.js
const MEALS = ["petit-dej", "dejeuner", "diner", "collation"];
const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
const num = (v, max) => typeof v === "number" && v >= 0 && v <= max;

const toJson = (m) => ({
  id: m.id, meal: m.meal, name: m.name,
  grams:   m.grams === null ? null : Number(m.grams),
  kcal:    m.kcal,
  protein: Number(m.protein), carbs: Number(m.carbs), fat: Number(m.fat),
});

// GET /api/meals?date=2026-11-11 — aliments du jour
router.get("/", async (req, res) => {
  if (!isDate(req.query.date)) return res.status(400).json({ error: "Date invalide." });
  const { rows } = await query(
    "SELECT * FROM meals WHERE user_id = $1 AND eaten_on = $2 ORDER BY id",
    [req.user.id, req.query.date]
  );
  res.json(rows.map(toJson));
});

// GET /api/meals/search?q=yaourt — produits du commerce (Open Food Facts, base libre), valeurs pour 100 g.
// On passe par le serveur : leur recherche n'accepte pas les appels directs depuis le navigateur.
const OFF_SEARCH = "https://search.openfoodfacts.org/search?page_size=15&langs=fr&fields=code,product_name,brands,nutriments,image_front_small_url&q=";
router.get("/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  if (q.length < 3) return res.json([]);
  try {
    const r = await fetch(OFF_SEARCH + encodeURIComponent(q), {
      headers: { "User-Agent": "YassGym/1.0 (appli de sport)" },
      signal: AbortSignal.timeout(8000),
    });
    const data = r.ok ? await r.json() : { hits: [] };
    const foods = (data.hits || []).map((h) => {
      const n = h.nutriments || {};
      const brand = Array.isArray(h.brands) ? h.brands[0] : h.brands;
      return {
        name: [h.product_name, brand].filter(Boolean).join(" · ").slice(0, 150),
        kcal: n["energy-kcal_100g"],
        protein: n.proteins_100g || 0, carbs: n.carbohydrates_100g || 0, fat: n.fat_100g || 0,
        img: typeof h.image_front_small_url === "string" && h.image_front_small_url.startsWith("https://") ? h.image_front_small_url : undefined,
      };
    }).filter((f) => f.name && typeof f.kcal === "number");
    res.json(foods);
  } catch {
    res.status(502).json({ error: "Recherche de produits indisponible." });
  }
});

// POST /api/meals  { date, meal, name, grams?, kcal, protein?, carbs?, fat? }
router.post("/", async (req, res) => {
  const { date, meal, grams = null, kcal, protein = 0, carbs = 0, fat = 0 } = req.body ?? {};
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!isDate(date))                        return res.status(400).json({ error: "Date invalide." });
  if (!MEALS.includes(meal))                return res.status(400).json({ error: "Repas invalide." });
  if (!name || name.length > 150)           return res.status(400).json({ error: "Nom de l'aliment invalide." });
  if (grams !== null && !num(grams, 5000))  return res.status(400).json({ error: "Quantité invalide." });
  if (!num(kcal, 10000))                    return res.status(400).json({ error: "Calories invalides." });
  if (![protein, carbs, fat].every((v) => num(v, 2000))) return res.status(400).json({ error: "Valeurs nutritionnelles invalides." });

  const { rows } = await query(
    `INSERT INTO meals (user_id, eaten_on, meal, name, grams, kcal, protein, carbs, fat)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [req.user.id, date, meal, name, grams, Math.round(kcal), protein, carbs, fat]
  );
  res.status(201).json(toJson(rows[0]));
});

// DELETE /api/meals/:id
router.delete("/:id", async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM meals WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: "Aliment introuvable" });
  res.status(204).end();
});

export default router;
