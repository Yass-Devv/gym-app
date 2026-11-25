import jwt from "jsonwebtoken";

export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d", algorithm: "HS256" });

// Vérifie le header "Authorization: Bearer <token>" et place l'utilisateur dans req.user
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Non authentifié" });
  try {
    // Algorithme imposé : un token signé autrement (ou non signé) est refusé
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!Number.isInteger(payload.id)) throw new Error("token invalide");
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Session expirée, reconnecte-toi" });
  }
}

// Identifiant numérique d'une ressource dans l'adresse (/:id) : tout le reste est « introuvable »
export const validId = (v) => /^\d{1,9}$/.test(String(v));
