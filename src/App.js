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
import Settings      from "./components/Settings";
import { TabBar }    from "./components/Shell";

// Session en cache local (affichage immédiat), uniquement si un token existe
const cachedUser = () => (getToken() ? ls.get(SESSION_KEY) : null);

// Écrans accessibles depuis la barre d'onglets
const TAB_PAGES = ["accueil", "exercises", "seance", "history"];

// Apparence : préférence de l'appareil, gardée en local
const THEME_KEY = "yassgym_theme";
const THEME_BG  = { sombre: "#0b0b0b", clair: "#f4ecdf" };

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

  const handleLogin = (u) => {
    saveUser(u);
    go(u.onboarded ? "accueil" : "onboarding");
  };

  const goSeance = (id) => { setOpenSeanceId(id); go("seance"); };

  // Les écrans internes demandent un compte
  const needsUser = TAB_PAGES.includes(page) || page === "settings" || page === "profile";
  const current = !user && needsUser ? "accueil" : page;

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
      {current === "history" && <HistoryPage user={user} />}

      {user && TAB_PAGES.includes(current) && (
        <TabBar page={current} onNav={(p) => (p === "seance" ? goSeance(null) : go(p))} />
      )}
    </div>
  );
}

export default App;
