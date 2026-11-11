// Crée les tables à partir de schema.sql : npm run db:init
import { readFile } from "node:fs/promises";
import { pool } from "./pool.js";

const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
try {
  await pool.query(sql);
  console.log("✅ Base de données initialisée");
} catch (err) {
  console.error("❌ Erreur d'initialisation :", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
