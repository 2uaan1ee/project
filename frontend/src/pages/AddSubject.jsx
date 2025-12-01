import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/add-subject.css";

const DEFAULT_FORM = {
  subject_id: "",
  subject_name: "",
  subjectEL_name: "",
  faculty_id: "",
  subject_type: "LT",
  old_id: "",
  equivalent_id: "",
  prerequisite_id: "",
  previous_id: "",
  theory_credits: "",
  practice_credits: "",
  status: "open",
  upsert: false,
};

const listPlaceholder = "VD: ACCT1000, ACCT2000";

const splitToArray = (value = "") =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export default function AddSubject() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setMessage(null);
  };

  const creditSummary = useMemo(
    () =>
      (Number(form.theory_credits) || 0) +
      (Number(form.practice_credits) || 0),
    [form.practice_credits, form.theory_credits]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        subject_id: form.subject_id,
        subject_name: form.subject_name || undefined,
        subjectEL_name: form.subjectEL_name || undefined,
        faculty_id: form.faculty_id || undefined,
        subject_type: form.subject_type,
        old_id: splitToArray(form.old_id),
        equivalent_id: splitToArray(form.equivalent_id),
        prerequisite_id: splitToArray(form.prerequisite_id),
        previous_id: splitToArray(form.previous_id),
        theory_credits: form.theory_credits
          ? Number(form.theory_credits)
          : undefined,
        practice_credits: form.practice_credits
          ? Number(form.practice_credits)
          : undefined,
        status: form.status,
        upsert: form.upsert,
      };

      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Lưu môn học thất bại");
      }

      setMessage({ type: "success", text: "Lưu môn học thành công." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.message || "Đã xảy ra lỗi khi lưu môn học.",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <p className="breadcrumb">Môn học</p>
            <h2>Thêm hoặc cập nhật môn học</h2>
          </div>
          <div className="header-actions"></div>
        </header>

        <div className="subject-toolbar">
          <div className="field-group">
            <label>Mã môn học *</label>
            <div className="combo">
              <input
                name="subject_id"
                value={form.subject_id}
                onChange={handleChange}
                placeholder="VD: ACCT3000"
                required
              />
            </div>
          </div>
          <div className="toolbar-actions">
            <span className="pill soft">
              Tổng số tín chỉ: {creditSummary || 0}
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
            <div className="form-grid">
              <div className="field-group stacked">
                <label>Tên môn học</label>
                <input
                  name="subject_name"
                  value={form.subject_name}
                  onChange={handleChange}
                  placeholder="Nhập tên môn học"
                />
              </div>

              <div className="field-group stacked">
                <label>Tên môn học (Tiếng Anh)</label>
                <input
                  name="subjectEL_name"
                  value={form.subjectEL_name}
                  onChange={handleChange}
                  placeholder="Nhập tên tiếng Anh"
                />
              </div>

              <div className="field-group stacked">
                <label>Khoa</label>
                <input
                  name="faculty_id"
                  placeholder="VD: KHOA_HTTT"
                  value={form.faculty_id}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group stacked">
                <label>Loại môn học</label>
                <select
                  name="subject_type"
                  value={form.subject_type}
                  onChange={handleChange}
                >
                  <option value="LT">LT (Lý thuyết)</option>
                  <option value="TH">TH (Thực hành)</option>
                </select>
              </div>

              <div className="field-group stacked">
                <label>Mã môn cũ</label>
                <input
                  name="old_id"
                  placeholder={listPlaceholder}
                  value={form.old_id}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group stacked">
                <label>Mã môn tương đương</label>
                <input
                  name="equivalent_id"
                  placeholder={listPlaceholder}
                  value={form.equivalent_id}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group stacked">
                <label>Mã môn tiên quyết</label>
                <input
                  name="prerequisite_id"
                  placeholder={listPlaceholder}
                  value={form.prerequisite_id}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group stacked">
                <label>Mã môn học trước</label>
                <input
                  name="previous_id"
                  placeholder={listPlaceholder}
                  value={form.previous_id}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group stacked">
                <label>Số tín chỉ lý thuyết</label>
                <input
                  type="number"
                  name="theory_credits"
                  min={0}
                  value={form.theory_credits}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group stacked">
                <label>Số tín chỉ thực hành</label>
                <input
                  type="number"
                  name="practice_credits"
                  min={0}
                  value={form.practice_credits}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group stacked checkbox-line">
                <label>
                  <input
                    type="checkbox"
                    name="upsert"
                    checked={form.upsert}
                    onChange={handleCheckboxChange}
                  />{" "}
                  Tự động cập nhật nếu môn đã tồn tại
                </label>
              </div>
            </div>

            <footer className="subject-form-actions">
              <div className="action-buttons">
                <button className="ghost" type="button" onClick={handleReset}>
                  Đặt lại
                </button>
                <button className="ghost" type="submit" disabled={loading}>
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}
