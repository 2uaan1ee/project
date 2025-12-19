// pages/AllSubjectList.jsx
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "../styles/subject-open.css";

// Material UI
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    TableSortLabel,
    Button,
    Tooltip,
} from "@mui/material";

/* =========================
   TABLE CONFIG + HELPERS
   ========================= */

const headCells = [
    { id: "checkbox", label: "", sortable: false },
    { id: "subject_id", label: "Mã môn", sortable: true },
    { id: "subject_name", label: "Tên môn học", sortable: true },
    { id: "faculty_id", label: "Khoa quản lý", sortable: true },
    { id: "total_credits", label: "Tổng số tín chỉ", sortable: true },
];

// mapping khoa
const FACULTY_LABELS = {
    KHOA_HTTT: "Hệ Thống Thông Tin",
    KHOA_KHMT: "Khoa Học Máy Tính",
    "KHOA_MMT&TT": "Mạng Máy Tính & Truyền Thông",
    KHOA_PĐTĐH: "Phòng Đào Tạo Đại Học",
    KHOA_BMTL: "Bộ Môn Toán Lý",
    KHOA_KTMT: "Kỹ Thuật Máy Tính",
    KHOA_BMAV: "Bộ Môn Anh Văn",
    KHOA_TTNN: "Trung Tâm Ngoại Ngữ",
    KHOA_KTTT: "Kỹ Thuật Thông Tin",
    KHOA_CNPM: "Công Nghệ Phần Mềm",
};


// mapping loại môn
const SUBJECT_TYPE_LABELS = {
    CN: "Chuyên Ngành",
    CSN: "Cơ Sở Ngành",
    DC: "Đại Cương",
    "ĐC": "Đại Cương",
    KLTN: "Khóa Luận Tốt Nghiệp",
    TT: "Thực Tập",
    TTTN: "Thực Tập Tốt Nghiệp",
    CDTN: "Chuyên Đề Tốt Nghiệp",
    "CĐTN": "Chuyên Đề Tốt Nghiệp",
    CNTC: "Chuyên Ngành Tự Chọn",
    BT: "Bài Tập",
};


function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
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

function getComparator(order, orderBy) {
    if (orderBy === "total_credits") {
        return order === "desc"
            ? (a, b) =>
                (b.theory_credits || 0) + (b.practice_credits || 0) -
                ((a.theory_credits || 0) + (a.practice_credits || 0))
            : (a, b) =>
                (a.theory_credits || 0) + (a.practice_credits || 0) -
                ((b.theory_credits || 0) + (b.practice_credits || 0));
    }

    return order === "desc"
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
    const stabilized = array.map((el, idx) => [el, idx]);
    stabilized.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilized.map((el) => el[0]);
}

function getRowKey(row, index) {
    return row.subject_id || row._id || index;
}

function formatArray(value) {
    if (value == null) return "—";
    if (Array.isArray(value)) return value.join(", ");
    const str = String(value).trim();
    return str === "" ? "—" : str;
}

/* mapping -> { label, tooltip }  ========================= */

function getFacultyDisplay(value) {
    if (!value) return { label: "—", tooltip: "" };

    if (Array.isArray(value)) {
        const items = value.map((v) => {
            const raw = String(v).trim();
            const key = raw.toUpperCase();
            const label = FACULTY_LABELS[key] || FACULTY_LABELS[raw] || raw;
            const tooltip = FACULTY_LABELS[key] || FACULTY_LABELS[raw]
                ? `${label} (${raw})`
                : raw;
            return { label, tooltip };
        });
        return {
            label: items.map((x) => x.label).join(", "),
            tooltip: items.map((x) => x.tooltip).join(", "),
        };
    }

    const raw = String(value).trim();
    const key = raw.toUpperCase();
    const label = FACULTY_LABELS[key] || FACULTY_LABELS[raw] || raw;
    const tooltip = FACULTY_LABELS[key] || FACULTY_LABELS[raw]
        ? `${label} (${raw})`
        : raw;
    return { label, tooltip };
}

