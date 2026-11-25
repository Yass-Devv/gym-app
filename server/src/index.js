import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool } from "./db/pool.js";
import authRoutes    from "./routes/auth.js";
import seanceRoutes  from "./routes/seances.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes    from "./routes/meals.js";
import challengeRoutes from "./routes/challenges.js";
import stepRoutes    from "./routes/steps.js";

const PROD = process.env.NODE_ENV === "production";
const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error("JWT_SECRET manquant dans server/.env");
// En production, on refuse un secret trop court ou resté à la valeur d'exemple : il permettrait de forger des sessions
if (PROD && (JWT_SECRET.length < 32 || JWT_SECRET.startsWith("change-moi"))) {
  throw new Error("JWT_SECRET trop faible : mets une longue chaîne aléatoire (ex. openssl rand -hex 48)");
}

const app = express();
// Derrière un hébergeur (Render, Railway, nginx…) : TRUST_PROXY=1 pour lire la vraie adresse IP du visiteur
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

// En-têtes de sécurité (nosniff, HSTS, anti-clickjacking…) et retrait de « X-Powered-By ».
// L'API ne renvoie que du JSON : aucune ressource n'a besoin d'être chargée depuis ses réponses.
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // l'appli mobile et le site appellent l'API depuis une autre origine
}));

// Origines autorisées : le site en dev + l'appli mobile Capacitor (Android et iOS)
const ORIGINS = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost", "https://localhost", "capacitor://localhost",
];
app.use(cors({ origin: ORIGINS }));
app.use(express.json({ limit: "300kb" })); // la photo de profil pèse au plus ~200 Ko

// Limites de débit par adresse IP : générale, puis stricte sur la connexion et l'inscription (anti force brute)
const limiter = (windowMin, max, error) => rateLimit({
  windowMs: windowMin * 60 * 1000, limit: max,
  standardHeaders: "draft-7", legacyHeaders: false,
  message: { error },
});
app.use("/api", limiter(1, 300, "Trop de requêtes, réessaie dans une minute."));
const authLimiter = limiter(15, 20, "Trop de tentatives, réessaie dans quelques minutes.");
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Les réponses contiennent des données personnelles : jamais de mise en cache
app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, db: "connected" });
});

app.use("/api/auth",     authRoutes);
app.use("/api/seances",  seanceRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/meals",    mealRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/steps",    stepRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route introuvable" }));

// Express 5 transmet automatiquement ici les erreurs des handlers async
app.use((err, _req, res, _next) => {
  // Requête mal formée (JSON invalide, corps trop gros) : erreur du client, pas du serveur
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Données trop volumineuses." });
  if (err.status >= 400 && err.status < 500) return res.status(400).json({ error: "Requête invalide." });
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

const PORT = process.env.PORT || 4000;
// Express 5 passe les erreurs de démarrage (ex. port déjà utilisé) à ce callback
app.listen(PORT, (err) => {
  if (err) {
    console.error(err.code === "EADDRINUSE"
      ? `❌ Le port ${PORT} est déjà utilisé : un autre serveur tourne déjà (ferme l'autre terminal).`
      : `❌ Démarrage impossible : ${err.message}`);
    process.exit(1);
  }
  console.log(`🚀 API YASS-GYM sur http://localhost:${PORT}`);
});
