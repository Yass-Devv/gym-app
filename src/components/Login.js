import React, { useState } from "react";
import { ls, USERS_KEY } from "../storage";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

function Login({ onLogin, onCancel }) {
  const [mode, setMode] = useState("login");
  const [f, setF]       = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (mode === "register" && !f.name.trim())
      e.name = "Le prénom est requis.";
    if (!f.email.trim())
      e.email = "L'email est requis.";
    else if (!isValidEmail(f.email))
      e.email = "Email invalide (ex: nom@domaine.com)";
    if (!f.password)
      e.password = "Le mot de passe est requis.";
    else if (f.password.length < 4)
      e.password = "Minimum 4 caractères.";
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const users = ls.get(USERS_KEY, {});
    if (mode === "login") {
      if (!users[f.email.trim()] || users[f.email.trim()].password !== f.password) {
        setErrors({ general: "Email ou mot de passe incorrect." });
        return;
      }
      onLogin({ email: f.email.trim(), name: users[f.email.trim()].name, gender: users[f.email.trim()].gender });
    } else {
      if (users[f.email.trim()]) { setErrors({ email: "Cet email est déjà utilisé." }); return; }
      users[f.email.trim()] = { name: f.name.trim(), password: f.password };
      ls.set(USERS_KEY, users);
      onLogin({ email: f.email.trim(), name: f.name.trim() });
    }
  };

  const errStyle = { color: "#f87171", fontSize: 11, marginTop: 5, paddingLeft: 2, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 };
  const isLogin  = mode === "login";

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* ── GAUCHE : Formulaire ── */}
        <div className="auth-left">
          <div className="auth-logo">⚡ YASS-GYM</div>
          <h2 className="auth-title">{isLogin ? "Bon retour 👋" : "Créer un compte"}</h2>
          <p className="auth-sub">{isLogin ? "Connecte-toi pour suivre ta progression" : "Rejoins la communauté YASS-GYM"}</p>

          {mode === "register" && (
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input className="gy-input" placeholder="Prénom" type="text" value={f.name}
                  onChange={e => { setF({ ...f, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                  onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
              </div>
              {errors.name && <div style={errStyle}>⚠ {errors.name}</div>}
            </div>
          )}

          <div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input className="gy-input" placeholder="Adresse email" type="email" value={f.email}
                style={{ borderColor: errors.email ? "#ef4444" : undefined }}
                onChange={e => { setF({ ...f, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            {errors.email && <div style={errStyle}>⚠ {errors.email}</div>}
          </div>

          <div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input className="gy-input" placeholder="Mot de passe" type="password" value={f.password}
                style={{ borderColor: errors.password ? "#ef4444" : undefined }}
                onChange={e => { setF({ ...f, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            {errors.password && <div style={errStyle}>⚠ {errors.password}</div>}
          </div>

          {isLogin && (
            <div className="auth-forgot">
              <span>Mot de passe oublié ?</span>
            </div>
          )}

          {errors.general && (
            <div className="auth-err">⚠️ {errors.general}</div>
          )}

          <button className="btn-orange btn-orange-full" onClick={submit} style={{ marginTop: 4 }}>
            {isLogin ? "Se connecter →" : "Créer mon compte →"}
          </button>

          {onCancel && (
            <p style={{ textAlign: "center", marginTop: 14 }}>
              <span style={{ color: "var(--textFaint)", cursor: "pointer", fontSize: 12 }} onClick={onCancel}>
                ← Retour à l'accueil
              </span>
            </p>
          )}
        </div>

        {/* ── DROITE : Branding ── */}
        <div className="auth-right">
          <div className="auth-right-logo">YASS-GYM</div>
          <p className="auth-right-tagline">
            {isLogin
              ? "Pas encore de compte ?\nRejoins des milliers d'athlètes et commence ton parcours fitness dès aujourd'hui."
              : "Tu as déjà un compte ?\nConnecte-toi pour retrouver tes séances, ta progression et tes stats."}
          </p>
          <button className="auth-right-switch-btn"
            onClick={() => { setMode(isLogin ? "register" : "login"); setErrors({}); setF({ name:"", email:"", password:"" }); }}>
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;