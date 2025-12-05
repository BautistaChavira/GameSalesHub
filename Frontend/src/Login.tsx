import { useState } from "react";
import "./Login.css";

interface LoginProps {
  onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica real de login (API call)
    console.log("Login:", { email, username, password });
    onLogin();
  };

  return (
    <div className="login_root">
      <h2 className="login_title">Iniciar sesión</h2>
      <form className="login_form" onSubmit={handleSubmit}>
        <label className="login_label">
          Email
          <input
            type="email"
            className="login_input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="login_label">
          Nombre de usuario
          <input
            type="text"
            className="login_input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label className="login_label">
          Contraseña
          <input
            type="password"
            className="login_input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="login_btn">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;