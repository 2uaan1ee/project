import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userName = localStorage.getItem("user_name") || "Người dùng";
  const userEmail = localStorage.getItem("user_email") || "email@example.com";
  const userAvatar = localStorage.getItem("user_avatar");

  const handleLogout = () => {
    localStorage.clear();
    nav("/auth/login", { replace: true });
  };

  return (
    <header className="navbar clean-navbar">
      <div className="nav-left">
        <img
          src="/img/logo_uit.svg"
          className="logo nav-clickable"
          onClick={() => window.location.reload()}
          alt="logo"
        />
        <h1 className="title nav-clickable" onClick={() => window.location.reload()}>
          Trường Đại học Công nghệ Thông tin
        </h1>
      </div>

      <div className="nav-user-area">
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <span className="user-email">{userEmail}</span>
        </div>

        <div className="avatar-wrapper">
          <img
            src={userAvatar || "/img/default.png"}
            alt="avatar"
            className="avatar-img"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          />
          {userMenuOpen && (
            <div className="user-dropdown">
              <button onClick={() => nav("/settings/profile")}>👤 Hồ sơ cá nhân</button>
              <button onClick={() => nav("/settings/password")}>🔑 Đổi mật khẩu</button>
              <button className="logout" onClick={handleLogout}>🚪 Đăng xuất</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
