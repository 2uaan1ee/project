import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/tuition.css";
import "../styles/subject-open.css";
import { authFetch } from "../lib/auth.js";
import tuitionPrintTemplate from "../templates/tuitionPrintTemplate.js";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";

// TODO: Thêm việc kiểm tra giảm giá cho đối tượng ưu tiên.
const formatCurrency = (value) => {
  const numeric = Number(value);
  return new Intl.NumberFormat("vi-VN").format(Number.isFinite(numeric) ? numeric : 0);
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildPrintTable = (items) => {
  const header = `    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>MSSV</th>
          <th>Họ và tên</th>
          <th>Lớp</th>
          <th>Số tiền phải đóng</th>
          <th>Số tiền đã đóng</th>
          <th>Còn lại</th>
        </tr>
      </thead>
      <tbody>`;
  const rows = (items || []).map((item, index) => {
    const studentId = escapeHtml(item.student_id || "");
    const studentName = escapeHtml(item.student_name || "—");
    const classId = escapeHtml(item.class_id || "-");
    const tuitionTotal = escapeHtml(formatCurrency(item.tuition_total));
    const totalPaid = escapeHtml(formatCurrency(item.total_paid));
    const remainingBalance = escapeHtml(formatCurrency(item.remaining_balance));
    return `        <tr>
          <td>${index + 1}</td>
          <td>${studentId}</td>
          <td>${studentName}</td>
          <td>${classId}</td>
          <td class="num">${tuitionTotal}</td>
          <td class="num">${totalPaid}</td>
          <td class="num">${remainingBalance}</td>
        </tr>`;
  });
  const body = rows.length
    ? rows.join("\n")
    : '        <tr><td class="empty" colspan="7">Không có dữ liệu</td></tr>';
  return `${header}
${body}
      </tbody>
    </table>`;
};

const buildPageTokens = (current, totalPages) => {
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
};

const compilePrintTemplate = (template, data) =>
  template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : ""
  );

