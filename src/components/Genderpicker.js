import React from "react";

function GenderPicker({ user, onPick }) {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      {/* Glow bg */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 700, height: 400, pointerEvents: "none",
        background: "radial-gradient(ellipse, rgba(255,107,43,0.07), transparent 65%)",
      }} />

      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:"var(--text)", letterSpacing:4, marginBottom:6, position:"relative" }}>
        YASS<span style={{ color:"var(--primary)" }}>-GYM</span>
      </div>

      <p style={{ color:"var(--textMuted)", fontSize:14, marginBottom:12, position:"relative" }}>
        Bienvenue <strong style={{ color:"var(--text)" }}>{user?.name}</strong>
      </p>

      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:12, padding:"8px 20px", marginBottom:36,
        color:"var(--textFaint)", fontSize:12, position:"relative",
      }}>
        ✦ Choisis ton profil pour personnaliser ton expérience
      </div>

      <div className="gender-grid">
        {/* HOMME */}
        <div className="gender-card" onClick={() => onPick("homme")}
          style={{ '--hover-color': '#ff6b2b' }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#ff6b2b";
            e.currentTarget.style.boxShadow   = "0 20px 50px rgba(255,107,43,0.2)";
            e.currentTarget.style.transform   = "translateY(-8px) scale(1.02)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow   = "none";
            e.currentTarget.style.transform   = "none";
          }}
        >
          <div style={{ fontSize:52, marginBottom:14 }}>💪</div>
          <div style={{
            fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700,
            color:"#ff6b2b", letterSpacing:2, marginBottom:8, textTransform:"uppercase",
          }}>Homme</div>
          <div style={{ color:"var(--textFaint)", fontSize:12, lineHeight:1.7, marginBottom:14 }}>
            Force · Masse musculaire<br/>Cardio intensif · Powerlifting
          </div>
          <div style={{
            background:"rgba(255,107,43,0.1)", border:"1px solid rgba(255,107,43,0.3)",
            borderRadius:20, padding:"5px 14px", display:"inline-block",
            color:"#ff6b2b", fontSize:11, fontWeight:700, letterSpacing:0.5,
          }}>90 exercices</div>
        </div>

        {/* FEMME */}
        <div className="gender-card" onClick={() => onPick("femme")}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#ec4899";
            e.currentTarget.style.boxShadow   = "0 20px 50px rgba(236,72,153,0.2)";
            e.currentTarget.style.transform   = "translateY(-8px) scale(1.02)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow   = "none";
            e.currentTarget.style.transform   = "none";
          }}
        >
          <div style={{ fontSize:52, marginBottom:14 }}>🌸</div>
          <div style={{
            fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700,
            color:"#ec4899", letterSpacing:2, marginBottom:8, textTransform:"uppercase",
          }}>Femme</div>
          <div style={{ color:"var(--textFaint)", fontSize:12, lineHeight:1.7, marginBottom:14 }}>
            Fessiers · Tonification<br/>Perte de poids · Pilates
          </div>
          <div style={{
            background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.3)",
            borderRadius:20, padding:"5px 14px", display:"inline-block",
            color:"#ec4899", fontSize:11, fontWeight:700, letterSpacing:0.5,
          }}>70 exercices</div>
        </div>
      </div>
    </div>
  );
}

export default GenderPicker;