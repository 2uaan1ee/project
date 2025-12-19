import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/regulations.css";

const navSections = [
  { title: "Học vụ & thi cử", subtitle: "Điểm quá trình, phúc khảo, lịch thi", count: 6 },
  { title: "Chương trình đào tạo", subtitle: "Chuẩn đầu ra, số tín chỉ, tiên quyết", count: 5 },
  { title: "Tài chính & học phí", subtitle: "Miễn giảm, hạn đóng, bổ sung hóa đơn", count: 4 },
  { title: "Công tác sinh viên", subtitle: "Kỷ luật, khen thưởng, hỗ trợ đặc biệt", count: 3 },
  { title: "Cơ sở vật chất", subtitle: "Đăng ký phòng, bảo trì, an toàn", count: 2 },
];

const quickRules = [
  { label: "Điểm chuyên cần tối thiểu", value: ">= 75%" },
  { label: "Thời gian nộp bài muộn", value: "Tối đa 48h, trừ 20%" },
  { label: "Số lần phúc khảo", value: "Tối đa 2 lần/học phần" },
  { label: "Định dạng file", value: "PDF, DOCX, tối đa 10MB" },
];

const reminders = [
  "Xác nhận thời gian áp dụng cho khóa 2023 trở đi.",
  "Kiểm tra ảnh hưởng đến các môn tiên quyết hiện hành.",
  "Thêm hướng dẫn chi tiết cho sinh viên học lại.",
  "Đính kèm biểu mẫu phúc khảo mới nhất.",
];

export default function RegulationSettings() {
  const navigate = useNavigate();

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
            {navSections.map((item, idx) => (
              <button
                type="button"
                key={item.title}
                className={`nav-item ${idx === 0 ? "active" : ""}`}
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
                {quickRules.map((rule) => (
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
                {reminders.map((item) => (
                  <li key={item}>
                    <input type="checkbox" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn subtle">Thêm ghi chú</button>
            </div>
          </div>
        </section>

        <aside className="reg-card regulation-side">
          <div className="side-section">
            <div className="side-head">
              <div>
                <p className="eyebrow">Hồ sơ đính kèm</p>
                <h4>Tài liệu hỗ trợ</h4>
              </div>
              <button type="button" className="link-btn">+ Thêm file</button>
            </div>
            <div className="attachment">
              <div>
                <div className="attachment-title">Mẫu đơn phúc khảo mới</div>
                <div className="attachment-meta">PDF • 320 KB • Cập nhật 18/03</div>
              </div>
              <button type="button" className="btn ghost small">Tải xuống</button>
            </div>
            <div className="attachment">
              <div>
                <div className="attachment-title">Biên bản họp góp ý 01/2024</div>
                <div className="attachment-meta">DOCX • 1.2 MB • Cập nhật 10/03</div>
              </div>
              <button type="button" className="btn ghost small">Xem</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
