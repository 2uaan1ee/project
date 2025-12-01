import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/subject-open.css";

const createEmptyRow = () => ({
  subject_id: "",
  subject_name: "",
  time: "",
});

const getDefaultForm = () => ({
  academic_year: "",
  semester: "1", // "1" | "2" | "summer"
  subject_rows: [createEmptyRow()],
});

const SUBJECT_PLACEHOLDER = "VD: ACCT1000";
const SUBJECT_NAME_PLACEHOLDER = "VD: Kinh tế vĩ mô";
const MAX_SUGGESTIONS = 5;

const splitToArray = (value = "") =>
  value
    .split(/[,;\n]/)
    .map((v) => v.trim())
    .filter(Boolean);

export default function SubjectOpen() {
  const navigate = useNavigate();
  const [form, setForm] = useState(getDefaultForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState(null);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSubjects = async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const res = await fetch("/api/subjects");
        if (!res.ok) {
          throw new Error("Không thể tải danh sách môn học.");
        }
        const data = await res.json();
        if (isMounted) {
          setSubjectOptions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setOptionsError(err?.message || "Không thể tải danh sách môn học.");
        }
      } finally {
        if (isMounted) {
          setOptionsLoading(false);
        }
      }
    };

    fetchSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm(getDefaultForm());
    setMessage(null);
    setActiveSuggestion(null);
  };

  const handleRowChange = (index, field, value) => {
    setForm((prev) => {
      const nextRows = [...prev.subject_rows];
      nextRows[index] = { ...nextRows[index], [field]: value };
      return { ...prev, subject_rows: nextRows };
    });
  };

  const addSubjectRow = () => {
    setForm((prev) => ({
      ...prev,
      subject_rows: [...prev.subject_rows, createEmptyRow()],
    }));
  };

  const removeSubjectRow = (index) => {
    setForm((prev) => {
      const nextRows = prev.subject_rows.filter((_, idx) => idx !== index);
      return {
        ...prev,
        subject_rows:
          nextRows.length > 0 ? nextRows : [createEmptyRow()],
      };
    });
    setActiveSuggestion(null);
  };

  const handleSuggestionSelect = (rowIndex, suggestion) => {
    setForm((prev) => {
      const nextRows = [...prev.subject_rows];
      nextRows[rowIndex] = {
        ...nextRows[rowIndex],
        subject_id: suggestion.subject_id || "",
        subject_name: suggestion.subject_name || "",
      };
      return { ...prev, subject_rows: nextRows };
    });
    setActiveSuggestion(null);
  };

  const buildSuggestions = (row, field = "subject_id") => {
    const querySource =
      field === "subject_name" ? row.subject_name : row.subject_id;
    const query = (querySource || "").trim().toLowerCase();
    if (query.length < 2) {
      return [];
    }

    return subjectOptions
      .filter((subject) => {
        const id = (subject.subject_id || "").toLowerCase();
        const name = (subject.subject_name || "").toLowerCase();
        if (field === "subject_name") {
          return name.includes(query);
        }
        return id.includes(query);
      })
      .slice(0, MAX_SUGGESTIONS);
  };

  const handleInputBlur = (index, field) => {
    setTimeout(() => {
      setActiveSuggestion((current) =>
        current && current.row === index && current.field === field
          ? null
          : current
      );
    }, 120);
  };

  const subjectCount = useMemo(
    () => form.subject_rows.filter((row) => row.subject_id.trim()).length,
    [form.subject_rows]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const subjects = splitToArray(
      form.subject_rows.map((row) => row.subject_id).join(",")
    );

    if (!form.academic_year || !form.semester || subjects.length === 0) {
      setLoading(false);
      setMessage({
        type: "error",
        text: "Vui lòng nhập năm học, học kỳ và ít nhất 1 mã môn học.",
      });
      return;
    }

    try {
      const payload = {
        year: form.academic_year,
        semester: form.semester,
        subject_ids: subjects,
      };

      // Backend is expected to handle this endpoint to actually
      // open the given subjects for registration.
      const res = await fetch("/api/subjects/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Mở đăng ký môn học thất bại.");
      }

      setMessage({
        type: "success",
        text: "Đã gửi yêu cầu mở đăng ký cho các môn đã chọn.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.message || "Đã xảy ra lỗi khi mở đăng ký.",
      });
    } finally {
      setLoading(false);
    }
  };

  const semesterLabel =
    form.semester === "1"
      ? "Học kỳ 1"
      : form.semester === "2"
      ? "Học kỳ 2"
      : "Học kỳ hè";

  return (
    <div className="subject-open-page add-subject-page">
      <section className="subject-open-content add-subject-content">
        <header className="subject-open-header">
          <div>
            <div className="subject-back-toolbar">
              <button
                className="subject-back"
                type="button"
                onClick={() => navigate("/app/dashboard")}
              >
                &larr; Quay về Trang chủ
              </button>
            </div>
            <p className="breadcrumb">MỞ LỚP TRỰC TUYẾN</p>
            <h2>Mở đăng ký môn học</h2>
          </div>
          <div className="header-actions"></div>
        </header>

        <div className="subject-toolbar">
          <div className="toolbar-fields">
            <div className="field-group">
              <label>Năm học *</label>
              <div className="combo">
                <input
                  name="academic_year"
                  value={form.academic_year}
                  onChange={handleChange}
                  placeholder="VD: 2024-2025"
                  required
                />
              </div>
            </div>
            <div className="field-group stacked semester-field">
              <label>Học kỳ *</label>
              <select
                name="semester"
                value={form.semester}
                onChange={handleChange}
              >
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
                <option value="summer">Học kỳ hè</option>
              </select>
            </div>
          </div>
          <div className="toolbar-actions">
            <span className="pill primary">
              Số môn đã chọn: <strong>{subjectCount}</strong>
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`banner ${
              message.type === "success" ? "success" : "error"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="subject-grid-card subject-form-card">
          <form onSubmit={handleSubmit}>
            <div className="subject-rows">
              {form.subject_rows.map((row, index) => {
                const isRowActive = activeSuggestion?.row === index;
                const showIdSuggestions =
                  isRowActive && activeSuggestion?.field === "subject_id";
                const showNameSuggestions =
                  isRowActive && activeSuggestion?.field === "subject_name";
                const idSuggestions = showIdSuggestions
                  ? buildSuggestions(row, "subject_id")
                  : [];
                const nameSuggestions = showNameSuggestions
                  ? buildSuggestions(row, "subject_name")
                  : [];
                return (
                  <div className="subject-row" key={`subject-row-${index}`}>
                    <button
                      type="button"
                      className="remove-row-button"
                      onClick={() => removeSubjectRow(index)}
                      aria-label={`Xóa môn học ${index + 1}`}
                    >
                      ×
                    </button>
                    <div className="field-group stacked subject-field">
                      <label>Mã môn học *</label>
                      <input
                        value={row.subject_id}
                        onChange={(event) =>
                          handleRowChange(index, "subject_id", event.target.value)
                        }
                        onFocus={() =>
                          setActiveSuggestion({ row: index, field: "subject_id" })
                        }
                        onBlur={() => handleInputBlur(index, "subject_id")}
                        placeholder={SUBJECT_PLACEHOLDER}
                      />
                      {idSuggestions.length > 0 && (
                        <ul className="subject-suggestions">
                          {idSuggestions.map((suggestion) => (
                            <li
                              key={
                                suggestion._id || suggestion.subject_id || index
                              }
                              className="subject-suggestion"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleSuggestionSelect(index, suggestion);
                              }}
                            >
                              <span className="suggestion-code">
                                {suggestion.subject_id}
                              </span>
                              <span className="suggestion-name">
                                {suggestion.subject_name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="field-group stacked subject-field">
                      <label>Tên môn học</label>
                      <input
                        value={row.subject_name}
                        onChange={(event) =>
                          handleRowChange(index, "subject_name", event.target.value)
                        }
                        onFocus={() =>
                          setActiveSuggestion({ row: index, field: "subject_name" })
                        }
                        onBlur={() => handleInputBlur(index, "subject_name")}
                        placeholder={SUBJECT_NAME_PLACEHOLDER}
                      />
                      {nameSuggestions.length > 0 && (
                        <ul className="subject-suggestions">
                          {nameSuggestions.map((suggestion) => (
                            <li
                              key={
                                suggestion._id || suggestion.subject_id || index
                              }
                              className="subject-suggestion"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleSuggestionSelect(index, suggestion);
                              }}
                            >
                              <span className="suggestion-code">
                                {suggestion.subject_id}
                              </span>
                              <span className="suggestion-name">
                                {suggestion.subject_name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="add-row-wrapper">
                <button
                  type="button"
                  className="add-row-button"
                  onClick={addSubjectRow}
                >
                  <span aria-hidden className="plus-symbol">
                    +
                  </span>
                  Thêm môn học
                </button>
              </div>
              {optionsLoading && (
                <p className="subject-hint">Đang tải danh sách môn học...</p>
              )}
              {optionsError && (
                <p className="subject-hint error">{optionsError}</p>
              )}
            </div>

            <footer className="subject-form-actions">
              <div className="action-buttons">
                <button className="ghost" type="button" onClick={handleReset}>
                  Đặt lại
                </button>
                <button className="ghost" type="submit" disabled={loading}>
                  {loading ? "Đang gửi..." : "Mở đăng ký"}
                </button>
              </div>
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}
