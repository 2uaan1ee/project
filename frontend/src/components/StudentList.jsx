import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/students.css";

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
  CNTT: "Công nghệ Thông tin",
  HTTT: "Hệ thống Thông tin",
  TMDT: "Thương mại Điện tử",
};

function formatMajor(majorId) {
  if (!majorId) return "";
  const code = String(majorId).trim();
  return MAJOR_LABELS[code] || code;
}

function buildStudentsUrl({ keyword = "", page = 1, limit = 20 }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (keyword.trim()) params.set("search", keyword.trim());

  if (API_BASE.startsWith("http")) return `${API_BASE}/students?${params.toString()}`;
  const prefix = API_BASE.startsWith("/") ? "" : "/";
  return `${prefix}${API_BASE}/students?${params.toString()}`;
}

function buildPageTokens(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  // 1 ... (c-1) c (c+1) ... last
  const tokens = [];
  const add = (x) => tokens.push(x);

  add(1);

  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);

  if (left > 2) add("...");

  for (let p = left; p <= right; p++) add(p);

  if (right < totalPages - 1) add("...");

  add(totalPages);

  return tokens;
}

export default function StudentList() {
  const nav = useNavigate();

  const LIMIT = 20;

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef(null);

  // debounce search + reset page về 1
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = async ({ keyword, page }) => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const url = buildStudentsUrl({ keyword, page, limit: LIMIT });
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Failed to load students (${res.status})`);

      const data = await res.json();
      setStudents(data?.items || []);
      setTotal(Number(data?.total) || 0);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("[student-list] fetch error", err);
      setError("Website hiện tại đang quá tải...");
      setStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // fetch khi page hoặc debouncedSearch đổi
  useEffect(() => {
    fetchStudents({ keyword: debouncedSearch, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  const totalPages = useMemo(() => {
    if (total <= 0) return 1;
    return Math.max(1, Math.ceil(total / LIMIT));
  }, [total]);

  // nếu đang ở page vượt totalPages (ví dụ search ra ít hơn), kéo về trang cuối
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageTokens = useMemo(() => buildPageTokens(page, totalPages), [page, totalPages]);

  return (
    <div className="student-page">
      <div className="profile-toolbar" style={{ marginBottom: 16 }}>
        <button className="profile-back" type="button" onClick={() => nav("/app/dashboard")}>
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
              Phân trang theo MSSV (tăng dần). Nhấp vào một dòng để xem hồ sơ chi tiết.
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

        {error ? (
          <div style={{ padding: 18, fontSize: 14, color: "#b91c1c" }}>{error}</div>
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
                {students.map((s) => {
                  const majorName = formatMajor(s.major_id);
                  return (
                    <tr key={s._id || s.student_id} onClick={() => nav(`/app/students/${s.student_id}`)}>
                      <td>{s.student_id}</td>
                      <td>{s.name}</td>
                      <td>{s.class_id}</td>
                      <td title={s.major_id}>{majorName}</td>
                      <td>{s.gender === "Male" ? "Nam" : s.gender === "Female" ? "Nữ" : (s.gender || "")}</td>
                    </tr>
                  );
                })}

                {!students.length && !loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: "#64748b", textAlign: "center" }}>
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: "#475569", textAlign: "center" }}>
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination bar */}
            <div className="student-loadmore-bar" style={{ justifyContent: "space-between" }}>
              <span className="student-loadmore-info" style={{ marginLeft: 16 }}>
                Tổng: <strong>{total}</strong> sinh viên — Trang <strong>{page}</strong> /{" "}
                <strong>{totalPages}</strong>
              </span>

              <div className="student-loadmore-actions" style={{ marginRight: 16, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="student-loadmore secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={loading || page === 1}
                >
                  ◀
                </button>

                {pageTokens.map((t, idx) =>
                  t === "..." ? (
                    <span key={`dots-${idx}`} style={{ padding: "6px 6px", color: "#64748b" }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={t}
                      type="button"
                      className={`student-loadmore ${t === page ? "" : "secondary"}`}
                      onClick={() => setPage(t)}
                      disabled={loading}
                      style={t === page ? { fontWeight: 700 } : undefined}
                    >
                      {t}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="student-loadmore secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={loading || page === totalPages}
                >
                  ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
