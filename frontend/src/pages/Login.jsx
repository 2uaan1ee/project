// src/pages/Login.jsx
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

// nhớ import themify icons trong index.html
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/themify-icons/0.1.2/css/themify-icons.css"/>

export default function Login({ onAuthed }) {
  const location = useLocation();
  const path = location.pathname;
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
  
      const token = data.token || data.access;
      if (!token) throw new Error("Không có token");
  
      // ✅ Lưu JWT
      localStorage.setItem("token", token);
  
      onAuthed?.(token); // nếu bạn vẫn muốn cập nhật state App
      nav("/app/dashboard", { replace: true });
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth__root">
      {/* giữ nguyên auth__left */}
      <section className="auth__left">
        <div className="auth__leftOverlay" />
        <div className="auth__leftContent">
          <div className="auth__brand">
            <img src="/img/logo_uit.svg" alt="UIT Logo" className="auth__logo logo-hover" />
          </div>
          <h1>TOÀN DIỆN, SÁNG TẠO, PHỤNG SỰ</h1>
          <div className="auth__dots">
            <span className={path.includes("/login") ? "active" : ""} />
            <span className={path.includes("/forgot") ? "active" : ""} />
          </div>
        </div>
      </section>

      {/* auth__right có card */}
      <section className="auth__right">
        <div className="auth__card">
          

          {/* banner dưới chữ Đăng nhập */}
          <div className="auth__banner" style={{ margin: "10px 0 20px" }}>
            <img src="/img/banner_uit.png" alt="UIT Banner" style={{ width: "100%", borderRadius: "12px" }} />
          </div>
          <h2>Đăng nhập</h2>
          <form onSubmit={submit} className="auth__form">
            <div className="auth__field">
              <label>Địa chỉ Email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="ví dụ: example@uit.edu.vn"
              />
            </div>

            <div className="auth__field">
              <label>Mật khẩu</label>
              <input 
                type="password"
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Nhập mật khẩu" 
              />
            </div>

            <div className="auth__row" style={{ textAlign: "right" }}>
              <Link className="auth__link" to="/auth/forgot">Quên mật khẩu?</Link>
            </div>

            {msg && <div className="auth__msg">{msg}</div>}

            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {/* nút đăng nhập google */}
            <button 
              type="button" 
              className="btn btn--google"
              onClick={()=>window.location.href="/api/auth/google"}
              style={{ marginTop: "10px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}
            >
              <img className="btn__glogo" src="/img/google-logo.png" alt="Google Logo" />
              Đăng nhập bằng Google
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
