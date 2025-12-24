// frontend/src/pages/CourseRegistrations.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/students.css";
import { apiFetch } from "../utils/apiFetch";

function buildPageTokens(current, totalPages) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

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

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toVnd(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "";
    return x.toLocaleString("vi-VN") + " ₫";
}

// Modal component for displaying registration details
function RegistrationDetailModal({ registrationId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await apiFetch(`/course-registrations/${registrationId}`);
                if (!res.ok) throw new Error(`Failed (${res.status})`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("[CourseRegistrations] fetch detail error:", err);
                setError("Không thể tải chi tiết phiếu đăng ký");
            } finally {
                setLoading(false);
            }
        };

        if (registrationId) fetchDetail();
    }, [registrationId]);

    if (!registrationId) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chi tiết Phiếu Đăng ký</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {loading && <p>Đang tải...</p>}
                    {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
                    {data && (
                        <div className="registration-detail">
                            {/* Thông tin sinh viên */}
                            <section className="detail-section">
                                <h3>Thông tin Sinh viên</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">MSSV:</span>
                                        <span className="detail-value">{data.student_id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Họ tên:</span>
                                        <span className="detail-value">{data.name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Ngành:</span>
                                        <span className="detail-value">{data.major_id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Khóa:</span>
                                        <span className="detail-value">{data.cohort_year}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Kì học:</span>
                                        <span className="detail-value">{data.study_year}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Thông tin đăng ký */}
                            <section className="detail-section">
                                <h3>Thông tin Đăng ký</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Số phiếu:</span>
                                        <span className="detail-value">{data.registration_no || data.bms_number}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Năm học:</span>
                                        <span className="detail-value">{data.academic_year}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Học kỳ:</span>
                                        <span className="detail-value">{data.semester_label} (Kỳ {data.semester})</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Đợt đăng ký:</span>
                                        <span className="detail-value">Đợt {data.registration_round}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Thời gian đăng ký:</span>
                                        <span className="detail-value">{formatDate(data.registered_at)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Tổng tín chỉ:</span>
                                        <span className="detail-value">{data.total_credits}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Danh sách môn học */}
                            {data.items && data.items.length > 0 && (
                                <section className="detail-section detail-section-full">
                                    <h3>Danh sách Môn học ({data.items.length})</h3>
                                    <div className="subjects-table-wrapper">
                                        <table className="subjects-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã MH</th>
                                                    <th>Tên môn học</th>
                                                    <th>Loại</th>
                                                    <th>Khoa</th>
                                                    <th>TC LT</th>
                                                    <th>TC TH</th>
                                                    <th>Tổng TC</th>
                                                    <th>Tự chọn</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.subject_id}</td>
                                                        <td>{item.subject_name}</td>
                                                        <td>{item.subject_type}</td>
                                                        <td>{item.faculty_id}</td>
                                                        <td>{item.theory_credits}</td>
                                                        <td>{item.practice_credits}</td>
                                                        <td>{item.total_credits}</td>
                                                        <td>{item.is_elective ? "✓" : ""}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Thông tin học phí */}
                            {data.tuition && (
                                <section className="detail-section">
                                    <h3>Thông tin Học phí</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">TC lý thuyết:</span>
                                            <span className="detail-value">{data.tuition.total_theory_credits}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">TC thực hành:</span>
                                            <span className="detail-value">{data.tuition.total_practice_credits}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Học phí LT:</span>
                                            <span className="detail-value">{toVnd(data.tuition.amount_theory)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Học phí TH:</span>
                                            <span className="detail-value">{toVnd(data.tuition.amount_practice)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Tổng học phí:</span>
                                            <span className="detail-value" style={{ fontWeight: 600 }}>
                                                {toVnd(data.tuition.amount_total)}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Metadata */}
                            {data.meta && (
                                <section className="detail-section">
                                    <h3>Metadata</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Nguồn:</span>
                                            <span className="detail-value">{data.meta.source}</span>
                                        </div>
                                        {data.meta.faculty_of_student && (
                                            <div className="detail-item">
                                                <span className="detail-label">Khoa của SV:</span>
                                                <span className="detail-value">{data.meta.faculty_of_student}</span>
                                            </div>
                                        )}
                                        {data.meta.has_cross_major_elective !== undefined && (
                                            <div className="detail-item">
                                                <span className="detail-label">Có môn liên ngành:</span>
                                                <span className="detail-value">
                                                    {data.meta.has_cross_major_elective ? "Có" : "Không"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CourseRegistrations() {
    const nav = useNavigate();
    const LIMIT = 20;

    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [sortKey, setSortKey] = useState("registered_at");
    const [sortDir, setSortDir] = useState("desc");

    const [selectedId, setSelectedId] = useState(null);

    const abortRef = useRef(null);

    // Debounce search + reset page về 1
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const fetchRegistrations = async ({ keyword, page, sortBy, sortOrder }) => {
        abortRef.current?.abort?.();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(LIMIT));
            if (keyword) params.set("search", keyword);
            params.set("sortBy", sortBy);
            params.set("sortOrder", sortOrder);

            const res = await apiFetch(`/course-registrations?${params.toString()}`, {
                signal: controller.signal,
            });

            if (res.status === 401) {
                setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                nav("/auth/login", { replace: true });
                return;
            }
            if (res.status === 403) {
                setError("Bạn không có quyền truy cập trang này.");
                return;
            }
            if (!res.ok) throw new Error(`Failed (${res.status})`);

            const data = await res.json();
            setRows(Array.isArray(data?.items) ? data.items : []);
            setTotal(Number(data?.total) || 0);
        } catch (err) {
            if (err?.name === "AbortError") return;
            console.error("[CourseRegistrations] fetch error", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations({
            keyword: debouncedSearch,
            page,
            sortBy: sortKey,
            sortOrder: sortDir,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, page, sortKey, sortDir]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / LIMIT)), [total]);
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageTokens = useMemo(() => buildPageTokens(page, totalPages), [page, totalPages]);

    const onSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const th = (label, key) => (
        <th
            onClick={() => onSort(key)}
            style={{ cursor: "pointer", userSelect: "none" }}
            title="Click để sắp xếp"
        >
            {label} {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
        </th>
    );

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
                            Quản lý Phiếu Đăng ký Học phần
                        </p>
                        <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
                            Danh sách phiếu đăng ký từ collection course_registrations. Click vào dòng để xem chi tiết.
                        </p>
                    </div>

                    <div className="student-search">
                        <span role="img" aria-label="search">
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm theo MSSV, Họ tên, Số phiếu..."
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
                                    {th("Số phiếu", "registration_no")}
                                    {th("MSSV", "student_id")}
                                    {th("Họ tên", "name")}
                                    {th("Năm học", "academic_year")}
                                    {th("Học kỳ", "semester_label")}
                                    {th("Tổng TC", "total_credits")}
                                    {th("Thời gian ĐK", "registered_at")}
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((r) => (
                                    <tr
                                        key={r._id}
                                        onClick={() => setSelectedId(r._id)}
                                        style={{ cursor: "pointer" }}
                                        title="Click để xem chi tiết"
                                    >
                                        <td>{r.registration_no || r.bms_number}</td>
                                        <td>{r.student_id}</td>
                                        <td>{r.name}</td>
                                        <td>{r.academic_year}</td>
                                        <td>{r.semester_label}</td>
                                        <td>{r.total_credits}</td>
                                        <td>{formatDate(r.registered_at)}</td>
                                    </tr>
                                ))}

                                {!rows.length && !loading && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 16, color: "#64748b", textAlign: "center" }}>
                                            Không có dữ liệu.
                                        </td>
                                    </tr>
                                )}

                                {loading && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 16, color: "#475569", textAlign: "center" }}>
                                            Đang tải...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="student-loadmore-bar" style={{ justifyContent: "space-between" }}>
                            <span className="student-loadmore-info" style={{ marginLeft: 16 }}>
                                Tổng: <strong>{total}</strong> — Trang <strong>{page}</strong> /{" "}
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

            {/* Detail Modal */}
            {selectedId && <RegistrationDetailModal registrationId={selectedId} onClose={() => setSelectedId(null)} />}
        </div>
    );
}
