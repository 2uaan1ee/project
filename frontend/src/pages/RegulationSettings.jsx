import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/regulations.css";
import { authFetch } from "../lib/auth";

const navSections = [
  { title: "Sinh viên", subtitle: "", count: 1 },
  { title: "Môn học", subtitle: "", count: 2 },
  { title: "Đăng ký học phần", subtitle: "", count: 2 },
  { title: "Học phí", subtitle: "", count: 1 },
];

const templateQuickRules = [
  { label: "Điểm chuyên cần tối thiểu", value: ">= 75%" },
  { label: "Thời gian nộp bài muộn", value: "Tối đa 48h, trừ 20%" },
  { label: "Số lần phúc khảo", value: "Tối đa 2 lần/học phần" },
  { label: "Định dạng file", value: "PDF, DOCX, tối đa 10MB" },
];

const templateReminders = [
  "Xác nhận thời gian áp dụng cho khóa 2023 trở đi.",
  "Kiểm tra ảnh hưởng đến các môn tiên quyết hiện hành.",
  "Thêm hướng dẫn chi tiết cho sinh viên học lại.",
  "Đính kèm biểu mẫu phúc khảo mới nhất.",
];

function TemplateAcademicContent({ canEdit }) {
  return (
    <>
      <div className="editor-head">
        <div>
          <p className="eyebrow">Học vụ & thi cử</p>
          <h3>Thiết lập điểm quá trình và kỳ thi</h3>
          <p className="muted">
            Điều chỉnh tỷ lệ điểm, điều kiện dự thi và hướng dẫn phúc khảo. Khi hoàn thiện, hệ thống sẽ đẩy thông báo cho sinh viên, giảng viên và cố vấn học tập.
          </p>
        </div>
      </div>

      <div className="field-grid">
        <label className="input-block">
          <span>Trọng số điểm quá trình</span>
          <input type="text" defaultValue="40%" placeholder="Nhập tỷ lệ %" disabled={!canEdit} />
        </label>
        <label className="input-block">
          <span>Trọng số điểm cuối kỳ</span>
          <input type="text" defaultValue="60%" placeholder="Nhập tỷ lệ %" disabled={!canEdit} />
        </label>
        <label className="input-block">
          <span>Số lần kiểm tra tối thiểu</span>
          <input type="number" defaultValue={3} min={0} disabled={!canEdit} />
        </label>
        <label className="input-block">
          <span>Điều kiện dự thi</span>
          <input type="text" defaultValue="Điểm quá trình >= 4.0" placeholder="Mô tả điều kiện" disabled={!canEdit} />
        </label>
      </div>

      <div className="input-row">
        <label className="input-block full">
          <span>Hướng dẫn phúc khảo</span>
          <textarea
            rows={3}
            defaultValue="Sinh viên nộp đơn trong 03 ngày sau khi công bố điểm. Mỗi học phần tối đa 2 lần phúc khảo và kết quả phúc khảo là kết quả cuối cùng."
            disabled={!canEdit}
          />
        </label>
      </div>

      <div className="field-grid two">
        <div className="input-block">
          <span>Thời hạn mở phúc khảo</span>
          <div className="inline-inputs">
            <input type="date" disabled={!canEdit} />
            <input type="date" disabled={!canEdit} />
          </div>
          <small>Chọn ngày bắt đầu và kết thúc dự kiến.</small>
        </div>

        <div className="input-block">
          <span>Hình thức thông báo</span>
          <div className="stacked-options">
            <label className="option-row">
              <input type="checkbox" defaultChecked disabled={!canEdit} />
              <span>Gửi email cho toàn bộ sinh viên thuộc học phần</span>
            </label>
            <label className="option-row">
              <input type="checkbox" defaultChecked disabled={!canEdit} />
              <span>Hiển thị banner trong cổng thông tin sinh viên</span>
            </label>
            <label className="option-row">
              <input type="checkbox" disabled={!canEdit} />
              <span>Thông báo cho giảng viên phụ trách</span>
            </label>
            <label className="option-row">
              <input type="checkbox" disabled={!canEdit} />
              <span>Gửi bản cứng tới phòng Công tác sinh viên</span>
            </label>
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="guideline-grid">
        <div className="guideline-block">
          <div className="block-head">
            <div>
              <p className="eyebrow">Ràng buộc gợi ý</p>
              <h4>Thông số nhanh</h4>
            </div>
            <button type="button" className="link-btn" disabled={!canEdit}>Chỉnh sửa</button>
          </div>
          <div className="pill-grid">
            {templateQuickRules.map((rule) => (
              <div key={rule.label} className="pill large">
                <div className="pill-title">{rule.label}</div>
                <div className="pill-value">{rule.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="guideline-block">
          <div className="block-head">
            <div>
              <p className="eyebrow">Nhắc việc & ghi chú</p>
              <h4>Checklist trước khi gửi</h4>
            </div>
          </div>
          <ul className="reminder-list">
            {templateReminders.map((item) => (
              <li key={item}>
                <input type="checkbox" disabled={!canEdit} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn subtle" disabled={!canEdit}>Thêm ghi chú</button>
        </div>
      </div>
    </>
  );
}

function StudentAcademicContent({
  maxStudentMajors,
  onMaxStudentMajorsChange,
  settingsErrors,
  canEdit,
}) {
  return (
    <>
      <div className="editor-head">
        <div>
          <p className="eyebrow">Sinh viên</p>
          <h3>Quy định dành cho sinh viên</h3>
          <p className="muted">
            Khung quy định áp dụng trực tiếp cho sinh viên
          </p>
        </div>
      </div>

      <div className="field-grid">
        <label className="input-block">
          <span>Số ngành học tối đa</span>
          <input
            type="number"
            min={0}
            value={maxStudentMajors ?? 1}
            onChange={onMaxStudentMajorsChange}
            disabled={!canEdit}
          />
          {settingsErrors?.maxStudentMajors ? (
            <small style={{color: "red"}}>{settingsErrors.maxStudentMajors}</small>
          ) : null}
        </label>
      </div>

    
    </>
  );
}

function SubjectPolicyContent({
  creditCoefficientPractice,
  creditCoefficientTheory,
  onCreditCoefficientPracticeChange,
  onCreditCoefficientTheoryChange,
  settingsErrors,
  canEdit,
}) {
  return (
    <>
      <div className="editor-head">
        <div>
          <p className="eyebrow">Môn học</p>
          <h3>Quy định dành cho môn học</h3>
          <p className="muted">
            Khung quy định áp dụng trực tiếp cho môn học
          </p>
        </div>
      </div>

      <div className="field-grid">
        <label className="input-block">
          <span>Hệ số tín chỉ / tiết cho tín chỉ thực hành</span>
          <input
            type="number"
            min={1}
            value={creditCoefficientPractice ?? 1}
            onChange={onCreditCoefficientPracticeChange}
            disabled={!canEdit}
          />
          {settingsErrors?.creditCoefficientPractice ? (
            <small style={{color: "red"}}>{settingsErrors.creditCoefficientPractice}</small>
          ) : null}
        </label>
        <label className="input-block">
          <span>Hệ số tín chỉ / tiết cho tín chỉ lý thuyết</span>
          <input
            type="number"
            min={1}
            value={creditCoefficientTheory ?? 1}
            onChange={onCreditCoefficientTheoryChange}
            disabled={!canEdit}
          />
          {settingsErrors?.creditCoefficientTheory ? (
            <small style={{color: "red"}}>{settingsErrors.creditCoefficientTheory}</small>
          ) : null}
        </label>
      </div>
    </>
  );
}

function CourseRegistrationPolicyContent({
  practiceCreditCost,
  theoryCreditCost,
  onPracticeCreditCostChange,
  onTheoryCreditCostChange,
  settingsErrors,
  canEdit,
}) {
  return (
    <>
      <div className="editor-head">
        <div>
          <p className="eyebrow">Đăng ký học phần</p>
          <h3>Quy định dành cho đăng ký học phần</h3>
          <p className="muted">
            Khung quy định áp dụng trực tiếp cho đăng ký học phần
          </p>
        </div>
      </div>

      <div className="field-grid">
        {/* TODO: Thêm hàm validator ở backend khi tính học phí sau đăng ký học phần BM5*/}
        <label className="input-block">
          <span>Chi phí 1 tín chỉ lý thuyết</span>
          <input
            type="number"
            min={0}
            value={theoryCreditCost ?? 1}
            onChange={onTheoryCreditCostChange}
            disabled={!canEdit}
          />
          {settingsErrors?.theoryCreditCost ? (
            <small style={{color: "red"}}>{settingsErrors.theoryCreditCost}</small>
          ) : null}
        </label>
        <label className="input-block">
          <span>Chi phí 1 tín chỉ thực hành</span>
          <input
            type="number"
            min={0}
            value={practiceCreditCost ?? 1}
            onChange={onPracticeCreditCostChange}
            disabled={!canEdit}
          />
          {settingsErrors?.practiceCreditCost ? (
            <small style={{color: "red"}}>{settingsErrors.practiceCreditCost}</small>
          ) : null}
        </label>
      </div>
    </>
  );
}

function TuitionPolicyContent({
  allowPriorityDiscount,
  onAllowPriorityDiscountChange,
  canEdit,
}) {
  return (
    <>
      <div className="editor-head">
        <div>
          <p className="eyebrow">Học phí</p>
          <h3>Quy định liên quan học phí</h3>
          <p className="muted">
            Điều chỉnh chính sách ưu tiên và ghi nhận học phí
          </p>
        </div>
      </div>

      <div className="field-grid two">
        <div className="input-block">
          <span>Giảm học phí</span>
          <div className="stacked-options">
            <label className="option-row">
              {/* TODO: Kiểm tra BM6 để thêm ràng buộc cho phép giảm học phí */}
              <input
                type="checkbox"
                checked={allowPriorityDiscount}
                onChange={onAllowPriorityDiscountChange}
                disabled={!canEdit}
              />
              <span>Áp dụng cho sinh viên thuộc đối tượng ưu tiên</span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
function PlaceholderContent({ title }) {
  return (
    <div className="editor-head">
      <div>
        <p className="eyebrow">Đang cập nhật</p>
        <h3>{title}</h3>
        <p className="muted">
          Nội dung quy định cho mục này sẽ được bổ sung sau.
        </p>
      </div>
    </div>
  );
}

export default function RegulationSettings() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = React.useState(navSections[0].title);
  const [attachments, setAttachments] = React.useState([]);
  const [loadingAttachments, setLoadingAttachments] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [attachmentError, setAttachmentError] = React.useState("");
  const fileInputRef = React.useRef(null);
  const [maxStudentMajors, setMaxStudentMajors] = React.useState(1);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  const [settingsSaving, setSettingsSaving] = React.useState(false);
  const [settingsErrors, setSettingsErrors] = React.useState({});
  const [settingsError, setSettingsError] = React.useState("");
  const [settingsSuccess, setSettingsSuccess] = React.useState("");
  const [settingsUpdatedAt, setSettingsUpdatedAt] = React.useState(null);
  const [creditCoefficientPractice, setCreditCoefficientPractice] = React.useState(1);
  const [creditCoefficientTheory, setCreditCoefficientTheory] = React.useState(1);
  const [practiceCreditCost, setPracticeCreditCost] = React.useState(1);
  const [theoryCreditCost, setTheoryCreditCost] = React.useState(1);
  const [allowPriorityDiscount, setAllowPriorityDiscount] = React.useState(true);
  const userRole = sessionStorage.getItem("user_role") || "user";
  const canEdit = userRole === "admin";

  const formatSavedAt = React.useCallback((value) => {
    if (!value) return "Chưa lưu";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Không rõ";
    const timePart = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    const datePart = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
    return `${timePart} • ${datePart}`;
  }, []);

  const renderEditorContent = () => {
    if (activeNav === "Mẫu") return <TemplateAcademicContent canEdit={canEdit} />;
    if (activeNav === "Sinh viên") {
      return (
        <StudentAcademicContent
          maxStudentMajors={maxStudentMajors}
          onMaxStudentMajorsChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setMaxStudentMajors("");
              setSettingsSuccess("");
              setSettingsErrors((prev) => ({ ...prev, maxStudentMajors: "" }));
              return;
            }
            const next = Math.max(0, Number(raw));
            setMaxStudentMajors(Number.isFinite(next) ? next : "");
            setSettingsSuccess("");
            setSettingsErrors((prev) => ({ ...prev, maxStudentMajors: "" }));
          }}
          settingsErrors={settingsErrors}
          canEdit={canEdit}
        />
      );
    }
    if (activeNav === "Môn học") {
      return (
        <SubjectPolicyContent
          creditCoefficientPractice={creditCoefficientPractice}
          creditCoefficientTheory={creditCoefficientTheory}
          onCreditCoefficientPracticeChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setCreditCoefficientPractice("");
              setSettingsSuccess("");
              setSettingsErrors((prev) => ({ ...prev, creditCoefficientPractice: "" }));
              return;
            }
            const next = Math.max(0, Number(raw));
            setCreditCoefficientPractice(Number.isFinite(next) ? next : "");
            setSettingsSuccess("");
            setSettingsErrors((prev) => ({ ...prev, creditCoefficientPractice: "" }));
          }}
          onCreditCoefficientTheoryChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setCreditCoefficientTheory("");
              setSettingsSuccess("");
              setSettingsErrors((prev) => ({ ...prev, creditCoefficientTheory: "" }));
              return;
            }
            const next = Math.max(0, Number(raw));
            setCreditCoefficientTheory(Number.isFinite(next) ? next : "");
            setSettingsSuccess("");
            setSettingsErrors((prev) => ({ ...prev, creditCoefficientTheory: "" }));
          }}
          settingsErrors={settingsErrors}
          canEdit={canEdit}
        />
      );
    }
    if (activeNav === "Đăng ký học phần") {
      return (
        <CourseRegistrationPolicyContent
          practiceCreditCost={practiceCreditCost}
          theoryCreditCost={theoryCreditCost}
          onPracticeCreditCostChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setPracticeCreditCost("");
              setSettingsSuccess("");
              setSettingsErrors((prev) => ({ ...prev, practiceCreditCost: "" }));
              return;
            }
            const next = Math.max(0, Number(raw));
            setPracticeCreditCost(Number.isFinite(next) ? next : "");
            setSettingsSuccess("");
            setSettingsErrors((prev) => ({ ...prev, practiceCreditCost: "" }));
          }}
          onTheoryCreditCostChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setTheoryCreditCost("");
              setSettingsSuccess("");
              setSettingsErrors((prev) => ({ ...prev, theoryCreditCost: "" }));
              return;
            }
            const next = Math.max(0, Number(raw));
            setTheoryCreditCost(Number.isFinite(next) ? next : "");
            setSettingsSuccess("");
            setSettingsErrors((prev) => ({ ...prev, theoryCreditCost: "" }));
          }}
          settingsErrors={settingsErrors}
          canEdit={canEdit}
        />
      );
    }
    if (activeNav === "Học phí") {
      return (
        <TuitionPolicyContent
          allowPriorityDiscount={allowPriorityDiscount}
          onAllowPriorityDiscountChange={(e) => {
            setAllowPriorityDiscount(e.target.checked);
            setSettingsSuccess("");
          }}
          canEdit={canEdit}
        />
      );
    }
    return <PlaceholderContent title={activeNav} />;
  };

  React.useEffect(() => {
    let cancelled = false;
    async function loadAttachments() {
      setLoadingAttachments(true);
      setAttachmentError("");
      try {
        const res = await authFetch("/api/regulations/attachments");
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Không thể tải danh sách file");
        if (!cancelled) setAttachments(payload?.attachments || []);
      } catch (err) {
        if (!cancelled) setAttachmentError(err.message || "Không thể tải danh sách file");
      } finally {
        if (!cancelled) setLoadingAttachments(false);
      }
    }
    loadAttachments();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveSettings = async () => {
    if (!canEdit) {
      setSettingsError("Chỉ admin mới được phép chỉnh sửa và lưu quy định.");
      return;
    }
    if (!settingsLoaded) return;
    setSettingsErrors({});
    if (maxStudentMajors === "" || maxStudentMajors === null) {
      setSettingsErrors({ maxStudentMajors: "Vui lòng nhập Số ngành học tối đa." });
      return;
    }
    const nextValue = Number(maxStudentMajors);
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      setSettingsErrors({ maxStudentMajors: "Số ngành học tối đa không hợp lệ." });
      return;
    }
    if (creditCoefficientPractice === "" || creditCoefficientPractice === null) {
      setSettingsErrors({
        creditCoefficientPractice: "Vui lòng nhập hệ số tín chỉ / tiết cho tín chỉ thực hành.",
      });
      return;
    }
    if (creditCoefficientTheory === "" || creditCoefficientTheory === null) {
      setSettingsErrors({
        creditCoefficientTheory: "Vui lòng nhập hệ số tín chỉ / tiết cho tín chỉ lý thuyết.",
      });
      return;
    }
    if (practiceCreditCost === "" || practiceCreditCost === null) {
      setSettingsErrors({ practiceCreditCost: "Vui lòng nhập chi phí 1 tín chỉ thực hành." });
      return;
    }
    if (theoryCreditCost === "" || theoryCreditCost === null) {
      setSettingsErrors({ theoryCreditCost: "Vui lòng nhập chi phí 1 tín chỉ lý thuyết." });
      return;
    }
    const practiceValue = Number(creditCoefficientPractice);
    const theoryValue = Number(creditCoefficientTheory);
    if (!Number.isFinite(practiceValue) || practiceValue <= 0) {
      setSettingsErrors({
        creditCoefficientPractice: "Hệ số tín chỉ / tiết cho tín chỉ thực hành phải lớn hơn 0.",
      });
      return;
    }
    if (!Number.isFinite(theoryValue) || theoryValue <= 0) {
      setSettingsErrors({
        creditCoefficientTheory: "Hệ số tín chỉ / tiết cho tín chỉ lý thuyết phải lớn hơn 0.",
      });
      return;
    }
    const practiceCostValue = Number(practiceCreditCost);
    const theoryCostValue = Number(theoryCreditCost);
    if (!Number.isFinite(practiceCostValue) || practiceCostValue < 0) {
      setSettingsErrors({
        practiceCreditCost: "Chi phí 1 tín chỉ thực hành không hợp lệ.",
      });
      return;
    }
    if (!Number.isFinite(theoryCostValue) || theoryCostValue < 0) {
      setSettingsErrors({
        theoryCreditCost: "Chi phí 1 tín chỉ lý thuyết không hợp lệ.",
      });
      return;
    }

    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      const res = await authFetch("/api/regulations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxStudentMajors: nextValue,
          creditCoefficientPractice: practiceValue,
          creditCoefficientTheory: theoryValue,
          practiceCreditCost: practiceCostValue,
          theoryCreditCost: theoryCostValue,
          allowPriorityDiscount,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Không thể lưu quy định");
      setSettingsSuccess("Đã lưu quy định.");
      setSettingsUpdatedAt(payload?.settings?.updatedAt ?? null);
    } catch (err) {
      setSettingsError(err.message || "Không thể lưu quy định");
    } finally {
      setSettingsSaving(false);
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      setSettingsError("");
      try {
        const res = await authFetch("/api/regulations/settings");
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Không thể tải quy định");
        if (!cancelled) {
          setSettingsErrors({});
          const value = payload?.settings?.maxStudentMajors;
          setMaxStudentMajors(
            Number.isFinite(Number(value)) ? Number(value) : 1
          );
          const practiceValue = payload?.settings?.creditCoefficientPractice;
          const theoryValue = payload?.settings?.creditCoefficientTheory;
          const practiceCostValue = payload?.settings?.practiceCreditCost;
          const theoryCostValue = payload?.settings?.theoryCreditCost;
          const allowPriorityDiscountValue = payload?.settings?.allowPriorityDiscount;
          setCreditCoefficientPractice(
            Number.isFinite(Number(practiceValue)) ? Number(practiceValue) : 1
          );
          setCreditCoefficientTheory(
            Number.isFinite(Number(theoryValue)) ? Number(theoryValue) : 1
          );
          setPracticeCreditCost(
            Number.isFinite(Number(practiceCostValue)) ? Number(practiceCostValue) : 1
          );
          setTheoryCreditCost(
            Number.isFinite(Number(theoryCostValue)) ? Number(theoryCostValue) : 1
          );
          setAllowPriorityDiscount(allowPriorityDiscountValue !== false);
          setSettingsUpdatedAt(payload?.settings?.updatedAt ?? null);
          setSettingsLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setSettingsError(err.message || "Không thể tải quy định");
          setSettingsErrors({});
          setSettingsLoaded(true);
        }
      }
    }
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAttachmentError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await authFetch("/api/regulations/attachments", {
        method: "POST",
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Tải file thất bại");

      setAttachments((prev) => [payload.attachment, ...prev]);
    } catch (err) {
      setAttachmentError(err.message || "Tải file thất bại");
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!attachmentId) return;
    setAttachmentError("");
    try {
      const res = await authFetch(`/api/regulations/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Không thể xoá file");
      setAttachments((prev) => prev.filter((item) => item._id !== attachmentId));
    } catch (err) {
      setAttachmentError(err.message || "Không thể xoá file");
    }
  };

  const formatSize = (size) => {
    if (!size && size !== 0) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="regulation-page">
      <div className="regulation-header">
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
          <h1>Thay đổi quy định</h1>
          <div className="regulation-tags">
            <span className="pill soft">Cập nhật: {formatSavedAt(settingsUpdatedAt)}</span>
            <span className="pill soft">Người chỉnh: Phạm Thu Hà</span>
          </div>
        </div>
        <div className="header-actions">
          {canEdit ? (
            <button
              type="button"
              className="btn primary"
              onClick={handleSaveSettings}
              disabled={settingsSaving}
            >
              {settingsSaving ? "Đang lưu..." : "Lưu quy định"}
            </button>
          ) : null}
          {settingsSuccess ? <span className="pill success">{settingsSuccess}</span> : null}
          {settingsError ? <span className="pill warning">{settingsError}</span> : null}
        </div>
      </div>

      <div className="regulation-grid">
        <aside className="reg-card regulation-nav">
          <div className="nav-head">
            <div>
              <p className="eyebrow">Danh mục</p>
              <h3>Nhóm quy định</h3>
            </div>
          </div>

          <div className="nav-list">
            {navSections.map((item) => (
              <button
                type="button"
                key={item.title}
                className={`nav-item ${activeNav === item.title ? "active" : ""}`}
                onClick={() => setActiveNav(item.title)}
              >
                <div>
                  <div className="nav-title">{item.title}</div>
                  <div className="nav-sub">{item.subtitle}</div>
                </div>
                <span className="nav-pill">{item.count} mục</span>
              </button>
            ))}
          </div>

        </aside>

        <section className="reg-card regulation-editor">
          {renderEditorContent()}
        </section>

        <aside className="reg-card regulation-side">
          <div className="side-section">
            <div className="side-head">
              <div>
                <p className="eyebrow">Hồ sơ đính kèm</p>
                <h4>Tài liệu hỗ trợ</h4>
              </div>
              {canEdit ? (
                <button type="button" className="link-btn" onClick={handleTriggerUpload} disabled={uploading}>
                  {uploading ? "Đang tải..." : "+ Thêm file"}
                </button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {attachmentError && (
              <div className="attachment-error">
                {attachmentError}
              </div>
            )}
            {loadingAttachments ? (
              <div className="attachment skeleton">Đang tải danh sách...</div>
            ) : attachments.length === 0 ? (
              <div className="attachment muted">Chưa có file nào</div>
            ) : (
              attachments.map((item) => (
                <div key={item._id || item.fileName} className="attachment">
                  <div>
                    <div className="attachment-title">
                      {item.originalName || item.fileName}
                    </div>
                    <div className="attachment-meta">
                      {item.mimeType || "Tệp"} • {formatSize(item.size)}
                      {item.updatedAt ? ` • Cập nhật ${new Date(item.updatedAt).toLocaleDateString("vi-VN")}` : ""}
                    </div>
                  </div>
                  {item.path ? (
                    <a
                      className="btn ghost small"
                      href={item.path}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tải xuống
                    </a>
                  ) : (
                    <span className="btn ghost small disabled">Không có link</span>
                  )}
                  {canEdit && item._id ? (
                    <button
                      type="button"
                      className="attachment-delete"
                      onClick={() => handleDeleteAttachment(item._id)}
                      aria-label="Xoá tài liệu"
                      title="Xoá tài liệu"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
