import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavigate = (path) => {
    setOpenMenu(null);
    nav(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/auth/login", { replace: true });
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
            <div
              className="dropdown"
              onMouseEnter={() => setOpenMenu("students")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <div onClick={() => handleNavigate("/students")}>
                📄 Lập hồ sơ sinh viên (BM1)
              </div>
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
            <div
              className="dropdown"
              onMouseEnter={() => setOpenMenu("courses")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <div onClick={() => handleNavigate("/courses")}>
                📘 Nhập danh sách môn học (BM2)
              </div>
              <div onClick={() => handleNavigate("/courses/program")}>
                📕 Nhập chương trình học (BM3)
              </div>
              <div onClick={() => handleNavigate("/courses/open")}>
                📗 Nhập môn học mở trong học kỳ (BM4)
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ✅ Avatar nằm bên phải navbar */}
      <div className="avatar" onClick={() => setUserMenuOpen(!userMenuOpen)}>
        <img src="/img/avatar_me.jpg" alt="user" />
        {userMenuOpen && (
          <div className="user-dropdown">
            <button onClick={() => handleNavigate("/settings/profile")}>
              👤 Hồ sơ cá nhân
            </button>
            <button onClick={() => handleNavigate("/settings/password")}>
              🔑 Đổi mật khẩu
            </button>
            <button className="logout" onClick={handleLogout}>
              🚪 Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
