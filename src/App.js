import React, { useState, useEffect } from "react";
import { ls, SESSION_KEY } from "./storage";
import { api, getToken, clearToken } from "./api";
import "./App.css";

import Home          from "./components/Home";
import Login         from "./components/Login";
import Onboarding    from "./components/Onboarding";
import ExercisesPage from "./components/Exercisespage";
import SeancePage    from "./components/Seancepage";
import HistoryPage   from "./components/Historypage";
import MealsPage     from "./components/Mealspage";
import Settings      from "./components/Settings";
import ChallengesPage from "./components/Challengespage";
import { TabBar }    from "./components/Shell";
import { syncSteps } from "./steps";

// Session en cache local (affichage immédiat), uniquement si un token existe
const cachedUser = () => (getToken() ? ls.get(SESSION_KEY) : null);

// Écrans accessibles depuis la barre d'onglets
const TAB_PAGES = ["accueil", "exercises", "seance", "repas", "history"];

// Apparence : préférence de l'appareil, gardée en local
const THEME_KEY = "yassgym_theme";
const THEME_BG  = { sombre: "#0b0b0b", clair: "#f4ecdf" };

// Titre de l'onglet du navigateur selon l'écran (repère pour l'historique, les favoris et le référencement)
const SITE_TITLE = "YASS-GYM — Carnet d'entraînement : séances, exercices et repas";
const PAGE_TITLES = {
  login: "Connexion", onboarding: "Bienvenue", profile: "Mon profil", settings: "Réglages",
  exercises: "Exercices", seance: "Séances", repas: "Repas", history: "Suivi", defis: "Défis",
};

function App() {
  const [page, setPage]   = useState("accueil");
  const [user, setUser]   = useState(cachedUser);
  const [theme, setTheme] = useState(() => (ls.get(THEME_KEY) === "clair" ? "clair" : "sombre"));
  // Séance à ouvrir directement en arrivant sur l'onglet Séances (depuis le tableau de bord)
  const [openSeanceId, setOpenSeanceId] = useState(null);

  const gender = user?.gender || null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BG[theme]);
    ls.set(THEME_KEY, theme);
  }, [theme]);

  const go = (p) => { setPage(p); window.scrollTo(0, 0); };

  const saveUser = (u) => { ls.set(SESSION_KEY, u); setUser(u); };

  const handleLogout = () => {
    clearToken();
    ls.del(SESSION_KEY);
    setUser(null);
    go("accueil");
  };

  // Au démarrage : on revalide la session auprès de l'API
  useEffect(() => {
    if (!getToken()) return;
    api.me()
      .then((u) => {
        saveUser(u);
        if (!u.onboarded) go("onboarding");
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 404) handleLogout();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Podomètre (appli Android) : on envoie les pas à l'ouverture et à chaque retour dans l'appli
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const sync = () => { if (document.visibilityState === "visible") syncSteps().catch(() => {}); };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [userId]);

  const handleLogin = (u) => {
    saveUser(u);
    go(u.onboarded ? "accueil" : "onboarding");
  };

  const goSeance = (id) => { setOpenSeanceId(id); go("seance"); };

  // Les écrans internes demandent un compte
  const needsUser = TAB_PAGES.includes(page) || page === "settings" || page === "profile" || page === "defis";
  const current = !user && needsUser ? "accueil" : page;

  useEffect(() => {
    document.title = PAGE_TITLES[current] ? `${PAGE_TITLES[current]} · YASS-GYM` : SITE_TITLE;
  }, [current]);

  return (
    <div className="App">
      {current === "accueil" && (
        <Home
          user={user}
          onLoginClick={() => go("login")}
          onGoExercises={() => go("exercises")}
          onGoSeance={goSeance}
          onGoHistory={() => go("history")}
          onGoSettings={() => go("settings")}
          onGoChallenges={() => go("defis")}
        />
      )}
      {current === "login" && <Login onLogin={handleLogin} onCancel={() => go("accueil")} />}
      {current === "onboarding" && user && (
        <Onboarding user={user} onDone={(u) => { saveUser(u); go("accueil"); }} onLogout={handleLogout} />
      )}
      {current === "profile" && (
        <Onboarding user={user} onDone={(u) => { saveUser(u); go("settings"); }} onClose={() => go("settings")} />
      )}
      {current === "settings" && (
        <Settings user={user} theme={theme} onTheme={setTheme} onUser={saveUser}
          onBack={() => go("accueil")} onEditProfile={() => go("profile")} onLogout={handleLogout} />
      )}
      {current === "exercises" && <ExercisesPage user={user} gender={gender} onGoSeance={goSeance} />}
      {current === "seance" && (
        <SeancePage user={user} gender={gender} openId={openSeanceId} onOpened={() => setOpenSeanceId(null)} />
      )}
      {current === "defis" && <ChallengesPage user={user} onBack={() => go("accueil")} />}
      {current === "repas" && <MealsPage user={user} onUser={saveUser} />}
      {current === "history" && <HistoryPage user={user} onUser={saveUser} />}

      {user && TAB_PAGES.includes(current) && (
        <TabBar page={current} onNav={(p) => (p === "seance" ? goSeance(null) : go(p))} />
      )}
    </div>
  );
}

export default App;
