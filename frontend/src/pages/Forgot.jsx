import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const location = useLocation();
  const path = location.pathname;

  // load script reCAPTCHA của Google
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!recaptchaToken) {
      setMsg("❌ Vui lòng xác nhận 'I'm not a robot'");
      return;
    }
    setMsg(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Yêu cầu không thành công");
      setMsg("📩 Đã gửi liên kết đặt lại mật khẩu vào email của bạn.");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // callback cho Google reCAPTCHA
  window.onRecaptchaSuccess = (token) => {
    setRecaptchaToken(token);
  };

  return (
    <div className="auth__root">
      {/* LEFT giữ nguyên */}
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

      {/* RIGHT */}
      <section className="auth__right">
        <div className="auth__card">
          <h2 className="auth__title">Quên mật khẩu</h2>
          <div className="auth__banner">
            <img src="/img/banner_uit.png" alt="UIT Banner" />
          </div>

          <p className="auth__hint">
            Quay lại{" "}
            <Link to="/auth/login" className="auth__link">Đăng nhập</Link>
          </p>

          <form onSubmit={submit} className="auth__form">
            <div className="auth__field">
              <label>Địa chỉ Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ví dụ: mssv@uit.edu.vn"
              />
            </div>

            {/* Google reCAPTCHA */}
            <div className="auth__captcha">
              <div
                className="g-recaptcha"
                data-sitekey="6Lc40NIrAAAAAPSD3AXTYv6KURG3cbgZgZnT3kwr" 
                data-callback="onRecaptchaSuccess"
              ></div>
            </div>

            {msg && <div className="auth__msg">{msg}</div>}

            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
