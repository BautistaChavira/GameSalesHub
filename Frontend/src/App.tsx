import { useState } from "react";
import "./App.css";
import Login from "./Login";
import Usuario from "./Usuario";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string>("offers");

  const userName = "Alan";
  const userImage = "/userdefault.jpg";

  return (
    <div className="app_root">
      <nav className="app_navbar">
        <button className="app_nav_btn" onClick={() => setActiveView("offers")}>
          Ofertas principales
        </button>
        <button className="app_nav_btn" onClick={() => setActiveView("foryou")}>
          Para ti
        </button>
        <button
          className="app_nav_btn"
          onClick={() => setActiveView("user")}
        >
          {isLoggedIn ? userName : "Iniciar sesión"}
        </button>
        <div className="app_user_avatar_wrapper">
          <img
            src={userImage}
            alt="Usuario"
            className="app_user_avatar"
            style={{ opacity: isLoggedIn ? 1 : 0.4 }}
          />
        </div>
      </nav>

      <main className="app_content">
        {activeView === "offers" && <h2>Ofertas principales (pendiente)</h2>}
        {activeView === "foryou" && <h2>Para ti (pendiente)</h2>}
        {activeView === "user" &&
          (!isLoggedIn ? (
            <Login onLogin={() => setIsLoggedIn(true)} />
          ) : (
            <Usuario />
          ))}
      </main>
    </div>
  );
}

export default App;