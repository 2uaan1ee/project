import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/students.css";

// Support both absolute (http://...) and relative (/api) API bases
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

// 👉 Mapping mã ngành -> tên tiếng Việt
const MAJOR_LABELS = {
  TTNT: "Trí tuệ Nhân tạo",
  ATTT: "An toàn Thông tin",
  KHMT: "Khoa học Máy tính",
  MMTT: "Mạng máy tính & Truyền thông Dữ liệu",
  TKVM: "Thiết kế Vi mạch",
  KHDL: "Khoa học Dữ liệu",
  KTPM: "Kỹ thuật Phần mềm",
  TTDPT: "Truyền thông Đa phương tiện",
  KTMT: "Kỹ thuật Máy tính",

  // thêm cho đủ bộ UIT (nếu data có)
  CNTT: "Công nghệ Thông tin",
  HTTT: "Hệ thống Thông tin",
  TMDT: "Thương mại Điện tử",
};

function formatMajor(majorId) {
  if (!majorId) return "";
  const code = String(majorId).trim();
  return MAJOR_LABELS[code] || code; // fallback: hiện mã nếu chưa mapping
}

function buildStudentsUrl(keyword = "") {
  const qs = keyword.trim()
    ? `?search=${encodeURIComponent(keyword.trim())}`
    : "";
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
  const [visibleCount, setVisibleCount] = useState(20); // hiển thị 20 dòng

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
      setError("Website hiện tại đang quá tải...");
    } finally {
      setLoading(false);
    }
  };

  // load lần đầu
  useEffect(() => {
    fetchStudents();
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchStudents(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // khi danh sách students thay đổi (do search), reset số dòng hiển thị
  useEffect(() => {
    setVisibleCount(20);
  }, [students]);

  // sắp xếp theo MSSV tăng dần
  const rows = useMemo(() => {
    const arr = students ? [...students] : [];
    arr.sort((a, b) =>
      String(a.student_id || "").localeCompare(String(b.student_id || ""))
    );
    return arr;
  }, [students]);

  // chỉ hiển thị tối đa visibleCount
  const rowsToShow = useMemo(
    () => rows.slice(0, visibleCount),
    [rows, visibleCount]
  );

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 20, rows.length));
  };

  const handleShowLess = () => {
    setVisibleCount(20);
  };

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
            <p
              style={{
                margin: "6px 0 0",
                color: "#475569",
                fontSize: 13,
              }}
            >
              Sắp xếp theo MSSV (tăng dần). Nhấp vào một dòng để xem hồ sơ chi
              tiết.
            </p>
          </div>
          <div className="student-search">
            <span role="img" aria-label="search">
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm theo MSSV, Họ tên hoặc lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 18, fontSize: 14 }}>
            Đang tải danh sách...
          </div>
        ) : error ? (
          <div
            style={{ padding: 18, fontSize: 14, color: "#b91c1c" }}
          >
            {error}
          </div>
        ) : (
          <>
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
                {rowsToShow.map((s) => {
                  const majorName = formatMajor(s.major_id);
                  return (
                    <tr
                      key={s._id || s.student_id}
                      onClick={() => nav(`/app/students/${s.student_id}`)}
                    >
                      <td>{s.student_id}</td>
                      <td>{s.name}</td>
                      <td>{s.class_id}</td>
                      {/* 👇 Hiển thị tên ngành đẹp + hover thấy mã ngành */}
                      <td title={s.major_id}>{majorName}</td>
                      <td>{s.gender === "Male" ? "Nam" : "Nữ"}</td>
                    </tr>
                  );
                })}
                {!rowsToShow.length && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        color: "#64748b",
                        textAlign: "center",
                      }}
                    >
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Thanh điều khiển show more / show less */}
            {rows.length > 0 && (
              <div className="student-loadmore-bar">
                <span className="student-loadmore-info" style={{ marginLeft: 16 }}>
                  Đang hiển thị <strong>{rowsToShow.length}</strong> /{" "}
                  <strong>{rows.length}</strong> sinh viên
                </span>
                <div className="student-loadmore-actions" style={{ marginRight: 16 }}>
                  {visibleCount < rows.length && (
                    <button
                      type="button"
                      className="student-loadmore"
                      onClick={handleShowMore}
                    >
                      Xem thêm
                    </button>
                  )}
                  {visibleCount > 20 && (
                    <button
                      type="button"
                      className="student-loadmore secondary"
                      onClick={handleShowLess}
                    >
                      Thu gọn
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
