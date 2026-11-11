import React, { useState } from "react";
import { ls, SESSION_KEY, workoutKey, THEMES } from "./storage";
import "./App.css";

import Home          from "./components/Home";
import Login         from "./components/Login";
import GenderPicker  from "./components/Genderpicker";
import ExercisesPage from "./components/Exercisespage";
import SeancePage    from "./components/Seancepage";
import HistoryPage   from "./components/Historypage";

function App() {
  const [page, setPage]     = useState("accueil");
  const [user, setUser]     = useState(() => ls.get(SESSION_KEY));
  const [gender, setGender] = useState(() => ls.get(SESSION_KEY)?.gender || null);
  const [seanceItems, setSeanceItems] = useState(() => {
    const u = ls.get(SESSION_KEY);
    return u ? ls.get(workoutKey(u.email), []) : [];
  });

  const theme = THEMES[gender] || THEMES.homme;
  const root  = document.documentElement;
  Object.entries(theme).forEach(([k, v]) => root.style.setProperty("--" + k, v));

  const handleLogin = (u) => {
    ls.set(SESSION_KEY, u);
    setUser(u);
    setGender(u.gender || null);
    setSeanceItems(ls.get(workoutKey(u.email), []));
    if (u.gender) setPage("accueil");
    else          setPage("gender");
  };

  const handleGender = (g) => {
    const updated = { ...user, gender: g };
    ls.set(SESSION_KEY, updated);
    setUser(updated);
    setGender(g);
    setPage("accueil");
  };

  const handleLogout = () => {
    ls.del(SESSION_KEY);
    setUser(null);
    setGender(null);
    setSeanceItems([]);
    setPage("accueil");
  };

  const addToSeance = (ex) => {
    if (!user) return;
    const cur     = ls.get(workoutKey(user.email), []);
    const updated = [...cur, { ex, sets: "3", reps: "", weight: "" }];
    ls.set(workoutKey(user.email), updated);
    setSeanceItems(updated);
  };

  const clearSeance = () => {
    if (user) ls.del(workoutKey(user.email));
    setSeanceItems([]);
  };

  return (
    <div className="App">
      {page === "accueil" && (
        <Home
          user={user} gender={gender} seanceCount={seanceItems.length}
          onLoginClick={() => setPage("login")}
          onLogout={handleLogout}
          onGoExercises={() => setPage("exercises")}
          onGoSeance={()    => setPage("seance")}
          onGoHistory={()   => setPage("history")}
          onSwitchGender={() => setPage("gender")}
        />
      )}
      {page === "login"  && <Login onLogin={handleLogin} onCancel={() => setPage("accueil")} />}
      {page === "gender" && <GenderPicker user={user} onPick={handleGender} />}
      {page === "exercises" && (
        <ExercisesPage user={user} gender={gender} onAddToSeance={addToSeance} onBack={() => setPage("accueil")} />
      )}
      {page === "seance" && (
        <SeancePage user={user} gender={gender} seanceItems={seanceItems}
          setSeanceItems={setSeanceItems}
          onSave={() => { clearSeance(); setPage("history"); }}
          onBack={() => setPage("accueil")} />
      )}
      {page === "history" && (
        <HistoryPage user={user} gender={gender} onBack={() => setPage("accueil")} />
      )}
    </div>
  );
}

export default App;