import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/curriculum.css";
import { authFetch } from "../lib/auth.js";

const NEW_SUBJECT = { code: "", note: "" };
const PROGRAM_ALL = "__all__";
const PROGRAM_DEFAULT = "__default__";

export default function CurriculumAdmin() {
  const navigate = useNavigate();
  const [majors, setMajors] = useState([]);
  const [editingTarget, setEditingTarget] = useState(null);
  const [manualForm, setManualForm] = useState({
    major: "",
    faculty: "",
    programCode: "",
    semester: "",
    notes: "",
    subjects: [{ ...NEW_SUBJECT }],
  });
  const [lookupState, setLookupState] = useState({ map: {}, missing: [] });
  const [manualStatus, setManualStatus] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  const [uploadForm, setUploadForm] = useState({ major: "", faculty: "", file: null });
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(() => Date.now());

  const [listFilter, setListFilter] = useState({ major: "", programCode: PROGRAM_ALL });
  const [semesters, setSemesters] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMajors() {
      try {
        const res = await authFetch("/api/curricula/majors");
        if (!res.ok) throw new Error("Không thể tải danh sách ngành");
        const data = await res.json();
        if (!cancelled) {
          setMajors(data);
        }
      } catch (err) {
        console.warn("fetchMajors", err);
      }
    }
    fetchMajors();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!majors.length) return;
    setListFilter((prev) => (prev.major ? prev : { ...prev, major: majors[0].major }));
  }, [majors]);

  useEffect(() => {
    setListFilter((prev) =>
      prev.programCode === PROGRAM_ALL ? prev : { ...prev, programCode: PROGRAM_ALL }
    );
  }, [listFilter.major]);

  useEffect(() => {
    const codes = manualForm.subjects
      .map((subject) => subject.code.trim().toUpperCase())
      .filter(Boolean);
    if (!codes.length) {
      setLookupState({ map: {}, missing: [] });
      return;
    }
    const uniqueCodes = Array.from(new Set(codes));
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ codes: uniqueCodes.join(",") });
        const res = await authFetch(`/api/curricula/subjects/lookup?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Không thể tra cứu mã môn");
        const map = {};
        (payload.subjects || []).forEach((subject) => {
          map[subject.code.toUpperCase()] = subject;
        });
        setLookupState({
          map,
          missing: (payload.missing || []).map((code) => code.toUpperCase()),
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setLookupState({ map: {}, missing: uniqueCodes });
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [manualForm.subjects]);

  const programCodeOptions = useMemo(() => {
    const codes = majors.flatMap((item) => item.programCodes || []);
    return Array.from(new Set(codes.filter(Boolean)));
  }, [majors]);

  const currentMajorInfo = useMemo(
    () => majors.find((item) => item.major === listFilter.major),
    [majors, listFilter.major]
  );

  const handleManualField = (field, value) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSubject = (index, field, value) => {
    setManualForm((prev) => {
      const subjects = [...prev.subjects];
      subjects[index] = { ...subjects[index], [field]: value };
      return { ...prev, subjects };
    });
  };

  const addSubjectRow = () => {
    setManualForm((prev) => ({ ...prev, subjects: [...prev.subjects, { ...NEW_SUBJECT }] }));
  };

  const removeSubjectRow = (index) => {
    setManualForm((prev) => {
      if (prev.subjects.length === 1) return prev;
      return {
        ...prev,
        subjects: prev.subjects.filter((_, idx) => idx !== index),
      };
    });
  };

  const readResponseBody = async (response) => {
    try {
      const cloned = response.clone();
      return await cloned.json();
    } catch {
      try {
        const text = await response.text();
        return text ? { message: text } : {};
      } catch {
        return {};
      }
    }
  };

  const runManualValidation = async (payload) => {
    const res = await authFetch("/api/curricula/manual/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readResponseBody(res);
    if (!res.ok) throw new Error(data?.message || "Không thể kiểm tra học kỳ");
    return data;
  };

  const hydrateFormFromSemester = (semester) => ({
    major: semester.major,
    faculty: semester.faculty || "",
    programCode: semester.programCode || "",
    semester: semester.semester,
    notes: semester.notes || "",
    subjects:
      semester.subjects && semester.subjects.length
        ? semester.subjects.map((subject) => ({ code: subject.code || "", note: subject.note || "" }))
        : [{ ...NEW_SUBJECT }],
  });

  const resetManualForm = useCallback(() => {
    setManualForm({
      major: "",
      faculty: "",
      programCode: "",
      semester: "",
      notes: "",
      subjects: [{ ...NEW_SUBJECT }],
    });
    setEditingTarget(null);
  }, []);

  const fetchSemesters = useCallback(
    async (overrideFilter) => {
      const target = overrideFilter || listFilter;
      if (!target.major) {
        setSemesters([]);
        return;
      }
      setListLoading(true);
      setListError("");
      try {
        const params = new URLSearchParams({ major: target.major });
        if (target.programCode === PROGRAM_DEFAULT) {
          params.append("programCode", "null");
        } else if (target.programCode !== PROGRAM_ALL && target.programCode) {
          params.append("programCode", target.programCode);
        }
        const res = await authFetch(`/api/curricula?${params.toString()}`);
        const data = await readResponseBody(res);
        if (!res.ok) throw new Error(data?.message || "Không thể tải chương trình");
        setSemesters(data);
      } catch (err) {
        setListError(err.message || "Không thể tải chương trình");
        setSemesters([]);
      } finally {
        setListLoading(false);
      }
    },
    [listFilter]
  );

  useEffect(() => {
    if (!listFilter.major) return;
    fetchSemesters(listFilter);
  }, [listFilter, fetchSemesters]);

  const handleManualSubmit = async (evt) => {
    evt.preventDefault();
    if (!editingTarget?._id) {
      setManualStatus({ type: "error", message: "Chọn học kỳ trong bảng để chỉnh sửa" });
      return;
    }
    setManualStatus(null);
    const payload = {
      major: manualForm.major.trim(),
      faculty: manualForm.faculty.trim(),
      programCode: manualForm.programCode.trim().toUpperCase() || null,
      semester: manualForm.semester.trim(),
      notes: manualForm.notes.trim(),
      subjects: manualForm.subjects
        .map((subject) => ({
          code: subject.code.trim().toUpperCase(),
          note: subject.note.trim(),
        }))
        .filter((subject) => subject.code),
    };

    if (!payload.major || !payload.semester) {
      setManualStatus({ type: "error", message: "Vui lòng nhập ngành và học kỳ" });
      return;
    }
    if (!payload.subjects.length) {
      setManualStatus({ type: "error", message: "Cần ít nhất 1 mã môn học" });
      return;
    }

    try {
      setManualLoading(true);
      const validationPayload = {
        major: payload.major,
        programCode: payload.programCode,
        semester: payload.semester,
        subjects: payload.subjects.map((subject) => subject.code),
        ignoreId: editingTarget._id,
      };
      const validation = await runManualValidation(validationPayload);
      if (validation.repeatedSubjects?.length) {
        setManualStatus({
          type: "error",
          message: `Mã môn bị nhập trùng: ${validation.repeatedSubjects.join(", ")}`,
        });
        return;
      }
      if (validation.semesterExists) {
        setManualStatus({ type: "error", message: `Học kỳ ${payload.semester} đã tồn tại cho ngành/chương trình này` });
        return;
      }
      if (validation.duplicateSubjects?.length) {
        const detail = validation.duplicateSubjects
          .map((item) => `${item.code} (${item.semesters.join(", ")})`)
          .join(", ");
        setManualStatus({ type: "error", message: `Các môn đã có ở học kỳ khác: ${detail}` });
        return;
      }

      const res = await authFetch(`/api/curricula/${editingTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readResponseBody(res);
      if (!res.ok) throw new Error(data?.message || "Không thể lưu dữ liệu");

      setManualStatus({
        type: "success",
        message: `Đã cập nhật ${data.semester || payload.semester}`,
      });

      await fetchSemesters(listFilter);

      if (data?._id) {
        setEditingTarget(data);
        setManualForm(hydrateFormFromSemester(data));
      }
    } catch (err) {
      setManualStatus({ type: "error", message: err.message || "Không thể lưu dữ liệu" });
    } finally {
      setManualLoading(false);
    }
  };

  const startEditSemester = (semester) => {
    setEditingTarget(semester);
    setManualForm(hydrateFormFromSemester(semester));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteSemester = async (semester) => {
    const confirmed = window.confirm(`Xóa ${semester.semester}?`);
    if (!confirmed) return;
    setDeleteBusy(semester._id);
    try {
      const res = await authFetch(`/api/curricula/${semester._id}`, { method: "DELETE" });
      const data = await readResponseBody(res);
      if (!res.ok) throw new Error(data?.message || "Không thể xóa học kỳ");
      setManualStatus({ type: "success", message: data?.message || "Đã xóa học kỳ" });
      if (editingTarget?._id === semester._id) {
        resetManualForm();
      }
      await fetchSemesters(listFilter);
    } catch (err) {
      setManualStatus({ type: "error", message: err.message || "Không thể xóa học kỳ" });
    } finally {
      setDeleteBusy(null);
    }
  };

  const detectDefaultsFromFile = async (file) => {
    if (!file) {
      setUploadForm((prev) => ({ ...prev, file: null, major: "", faculty: "" }));
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || !parsed.length) {
        setUploadForm((prev) => ({ ...prev, file, major: "", faculty: "" }));
        return;
      }
      const tally = (key) => {
        const map = new Map();
        parsed.forEach((item) => {
          const value = String(item?.[key] || "").trim();
          if (!value) return;
          map.set(value, (map.get(value) || 0) + 1);
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      };
      const major = tally("major");
      const faculty = tally("faculty");
      setUploadForm((prev) => ({ ...prev, file, major, faculty }));
    } catch (err) {
      console.warn("detectDefaultsFromFile", err);
      setUploadForm((prev) => ({ ...prev, file }));
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    await detectDefaultsFromFile(file);
  };

  const handleUploadSubmit = async (evt) => {
    evt.preventDefault();
    setUploadStatus(null);
    if (!uploadForm.file) {
      setUploadStatus({ type: "error", message: "Vui lòng chọn file JSON" });
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      if (uploadForm.major.trim()) formData.append("major", uploadForm.major.trim());
      if (uploadForm.faculty.trim()) formData.append("faculty", uploadForm.faculty.trim());
      const res = await authFetch("/api/curricula/upload", {
        method: "POST",
        body: formData,
      });
      const data = await readResponseBody(res);
      if (!res.ok) throw new Error(data?.message || "Upload thất bại");
      const successMessage = typeof data?.message === "string" && data.message.trim()
        ? data.message
        : "Đã cập nhật chương trình";
      setUploadStatus({ type: "success", message: successMessage });
      setFileInputKey(Date.now());
      setUploadForm({ major: "", faculty: "", file: null });
      await fetchSemesters(listFilter);
    } catch (err) {
      setUploadStatus({ type: "error", message: err.message || "Upload thất bại" });
    } finally {
      setUploading(false);
    }
  };

  const resolvedSubjects = manualForm.subjects.map((subject) => {
    const code = subject.code.trim().toUpperCase();
    const info = lookupState.map[code];
    const missing = lookupState.missing.includes(code);
    return { ...subject, resolved: info, missing };
  });

  return (
    <div className="curriculum-page">
      <div className="curriculum-header">
        <div className="curriculum-header-top">
          <h1>Quản lý chương trình đào tạo</h1>
          <button type="button" className="curriculum-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>
        <p>Chọn học kỳ đang có để chỉnh sửa chi tiết hoặc import file JSON để cập nhật hàng loạt.</p>
      </div>

      <div className="curriculum-admin">
        <section className="curriculum-card full-width">
          <h2>Chỉnh sửa học kỳ</h2>
          {!editingTarget && (
            <div className="curriculum-empty" style={{ textAlign: "left" }}>
              Chọn một học kỳ trong danh sách bên dưới để chỉnh sửa.
            </div>
          )}
          {editingTarget && (
            <>
              <div className="edit-banner">
                <span>
                  Đang chỉnh sửa {editingTarget.semester} • {editingTarget.major}
                  {editingTarget.programCode ? ` • ${editingTarget.programCode}` : ""}
                </span>
                <button type="button" className="ghost" onClick={resetManualForm}>
                  Hủy lựa chọn
                </button>
              </div>
              <form onSubmit={handleManualSubmit} className="curriculum-controls" style={{ flexDirection: "column", gap: 12 }}>
                <input
                  list="majorOptions"
                  placeholder="Ngành học"
                  value={manualForm.major}
                  onChange={(e) => handleManualField("major", e.target.value)}
                  required
                />
                <input
                  list="facultyOptions"
                  placeholder="Khoa phụ trách"
                  value={manualForm.faculty}
                  onChange={(e) => handleManualField("faculty", e.target.value)}
                />
                <input
                  list="programCodes"
                  placeholder="Mã chương trình (optional)"
                  value={manualForm.programCode}
                  onChange={(e) => handleManualField("programCode", e.target.value)}
                />
                <input
                  placeholder="Tên học kỳ"
                  value={manualForm.semester}
                  onChange={(e) => handleManualField("semester", e.target.value)}
                  required
                />
                <textarea
                  placeholder="Ghi chú chung"
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => handleManualField("notes", e.target.value)}
                />

                <div className="subject-rows">
                  {resolvedSubjects.map((subject, index) => (
                    <div className={`subject-row ${subject.missing ? "subject-row--error" : ""}`} key={`subject-${index}`}>
                      <input
                        placeholder="Mã môn"
                        value={subject.code}
                        onChange={(e) => updateSubject(index, "code", e.target.value)}
                      />
                      <div className={`subject-info ${subject.missing ? "subject-info--missing" : ""}`}>
                        {subject.resolved
                          ? (
                            <>
                              <strong>{subject.resolved.name}</strong>
                              <span>{` (${subject.resolved.credits || "-"} tín)`}</span>
                            </>
                          )
                          : subject.missing
                          ? "Không tồn tại"
                          : "Nhập mã để tra cứu"}
                      </div>
                      <input
                        placeholder="Ghi chú"
                        value={subject.note}
                        onChange={(e) => updateSubject(index, "note", e.target.value)}
                      />
                      <button type="button" className="ghost" onClick={() => removeSubjectRow(index)} title="Xóa dòng">
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ghost subject-add-button" onClick={addSubjectRow}>
                    + Thêm mã môn
                  </button>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="submit" className="primary" disabled={manualLoading}>
                    {manualLoading ? "Đang lưu..." : "Cập nhật học kỳ"}
                  </button>
                  <button type="button" className="ghost" onClick={resetManualForm}>
                    Hủy chỉnh sửa
                  </button>
                </div>
              </form>
            </>
          )}
          {manualStatus && <div className={`status-banner ${manualStatus.type}`}>{manualStatus.message}</div>}
          <datalist id="majorOptions">
            {majors.map((item) => (
              <option key={item.major} value={item.major} />
            ))}
          </datalist>
          <datalist id="facultyOptions">
            {majors.flatMap((item) =>
              (item.faculties || []).map((fac) => (
                <option key={`${item.major}-${fac}`} value={fac} />
              ))
            )}
          </datalist>
          <datalist id="programCodes">
            {programCodeOptions.map((code) => (
              <option key={code} value={code} />
            ))}
          </datalist>
        </section>

        <section className="curriculum-card full-width">
          <h2>Import từ file JSON</h2>
          <form onSubmit={handleUploadSubmit}>
            <div className="upload-field">
              <label>Mẫu JSON theo chuẩn hệ thống</label>
              <input
                key={fileInputKey}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="upload-field">
              <label>Ngành học mặc định (optional)</label>
              <input
                value={uploadForm.major}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, major: e.target.value }))}
                placeholder="VD: Công nghệ thông tin"
              />
            </div>
            <div className="upload-field">
              <label>Khoa phụ trách (optional)</label>
              <input
                value={uploadForm.faculty}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, faculty: e.target.value }))}
                placeholder="VD: Khoa Khoa học & Kỹ thuật Thông tin"
              />
            </div>
            <button type="submit" className="primary" disabled={uploading}>
              {uploading ? "Đang upload..." : "Upload JSON"}
            </button>
          </form>
          {uploadStatus && <div className={`status-banner ${uploadStatus.type}`}>{uploadStatus.message}</div>}
        </section>

        <section className="curriculum-card full-width">
          <h2>Học kỳ đã tạo</h2>
          <div className="admin-list-header">
            <label>
              Ngành
              <select value={listFilter.major} onChange={(e) => setListFilter((prev) => ({ ...prev, major: e.target.value }))}>
                {!majors.length && <option value="">Chưa có dữ liệu</option>}
                {majors.map((item) => (
                  <option key={item.major} value={item.major}>
                    {item.major}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chương trình
              <select
                value={listFilter.programCode}
                onChange={(e) => setListFilter((prev) => ({ ...prev, programCode: e.target.value }))}
              >
                <option value={PROGRAM_ALL}>Tất cả</option>
                <option value={PROGRAM_DEFAULT}>Mặc định (không mã)</option>
                {(currentMajorInfo?.programCodes || []).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {listError && <div className="status-banner error">{listError}</div>}
          {listLoading ? (
            <div className="curriculum-empty">Đang tải danh sách...</div>
          ) : semesters.length === 0 ? (
            <div className="curriculum-empty">Chưa có học kỳ cho bộ lọc hiện tại.</div>
          ) : (
            <div className="curriculum-table-wrapper">
              <table className="curriculum-table">
                <thead>
                  <tr>
                    <th>Học kỳ</th>
                    <th>Chương trình</th>
                    <th>Khoa</th>
                    <th>Số môn</th>
                    <th>Cập nhật</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map((item) => {
                    const lastUpdated = item.updatedAt || item.createdAt;
                    return (
                      <tr key={item._id}>
                        <td>{item.semester}</td>
                        <td>{item.programCode || "Mặc định"}</td>
                        <td>{item.faculty || "-"}</td>
                        <td>{item.subjects?.length || 0}</td>
                        <td>{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "-"}</td>
                      <td>
                        <div className="admin-actions">
                          <button type="button" className="ghost" onClick={() => startEditSemester(item)}>
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteSemester(item)}
                            disabled={deleteBusy === item._id}
                          >
                            {deleteBusy === item._id ? "Đang xóa..." : "Xóa"}
                          </button>
                        </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
