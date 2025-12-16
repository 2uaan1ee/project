import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/tuition.css";
import { authFetch } from "../lib/auth.js";

const formatCurrency = (value) => {
  const numeric = Number(value);
  return new Intl.NumberFormat("vi-VN").format(Number.isFinite(numeric) ? numeric : 0);
};

export default function TuitionPayments() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");

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
    if (!sortField) return rows;
    const cloned = [...rows];
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
  }, [rows, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
      return;
    }
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? "▲" : "▼";
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
        item.major_id || "",
        Number(item.tuition_total) || 0,
        Number(item.total_paid) || 0,
        Number(item.remaining_balance) || 0,
      ].join(",")
    );
    const csvContent = [headers.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const semesterLabel = semesterOptions.find((s) => String(s.semester) === String(semester))?.label || `HK${semester}`;
    a.href = url;
    a.download = `hocphi_${academicYear || "nam-hoc"}_${semesterLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tuition-page">
      <div className="tuition-header">
        <div className="tuition-header-top">
          <h1>Danh sách sinh viên chưa hoàn thành học phí</h1>
          <button type="button" className="tuition-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>
        <p>Chọn năm học và học kỳ để xem chi tiết.</p>
      </div>

      {error && <div className="status-banner error">{error}</div>}

      <div className="tuition-controls">
        <label>
          Năm học
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
        </label>

        <label>
          Học kỳ
          <select value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!semesterOptions.length}>
            {!semesterOptions.length && <option value="">-</option>}
            {semesterOptions.map((item) => (
              <option key={item.semester} value={item.semester}>
                {item.label || `Học kỳ ${item.semester}`}
              </option>
            ))}
          </select>
        </label>

        <div className="tuition-actions">
          <button type="button" className="export-btn" onClick={handleExport} disabled={!sortedRows.length}>
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="tuition-sheet">
        {loading ? (
          <div className="tuition-empty">Đang tải dữ liệu...</div>
        ) : rows.length === 0 ? (
          <div className="tuition-empty">
            Chưa có dữ liệu cho bộ lọc này. Hãy chọn năm/học kỳ khác hoặc kiểm tra dữ liệu nguồn.
          </div>
        ) : (
          <div className="tuition-table-wrapper">
            <table className="tuition-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("student_id")}>
                      MSSV <span className="sort-icon">{renderSortIcon("student_id")}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("student_name")}>
                      Họ và tên <span className="sort-icon">{renderSortIcon("student_name")}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("major_id")}>
                      Ngành <span className="sort-icon">{renderSortIcon("major_id")}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("tuition_total")}>
                      Số tiền phải đóng <span className="sort-icon">{renderSortIcon("tuition_total")}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("total_paid")}>
                      Số tiền đã đóng <span className="sort-icon">{renderSortIcon("total_paid")}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort("remaining_balance")}>
                      Còn lại <span className="sort-icon">{renderSortIcon("remaining_balance")}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((item, idx) => (
                  <tr key={item.student_id}>
                    <td>{idx + 1}</td>
                    <td>{item.student_id}</td>
                    <td className="cell-strong">{item.student_name || "—"}</td>
                    <td>{item.major_id || "-"}</td>
                    <td className="cell-number">{formatCurrency(item.tuition_total)}</td>
                    <td className="cell-number paid">{formatCurrency(item.total_paid)}</td>
                    <td className="cell-number remaining">{formatCurrency(item.remaining_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
