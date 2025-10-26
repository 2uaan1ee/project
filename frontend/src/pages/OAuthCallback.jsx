// src/pages/OAuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback({ onAuthed }) {
  const nav = useNavigate();

  useEffect(() => {
    // Lấy token từ hash (#token=...) hoặc query (?token=...)
    const hash = new URLSearchParams(window.location.hash.slice(1));
    let token = hash.get("token");

    if (!token) {
      const qs = new URLSearchParams(window.location.search);
      token = qs.get("token");
    }

    if (token) {
      // ✅ Đừng xóa toàn bộ URL ngay, chỉ thay hash = ""
      window.history.replaceState({}, document.title, "/oauth/callback");
      localStorage.setItem("token", token);
      onAuthed?.(token);

      // ✅ Điều hướng sau khi lưu token
      setTimeout(() => {
        nav("/app/dashboard", { replace: true });
      }, 100);
    } else {
      nav("/auth/login?oauth=failed", { replace: true });
    }
  }, [nav, onAuthed]);

  return <div style={{ padding: 24 }}>Đang đăng nhập bằng Google…</div>;
}
