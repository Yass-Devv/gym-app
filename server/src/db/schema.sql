-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  gender        VARCHAR(10)  CHECK (gender IN ('homme', 'femme')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Séances programmées (modèles : nom, jour, liste d'exercices)
CREATE TABLE IF NOT EXISTS seances (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom         VARCHAR(100) NOT NULL,
  jour        VARCHAR(20)  NOT NULL DEFAULT 'Lundi',
  exercises   JSONB        NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seances_user ON seances(user_id);

-- Historique des séances terminées
CREATE TABLE IF NOT EXISTS workouts (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seance_name  VARCHAR(100),
  exercises    JSONB        NOT NULL DEFAULT '[]',
  total_cal    INTEGER      NOT NULL DEFAULT 0,
  performed_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, performed_at DESC);

-- Profil sportif (onboarding) — ajout idempotent : relancer npm run db:init suffit
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year    SMALLINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm     SMALLINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg     NUMERIC(5,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS activities    JSONB NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal          VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS level         VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS days_per_week SMALLINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS health_optin  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at  TIMESTAMPTZ;

-- Réglages : zones sensibles, unité de poids, photo de profil (JPEG en data URL)
ALTER TABLE users ADD COLUMN IF NOT EXISTS sensitive_zones JSONB NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS unit            VARCHAR(3) NOT NULL DEFAULT 'kg';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar          TEXT;

-- Objectifs choisis à la main : { kcal, protein, carbs, fat, burn }. Un objectif absent est calculé d'après le profil.
ALTER TABLE users ADD COLUMN IF NOT EXISTS goals JSONB NOT NULL DEFAULT '{}';

-- Repas : aliments consommés jour par jour. Les valeurs sont celles de la quantité saisie (pas pour 100 g).
CREATE TABLE IF NOT EXISTS meals (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  eaten_on   DATE         NOT NULL,
  meal       VARCHAR(20)  NOT NULL CHECK (meal IN ('petit-dej', 'dejeuner', 'diner', 'collation')),
  name       VARCHAR(150) NOT NULL,
  grams      NUMERIC(7,1),
  kcal       INTEGER      NOT NULL,
  protein    NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs      NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat        NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meals_user_day ON meals(user_id, eaten_on);
