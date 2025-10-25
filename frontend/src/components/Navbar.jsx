// src/components/Navbar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const handleNavigate = (path) => {
    setOpenMenu(null);
    nav(path);
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <img src="/img/logo_uit.svg" alt="logo" className="logo" />
        <h1>Trường Đại học Công nghệ Thông tin</h1>
      </div>

      <nav className="nav-menu">
        <div
          className="nav-item"
          onMouseEnter={() => setOpenMenu("students")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          👨‍🎓 Quản lý sinh viên
          {openMenu === "students" && (
            <div className="dropdown">
              <div onClick={() => handleNavigate("/students")}>📄 Lập hồ sơ sinh viên (BM1)</div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => setOpenMenu("courses")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          📚 Quản lý môn học
          {openMenu === "courses" && (
            <div className="dropdown">
              <div onClick={() => handleNavigate("/courses")}>📘 Danh sách môn học (BM2)</div>
              <div onClick={() => handleNavigate("/courses/program")}>📕 Chương trình học (BM3)</div>
              <div onClick={() => handleNavigate("/courses/open")}>📗 Môn học mở (BM4)</div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => setOpenMenu("registration")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          📝 Đăng ký học phần
          {openMenu === "registration" && (
            <div className="dropdown">
              <div onClick={() => handleNavigate("/registration")}>📑 Phiếu đăng ký học phần (BM5)</div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => setOpenMenu("fees")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          💰 Thu học phí
          {openMenu === "fees" && (
            <div className="dropdown">
              <div onClick={() => handleNavigate("/fees")}>🧾 Phiếu thu học phí (BM6)</div>
              <div onClick={() => handleNavigate("/fees/report")}>📊 Báo cáo SV chưa đóng học phí (BM7)</div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => setOpenMenu("settings")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          ⚙️ Cài đặt
          {openMenu === "settings" && (
            <div className="dropdown">
              <div onClick={() => handleNavigate("/settings/profile")}>👤 Hồ sơ cá nhân</div>
              <div onClick={() => handleNavigate("/settings/password")}>🔑 Đổi mật khẩu</div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
