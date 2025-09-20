import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onAuthed }) {
  const location = useLocation();
  const path = location.pathname; // ví dụ: "/auth/login"
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault(); if (loading) return;
    setMsg(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      const token = data.token || data.access;
      if (!token) throw new Error("No token");
      onAuthed?.(token);              // lưu token ở App
      nav("/app/dashboard", { replace: true });
    } catch (e) { setMsg(e.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="auth__root">
      <section className="auth__left">
        <div className="auth__leftOverlay" />
        <div className="auth__leftContent">
          <div className="auth__brand"><img src="/img/logo_uit.svg" alt="UIT Logo" className="auth__logo logo-hover" /><span>UIT</span></div>
          <h1>Học sáng tạo, trải nghiệm, Sống trách nhiệm, yêu thương!</h1>
          <div className="auth__dots">
            <span className={path.includes("/login") ? "active" : ""} />
            <span className={path.includes("/register") ? "active" : ""} />
            <span className={path.includes("/forgot") ? "active" : ""} />
           </div>

        </div>
      </section>

      <section className="auth__right">
        <div className="auth__card">
          <h2>Sign In</h2>
          <p className="auth__hint">New user? <Link className="auth__link" to="/auth/register">Create an account</Link></p>

          <form onSubmit={submit} className="auth__form">
            <div className="auth__field">
              <label>Email Address</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
            </div>
            <div className="auth__field">
              <label>Password</label>
              <div className="auth__pw">
                <input type={showPw?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Input your password"/>
                <button type="button" className="auth__eye" onClick={()=>setShowPw(s=>!s)}>{showPw?"🙈":"👁️"}</button>
              </div>
            </div>

            <div className="auth__row" style={{ textAlign: "right" }}>
                <Link className="auth__link" to="/auth/forgot">Forgot password?</Link>
            </div>

            {msg && <div className="auth__msg">{msg}</div>}
            <button className="btn btn--primary" type="submit" disabled={loading}>{loading?"Signing in...":"Sign In"}</button>
            <div className="auth__divider"><span>or</span></div>
            <button type="button" className="btn btn--oauth">Sign in with Google</button>
            <button type="button" className="btn btn--oauth fb">Sign in with Facebook</button>
            <p className="auth__terms">Protected by reCAPTCHA and subject to the Google Privacy Policy and Terms of Service.</p>
          </form>
        </div>
      </section>
    </div>
  );
}
