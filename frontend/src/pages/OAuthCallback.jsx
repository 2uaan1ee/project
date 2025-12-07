import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback({ onAuthed }) {
  const nav = useNavigate();

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);

    const token = qs.get("token");
    const name = qs.get("name");
    const email = qs.get("email");
    const avatar = qs.get("avatar");

    if (!token) {
      nav("/auth/login?oauth=failed", { replace: true });
      return;
    }

    // Lưu thông tin vào localStorage
    localStorage.setItem("token", token);
    if (name) localStorage.setItem("user_name", name);
    if (email) localStorage.setItem("user_email", email);
    if (avatar) localStorage.setItem("user_avatar", decodeURIComponent(avatar));

    // Decode JWT to get user role
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      if (payload.role) localStorage.setItem("user_role", payload.role);
    } catch (decodeErr) {
      console.warn("Failed to decode token:", decodeErr);
    }

    onAuthed?.(token);

    // Xóa query khỏi URL
    window.history.replaceState({}, document.title, "/oauth/callback");

    setTimeout(() => {
      nav("/app/dashboard", { replace: true });
    }, 50);
  }, [nav, onAuthed]);

  return <div style={{ padding: 24 }}>Đang đăng nhập bằng Google…</div>;
}
