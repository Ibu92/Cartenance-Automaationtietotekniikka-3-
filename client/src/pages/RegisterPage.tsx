import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CarFront } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../state";
import type { User } from "../types";

export function RegisterPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await api<{ token: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      login(result.token, result.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-panel" onSubmit={submit}>
        <div className="auth-title"><CarFront size={34} /><h1>Create account</h1></div>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="button wide">Register</button>
        <p className="muted">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
