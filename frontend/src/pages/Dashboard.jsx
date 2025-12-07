// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/subject-open.css"; // dùng lại style sidebar bên subject-open
import CalendarWidget from "../components/CalendarWidget.jsx";

export default function Dashboard() {
  const nav = useNavigate();
  const userRole = sessionStorage.getItem("user_role") || "user";

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
      {/* Sidebar bên trái - dùng lại subject-open-steps */}
      <aside className="subject-open-steps">
        <div className="step-brand">
          <img src="/img/logo_uit.svg" alt="Logo UIT" />
        </div>

        <h3 style={{ textAlign: "center", marginBottom: 6 }}>Trang chủ</h3>

        <ol>
          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/subject-open")}
          >
            <span className="step-number">1</span>
            Danh sách môn học
          </li>

          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/training-program")}
          >
            <span className="step-number">2</span>
            Chương trình đào tạo
          </li>

          {userRole === "admin" && (
            <li
              style={{ cursor: "pointer", color: "#dc2626", fontWeight: "bold" }}
              onClick={() => nav("/app/admin/training-program")}
            >
              <span className="step-number">🔑</span>
              Quản lý CT đào tạo (Admin)
            </li>
          )}

          <li>
            <span className="step-number">3</span>
            Lịch trình giảng dạy
          </li>

          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/students")}
          >
            <span className="step-number">4</span>
            Danh sách sinh viên
          </li>

          <li>
            <span className="step-number">5</span>
            Bảng điểm
          </li>

          <li>
            <span className="step-number">6</span>
            Tin tức
          </li>
        </ol>

        <div className="step-footer">
          <button type="button">Like & Share</button>
          <span className="star-count">458 ⭐</span>
        </div>
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