function getSubjectTypeDisplay(value) {
    if (!value) return { label: "—", tooltip: "" };

    if (Array.isArray(value)) {
        const items = value.map((v) => {
            const raw = String(v).trim();
            const key = raw.toUpperCase();
            const label = SUBJECT_TYPE_LABELS[key] || SUBJECT_TYPE_LABELS[raw] || raw;
            const tooltip = SUBJECT_TYPE_LABELS[key] || SUBJECT_TYPE_LABELS[raw]
                ? `${label} (${raw})`
                : raw;
            return { label, tooltip };
        });
        return {
            label: items.map((x) => x.label).join(", "),
            tooltip: items.map((x) => x.tooltip).join(", "),
        };
    }

    const raw = String(value).trim();
    const key = raw.toUpperCase();
    const label = SUBJECT_TYPE_LABELS[key] || SUBJECT_TYPE_LABELS[raw] || raw;
    const tooltip = SUBJECT_TYPE_LABELS[key] || SUBJECT_TYPE_LABELS[raw]
        ? `${label} (${raw})`
        : raw;
    return { label, tooltip };
}


/* =========================
   DETAIL PANEL
   ========================= */

function SubjectDetailPanel({ subject }) {
    const hasSubject = !!subject;

    const totalCredits =
        (Number(subject?.theory_credits) || 0) + (Number(subject?.practice_credits) || 0);

    const facultyDisplay = hasSubject
        ? getFacultyDisplay(subject.faculty_id)
        : { label: "—", tooltip: "" };

    const typeDisplay = hasSubject
        ? getSubjectTypeDisplay(subject.subject_type)
        : { label: "—", tooltip: "" };

    const v = (val) => (hasSubject ? formatArray(val) : "—"); // value helper (ổn định số dòng)

    return (
        <div className="subject-hero" aria-live="polite">
            {/* Cột 1 */}
            <div className="subject-hero__block">
                <span className="subject-hero__label">Mã môn học</span>

                <span
                    className="subject-hero__value subject-ellipsis"
                    title={hasSubject ? formatArray(subject?.subject_id) : ""}
                >
                    {hasSubject ? formatArray(subject?.subject_id) : "Chưa chọn môn"}
                </span>

                <div className="subject-meta">
                    <Tooltip title={typeDisplay.tooltip} arrow>
                        <span className="subject-meta-pill subject-ellipsis" title={typeDisplay.label}>
                            Loại môn: {typeDisplay.label}
                        </span>
                    </Tooltip>

                    <Tooltip title={facultyDisplay.tooltip} arrow>
                        <span className="subject-meta-pill subject-ellipsis" title={facultyDisplay.label}>
                            Khoa quản lý: {facultyDisplay.label}
                        </span>
                    </Tooltip>

                    <span className="subject-meta-pill">Số tín chỉ: {hasSubject ? totalCredits : "—"}</span>
                </div>
            </div>

            {/* Cột 2 */}
            <div className="subject-hero__block">
                <span className="subject-hero__label">Tên môn học</span>

                <span
                    className="subject-hero__value subject-ellipsis"
                    title={hasSubject ? formatArray(subject?.subject_name) : ""}
                >
                    {hasSubject ? formatArray(subject?.subject_name) : "Hãy chọn một môn trong bảng bên dưới"}
                </span>

                <span className="subject-hero__line subject-ellipsis" title={v(subject?.subjectEL_name)}>
                    Tên tiếng Anh: {v(subject?.subjectEL_name)}
                </span>
                <span className="subject-hero__line subject-ellipsis" title={v(subject?.old_id)}>
                    Mã cũ: {v(subject?.old_id)}
                </span>
            </div>

            {/* Cột 3 */}
            <div className="subject-hero__block">
                <span className="subject-hero__label">Thông tin thêm</span>

                <span className="subject-hero__line">TC lý thuyết: {v(subject?.theory_credits)}</span>
                <span className="subject-hero__line">TC thực hành: {v(subject?.practice_credits)}</span>

                <span className="subject-hero__line subject-ellipsis" title={v(subject?.prerequisite_id)}>
                    Môn tiên quyết: {v(subject?.prerequisite_id)}
                </span>
                <span className="subject-hero__line subject-ellipsis" title={v(subject?.equivalent_id)}>
                    Môn tương đương: {v(subject?.equivalent_id)}
                </span>
            </div>
        </div>
    );
}


/* =========================
   SORTABLE TABLE (SINGLE SELECT)
   ========================= */

