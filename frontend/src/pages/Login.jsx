// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";

export default function Login({ onAuthed }) {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    sessionStorage.removeItem("token");
  }, []);

  // 🧩 Hàm parse lỗi từ server hoặc HTTP
  const parseError = (res, data, raw) => {
    let msg = data?.message || "";

    if (res.status === 403 && !msg)
      msg = "Tài khoản email không được phép. Chỉ chấp nhận: uit.edu.vn, gm.uit.edu.vn";
    else if (res.status === 401 && !msg)
      msg = "Mật khẩu không đúng";
    else if (res.status === 404 && !msg)
      msg = "Không tìm thấy người dùng";
    else if (!msg && /<!DOCTYPE|<html/i.test(raw))
      msg = "Phản hồi không hợp lệ từ máy chủ (HTML). Kiểm tra proxy API.";
    else if (!msg)
      msg = "Đăng nhập thất bại";

    return msg;
  };

  // 🧩 Xử lý đăng nhập
  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setMsg("");
    setLoading(true);

    try {
      const payload = { email: email.trim().toLowerCase(), password };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),

        // ✅ QUAN TRỌNG: để nhận cookie refresh_token từ server
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();
      const data = contentType.includes("application/json") ? JSON.parse(raw) : null;

      if (!res.ok) throw new Error(parseError(res, data, raw));

      const token = data?.token || data?.access;
      if (!token) throw new Error("Không nhận được token từ máy chủ");

      // ✅ Lưu token vào sessionStorage luôn cho chắc
      sessionStorage.setItem("token", token);

      // Decode JWT to get user info
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(window.atob(base64));

        if (payload.role) sessionStorage.setItem("user_role", payload.role);
        if (payload.email) sessionStorage.setItem("user_email", payload.email);
      } catch (decodeErr) {
        console.warn("Failed to decode token:", decodeErr);
      }

      onAuthed?.(token);
      nav("/app/dashboard", { replace: true });
    } catch (err) {
      setMsg(err.message || "Có lỗi xảy ra trong quá trình đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth__right">
      <div className="auth__card">
        {/* Banner UIT */}
        <div className="auth__banner" style={{ margin: "10px 0 20px" }}>
          <img
            src="/img/banner_uit.png"
            alt="UIT Banner"
            style={{ width: "100%", borderRadius: "12px" }}
          />
        </div>

        <h2 className="auth__title">Đăng nhập</h2>

        <form onSubmit={submit} className="auth__form">
          <div className="auth__field">
            <label>Địa chỉ Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ví dụ: example@uit.edu.vn"
            />
          </div>

          <div className="auth__field">
            <label>Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <div className="auth__row" style={{ textAlign: "right" }}>
            <Link className="auth__link" to="/auth/forgot">
              Quên mật khẩu?
            </Link>
          </div>

          {msg && <div className="auth__msg">{msg}</div>}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          {/* Nút đăng nhập Google */}
          <button
            type="button"
            className="btn btn--google"
            onClick={() => {
              const hd = "gm.uit.edu.vn";
              const qs = new URLSearchParams();
              if (email) qs.set("login_hint", email);
              qs.set("hd", hd);
              window.location.href = `/api/auth/google?${qs.toString()}`;
            }}
          >
            <img className="btn__glogo" src="/img/google-logo.png" alt="Google Logo" />
            Đăng nhập bằng Google
          </button>
        </form>
      </div>
    </section>
  );
}
