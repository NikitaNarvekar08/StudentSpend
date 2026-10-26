import { useState } from "react";
import "./Auth.css";

const API = "http://localhost:5000/api/auth";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();

    if (mode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setBusy(true);
      const response = await fetch(`${API}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode === "register" ? { name: name.trim() } : {}),
          email: cleanEmail,
          password
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `${mode === "login" ? "Login" : "Registration"} failed.`);
      if (!data.token || !data.user) {
        throw new Error("The backend must return both a token and a user. Authentication API is not configured yet.");
      }
      onLogin({ token: data.token, user: data.user });
    } catch (err) {
      setError(err.message || "Could not connect. Check that the backend is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand"><span className="auth-brand-mark">S</span> StudentSpend</div>
        <div className="auth-visual-content">
          <span className="auth-kicker">YOUR MONEY, YOUR PLAN</span>
          <h1>Small steps today.<br />Better money habits tomorrow.</h1>
          <p>Keep your budget clear, understand your spending, and work towards the things you want.</p>
          <div className="auth-benefits">
            <div><span>↗</span><p><strong>Track spending</strong><small>See where your money goes.</small></p></div>
            <div><span>◎</span><p><strong>Plan your budget</strong><small>Make your pocket money go further.</small></p></div>
            <div><span>✦</span><p><strong>Reach your goals</strong><small>Celebrate every saving milestone.</small></p></div>
          </div>
        </div>
        <p className="auth-visual-footer">Made for student life, with ♥</p>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-mobile-brand"><span className="auth-brand-mark">S</span> StudentSpend</div>
          <div className="auth-form-heading">
            <span className="auth-mini-label">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</span>
            <h2>{mode === "login" ? "Sign in to your account" : "Create your account"}</h2>
            <p>{mode === "login" ? "Pick up where you left off with your finances." : "Start building better money habits today."}</p>
          </div>

          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setError(""); }}>Login</button>
            <button type="button" className={mode === "register" ? "selected" : ""} onClick={() => { setMode("register"); setError(""); }}>Register</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && <label>Full name
              <input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" maxLength={80} required />
            </label>}
            <label>Email address
              <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </label>
            <label>Password
              <div className="auth-password-wrap">
                <input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
                <button type="button" className="auth-show-password" onClick={() => setShowPassword(v => !v)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
            </label>
            {error && <p className="auth-alert auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in →" : "Create account →"}</button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New to StudentSpend?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="auth-security-note">Your financial data should stay private and secure.</p>
        </div>
      </section>
    </main>
  );
}
