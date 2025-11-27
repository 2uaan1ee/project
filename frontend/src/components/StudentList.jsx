import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/students.css";

// Support both absolute (http://...) and relative (/api) API bases
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

function buildStudentsUrl(keyword = "") {
  const qs = keyword.trim() ? `?search=${encodeURIComponent(keyword.trim())}` : "";
  if (API_BASE.startsWith("http")) return `${API_BASE}/students${qs}`;
  const prefix = API_BASE.startsWith("/") ? "" : "/";
  return `${prefix}${API_BASE}/students${qs}`;
}

export default function StudentList() {
  const nav = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStudents = async (keyword = "") => {
    setLoading(true);
    setError("");
    try {
      const url = buildStudentsUrl(keyword);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
      const data = await res.json();
      setStudents(data || []);
    } catch (err) {
      console.error("[student-list] fetch error", err);
      setError("Websites hiện tại đang quá tải...");
    } finally {
      setLoading(false);
    }
  };

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
              placeholder="Tìm theo MSSV, Họ tên hoặc lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 18, fontSize: 14 }}>Đang tải danh sách...</div>
        ) : error ? (
          <div style={{ padding: 18, fontSize: 14, color: "#b91c1c" }}>{error}</div>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>ớp</th>
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
