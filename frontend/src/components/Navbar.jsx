import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userName = sessionStorage.getItem("user_name") || "Người dùng";
  const userEmail = sessionStorage.getItem("user_email") || "email@example.com";
  const rawAvatar = sessionStorage.getItem("user_avatar") || "";
  const userAvatar = (() => {
    if (!rawAvatar) return "";
    try {
      const url = new URL(rawAvatar);
      const host = url.hostname.toLowerCase();
      const isGoogle = host === "lh3.googleusercontent.com" || host.endsWith(".googleusercontent.com");
      return isGoogle ? `/api/avatar-proxy?url=${encodeURIComponent(rawAvatar)}` : rawAvatar;
    } catch {
      return rawAvatar;
    }
  })();

  const handleLogout = () => {
    sessionStorage.clear();
    nav("/auth/login", { replace: true });
  };

  const navSection = useMemo(() => {
    const path = location.pathname || "";
    const sections = [
      { prefix: "/app/subject-list", label: "1. Danh sách môn học" },
      { prefix: "/app/training-program", label: "2. Chương trình đào tạo" },
      { prefix: "/app/subject-open", label: "3. Mở học phần" },
      { prefix: "/app/subjects", label: "3. Mở học phần" },
      { prefix: "/app/admin/training-program", label: "Admin. Quản lí CT đào tạo" },
      { prefix: "/app/admin/subject-open", label: "Admin. Quản lí mở học phần" },
      { prefix: "/app/students", label: "5. Danh sách sinh viên" },
      { prefix: "/app/tuition-list", label: "7. Danh sách học phí" },
      { prefix: "/app/tuition", label: "8. Tình trạng học phí" },
      { prefix: "/app/regulations", label: "9. Thay đổi quy định" },
      { prefix: "/app/all-subjects", label: "1. Điều chỉnh môn học" },
      { prefix: "/app/dashboard", label: "Trang chủ" },
    ];

    const match = sections.find((item) => path.startsWith(item.prefix));
    return match?.label || "";
  }, [location.pathname]);

  return (
    <header className="navbar clean-navbar">
      <div className="nav-left">
        <img
          src="/img/logo_uit.svg"
          className="logo nav-clickable"
          onClick={() => nav("/app/dashboard")}
          alt="logo"
        />
        <h1 className="title nav-clickable" onClick={() => nav("/app/dashboard")}>
          Trường Đại học Công nghệ Thông tin
        </h1>
        {navSection && <span className="nav-section">{navSection}</span>}
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



