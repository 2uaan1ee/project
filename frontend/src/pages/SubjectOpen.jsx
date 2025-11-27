// pages/SubjectOpen.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "../styles/subject-open.css";

ModuleRegistry.registerModules([AllCommunityModule]);

// 🔥 Nhãn tiếng Việt
const FIELD_LABELS = {
    subject_id: "Mã môn",
    subject_name: "Tên môn học",
    subjectEL_name: "Tên tiếng Anh",
    faculty_id: "Khoa quản lý",
    subject_type: "Loại môn",
    theory_credits: "TC lý thuyết",
    practice_credits: "TC thực hành",
    prerequisite_id: "Môn tiên quyết",
    equivalent_id: "Môn tương đương",
    previous_id: "Học trước",
    old_id: "Mã cũ",
    createdAt: "Ngày tạo",
    updatedAt: "Ngày cập nhật",
};


function formatArray(value) {
    if (Array.isArray(value)) return value.join(", ");
    if (!value) return "";
    return String(value);
}

export default function SubjectOpen() {
    const [rowData, setRowData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [quickFilter, setQuickFilter] = useState("");
    const [selectedCount, setSelectedCount] = useState(0);
    const gridRef = useRef(null);
    const navigate = useNavigate();

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
            minWidth: 120,
        }),
        []
    );

    // 🔥 Tạo column AG-Grid
    const buildColumns = useCallback((availableKeys = []) => {
        const baseCols = [
            {
                headerName: "",
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 60,
                pinned: "left",
                suppressMenu: true,
                sortable: false,
            },
            {
                field: "subject_id",
                headerName: FIELD_LABELS.subject_id,
                pinned: "left",
                width: 130,
                cellClass: "cell-strong",
            },
            {
                field: "subject_name",
                headerName: FIELD_LABELS.subject_name,
                minWidth: 280,
                flex: 1.6,
                cellClass: "cell-link",
                tooltipField: "subject_name",
            },
            {
                field: "subjectEL_name",
                headerName: FIELD_LABELS.subjectEL_name,
                minWidth: 220,
                flex: 1.2,
                tooltipField: "subjectEL_name",
            },
            {
                field: "faculty_id",
                headerName: FIELD_LABELS.faculty_id,
                width: 130,
                cellClass: "cell-muted",
            },
            {
                field: "subject_type",
                headerName: FIELD_LABELS.subject_type,
                width: 120,
                cellClass: "pill-cell",
            },
            {
                headerName: "Tổng số tín chỉ",
                valueGetter: (params) =>
                    (params.data?.theory_credits || 0) +
                    (params.data?.practice_credits || 0),
                width: 130,
                cellClass: "cell-strong",
            },
            {
                field: "theory_credits",
                headerName: FIELD_LABELS.theory_credits,
                width: 110,
                cellClass: "cell-center",
            },
            {
                field: "practice_credits",
                headerName: FIELD_LABELS.practice_credits,
                width: 110,
                cellClass: "cell-center",
            },
            {
                field: "status",
                headerName: FIELD_LABELS.status,
                width: 130,
                cellRenderer: (params) => {
                    const value = params.value || "unknown";
                    const open = value.toLowerCase() === "open";
                    return `<span class="status-badge ${open ? "status-open" : "status-closed"}">
                        ${open ? "Mở" : "Đóng"}
                    </span>`;
                },
                cellClass: "cell-center",
                tooltipField: "status",
            },
        ];

        // 🔥 Thêm column bổ sung
        const extraCols = availableKeys
            .filter((key) => !baseCols.some((c) => c.field === key) && FIELD_LABELS[key])
            .map((field) => ({
                field,
                headerName: FIELD_LABELS[field],
                flex: 1,
                valueFormatter: (params) => formatArray(params.value),
            }));

        return [...baseCols, ...extraCols];
    }, []);

    // 🔥 Load API
    const loadSubjects = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/subjects/open");
            if (!res.ok) throw new Error(`API lỗi (mã ${res.status})`);

            const data = await res.json();
            const rows = Array.isArray(data) ? data : [];
            setRowData(rows);

            const keys = new Set();
            rows.forEach((item) => Object.keys(item).forEach((k) => keys.add(k)));

            setColumnDefs(buildColumns([...keys]));
        } catch (err) {
            setError(err.message || "Không thể tải danh sách môn học");
            setRowData([]);
            setColumnDefs(buildColumns());
        } finally {
            setIsLoading(false);
        }
    }, [buildColumns]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const handleSelectionChanged = useCallback(() => {
        const count = gridRef.current?.api.getSelectedRows().length || 0;
        setSelectedCount(count);
    }, []);

    const handleQuickFilter = useCallback((value) => {
        setQuickFilter(value);
        gridRef.current?.api.setQuickFilter(value);
    }, []);

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

    return (
        <div className="subject-open-page">
            {/* Sidebar bên trái */}
            <aside className="subject-open-steps">
                <div className="step-brand">
                    <img src="/img/logo_uit.svg" alt="Logo UIT" />
                </div>
                <ol>
                    <li><span className="step-number">1</span>Chọn file Excel</li>
                    <li><span className="step-number">2</span>Xếp lớp</li>
                    <li><span className="step-number">3</span>Xuất TKB & script</li>
                </ol>
                <div className="step-footer">
                    <button type="button">Like & Share</button>
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
                        <button className="ghost" onClick={loadSubjects} disabled={isLoading}>Làm mới</button>
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
                        <span className="pill soft">Tổng tín chỉ: {creditTotal}</span>
                        <span className="pill primary">Đang chọn: {selectedCount}</span>
                    </div>
                </div>

                {/* Bảng */}
                <div className="subject-grid-card">
                    {error && (
                        <div className="error-banner">
                            <strong>Lỗi:</strong> {error}
                        </div>
                    )}

                    <div className={`ag-theme-alpine subject-grid ${isLoading ? "is-loading" : ""}`}>
                        <AgGridReact
                            ref={gridRef}
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            rowSelection="multiple"
                            animateRows
                            suppressRowClickSelection
                            quickFilterText={quickFilter}
                            sideBar={["columns", "filters"]}
                            onSelectionChanged={handleSelectionChanged}
                            onGridReady={(params) => {
                                gridRef.current = params;
                                handleQuickFilter(quickFilter);
                            }}
                            getRowId={(params) =>
                                params.data?.subject_id || params.data?._id || params.node.id
                            }
                        />
                    </div>
                </div>

                <footer className="subject-summary">
                    <span>Tổng tín chỉ: <strong>{creditTotal}</strong></span>
                    <span>Số môn học: <strong>{rowData.length}</strong></span>
                </footer>
            </section>
        </div>
    );
}
