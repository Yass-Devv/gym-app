import React from "react";

function Home({ user, gender, seanceCount, onLoginClick, onLogout, onGoExercises, onGoSeance, onGoHistory, onSwitchGender }) {
  const isFemme = gender === "femme";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── HEADER ── */}
      <div className="gy-header">
        <div className="gy-logo">
          YASS<span style={{ color:"var(--primary)" }}>-GYM</span>
          <span className="gy-logo-dot" />
        </div>
        <div className="gy-header-right">
          {user ? (
            <>
              <button className="gy-gender-tag" onClick={onSwitchGender}>
                {isFemme ? "🌸 Femme" : "💪 Homme"}
              </button>
              <span className="gy-username">👋 {user.name}</span>
              <button className="btn-ghost" onClick={onLogout}>Déconnexion</button>
            </>
          ) : (
            <button className="btn-orange" onClick={onLoginClick}>Se connecter</button>
          )}
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="home-hero">
        <div className="home-hero-glow" />

        <h1 className="home-hero-title">
          YASS<span>-GYM</span>
        </h1>

        <p className="home-hero-sub">
          {user
            ? `Ready to train, ${user.name} ? ${isFemme ? "🌸" : "💪"}`
            : "Track. Train. Transform."}
        </p>

        {!user && (
          <button className="btn-primary btn-primary-lg" onClick={onLoginClick} style={{ marginBottom: 36 }}>
            Commencer maintenant →
          </button>
        )}

        {/* Phone frame avec image de fond */}
        <div className="home-phone-frame" style={{ marginBottom: user ? 36 : 0 }}>
          <img
            src="/images/fond-d'acceuil.jpg"
            alt="Yass-Gym training"
            onError={e => { e.target.parentElement.style.display="none"; }}
          />
          <div className="home-phone-overlay">
            <div className="home-phone-mode-badge">
              {isFemme ? "🌸 Mode Femme" : "💪 Mode Homme"}
            </div>
          </div>
        </div>
      </div>

      {/* ── CARDS ── */}
      {user ? (
        <div className="home-cards">
          <div className="home-card" onClick={onGoExercises}>
            <span className="home-card-icon">🏋️</span>
            <div className="home-card-title">Exercices</div>
            <div className="home-card-desc">
              {isFemme
                ? "70 exercices · Fessiers, cardio, tonification"
                : "90 exercices · Force, masse, explosivité"}
            </div>
            <div className="home-card-badge">
              {isFemme ? "70 exos" : "90 exos"}
            </div>
          </div>

          <div className="home-card" onClick={onGoSeance}>
            <span className="home-card-icon">🏃</span>
            <div className="home-card-title">Mes Séances</div>
            <div className="home-card-desc">Crée tes séances · séries, reps et poids</div>
            {seanceCount > 0 && (
              <div className="home-card-badge">
                {seanceCount} exercice{seanceCount > 1 ? "s" : ""} en cours
              </div>
            )}
          </div>

          <div className="home-card" onClick={onGoHistory}>
            <span className="home-card-icon">📊</span>
            <div className="home-card-title">Historique</div>
            <div className="home-card-desc">Progression · calories · streak</div>
          </div>
        </div>
      ) : (
        <p style={{ textAlign:"center", color:"var(--textFaint)", fontSize:13, paddingBottom:40 }}>
          Connecte-toi pour accéder à toutes les fonctionnalités
        </p>
      )}
    </div>
  );
}

export default Home;