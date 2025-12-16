// pages/SubjectOpen.jsx
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
        (Number(subject?.theory_credits) || 0) +
        (Number(subject?.practice_credits) || 0);

    const facultyDisplay = hasSubject
        ? getFacultyDisplay(subject.faculty_id)
        : { label: "—", tooltip: "" };

    const typeDisplay = hasSubject
        ? getSubjectTypeDisplay(subject.subject_type)
        : { label: "—", tooltip: "" };

    return (
        <div className="subject-hero">
            {/* Cột 1: Mã môn + meta */}
            <div className="subject-hero__block">
                <span className="subject-hero__label">Mã môn học</span>
                <span className="subject-hero__value">
                    {hasSubject ? formatArray(subject.subject_id) : "Chưa chọn môn"}
                </span>

                <div className="subject-meta">
                    {hasSubject ? (
                        <Tooltip title={typeDisplay.tooltip} arrow>
                            <span className="subject-meta-pill">
                                Loại môn: {typeDisplay.label}
                            </span>
                        </Tooltip>
                    ) : (
                        <span className="subject-meta-pill">Loại môn: —</span>
                    )}

                    {hasSubject ? (
                        <Tooltip title={facultyDisplay.tooltip} arrow>
                            <span className="subject-meta-pill">
                                Khoa quản lý: {facultyDisplay.label}
                            </span>
                        </Tooltip>
                    ) : (
                        <span className="subject-meta-pill">Khoa quản lý: —</span>
                    )}

                    <span className="subject-meta-pill">
                        Số tín chỉ: {hasSubject ? totalCredits : "—"}
                    </span>
                </div>
            </div>

            {/* Cột 2: Tên môn */}
            <div className="subject-hero__block">
                <span className="subject-hero__label">Tên môn học</span>
                <span className="subject-hero__value">
                    {hasSubject
                        ? formatArray(subject.subject_name)
                        : "Hãy chọn một môn trong bảng bên dưới"}
                </span>

                {hasSubject && (
                    <>
                        <span>
                            Tên tiếng Anh: {formatArray(subject.subjectEL_name)}
                        </span>
                        <span>Mã cũ: {formatArray(subject.old_id)}</span>
                    </>
                )}
            </div>

            {/* Cột 3: Thông tin thêm */}
            <div className="subject-hero__block">
                <span className="subject-hero__label">Thông tin thêm</span>
                <span>
                    TC lý thuyết:{" "}
                    {hasSubject ? formatArray(subject.theory_credits) : "—"}
                </span>
                <span>
                    TC thực hành:{" "}
                    {hasSubject ? formatArray(subject.practice_credits) : "—"}
                </span>

                {hasSubject && (
                    <>
                        <span>
                            Môn tiên quyết: {formatArray(subject.prerequisite_id)}
                        </span>
                        <span>
                            Môn tương đương: {formatArray(subject.equivalent_id)}
                        </span>
                    </>
                )}
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
    initialVisible = 4,
}) {
    const [order, setOrder] = useState("asc");
    const [orderBy, setOrderBy] = useState("subject_id");
    const [visibleCount, setVisibleCount] = useState(initialVisible);

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

    const rowsToShow = useMemo(
        () => sortedRows.slice(0, visibleCount),
        [sortedRows, visibleCount]
    );

    const handleRowClick = (row, key) => {
        onRowSelect?.(row, key);
    };

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 4, rows.length));
    };

    const handleShowLess = () => {
        setVisibleCount(initialVisible);
    };

    // khi rows đổi (reload API), reset số hàng hiển thị
    useEffect(() => {
        setVisibleCount(initialVisible);
    }, [rows, initialVisible]);

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
                                    {headCell.id === "checkbox" ? (
                                        // cột tick, không cho select all, chỉ để trống
                                        null
                                    ) : (
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
                        {rowsToShow.map((row, index) => {
                            const rowKey = getRowKey(row, index);
                            const isSelected = selectedKey === rowKey;
                            const totalCredits =
                                (Number(row.theory_credits) || 0) +
                                (Number(row.practice_credits) || 0);

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

                        {rowsToShow.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    Không có môn học nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {rows.length > initialVisible && (
                <div className="table-loadmore-bar">
                    {visibleCount < rows.length && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleLoadMore}
                        >
                            LOAD MORE
                        </Button>
                    )}
                    {visibleCount > initialVisible && (
                        <Button
                            variant="text"
                            size="small"
                            onClick={handleShowLess}
                        >
                            SHOW LESS
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}

/* =========================
   SUBJECT OPEN PAGE
   ========================= */

export default function SubjectOpen() {
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
            const token = sessionStorage.getItem("token");
            const res = await fetch("/api/subject-open", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`API lỗi (mã ${res.status})`);
            const data = await res.json();
            const subjects = data.success && data.data ? data.data.flatMap(list => list.subjects) : [];
            setRowData(subjects);
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
                        <p className="breadcrumb">MỞ LỚP TRỰC TUYẾN</p>
                        <h2>Danh sách môn học mở</h2>
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
                            initialVisible={4}
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
