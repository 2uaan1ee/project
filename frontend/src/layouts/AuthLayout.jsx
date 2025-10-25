// src/layouts/AuthLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import "../styles/auth.css";

export default function AuthLayout() {
  const { pathname } = useLocation();
  return (
    <div className="auth__root">
      <section className="auth__left">
        <div className="auth__leftContent">
          <div className="auth__brand">
            <img src="/img/logo_uit.svg" alt="UIT Logo" className="auth__logo" />
          </div>
          <h1>TOÀN DIỆN, SÁNG TẠO, PHỤNG SỰ</h1>
          <div className="auth__dots">
            <span className={pathname.includes("/login") ? "active" : ""} />
            <span className={pathname.includes("/forgot") ? "active" : ""} />
          </div>
        </div>
      </section>

      <Outlet />
    </div>
  );
}
