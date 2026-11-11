import React, { useState } from "react";
import { api, setToken } from "../api";
import { Logo, photo } from "./Shell";
import "./auth.css";

const MIN_PASSWORD = 6;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Score 0-4 : longueur, majuscule/minuscule, chiffre, caractère spécial
const passwordScore = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= MIN_PASSWORD) s++;
  if (p.length >= 10) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  else if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) s += 0.5;
  return Math.min(4, Math.floor(s));
};
const SCORE_LABELS = ["Trop court", "Faible", "Correct", "Bon", "Très solide"];

function Login({ onLogin, onCancel }) {
  const [mode, setMode]       = useState("login");
  const [f, setF]             = useState({ name: "", email: "", password: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const isLogin = mode === "login";
  const score   = passwordScore(f.password);

  const set = (key) => (e) => {
    setF({ ...f, [key]: e.target.value });
    if (errors[key] || errors.general) setErrors({ ...errors, [key]: "", general: "" });
  };

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    setErrors({});
    setShowPwd(false);
  };

  const validate = () => {
    const e = {};
    if (!isLogin && !f.name.trim()) e.name = "Le prénom est requis.";
    if (!f.email.trim()) e.email = "L'e-mail est requis.";
    else if (!isValidEmail(f.email)) e.email = "E-mail invalide (ex. : nom@domaine.com)";
    if (!f.password) e.password = "Le mot de passe est requis.";
    else if (!isLogin && f.password.length < MIN_PASSWORD) e.password = `Minimum ${MIN_PASSWORD} caractères.`;
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (loading) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const { token, user } = isLogin
        ? await api.login(f.email.trim(), f.password)
        : await api.register(f.name.trim(), f.email.trim(), f.password);
      setToken(token);
      onLogin(user);
    } catch (err) {
      if (err.status === 409) setErrors({ email: err.message });
      else if (err.status) setErrors({ general: err.message });
      else setErrors({ general: "Serveur injoignable. Vérifie ta connexion et réessaie." });
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="lg-photo">
        <img className="ph" src={photo(isLogin ? "barre-nb" : "rack")} alt="" />
        <header className="bar">
          <Logo />
          {onCancel && <button type="button" className="link" onClick={onCancel}>Fermer</button>}
        </header>
      </div>

      <form className="lg-form" onSubmit={submit} noValidate key={mode}>
        <h1 className="disp lg-title">
          {isLogin ? <>Content de<br />te revoir.</> : <>Ouvre ton<br />carnet.</>}
        </h1>

        {!isLogin && (
          <>
            <div className={"field" + (errors.name ? " err" : "")}>
              <label htmlFor="lg-name">Prénom</label>
              <input id="lg-name" type="text" autoComplete="given-name" maxLength={100}
                value={f.name} onChange={set("name")} />
            </div>
            {errors.name && <div className="field-err" role="alert">{errors.name}</div>}
          </>
        )}

        <div className={"field" + (errors.email ? " err" : "")}>
          <label htmlFor="lg-email">E-mail</label>
          <input id="lg-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
            spellCheck="false" placeholder="nom@domaine.com" value={f.email} onChange={set("email")} />
        </div>
        {errors.email && <div className="field-err" role="alert">{errors.email}</div>}

        <div className={"field" + (errors.password ? " err" : "")}>
          <label htmlFor="lg-password">
            <span>Mot de passe</span>
            <button type="button" className="lg-show" onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? "Masquer" : "Afficher"}
            </button>
          </label>
          <input id="lg-password" type={showPwd ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={isLogin ? "" : `${MIN_PASSWORD} caractères minimum`}
            value={f.password} onChange={set("password")} />
        </div>
        {errors.password && <div className="field-err" role="alert">{errors.password}</div>}
        {!isLogin && f.password && (
          <div className="lg-strength mono" data-score={score}>
            <div className="lg-strength-bars"><i /><i /><i /><i /></div>
            <span>{SCORE_LABELS[score]}</span>
          </div>
        )}

        {errors.general && <div className="alert" role="alert">{errors.general}</div>}

        <button type="submit" className="btn" disabled={loading}>
          {loading
            ? <span className="spin" aria-label="Chargement" />
            : <><span>{isLogin ? "Se connecter" : "Créer mon compte"}</span><span aria-hidden="true">→</span></>}
        </button>

        <p className="lg-switch mono">
          {isLogin ? "Pas de compte ? " : "Déjà inscrit ? "}
          <button type="button" onClick={switchMode}>{isLogin ? "Créer le mien" : "Me connecter"}</button>
        </p>
      </form>
    </div>
  );
}

export default Login;
