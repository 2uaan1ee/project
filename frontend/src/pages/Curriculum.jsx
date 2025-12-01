import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/curriculum.css";
import { authFetch } from "../lib/auth.js";

const PROGRAM_ALL = "__all__";
const PROGRAM_DEFAULT = "__default__";

export default function Curriculum() {
  const navigate = useNavigate();
  const [majors, setMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [programFilter, setProgramFilter] = useState(PROGRAM_ALL);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchMajors() {
      try {
        const res = await authFetch("/api/curricula/majors");
        if (!res.ok) throw new Error("Không thể tải danh sách ngành");
        const data = await res.json();
        if (!cancelled) {
          setMajors(data);
          if (!selectedMajor && data.length) {
            setSelectedMajor(data[0].major);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Không thể tải danh sách ngành");
      }
    }
    fetchMajors();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedMajor) return;
    let cancelled = false;
    async function fetchSemesters() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ major: selectedMajor });
        if (programFilter === PROGRAM_DEFAULT) {
          params.append("programCode", "null");
        } else if (programFilter !== PROGRAM_ALL) {
          params.append("programCode", programFilter);
        }
        const res = await authFetch(`/api/curricula?${params.toString()}`);
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.message || "Không thể tải chương trình");
        }
        if (!cancelled) {
          setSemesters(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể tải chương trình");
          setSemesters([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSemesters();
    return () => {
      cancelled = true;
    };
  }, [selectedMajor, programFilter]);

  const currentMajorInfo = useMemo(
    () => majors.find((item) => item.major === selectedMajor),
    [majors, selectedMajor]
  );

  const programOptions = useMemo(() => currentMajorInfo?.programCodes || [], [currentMajorInfo]);
  const facultyDisplay = semesters[0]?.faculty || currentMajorInfo?.faculties?.[0] || "";

  return (
    <div className="curriculum-page">
      <div className="curriculum-header">
        <div className="curriculum-header-top">
          <h1>Chương trình học chuẩn</h1>
          <button type="button" className="curriculum-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>
        <p>Chọn ngành và (nếu có) mã chương trình để xem danh sách học phần theo từng học kỳ.</p>
      </div>

      {error && <div className="status-banner error">{error}</div>}

      <div className="curriculum-controls">
        <label>
          Ngành học
          <select value={selectedMajor} onChange={(e) => { setSelectedMajor(e.target.value); setProgramFilter(PROGRAM_ALL); }}>
            {!majors.length && <option value="" disabled>Chưa có dữ liệu</option>}
            {majors.map((item) => (
              <option value={item.major} key={item.major}>
                {item.major}
              </option>
            ))}
          </select>
        </label>

        <label>
          Chương trình
          <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
            <option value={PROGRAM_ALL}>Tất cả</option>
            <option value={PROGRAM_DEFAULT}>Mặc định (không mã)</option>
            {programOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>

        {facultyDisplay && (
          <label>
            Khoa phụ trách
            <input value={facultyDisplay} readOnly title={facultyDisplay} />
          </label>
        )}
      </div>

      {loading && <div className="curriculum-empty">Đang tải dữ liệu...</div>}

      {!loading && semesters.length === 0 && (
        <div className="curriculum-empty">
          Hiện chưa có dữ liệu cho ngành được chọn. Thử chọn chương trình khác hoặc liên hệ quản trị viên.
        </div>
      )}

      <div className="curriculum-list">
        {semesters.map((semester) => (
          <section className="semester-card" key={`${semester.major}-${semester.semester}-${semester.programCode || "default"}`}>
            <div className="semester-meta" style={{ justifyContent: "space-between" }}>
              <div>
                <h3>{semester.semester}</h3>
                {semester.notes && <p style={{ margin: "4px 0", color: "#475467" }}>{semester.notes}</p>}
              </div>
              <div className="semester-meta">
                <span>{semester.major}</span>
                {semester.programCode && <span>Mã CT: {semester.programCode}</span>}
                {semester.faculty && <span>{semester.faculty}</span>}
              </div>
            </div>

            <table className="curriculum-table">
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên môn học</th>
                  <th>Tín chỉ</th>
                  <th>Loại</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {semester.subjects.map((subject, idx) => (
                  <tr key={`${subject.code}-${idx}`}>
                    <td>{subject.code}</td>
                    <td>{subject.name}</td>
                    <td>{subject.credits ?? "-"}</td>
                    <td>{subject.type || "-"}</td>
                    <td>{subject.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
