import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/students.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function StudentList() {
  const nav = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStudents = async (keyword = "") => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/students`);
      if (keyword.trim()) url.searchParams.set("search", keyword.trim());
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load students");
      const data = await res.json();
      setStudents(data || []);
    } catch (err) {
      console.error("[student-list] fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  // debounce search
  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const rows = useMemo(() => students ?? [], [students]);

  return (
    <div className="student-page">
      <div className="profile-toolbar" style={{ marginBottom: 16 }}>
        <button
          className="profile-back"
          type="button"
          onClick={() => nav("/app/dashboard")}
        >
          ← Quay về trang chủ
        </button>
      </div>
      <div className="student-card">
        <div className="student-list__header">
          <div>
            <p className="status-chip" style={{ margin: 0 }}>
              <span aria-hidden>📋</span>
              Danh sách sinh viên
            </p>
            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
              Sắp xếp theo MSSV (tăng dần). Nhấp vào một dòng để xem hồ sơ chi tiết.
            </p>
          </div>
          <div className="student-search">
            <span role="img" aria-label="search">🔍</span>
            <input
              type="text"
              placeholder="Tìm MSSV, họ tên hoặc lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 18, fontSize: 14 }}>Đang tải danh sách...</div>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Lớp</th>
                <th>Ngành</th>
                <th>Giới tính</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s._id || s.student_id} onClick={() => nav(`/app/students/${s.student_id}`)}>
                  <td>{s.student_id}</td>
                  <td>{s.name}</td>
                  <td>{s.class_id}</td>
                  <td>{s.major_id}</td>
                  <td>{s.gender === "Male" ? "Nam" : "Nữ"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan="5" style={{ padding: 16, color: "#64748b", textAlign: "center" }}>
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
