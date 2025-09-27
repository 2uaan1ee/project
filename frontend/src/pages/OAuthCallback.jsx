import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback({ onAuthed }) {
  const nav = useNavigate();
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    let token = hash.get("token");
    if (!token) {
      const qs = new URLSearchParams(window.location.search);
      token = qs.get("token");
    }
    if (token) {
      window.history.replaceState({}, document.title, "/");
      localStorage.setItem("token", token);
      onAuthed?.(token);
      nav("/app/dashboard", { replace: true });
    } else {
      nav("/auth/login?oauth=failed", { replace: true });
    }
  }, [nav, onAuthed]);

  return <div style={{ padding: 24 }}>Đang đăng nhập bằng Google…</div>;
}
