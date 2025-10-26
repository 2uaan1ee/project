// src/pages/Dashboard.jsx
import { useState } from "react";
import "../styles/dashboard.css";
import { clearToken, apiLogout } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();

  const courses = [
    {
      thumb: "/img/course_1.jpg",
      title: "Introduction Basic Programming HTML & CSS",
      author: "Alfredo Rhiel Madsen",
      level: "Intermediate",
      rating: "4.5",
    },
    {
      thumb: "/img/course_2.jpg",
      title: "Creating Beautiful Landing Page in 1 Hour",
      author: "Lincoln George",
      level: "Beginner",
      rating: "4.5",
    },
  ];

  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      clearToken();
      nav("/auth/login", { replace: true });
    }
  };

  return (
    <div className="dashboard-layout">
      {/* ===== Sidebar Trái ===== */}
      <aside className="sidebar-left">
        <h3>📚 Điều hướng</h3>
        <ul>
          <li>🏠 Trang chủ</li>
          <li>📅 Bảng điều khiển</li>
          <li>🧑‍🎓 Các khóa học của tôi</li>
          <li>🛠️ Hỗ trợ</li>
        </ul>
      </aside>

      {/* ===== Nội dung chính ===== */}
      <main className="dashboard-content">
        <header className="topbar">
          <h1>📰 Tin tức & Khóa học</h1>

          <div className="avatar" onClick={() => setMenuOpen(v => !v)}>
            <img src="/img/avatar_me.jpg" alt="user" />
            {menuOpen && (
              <div className="user-dropdown">
                <button>⚙️ Cài đặt</button>
                <button>🔑 Đổi mật khẩu</button>
                <button className="logout" onClick={handleLogout}>
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="grid">
          {courses.map((c, i) => (
            <div className="card" key={i}>
              <div className="thumb">
                <img src={c.thumb} alt={c.title} />
                <span className="badge">{c.level}</span>
              </div>
              <h3>{c.title}</h3>
              <p className="author">👨‍🏫 {c.author}</p>
              <div className="meta">
                <span>⭐ {c.rating}</span>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ===== Sidebar Phải ===== */}
      <aside className="sidebar-right">
        <div className="widget">
          <h4>🗓️ Lịch</h4>
          <p>Tháng 10 / 2025</p>
          <p>25 - Hôm nay</p>
        </div>

        <div className="widget">
          <h4>🌐 Thành viên trực tuyến</h4>
          <p>96 người dùng</p>
        </div>
      </aside>
    </div>
  );
}
