// ─── CLIENT API (backend Node.js / PostgreSQL) ───────────────────────────────
// En dev, les appels "/api/..." sont redirigés vers http://localhost:4000 grâce au "proxy" de package.json.
// Dans l'appli mobile (Capacitor) il n'y a pas de proxy : REACT_APP_API_URL donne l'adresse du serveur.
const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "yassgym_token";

export const getToken   = ()  => localStorage.getItem(TOKEN_KEY);
export const setToken   = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = ()  => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register:  (name, email, password) => request("/auth/register", { method: "POST", body: { name, email, password } }),
  login:     (email, password)       => request("/auth/login",    { method: "POST", body: { email, password } }),
  me:        ()                      => request("/auth/me"),
  setGender: (gender)                => request("/auth/me", { method: "PATCH", body: { gender } }),
  updateProfile: (profile)           => request("/auth/me", { method: "PATCH", body: profile }),

  // Séances programmées
  getSeances:   ()           => request("/seances"),
  createSeance: (seance)     => request("/seances",        { method: "POST", body: seance }),
  updateSeance: (id, seance) => request(`/seances/${id}`,  { method: "PUT",  body: seance }),
  deleteSeance: (id)         => request(`/seances/${id}`,  { method: "DELETE" }),

  // Historique & stats
  getHistory:  ()        => request("/workouts"),
  saveWorkout: (workout) => request("/workouts", { method: "POST", body: workout }),
  getStats:    ()        => request("/workouts/stats"),
};
