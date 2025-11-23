// src/components/Navbar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/auth/login", { replace: true });
  };

  return (
    <header className="navbar clean-navbar">
      <div className="nav-left">
        <img src="/img/logo_uit.svg" alt="logo" className="logo" />
        <h1 className="title">Trường Đại học Công nghệ Thông tin</h1>
      </div>

      {/* Avatar user */}
      <div className="avatar" onClick={() => setUserMenuOpen(!userMenuOpen)}>
        <img src="/img/anh_avt_1-1.jpg" alt="user" />
        {userMenuOpen && (
          <div className="user-dropdown">
            <button onClick={() => nav("/settings/profile")}>👤 Hồ sơ cá nhân</button>
            <button onClick={() => nav("/settings/password")}>🔑 Đổi mật khẩu</button>
            <button className="logout" onClick={handleLogout}>
              🚪 Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
