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
    { id: "actions", label: "Thao tác", sortable: false },
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

                <span className="subject-hero__line subject-ellipsis" title={v(subject?.total_periods)}>
                    Tổng số tiết: {v(subject?.total_periods)}
                </span>
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
    onEditRow,
    onDeleteRow,
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
    const handleEditClick = (event, row) => {
        event.stopPropagation();
        onEditRow?.(row);
    };
    const handleDeleteClick = (event, row) => {
        event.stopPropagation();
        onDeleteRow?.(row);
    };

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
                                    align={headCell.id === "actions" ? "right" : "left"}
                                >
                                    {headCell.id === "checkbox" ? null : headCell.sortable ? (
                                        <TableSortLabel
                                            active={orderBy === headCell.id}
                                            direction={orderBy === headCell.id ? order : "asc"}
                                            onClick={() => handleRequestSort(headCell.id)}
                                        >
                                            {headCell.label}
                                        </TableSortLabel>
                                    ) : (
                                        <span>{headCell.label}</span>
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
                                    <TableCell align="right">
                                        <div className="subject-row-actions">
                                            <Tooltip title="Sửa môn học" arrow>
                                                <button
                                                    type="button"
                                                    className="subject-action-btn"
                                                    aria-label={`Sửa ${row.subject_id || row.subject_name || "môn học"}`}
                                                    onClick={(event) => handleEditClick(event, row)}
                                                >
                                                    <i className="ti-pencil" aria-hidden="true" />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Xóa môn học" arrow>
                                                <button
                                                    type="button"
                                                    className="subject-action-btn danger"
                                                    aria-label={`Xóa ${row.subject_id || row.subject_name || "môn học"}`}
                                                    onClick={(event) => handleDeleteClick(event, row)}
                                                >
                                                    <i className="ti-close" aria-hidden="true" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {pageRows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
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
    const [editSubject, setEditSubject] = useState(null);
    const [deleteSubject, setDeleteSubject] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        subject_id: "",
        subject_name: "",
        subjectEL_name: "",
        faculty_id: "",
        subject_type: "",
        theory_credits: "",
        practice_credits: "",
        prerequisite_id: "",
        equivalent_id: "",
        old_id: "",
    });
    const [editForm, setEditForm] = useState({
        subject_name: "",
        subjectEL_name: "",
        faculty_id: "",
        subject_type: "",
        theory_credits: "",
        practice_credits: "",
        prerequisite_id: "",
        equivalent_id: "",
        old_id: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const toInputList = (value) => {
        if (!value) return "";
        if (Array.isArray(value)) return value.join(", ");
        return String(value);
    };

    const handleOpenEdit = (row) => {
        setEditSubject(row);
        setEditForm({
            subject_name: row?.subject_name || "",
            subjectEL_name: row?.subjectEL_name || "",
            faculty_id: row?.faculty_id || "",
            subject_type: row?.subject_type || "",
            theory_credits: row?.theory_credits ?? "",
            practice_credits: row?.practice_credits ?? "",
            prerequisite_id: toInputList(row?.prerequisite_id),
            equivalent_id: toInputList(row?.equivalent_id),
            old_id: toInputList(row?.old_id),
        });
    };

    const handleOpenCreate = () => {
        setCreateForm({
            subject_id: "",
            subject_name: "",
            subjectEL_name: "",
            faculty_id: "",
            subject_type: "",
            theory_credits: "",
            practice_credits: "",
            prerequisite_id: "",
            equivalent_id: "",
            old_id: "",
        });
        setIsCreateOpen(true);
    };

    const handleCloseCreate = () => {
        if (isCreating) return;
        setIsCreateOpen(false);
    };

    const handleCloseEdit = () => {
        if (isSaving) return;
        setEditSubject(null);
    };

    const handleOpenDelete = (row) => {
        setDeleteSubject(row);
    };

    const handleCloseDelete = () => {
        if (isDeleting) return;
        setDeleteSubject(null);
    };

    const handleEditChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateChange = (field, value) => {
        setCreateForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveEdit = async (event) => {
        event.preventDefault();
        if (!editSubject) return;
        setIsSaving(true);
        setError("");
        try {
            const token = sessionStorage.getItem("token") || "";
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const res = await fetch(`/api/subjects/${encodeURIComponent(editSubject.subject_id)}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(editForm),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload.message || `API lỗi (mã ${res.status})`);
            }
            const data = await res.json();
            const updated = data?.subject || data;
            setRowData((prev) =>
                prev.map((row) =>
                    row.subject_id === updated.subject_id ? { ...row, ...updated } : row
                )
            );
            if (selectedSubject?.subject_id === updated.subject_id) {
                setSelectedSubject(updated);
            }
            setEditSubject(null);
        } catch (err) {
            setError(err.message || "Không thể cập nhật môn học");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateSubject = async (event) => {
        event.preventDefault();
        if (!createForm.subject_id.trim()) {
            setError("Vui lòng nhập mã môn học");
            return;
        }
        setIsCreating(true);
        setError("");
        try {
            const token = sessionStorage.getItem("token") || "";
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const res = await fetch("/api/subjects", {
                method: "POST",
                headers,
                body: JSON.stringify(createForm),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload.message || `API lỗi (mã ${res.status})`);
            }
            const data = await res.json();
            const created = data?.subject || data;
            setRowData((prev) => [created, ...prev]);
            setIsCreateOpen(false);
        } catch (err) {
            setError(err.message || "Không thể thêm môn học");
        } finally {
            setIsCreating(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteSubject) return;
        setIsDeleting(true);
        setError("");
        try {
            const token = sessionStorage.getItem("token") || "";
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`/api/subjects/${encodeURIComponent(deleteSubject.subject_id)}`, {
                method: "DELETE",
                headers,
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload.message || `API lỗi (mã ${res.status})`);
            }
            setRowData((prev) =>
                prev.filter((row) => row.subject_id !== deleteSubject.subject_id)
            );
            if (selectedSubject?.subject_id === deleteSubject.subject_id) {
                setSelectedSubject(null);
                setSelectedKey(null);
            }
            setDeleteSubject(null);
        } catch (err) {
            setError(err.message || "Không thể xóa môn học");
        } finally {
            setIsDeleting(false);
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
                        <div className="combo-row">
                            <div className="combo">
                                <input
                                    type="text"
                                    placeholder="Nhập mã môn hoặc tên môn..."
                                    value={quickFilter}
                                    onChange={(e) => handleQuickFilter(e.target.value)}
                                />
                                <span className="combo-suffix">⌕</span>
                            </div>
                            <button
                                type="button"
                                className="subject-add-btn"
                                onClick={handleOpenCreate}
                            >
                                + Thêm môn
                            </button>
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
                            onEditRow={handleOpenEdit}
                            onDeleteRow={handleOpenDelete}
                        />
                    </div>
                </div>
            </section>

            {editSubject && (
                <div className="subject-modal-backdrop" onClick={handleCloseEdit}>
                    <div className="subject-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="subject-modal-header">
                            <div>
                                <p className="subject-modal-label">SỬA MÔN HỌC</p>
                                <h3 className="subject-modal-title">
                                    {editSubject.subject_id || "Môn học"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="subject-modal-close"
                                onClick={handleCloseEdit}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit}>
                            <div className="subject-modal-body">
                                <div className="subject-modal-grid">
                                    <div className="subject-form-field">
                                        <label>Mã môn học</label>
                                        <input value={editSubject.subject_id || ""} disabled />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Tên môn học</label>
                                        <input
                                            value={editForm.subject_name}
                                            onChange={(e) => handleEditChange("subject_name", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Tên tiếng Anh</label>
                                        <input
                                            value={editForm.subjectEL_name}
                                            onChange={(e) => handleEditChange("subjectEL_name", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Khoa quản lý</label>
                                        <input
                                            value={editForm.faculty_id}
                                            onChange={(e) => handleEditChange("faculty_id", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Loại môn</label>
                                        <input
                                            value={editForm.subject_type}
                                            onChange={(e) => handleEditChange("subject_type", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>TC lý thuyết</label>
                                        <input
                                            type="number"
                                            value={editForm.theory_credits}
                                            onChange={(e) => handleEditChange("theory_credits", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>TC thực hành</label>
                                        <input
                                            type="number"
                                            value={editForm.practice_credits}
                                            onChange={(e) => handleEditChange("practice_credits", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Môn tiên quyết</label>
                                        <input
                                            value={editForm.prerequisite_id}
                                            onChange={(e) => handleEditChange("prerequisite_id", e.target.value)}
                                        />
                                        <span className="subject-form-note">Ngăn cách bằng dấu phẩy</span>
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Môn tương đương</label>
                                        <input
                                            value={editForm.equivalent_id}
                                            onChange={(e) => handleEditChange("equivalent_id", e.target.value)}
                                        />
                                        <span className="subject-form-note">Ngăn cách bằng dấu phẩy</span>
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Mã cũ</label>
                                        <input
                                            value={editForm.old_id}
                                            onChange={(e) => handleEditChange("old_id", e.target.value)}
                                        />
                                        <span className="subject-form-note">Ngăn cách bằng dấu phẩy</span>
                                    </div>
                                </div>
                            </div>
                            <div className="subject-modal-footer">
                                <button
                                    type="button"
                                    className="subject-btn ghost"
                                    onClick={handleCloseEdit}
                                    disabled={isSaving}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="subject-btn" disabled={isSaving}>
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteSubject && (
                <div className="subject-modal-backdrop" onClick={handleCloseDelete}>
                    <div className="subject-modal subject-modal--danger" onClick={(e) => e.stopPropagation()}>
                        <div className="subject-modal-header">
                            <div>
                                <p className="subject-modal-label">XÓA MÔN HỌC</p>
                                <h3 className="subject-modal-title">
                                    {deleteSubject.subject_id || deleteSubject.subject_name || "Môn học"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="subject-modal-close"
                                onClick={handleCloseDelete}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>
                        <div className="subject-modal-body">
                            <p>
                                Bạn có chắc muốn xóa môn học{" "}
                                <strong>{deleteSubject.subject_name || deleteSubject.subject_id}</strong>?
                            </p>
                        </div>
                        <div className="subject-modal-footer">
                            <button
                                type="button"
                                className="subject-btn ghost"
                                onClick={handleCloseDelete}
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="subject-btn danger"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Đang xóa..." : "Xóa môn"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateOpen && (
                <div className="subject-modal-backdrop" onClick={handleCloseCreate}>
                    <div className="subject-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="subject-modal-header">
                            <div>
                                <p className="subject-modal-label">THÊM MÔN HỌC</p>
                                <h3 className="subject-modal-title">Môn học mới</h3>
                            </div>
                            <button
                                type="button"
                                className="subject-modal-close"
                                onClick={handleCloseCreate}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubject}>
                            <div className="subject-modal-body">
                                <div className="subject-modal-grid">
                                    <div className="subject-form-field">
                                        <label>Mã môn học</label>
                                        <input
                                            value={createForm.subject_id}
                                            onChange={(e) => handleCreateChange("subject_id", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Tên môn học</label>
                                        <input
                                            value={createForm.subject_name}
                                            onChange={(e) => handleCreateChange("subject_name", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Tên tiếng Anh</label>
                                        <input
                                            value={createForm.subjectEL_name}
                                            onChange={(e) => handleCreateChange("subjectEL_name", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Khoa quản lý</label>
                                        <input
                                            value={createForm.faculty_id}
                                            onChange={(e) => handleCreateChange("faculty_id", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Loại môn</label>
                                        <input
                                            value={createForm.subject_type}
                                            onChange={(e) => handleCreateChange("subject_type", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>TC lý thuyết</label>
                                        <input
                                            type="number"
                                            value={createForm.theory_credits}
                                            onChange={(e) => handleCreateChange("theory_credits", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>TC thực hành</label>
                                        <input
                                            type="number"
                                            value={createForm.practice_credits}
                                            onChange={(e) => handleCreateChange("practice_credits", e.target.value)}
                                        />
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Môn tiên quyết</label>
                                        <input
                                            value={createForm.prerequisite_id}
                                            onChange={(e) => handleCreateChange("prerequisite_id", e.target.value)}
                                        />
                                        <span className="subject-form-note">Ngăn cách bằng dấu phẩy</span>
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Môn tương đương</label>
                                        <input
                                            value={createForm.equivalent_id}
                                            onChange={(e) => handleCreateChange("equivalent_id", e.target.value)}
                                        />
                                        <span className="subject-form-note">Ngăn cách bằng dấu phẩy</span>
                                    </div>
                                    <div className="subject-form-field">
                                        <label>Mã cũ</label>
                                        <input
                                            value={createForm.old_id}
                                            onChange={(e) => handleCreateChange("old_id", e.target.value)}
                                        />
                                        <span className="subject-form-note">Ngăn cách bằng dấu phẩy</span>
                                    </div>
                                </div>
                            </div>
                            <div className="subject-modal-footer">
                                <button
                                    type="button"
                                    className="subject-btn ghost"
                                    onClick={handleCloseCreate}
                                    disabled={isCreating}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="subject-btn" disabled={isCreating}>
                                    {isCreating ? "Đang thêm..." : "Thêm môn"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