export default function TuitionPayments() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    let cancelled = false;
    async function loadFilters() {
      try {
        const res = await authFetch("/api/tuition-payments/filters");
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Không thể tải bộ lọc");
        if (cancelled) return;
        setFilters(payload || []);
        if ((payload || []).length && !academicYear) {
          setAcademicYear(payload[0].academic_year);
          const firstSemester = payload[0].semesters?.[0]?.semester;
          if (firstSemester !== undefined) setSemester(String(firstSemester));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Không thể tải bộ lọc");
      }
    }
    loadFilters();
    return () => {
      cancelled = true;
    };
  }, []);

  const semesterOptions = useMemo(() => {
    return filters.find((f) => f.academic_year === academicYear)?.semesters || [];
  }, [filters, academicYear]);

  const classOptions = useMemo(() => {
    const unique = new Set();
    rows.forEach((row) => {
      if (row.class_id) unique.add(String(row.class_id));
    });
    return Array.from(unique).sort((a, b) =>
      a.localeCompare(b, "vi", { sensitivity: "base" })
    );
  }, [rows]);

  const normalizedClassFilter = useMemo(() => {
    const trimmed = classFilter.trim();
    if (!trimmed) return "";
    const lowered = trimmed.toLowerCase();
    if (["tất cả", "tất cả lớp", "tat ca", "tat ca lop", "all"].includes(lowered)) {
      return "";
    }
    return trimmed;
  }, [classFilter]);

  const filteredRows = useMemo(() => {
    if (!normalizedClassFilter) return rows;
    const needle = normalizedClassFilter.toLowerCase();
    return rows.filter((row) =>
      String(row.class_id || "").toLowerCase().includes(needle)
    );
  }, [rows, normalizedClassFilter]);

  useEffect(() => {
    if (!academicYear || !semesterOptions.length) return;
    if (!semesterOptions.some((opt) => String(opt.semester) === String(semester))) {
      const nextSemester = semesterOptions[0]?.semester;
      if (nextSemester !== undefined) setSemester(String(nextSemester));
    }
  }, [academicYear, semesterOptions, semester]);

  useEffect(() => {
    if (!academicYear || semester === "") return;
    let cancelled = false;
    async function loadSummary() {
      setLoading(true);
      setError("");
      setSortField("");
      try {
        const params = new URLSearchParams({
          academic_year: academicYear,
          semester: semester,
        });
        const res = await authFetch(`/api/tuition-payments?${params.toString()}`);
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Không thể tải dữ liệu học phí");
        if (!cancelled) {
          const enriched = (payload || []).map((item, index) => ({ ...item, __index: index }));
          setRows(enriched);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể tải dữ liệu học phí");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [academicYear, semester]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    const cloned = [...filteredRows];
    cloned.sort((a, b) => {
      if (sortField === "_index") {
        return sortDir === "asc" ? a.__index - b.__index : b.__index - a.__index;
      }
      const va = a[sortField];
      const vb = b[sortField];
      if (va == null && vb == null) return 0;
      if (va == null) return sortDir === "asc" ? -1 : 1;
      if (vb == null) return sortDir === "asc" ? 1 : -1;
      if (!Number.isNaN(Number(va)) && !Number.isNaN(Number(vb))) {
        const na = Number(va);
        const nb = Number(vb);
        return sortDir === "asc" ? na - nb : nb - na;
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb), "vi", { sensitivity: "base" })
        : String(vb).localeCompare(String(va), "vi", { sensitivity: "base" });
    });
    return cloned;
  }, [filteredRows, sortField, sortDir]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedRows.length / rowsPerPage)),
    [sortedRows.length, rowsPerPage]
  );

  useEffect(() => {
    setPage(1);
  }, [filteredRows, sortField, sortDir]);

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

  const semesterLabel = useMemo(() => {
    const match = semesterOptions.find((s) => String(s.semester) === String(semester));
    if (match?.label) return match.label;
    if (semester !== "") return `HK${semester}`;
    return "";
  }, [semesterOptions, semester]);

  const printSummary = useMemo(() => {
    return sortedRows.reduce(
      (acc, item) => {
        acc.totalDue += Number(item.tuition_total) || 0;
        acc.totalPaid += Number(item.total_paid) || 0;
        acc.totalRemaining += Number(item.remaining_balance) || 0;
        return acc;
      },
      { totalDue: 0, totalPaid: 0, totalRemaining: 0 }
    );
  }, [sortedRows]);

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
      return;
    }
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleExport = () => {
    if (!sortedRows.length) return;
    const headers = [
      "MSSV",
      "Họ và tên",
      "Ngành",
      "Số tiền phải đóng",
      "Số tiền đã đóng",
      "Còn lại",
    ];
    const lines = sortedRows.map((item) =>
      [
        item.student_id || "",
        item.student_name || "",
        item.class_id|| "",
        Number(item.tuition_total) || 0,
        Number(item.total_paid) || 0,
        Number(item.remaining_balance) || 0,
      ].join(",")
    );
    const csvContent = [headers.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hocphi_${academicYear || "nam-hoc"}_${semesterLabel || "hoc-ky"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!sortedRows.length) return;
    const classLabel = normalizedClassFilter || "Tất cả";
    const templateData = {
      title: "Danh sách sinh viên chưa hoàn thành học phí",
      academicYear: escapeHtml(academicYear || "-"),
      semesterLabel: escapeHtml(semesterLabel || "-"),
      classLabel: escapeHtml(classLabel),
      generatedAt: escapeHtml(new Date().toLocaleString("vi-VN")),
      totalStudents: escapeHtml(String(sortedRows.length)),
      totalDue: escapeHtml(formatCurrency(printSummary.totalDue)),
      totalPaid: escapeHtml(formatCurrency(printSummary.totalPaid)),
      totalRemaining: escapeHtml(formatCurrency(printSummary.totalRemaining)),
      table: buildPrintTable(sortedRows),
    };
    const html = compilePrintTemplate(tuitionPrintTemplate, templateData);
    const printWindow = window.open("", "_blank", "width=1024,height=720");
    if (!printWindow) {
      window.alert("Trình duyệt đang chặn cửa sổ in. Vui lòng bật pop-up để tiếp tục.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div className="subject-open-page subject-open-page--single">
      <section className="subject-open-content tuition-page">
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
            <h2>Danh sách sinh viên chưa hoàn thành học phí</h2>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="ghost"
              onClick={handlePrint}
              disabled={!sortedRows.length}
            >
              In danh sách
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!sortedRows.length}
            >
              Xuất Excel
            </button>
          </div>
        </header>
        <p className="tuition-subtitle">Chọn năm học và học kỳ để xem chi tiết.</p>

        {error && <div className="status-banner error">{error}</div>}

        <div className="subject-toolbar">
          <div className="field-group">
            <label>Năm học</label>
            <select
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                setSemester("");
              }}
            >
              {!filters.length && <option value="" disabled>Chưa có dữ liệu</option>}
              {filters.map((item) => (
                <option key={item.academic_year} value={item.academic_year}>
                  {item.academic_year}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Học kỳ</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!semesterOptions.length}>
              {!semesterOptions.length && <option value="">-</option>}
              {semesterOptions.map((item) => (
                <option key={item.semester} value={item.semester}>
                  {item.label || `Học kỳ ${item.semester}`}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Lớp</label>
            <div className="tuition-class-filter">
              <input
                list="tuition-class-options"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                placeholder="Tất cả"
              />
            </div>
            <datalist id="tuition-class-options">
              {classOptions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="tuition-sheet">
        {loading ? (
          <div className="tuition-empty">Đang tải dữ liệu...</div>
        ) : rows.length === 0 ? (
          <div className="tuition-empty">
            Chưa có dữ liệu cho bộ lọc này. Hãy chọn năm/học kỳ khác hoặc kiểm tra dữ liệu nguồn.
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="tuition-empty">
            Không có lớp phù hợp với bộ lọc hiện tại. Hãy chọn lớp khác hoặc hiển thị tất cả.
          </div>
        ) : (
          <div className="subject-grid-card">
            <div className="subject-grid">
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>STT</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === "student_id"}
                          direction={sortField === "student_id" ? sortDir : "asc"}
                          onClick={() => toggleSort("student_id")}
                        >
                          MSSV
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === "student_name"}
                          direction={sortField === "student_name" ? sortDir : "asc"}
                          onClick={() => toggleSort("student_name")}
                        >
                          Họ và tên
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === "class_id"}
                          direction={sortField === "class_id" ? sortDir : "asc"}
                          onClick={() => toggleSort("class_id")}
                        >
                          Lớp
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === "tuition_total"}
                          direction={sortField === "tuition_total" ? sortDir : "asc"}
                          onClick={() => toggleSort("tuition_total")}
                        >
                          Số tiền phải đóng
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === "total_paid"}
                          direction={sortField === "total_paid" ? sortDir : "asc"}
                          onClick={() => toggleSort("total_paid")}
                        >
                          Số tiền đã đóng
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === "remaining_balance"}
                          direction={sortField === "remaining_balance" ? sortDir : "asc"}
                          onClick={() => toggleSort("remaining_balance")}
                        >
                          Còn lại
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageRows.map((item, idx) => (
                      <TableRow key={item.student_id}>
                        <TableCell>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>{item.student_id}</TableCell>
                        <TableCell className="cell-strong">{item.student_name || "—"}</TableCell>
                        <TableCell>{item.class_id || "-"}</TableCell>
                        <TableCell className="cell-number">{formatCurrency(item.tuition_total)}</TableCell>
                        <TableCell className="cell-number paid">{formatCurrency(item.total_paid)}</TableCell>
                        <TableCell className="cell-number remaining">{formatCurrency(item.remaining_balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

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
                  {pageTokens.map((token, idx) =>
                    token === "..." ? (
                      <span key={`dots-${idx}`} className="page-dots">…</span>
                    ) : (
                      <button
                        key={token}
                        type="button"
                        className={`page-btn ${token === page ? "active" : ""}`}
                        onClick={() => setPage(token)}
                      >
                        {token}
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
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
