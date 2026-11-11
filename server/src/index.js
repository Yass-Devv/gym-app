import express from "express";
import cors from "cors";
import { pool } from "./db/pool.js";
import authRoutes    from "./routes/auth.js";
import seanceRoutes  from "./routes/seances.js";
import workoutRoutes from "./routes/workouts.js";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET manquant dans server/.env");

const app = express();
// Origines autorisées : le site en dev + l'appli mobile Capacitor (Android et iOS)
const ORIGINS = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost", "https://localhost", "capacitor://localhost",
];
app.use(cors({ origin: ORIGINS }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, db: "connected" });
});

app.use("/api/auth",     authRoutes);
app.use("/api/seances",  seanceRoutes);
app.use("/api/workouts", workoutRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route introuvable" }));

// Express 5 transmet automatiquement ici les erreurs des handlers async
app.use((err, _req, res, _next) => {
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