function SortableSubjectTable({
    rows,
    selectedKey,
    onRowSelect,
    rowsPerPage = 10,
}) {
    const [order, setOrder] = useState("asc");
    const [orderBy, setOrderBy] = useState("subject_id");
    const [page, setPage] = useState(1);

    const handleRequestSort = (property) => {
        if (property === "checkbox") return;
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const sortedRows = useMemo(
        () => stableSort(rows, getComparator(order, orderBy)),
        [rows, order, orderBy]
    );

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(sortedRows.length / rowsPerPage)),
        [sortedRows.length, rowsPerPage]
    );

    useEffect(() => {
        // đổi filter/sort -> quay về trang 1 cho UX dễ hiểu
        setPage(1);
    }, [rows, order, orderBy]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageRows = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedRows.slice(start, start + rowsPerPage);
    }, [sortedRows, page, rowsPerPage]);

    const pageTokens = useMemo(
        () => buildPageTokens(page, totalPages),
        [page, totalPages]
    );

    const handleRowClick = (row, key) => onRowSelect?.(row, key);

    return (
        <>
            <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {headCells.map((headCell) => (
                                <TableCell
                                    key={headCell.id}
                                    padding={headCell.id === "checkbox" ? "checkbox" : "normal"}
                                >
                                    {headCell.id === "checkbox" ? null : (
                                        <TableSortLabel
                                            active={orderBy === headCell.id}
                                            direction={orderBy === headCell.id ? order : "asc"}
                                            onClick={() => handleRequestSort(headCell.id)}
                                        >
                                            {headCell.label}
                                        </TableSortLabel>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {pageRows.map((row, index) => {
                            const rowKey = getRowKey(row, index);
                            const isSelected = selectedKey === rowKey;

                            const totalCredits =
                                (Number(row.theory_credits) || 0) + (Number(row.practice_credits) || 0);

                            const facultyDisplay = getFacultyDisplay(row.faculty_id);

                            return (
                                <TableRow
                                    key={rowKey}
                                    hover
                                    selected={isSelected}
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => handleRowClick(row, rowKey)}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={isSelected} />
                                    </TableCell>
                                    <TableCell>{row.subject_id}</TableCell>
                                    <TableCell>{row.subject_name}</TableCell>
                                    <TableCell>
                                        {facultyDisplay.tooltip ? (
                                            <Tooltip title={facultyDisplay.tooltip} arrow>
                                                <span>{facultyDisplay.label}</span>
                                            </Tooltip>
                                        ) : (
                                            <span>{facultyDisplay.label}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{totalCredits}</TableCell>
                                </TableRow>
                            );
                        })}

                        {pageRows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    Không có môn học nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {sortedRows.length > 0 && (
                <div className="table-pagination-bar">
                    <span className="table-pagination-info">
                        Đang hiển thị <strong>{pageRows.length}</strong> /{" "}
                        <strong>{sortedRows.length}</strong> — Trang{" "}
                        <strong>{page}</strong> / <strong>{totalPages}</strong>
                    </span>

                    <div className="table-pagination-actions">
                        <button
                            type="button"
                            className="page-btn"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            ◀
                        </button>

                        {pageTokens.map((t, idx) =>
                            t === "..." ? (
                                <span key={`dots-${idx}`} className="page-dots">
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={t}
                                    type="button"
                                    className={`page-btn ${t === page ? "active" : ""}`}
                                    onClick={() => setPage(t)}
                                >
                                    {t}
                                </button>
                            )
                        )}

                        <button
                            type="button"
                            className="page-btn"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}


/* =========================
   SUBJECT OPEN PAGE
   ========================= */

export default function AllSubjectList() {
    const [rowData, setRowData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [quickFilter, setQuickFilter] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedKey, setSelectedKey] = useState(null);

    const navigate = useNavigate();

    const loadSubjects = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const token = sessionStorage.getItem("token") || "";
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await fetch("/api/subjects", { headers });
            if (!res.ok) throw new Error(`API lỗi (mã ${res.status})`);
            const data = await res.json();
            const rows = Array.isArray(data)
                ? data
                : Array.isArray(data?.subjects)
                    ? data.subjects
                    : [];
            setRowData(rows);
        } catch (err) {
            setError(err.message || "Không thể tải danh sách môn học");
            setRowData([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const handleQuickFilter = useCallback((value) => {
        setQuickFilter(value);
    }, []);

    const filteredRows = useMemo(() => {
        if (!quickFilter.trim()) return rowData;
        const q = quickFilter.trim().toLowerCase();
        return rowData.filter((row) => {
            const { label: facultyLabel } = getFacultyDisplay(row.faculty_id);
            const { label: typeLabel } = getSubjectTypeDisplay(row.subject_type);
            const text = `${row.subject_id || ""} ${row.subject_name || ""} ${row.faculty_id || ""
                } ${facultyLabel} ${typeLabel}`.toLowerCase();
            return text.includes(q);
        });
    }, [rowData, quickFilter]);

    const creditTotal = useMemo(
        () =>
            rowData.reduce(
                (sum, row) =>
                    sum +
                    (Number(row.theory_credits) || 0) +
                    (Number(row.practice_credits) || 0),
                0
            ),
        [rowData]
    );

    const totalSubjects = useMemo(
        () => rowData.length,
        [rowData]
    );

    const selectedCount = selectedSubject ? 1 : 0;

    const handleRowSelect = (row, key) => {
        // toggle: click lại cùng môn thì bỏ chọn
        if (key === selectedKey) {
            setSelectedSubject(null);
            setSelectedKey(null);
        } else {
            setSelectedSubject(row);
            setSelectedKey(key);
        }
    };

    return (
        <div className="subject-open-page">
            {/* Sidebar bên trái */}
            <aside className="subject-open-steps">
                <div className="step-brand">
                    <img src="/img/logo_uit.svg" alt="Logo UIT" />
                </div>
                <ol>
                    <li>
                        <span className="step-number">1</span>Chọn file Excel
                    </li>
                    <li>
                        <span className="step-number">2</span>Xếp lớp
                    </li>
                    <li>
                        <span className="step-number">3</span>Xuất TKB &amp; script
                    </li>
                </ol>
                <div className="step-footer">
                    <button type="button">Like &amp; Share</button>
                    <span className="star-count">458 ⭐</span>
                </div>
            </aside>

            {/* Nội dung chính */}
            <section className="subject-open-content">
                <header className="subject-open-header">
                    <div>
                        <div className="subject-back-toolbar">
                            <button
                                className="subject-back"
                                type="button"
                                onClick={() => navigate("/app/dashboard")}
                            >
                                ← Quay về trang chủ
                            </button>
                        </div>
                        <p className="breadcrumb">TẤT CẢ MÔN HỌC</p>
                        <h2>Danh sách tất cả môn học</h2>
                    </div>
                    <div className="header-actions">
                        <button
                            className="ghost"
                            onClick={loadSubjects}
                            disabled={isLoading}
                        >
                            {isLoading ? "Đang tải..." : "Làm mới"}
                        </button>
                        <button>Xuất Excel</button>
                    </div>
                </header>

                {/* Thanh công cụ */}
                <div className="subject-toolbar">
                    <div className="field-group">
                        <label>Tìm kiếm</label>
                        <div className="combo">
                            <input
                                type="text"
                                placeholder="Nhập mã môn hoặc tên môn..."
                                value={quickFilter}
                                onChange={(e) => handleQuickFilter(e.target.value)}
                            />
                            <span className="combo-suffix">⌕</span>
                        </div>
                    </div>
                    <div className="toolbar-actions">
                        <span className="pill soft">
                            Tổng số môn: {totalSubjects}
                        </span>
                        <span className="pill primary">
                            Đang chọn: {selectedCount}
                        </span>
                    </div>
                </div>

                {/* Khung thông tin môn được chọn */}
                <SubjectDetailPanel subject={selectedSubject} />

                {/* Bảng */}
                <div className="subject-grid-card">
                    {error && (
                        <div className="error-banner">
                            <strong>Lỗi:</strong> {error}
                        </div>
                    )}

                    <div className={`subject-grid ${isLoading ? "is-loading" : ""}`}>
                        <SortableSubjectTable
                            rows={filteredRows}
                            selectedKey={selectedKey}
                            onRowSelect={handleRowSelect}
                        />
                    </div>
                </div>

                <footer className="subject-summary">
                    <span>
                        Tổng tín chỉ: <strong>{creditTotal}</strong>
                    </span>
                    <span>
                        Số môn học: <strong>{rowData.length}</strong>
                    </span>
                </footer>
            </section>
        </div>
    );
}
