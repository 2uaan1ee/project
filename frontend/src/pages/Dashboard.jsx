// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import CalendarWidget from "../components/CalendarWidget.jsx";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
export default function Dashboard() {
  const nav = useNavigate();
  const { user } = useContext(AuthContext);
  const courses = [
    {
      thumb: "/img/course_1.jpg",
      title: "Introduction Basic Programming HTML & CSS",
      author: "Alfredo Rhiel Madsen",
      rating: "4.5",
    },
    {
      thumb: "/img/course_2.jpg",
      title: "Creating Beautiful Landing Page in 1 Hour",
      author: "Lincoln George",
      rating: "4.5",
    },
  ];

  return (
    <div className="dashboard-layout cleaner">
      {/* Sidebar trái */}
      <aside className="sidebar-left improved">
        <h3>Trang chủ</h3>
        <ul>
          <li>Các môn học đã giảng dạy</li>
          <li>Lịch trình giảng dạy</li>
          <li>
            <button
              type="button"
              onClick={() => nav("/app/students")}
              style={{ background: "none", border: "none", padding: 0, color: "#2563eb", cursor: "pointer" }}
            >
              Danh sách sinh viên
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => nav("/app/curriculum")}
              style={{ background: "none", border: "none", padding: 0, color: "#2563eb", cursor: "pointer" }}
            >
              Chương trình đào tạo
            </button>
          </li>
          {user?.role === "admin" && (
            <li>
              <button
                type="button"
                onClick={() => nav("/app/curriculum/manage")}
                style={{ background: "none", border: "none", padding: 0, color: "#16a34a", cursor: "pointer" }}
              >
                Quản lý chương trình
              </button>
            </li>
          )}
          <li>Bảng điểm</li>
          <li>Tin tức</li>
        </ul>
      </aside>

      {/* Nội dung chính */}
      <main className="dashboard-content">
        <header className="topbar">
          <h1>📰 Tin tức & Khoá học</h1>
        </header>

        {/* Cards khóa học */}
        <section className="grid modern-grid">
          {courses.map((c, i) => (
            <div className="card smooth" key={i}>
              <div className="thumb">
                <img src={c.thumb} alt={c.title} />
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

      {/* Sidebar phải */}
      <aside className="sidebar-right improved">
        <CalendarWidget />

        <div className="widget">
          <h4>🌐 Thành viên trực tuyến</h4>
          <p>96 người dùng</p>
        </div>
      </aside>
    </div>
  );
}
