import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant dans server/.env");
}

// Base sur ce Mac : pas de chiffrement. Base hébergée (Supabase, Neon…) : connexion chiffrée (SSL).
// On retire « sslmode » de l'adresse, sinon il remplacerait ce réglage.
const url = new URL(process.env.DATABASE_URL);
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
url.searchParams.delete("sslmode");

export const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl: local ? false : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);
