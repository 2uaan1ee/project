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

    // Lưu thông tin vào sessionStorage
    sessionStorage.setItem("token", token);
    if (name) sessionStorage.setItem("user_name", name);
    if (email) sessionStorage.setItem("user_email", email);
    if (avatar) sessionStorage.setItem("user_avatar", decodeURIComponent(avatar));

    // Decode JWT to get user role
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      if (payload.role) sessionStorage.setItem("user_role", payload.role);
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
