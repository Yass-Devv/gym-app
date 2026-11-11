import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db/pool.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const MIN_PASSWORD = 6;

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, gender: u.gender,
  birthYear:   u.birth_year,
  heightCm:    u.height_cm,
  weightKg:    u.weight_kg === null ? null : Number(u.weight_kg),
  activities:  u.activities || [],
  goal:        u.goal,
  level:       u.level,
  daysPerWeek: u.days_per_week,
  healthOptin: u.health_optin,
  sensitiveZones: u.sensitive_zones || [],
  unit:        u.unit || "kg",
  avatar:      u.avatar || null,
  onboarded:   Boolean(u.onboarded_at),
});

// Valeurs acceptées pour le profil (doivent correspondre à src/components/Onboarding.js)
const ACTIVITIES = ["musculation", "course", "cardio", "danse", "boxe", "yoga", "velo", "natation", "crossfit", "sports-co"];
const GOALS      = ["perte-poids", "prise-muscle", "forme", "endurance"];
const LEVELS     = ["debutant", "intermediaire", "avance"];
// Zones sensibles (doivent correspondre à SENSITIVE_AREAS dans src/components/Shell.js)
const SENSITIVE  = ["cou", "epaules", "coudes", "poignets", "dos", "lombaires", "hanches", "genoux", "chevilles"];
const MAX_AVATAR = 200000; // caractères (≈ 150 Ko d'image)

const intBetween = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

// Chaque champ : colonne SQL + validation. Seuls les champs envoyés sont modifiés.
const PROFILE_FIELDS = {
  gender:      { col: "gender",        ok: (v) => ["homme", "femme"].includes(v) },
  birthYear:   { col: "birth_year",    ok: (v) => intBetween(v, 1900, new Date().getFullYear() - 10) },
  heightCm:    { col: "height_cm",     ok: (v) => intBetween(v, 100, 250) },
  weightKg:    { col: "weight_kg",     ok: (v) => typeof v === "number" && v >= 25 && v <= 300 },
  activities:  { col: "activities",    ok: (v) => Array.isArray(v) && v.length <= ACTIVITIES.length && v.every((a) => ACTIVITIES.includes(a)), toSql: JSON.stringify },
  goal:        { col: "goal",          ok: (v) => GOALS.includes(v) },
  level:       { col: "level",         ok: (v) => LEVELS.includes(v) },
  daysPerWeek: { col: "days_per_week", ok: (v) => intBetween(v, 1, 7) },
  healthOptin: { col: "health_optin",  ok: (v) => typeof v === "boolean" },
  sensitiveZones: { col: "sensitive_zones", ok: (v) => Array.isArray(v) && v.length <= SENSITIVE.length && v.every((z) => SENSITIVE.includes(z)), toSql: JSON.stringify },
  unit:        { col: "unit",          ok: (v) => ["kg", "lbs"].includes(v) },
  // null = retirer la photo
  avatar:      { col: "avatar",        ok: (v) => v === null || (typeof v === "string" && v.length <= MAX_AVATAR && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)) },
};

// POST /api/auth/register  { name, email, password }
router.post("/register", async (req, res) => {
  const name     = req.body?.name?.trim();
  const email    = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!name)                          return res.status(400).json({ error: "Le prénom est requis." });
  if (name.length > 100)              return res.status(400).json({ error: "Prénom trop long." });
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: "Email invalide." });
  if (typeof password !== "string" || password.length < MIN_PASSWORD)
    return res.status(400).json({ error: `Minimum ${MIN_PASSWORD} caractères.` });

  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hash]
    );
    res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Cet email est déjà utilisé." });
    throw err;
  }
});

// POST /api/auth/login  { email, password }
router.post("/login", async (req, res) => {
  const email    = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json(publicUser(rows[0]));
});

// PATCH /api/auth/me  { gender?, birthYear?, heightCm?, weightKg?, activities?, goal?, level?,
//                       daysPerWeek?, healthOptin?, onboarded? }
router.patch("/me", requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const sets = [];
  const values = [];

  for (const [key, field] of Object.entries(PROFILE_FIELDS)) {
    if (body[key] === undefined) continue;
    if (!field.ok(body[key])) return res.status(400).json({ error: `Valeur invalide : ${key}` });
    values.push(field.toSql ? field.toSql(body[key]) : body[key]);
    sets.push(`${field.col} = $${values.length}`);
  }
  if (body.onboarded === true) sets.push("onboarded_at = COALESCE(onboarded_at, now())");
  if (sets.length === 0) return res.status(400).json({ error: "Aucune modification" });

  values.push(req.user.id);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json(publicUser(rows[0]));
});

export default router;
