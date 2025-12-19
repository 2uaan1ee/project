import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/regulations.css";
import { authFetch } from "../lib/auth";

const navSections = [
  { title: "Mẫu", subtitle: "Điểm quá trình, phúc khảo, lịch thi", count: 6 },
  { title: "Sinh viên", subtitle: "", count: 6 },
  { title: "Môn học", subtitle: "", count: 5 },
  { title: "Chương trình đào tạo", subtitle: "", count: 5 },
  { title: "Đăng ký học phần", subtitle: "", count: 5 },
  { title: "Học phí", subtitle: "", count: 4 },
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

const studentQuickRules = [
  { label: "Điểm chuyên cần tối thiểu", value: ">= 80%" },
  { label: "Hạn nộp bổ sung", value: "Trong 24h sau mỗi buổi học" },
  { label: "Số lần xem lại bài", value: "Tối đa 1 lần/bài" },
  { label: "Định dạng bài nộp", value: "PDF, tối đa 15MB" },
];

const studentReminders = [
  "Thông báo rõ thời gian áp dụng cho tất cả lớp thuộc học phần.",
  "Gửi hướng dẫn phúc khảo lên LMS cho sinh viên tự truy cập.",
  "Cập nhật danh sách cố vấn học tập để nhận thông báo.",
  "Xác thực thông tin liên lạc của sinh viên trước kỳ thi.",
];

function TemplateAcademicContent() {
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
        <div className="chip-row">
          <span className="pill neutral">Áp dụng: Học kỳ 1 / 2025</span>
        </div>
      </div>

      <div className="field-grid">
        <label className="input-block">
          <span>Trọng số điểm quá trình</span>
          <input type="text" defaultValue="40%" placeholder="Nhập tỷ lệ %" />
        </label>
        <label className="input-block">
          <span>Trọng số điểm cuối kỳ</span>
          <input type="text" defaultValue="60%" placeholder="Nhập tỷ lệ %" />
        </label>
        <label className="input-block">
          <span>Số lần kiểm tra tối thiểu</span>
          <input type="number" defaultValue={3} min={0} />
        </label>
        <label className="input-block">
          <span>Điều kiện dự thi</span>
          <input type="text" defaultValue="Điểm quá trình >= 4.0" placeholder="Mô tả điều kiện" />
        </label>
      </div>

      <div className="input-row">
        <label className="input-block full">
          <span>Hướng dẫn phúc khảo</span>
          <textarea
            rows={3}
            defaultValue="Sinh viên nộp đơn trong 03 ngày sau khi công bố điểm. Mỗi học phần tối đa 2 lần phúc khảo và kết quả phúc khảo là kết quả cuối cùng."
          />
        </label>
      </div>

      <div className="field-grid two">
        <div className="input-block">
          <span>Thời hạn mở phúc khảo</span>
          <div className="inline-inputs">
            <input type="date" />
            <input type="date" />
          </div>
          <small>Chọn ngày bắt đầu và kết thúc dự kiến.</small>
        </div>

        <div className="input-block">
          <span>Hình thức thông báo</span>
          <div className="stacked-options">
            <label className="option-row">
              <input type="checkbox" defaultChecked />
              <span>Gửi email cho toàn bộ sinh viên thuộc học phần</span>
            </label>
            <label className="option-row">
              <input type="checkbox" defaultChecked />
              <span>Hiển thị banner trong cổng thông tin sinh viên</span>
            </label>
            <label className="option-row">
              <input type="checkbox" />
              <span>Thông báo cho giảng viên phụ trách</span>
            </label>
            <label className="option-row">
              <input type="checkbox" />
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
            <button type="button" className="link-btn">Chỉnh sửa</button>
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
                <input type="checkbox" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn subtle">Thêm ghi chú</button>
        </div>
      </div>
    </>
  );
}

function StudentAcademicContent() {
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
        <div className="chip-row">
          <span className="pill neutral">Áp dụng: Từ khóa 2024</span>
        </div>
      </div>

      <div className="field-grid">
        <label className="input-block">
          <span>Số ngành học tối đa</span>
          <input type="number" defaultValue={1} min={0} />
        </label>
      </div>

      <div className="field-grid two">
        <div className="input-block">
          <span>Giảm học phí</span>
          <div className="stacked-options">
            <label className="option-row">
              <input type="checkbox" defaultChecked />
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

  const renderEditorContent = () => {
    if (activeNav === "Mẫu") return <TemplateAcademicContent />;
    if (activeNav === "Sinh viên") return <StudentAcademicContent />;
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
          <h1>Điều chỉnh quy định năm học 2024 - 2025</h1>
          <p className="lead">
            Trang trung tâm cho cán bộ cập nhật quy định, lưu bản nháp và gửi phê duyệt. Nội dung bên dưới chỉ là layout mẫu, chưa gắn API.
          </p>
          <div className="regulation-tags">
            <span className="pill soft">Cập nhật: 10:45 • 22/03</span>
            <span className="pill soft">Người chỉnh: Phạm Thu Hà</span>
          </div>
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

          <div className="nav-foot">
            <p>Gợi ý: chia nhỏ theo Học vụ, Tài chính, Công tác sinh viên để dễ phê duyệt.</p>
            <button type="button" className="btn ghost">Xem lịch sử chỉnh sửa</button>
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
              <button type="button" className="link-btn" onClick={handleTriggerUpload} disabled={uploading}>
                {uploading ? "Đang tải..." : "+ Thêm file"}
              </button>
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
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
