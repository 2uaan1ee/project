// frontend/src/pages/StudentListTuition.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/students.css";
import { apiFetch } from "../utils/apiFetch";

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

function normalizeMajorIds(majorId) {
    if (!majorId) return [];
    if (Array.isArray(majorId)) return majorId.map((id) => String(id).trim()).filter(Boolean);
    const code = String(majorId).trim();
    return code ? [code] : [];
}
function formatMajor(majorId) {
    const ids = normalizeMajorIds(majorId);
    if (!ids.length) return "";
    return ids.map((code) => MAJOR_LABELS[code] || code).join(", ");
}

function toVnd(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "";
    return x.toLocaleString("vi-VN") + " ₫";
}
function pct(discountRate) {
    const x = Number(discountRate);
    if (!Number.isFinite(x)) return "";
    return Math.round(x * 100) + "%";
}

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

export default function StudentListTuition() {
    const nav = useNavigate();
    const LIMIT = 20;

    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [sortKey, setSortKey] = useState("student_id");
    const [sortDir, setSortDir] = useState("asc"); // asc | desc

    // ✅ NEW: filter tốt nghiệp giống StudentList
    const [gradFilter, setGradFilter] = useState("all"); // all|true|false

    const abortRef = useRef(null);

    // debounce search + reset page về 1
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    // đổi filter -> reset page
    useEffect(() => {
        setPage(1);
    }, [gradFilter]);

    const fetchMaps = async ({ keyword, page }) => {
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

            const res = await apiFetch(`/tuition-payments/maps?${params.toString()}`, {
                signal: controller.signal,
            });

            if (res.status === 401) {
                setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                nav("/auth/login", { replace: true });
                return;
            }
            if (!res.ok) throw new Error(`Failed (${res.status})`);

            const data = await res.json();
            setRows(Array.isArray(data?.items) ? data.items : []);
            setTotal(Number(data?.total) || 0);
        } catch (err) {
            if (err?.name === "AbortError") return;
            console.error("[tuition-list] fetch error", err);
            setError("Website hiện tại đang quá tải...");
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaps({ keyword: debouncedSearch, page });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, page]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / LIMIT)), [total]);
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageTokens = useMemo(() => buildPageTokens(page, totalPages), [page, totalPages]);

    // ✅ filter tốt nghiệp ở FE
    const filteredRows = useMemo(() => {
        if (gradFilter === "all") return rows;

        const want = gradFilter === "true";
        return rows.filter((r) => Boolean(r?.isGraduate) === want);
    }, [rows, gradFilter]);

    const sortedRows = useMemo(() => {
        const copy = [...filteredRows];

        const getVal = (r) => {
            if (sortKey === "name") return String(r.name || "");
            if (sortKey === "major") return String(r.major_id || "");
            if (sortKey === "credits") return Number(r?.tuition?.total_credits || 0);
            if (sortKey === "before") return Number(r?.tuition?.amount_total || 0);
            if (sortKey === "after") return Number(r?.tuition?.amount_payable || 0);
            if (sortKey === "discount") return Number(r?.priority?.discount_rate || 0);
            if (sortKey === "graduate") return Number(Boolean(r?.isGraduate)); // ✅ sort theo tốt nghiệp
            return String(r.student_id || "");
        };

        copy.sort((a, b) => {
            const va = getVal(a);
            const vb = getVal(b);

            const dir = sortDir === "asc" ? 1 : -1;

            if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
            return String(va).localeCompare(String(vb), "vi", { numeric: true }) * dir;
        });

        return copy;
    }, [filteredRows, sortKey, sortDir]);

    const onSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const th = (label, key) => (
        <th onClick={() => onSort(key)} style={{ cursor: "pointer", userSelect: "none" }} title="Click để sort">
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
                <div className="student-list__header" style={{ alignItems: "flex-start" }}>
                    <div>
                        <p className="status-chip" style={{ margin: 0 }}>
                            Danh sách học phí theo sinh viên
                        </p>
                        <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
                            Click tiêu đề cột để sort
                        </p>
                    </div>

                    {/* ✅ Search + filter tốt nghiệp cùng hàng */}
                    <div className="student-controls">
                        <div className="student-search student-search--grow">
                            <span role="img" aria-label="search">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm theo MSSV, Họ tên, lớp, ngành..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="student-search student-search--select">
                            <span role="img" aria-label="grad">
                                🎓
                            </span>
                            <select value={gradFilter} onChange={(e) => setGradFilter(e.target.value)}>
                                <option value="all">Tất cả</option>
                                <option value="true">Đã tốt nghiệp</option>
                                <option value="false">Chưa tốt nghiệp</option>
                            </select>
                            <span className="student-select-caret">▾</span>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div style={{ padding: 18, fontSize: 14, color: "#b91c1c" }}>{error}</div>
                ) : (
                    <>
                        <table className="student-table">
                            <thead>
                                <tr>
                                    {th("MSSV", "student_id")}
                                    {th("Họ tên", "name")}
                                    {th("Ngành", "major")}
                                    {th("Tổng tín chỉ", "credits")}
                                    {th("Học phí trước giảm", "before")}
                                    {th("Học phí sau giảm", "after")}
                                    {th("% giảm", "discount")}
                                    {th("Tốt nghiệp", "graduate")}
                                </tr>
                            </thead>

                            <tbody>
                                {sortedRows.map((r) => {
                                    const majorName = formatMajor(r.major_id);
                                    const credits = r?.tuition?.total_credits ?? "";
                                    const before = r?.tuition?.amount_total ?? "";
                                    const after = r?.tuition?.amount_payable ?? "";
                                    const disc = r?.priority?.discount_rate ?? 0;

                                    return (
                                        <tr
                                            key={r._id || `${r.student_id}-${r.academic_year}-${r.semester}-${r.registration_round}`}
                                            onClick={() => nav(`/app/tuition-list/${encodeURIComponent(r.student_id)}`)}
                                            style={{ cursor: "pointer" }}
                                            title="Xem phiếu thu học phí"
                                        >
                                            <td>{r.student_id}</td>
                                            <td>{r.name}</td>
                                            <td title={normalizeMajorIds(r.major_id).join(", ")}>{majorName || r.major_id || ""}</td>
                                            <td>{credits}</td>
                                            <td>{toVnd(before)}</td>
                                            <td>{toVnd(after)}</td>
                                            <td>{pct(disc)}</td>
                                            <td>{r.isGraduate ? "✅" : ""}</td>
                                        </tr>
                                    );
                                })}

                                {!sortedRows.length && !loading && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 16, color: "#64748b", textAlign: "center" }}>
                                            Không có dữ liệu.
                                        </td>
                                    </tr>
                                )}

                                {loading && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 16, color: "#475569", textAlign: "center" }}>
                                            Đang tải...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="student-loadmore-bar" style={{ justifyContent: "space-between" }}>
                            <span className="student-loadmore-info" style={{ marginLeft: 16 }}>
                                Tổng: <strong>{total}</strong> — Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
                                {gradFilter !== "all" ? (
                                    <>
                                        {" "}
                                        — Đang lọc: <strong>{gradFilter === "true" ? "Đã tốt nghiệp" : "Chưa tốt nghiệp"}</strong>
                                    </>
                                ) : null}
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
