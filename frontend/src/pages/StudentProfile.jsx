// frontend/src/pages/StudentProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../lib/auth";
import "../styles/students_admin.css"; // Đảm bảo bạn đã có file này trong thư mục styles

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^(03|05|07|08|09)+([0-9]{8})$/
};

const KV_OPTIONS = [
  { value: "KV1", label: "KV1" },
  { value: "KV2-NT", label: "KV2-NT" },
  { value: "KV2", label: "KV2" },
  { value: "KV3", label: "KV3" }
];

// --- 1. Helper check quyền Admin (Ưu tiên SessionStorage) ---
function getIsAdmin() {
  try {
    const token = sessionStorage.getItem("token") || 
                  sessionStorage.getItem("access_token") || 
                  localStorage.getItem("token");
    if (!token) return false;

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    
    return JSON.parse(jsonPayload).role === "admin";
  } catch (e) { return false; }
}

// --- 2. Helper update dữ liệu lồng nhau ---
const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((o, key) => (o[key] = o[key] || {}), obj);
  lastObj[lastKey] = value;
  return { ...obj };
};

// --- Các hàm format dữ liệu ---
const MAJOR_LABELS = {
  TTNT: "Trí tuệ Nhân tạo", ATTT: "An toàn Thông tin", KHMT: "Khoa học Máy tính",
  MMTT: "Mạng máy tính & Truyền thông Dữ liệu", TKVM: "Thiết kế Vi mạch", KHDL: "Khoa học Dữ liệu",
  KTPM: "Kỹ thuật Phần mềm", TTDPT: "Truyền thông Đa phương tiện", KTMT: "Kỹ thuật Máy tính",
  CNTT: "Công nghệ Thông tin", HTTT: "Hệ thống Thông tin", TMDT: "Thương mại Điện tử",
};

function buildStudentUrl(id) {
  if (!id) return null;
  if (API_BASE.startsWith("http")) return `${API_BASE}/students/${id}`;
  const prefix = API_BASE.startsWith("/") ? "" : "/";
  return `${prefix}${API_BASE}/students/${id}`;
}

function normalizeMajorIds(majorId) {
  if (!majorId) return [];
  if (Array.isArray(majorId)) return majorId.map((x) => String(x).trim()).filter(Boolean);
  const code = String(majorId).trim();
  return code ? [code] : [];
}

function formatMajor(majorId) {
  const ids = normalizeMajorIds(majorId);
  if (!ids.length) return "";
  return ids.map((code) => MAJOR_LABELS[code] || code).join(", ");
}

function prettyGender(g) {
  if (g === "Male") return "Nam";
  if (g === "Female") return "Nữ";
  if (g === "Nam" || g === "Nữ") return g;
  return g || "";
}

// --- MAIN COMPONENT ---
export default function StudentProfile() {
  const { student_id } = useParams();
  
  // State
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handlePrint = () => window.print();

  // Load data
  useEffect(() => {
    setIsAdmin(getIsAdmin()); 
    const fetchStudent = async () => {
      setLoading(true);
      setError("");
      try {
        const url = buildStudentUrl(student_id);
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Student not found");
        const data = await res.json();
        setStudent(data);
        setFormData(JSON.parse(JSON.stringify(data)));
      } catch (err) {
        console.error(err);
        setError("Không tải được hồ sơ sinh viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [student_id]);

  // Handlers
  const handleInputChange = (path, value) => {
    setFormData((prev) => {
      const newState = JSON.parse(JSON.stringify(prev));
      setNestedValue(newState, path, value);
      return newState;
    });
  };

  const handleSave = async () => {
    // 1. TẠO BIẾN TẠM (Clone dữ liệu ra để xử lý ngay lập tức)
    let submitData = JSON.parse(JSON.stringify(formData));

    // 2. AUTO-FIX: Xử lý vụ priority.code trên biến tạm này
    // Đảm bảo priority luôn tồn tại
    if (!submitData.priority) {
      submitData.priority = { code: "KV3", label: "KV3", discount_rate: 0 };
    }
    
    // Nếu code không hợp lệ, gán mặc định về KV3 (hoặc lấy từ admission nếu có)
    const validCodes = ["KV1", "KV2-NT", "KV2", "KV3"];
    if (!validCodes.includes(submitData.priority.code)) {
       // Thử map từ admission qua, nếu vẫn sai thì về KV3
       const fallback = submitData.admission?.khu_vuc_tuyen_sinh;
       submitData.priority.code = validCodes.includes(fallback) ? fallback : "KV3";
    }

    // 3. VALIDATE DỮ LIỆU (Kiểm tra trên submitData thay vì formData)
    const contact = submitData.contact || {};
    
    if (!contact.school_email || !REGEX.EMAIL.test(contact.school_email)) {
      return alert("Lỗi: Email trường không hợp lệ hoặc để trống!");
    }
    if (!contact.personal_email || !REGEX.EMAIL.test(contact.personal_email)) {
      return alert("Lỗi: Email cá nhân không đúng định dạng!");
    }
    if (!contact.phone || !REGEX.PHONE.test(contact.phone)) {
      return alert("Lỗi: Số điện thoại phải là 10 số (đầu 03,05,07,08,09)!");
    }
    if (contact.alias_email && !REGEX.EMAIL.test(contact.alias_email)) {
      return alert("Lỗi: Email khác không đúng định dạng!");
    }

    // 4. GỬI DỮ LIỆU ĐI
    if (!window.confirm("Xác nhận cập nhật dữ liệu vào hệ thống?")) return;
    
    try {
      const url = buildStudentUrl(student_id);
      const res = await authFetch(url, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData), // QUAN TRỌNG: Gửi submitData, không gửi formData
      });
      
      if (!res.ok) {
        // Nếu backend trả về lỗi, cố gắng đọc message lỗi
        const errData = await res.json().catch(() => ({})); 
        throw new Error(errData.message || "Lỗi khi lưu dữ liệu");
      }

      const updatedData = await res.json();
      
      // Cập nhật lại giao diện sau khi thành công
      setStudent(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      alert("Cập nhật thành công!");
      
    } catch (err) {
      console.error(err);
      alert("Lỗi: " + err.message);
    }
  };

  const handleCancel = () => {
    setFormData(JSON.parse(JSON.stringify(student)));
    setIsEditing(false);
  };

  const majorDisplay = useMemo(() => formatMajor(student?.major_id), [student?.major_id]);

  if (loading) return <div className="student-page">Đang tải hồ sơ sinh viên...</div>;
  if (error) return <div className="student-page" style={{ color: "#b91c1c" }}>{error}</div>;
  if (!student) return <div className="student-page">Không tìm thấy sinh viên.</div>;

  const source = isEditing ? formData : student;
  const contact = source.contact || {};
  const address = source.address || {};
  const identity = source.identity || {};
  const family = source.family || {};
  const admission = source.admission || {};
  const school_registered = source.school_registered || {};
  const priority = source.priority || { code: "NONE", label: "Không ưu tiên", discount_rate: 0 };
  const studyHistory = Array.isArray(source.study_history) ? source.study_history : [];

  const YES_NO_OPTS = [{ value: true, label: "Có" }, { value: false, label: "Không" }];

  return (
    <div className="student-page">
      <div className="profile-toolbar">
        <Link className="profile-back" to="/app/students">← Quay về danh sách</Link>
        <div style={{ display: "flex", gap: "10px" }}>
           {isAdmin && !isEditing && (
              <button className="print-btn" onClick={() => setIsEditing(true)} style={{ backgroundColor: "#0284c7", color: "white" }}>
                ✏️ Chỉnh sửa
              </button>
           )}
           {isEditing ? (
             <>
               <button className="print-btn" onClick={handleCancel} style={{ background: "#94a3b8", color: "white" }}>Hủy bỏ</button>
               <button className="print-btn" onClick={handleSave} style={{ background: "#16a34a", color: "white" }}>💾 Lưu lại</button>
             </>
           ) : (
             <button className="print-btn" type="button" onClick={handlePrint}>🖨️ In lý lịch</button>
           )}
        </div>
      </div>

      {isEditing && <div style={{ background: "#fff7ed", color: "#c2410c", padding: "8px", marginBottom: "10px", borderRadius: "4px" }}>⚠️ Đang chỉnh sửa (Admin Mode) - Thông tin cơ bản (Màu xanh) không được phép thay đổi.</div>}

      {/* --- HERO SECTION (KHÓA CỨNG - KHÔNG CHO EDIT) --- */}
      <div className="profile-hero student-card" style={{ padding: 0, border: "none", boxShadow: "none" }}>
        <div className="profile-hero__block">
          <span className="profile-hero__label">MSSV</span>
          <span className="profile-hero__value">{source.student_id}</span>
          <div className="profile-meta">
            <span className="meta-pill">Lớp: {source.class_id}</span>
            <span className="meta-pill">KV: {admission.khu_vuc_tuyen_sinh}</span>
          </div>
        </div>

        <div className="profile-hero__block">
          <span className="profile-hero__label">Họ và tên</span>
          {/* Luôn hiển thị text, không bao giờ render input */}
          <span className="profile-hero__value">{source.name || source.full_name}</span>
          <span>Ngày sinh: {source.birth_date}</span>
          <span>Nơi sinh: {source.birthplace || source.birthplace_province}</span>
        </div>

        <div className="profile-hero__block">
          <span className="profile-hero__label">Học tập</span>
          <span className="profile-hero__value">{majorDisplay}</span>
          <span>Giới tính: {prettyGender(source.gender)}</span>
        </div>
      </div>

      {/* --- CÁC PHẦN DƯỚI (CHO PHÉP EDIT) --- */}
      <Section title="Thông tin trường">
        <div className="field-grid">
          <Field label="Ký hiệu trường" value={source.ky_hieu_truong} isEditing={false} />
          
          <Field label="Trường đăng ký" value={source.registration_school || school_registered.school_name} wide isEditing={false} />
          <Field label="Mã trường" value={source.school_code || school_registered.school_code} isEditing={false} />
        </div>
      </Section>

      <Section title="Tuyển sinh & ưu tiên">
        <div className="field-grid">
          {/* 1. KHU VỰC TUYỂN SINH: Map vào admission.khu_vuc_tuyen_sinh */}
          <Field 
            label="KV Tuyển sinh" 
            name="priority.code"
            type="select" 
            options={isEditing ? KV_OPTIONS : []} 
            value={priority.code}
            isEditing={isEditing} 
            onChange={handleInputChange} 
          />

          {/* 2. ĐỐI TƯỢNG ƯU TIÊN: Map vào priority.label hoặc priority.code */}
          <Field 
            label="Đối tượng ưu tiên" 
            name="priority.label" 
            value={priority.label} // Dữ liệu là "Không ưu tiên"
            isEditing={isEditing} 
            onChange={handleInputChange} 
          />

          {/* 3. MỨC GIẢM: Map vào priority.discount_rate */}
          <Field 
            label="Mức giảm (0-1)" 
            name="priority.discount_rate" 
            type="number" 
            value={priority.discount_rate} // Dữ liệu là 0
            isEditing={isEditing} 
            onChange={handleInputChange} 
            min="0" 
            max="1" 
            step="0.01" 
          />
        </div>
        
        {/* Các checkbox giữ nguyên */}
        <div className="field-grid" style={{ marginTop: 10 }}>
          <Field label="Con liệt sĩ" name="priority_flags.is_child_of_martyr" type="select" options={YES_NO_OPTS} value={source.priority_flags?.is_child_of_martyr} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Con thương binh" name="priority_flags.is_child_of_invalid" type="select" options={YES_NO_OPTS} value={source.priority_flags?.is_child_of_invalid} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Vùng sâu/xa" name="address.is_remote_area" type="select" options={YES_NO_OPTS} value={address.is_remote_area} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Dân tộc thiểu số" name="identity.is_ethnic_minority" type="select" options={YES_NO_OPTS} value={identity.is_ethnic_minority} isEditing={isEditing} onChange={handleInputChange} />
        </div>
      </Section>

      <Section title="Thông tin liên hệ">
        <div className="field-grid">
          <Field label="Email trường" name="contact.school_email" type="email" value={contact.school_email} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Email cá nhân" name="contact.personal_email" type="email" value={contact.personal_email} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Số điện thoại" name="contact.phone" type="tel" value={contact.phone} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Email khác" name="contact.alias_email" value={contact.alias_email} isEditing={isEditing} onChange={handleInputChange} />
        </div>
      </Section>

      <Section title="Địa chỉ">
        <div className="field-grid">
          <Field label="Thường trú" name="address.permanent_address" value={address.permanent_address} wide isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Tạm trú" name="address.temporary_address" value={address.temporary_address} wide isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Quê quán" name="address.hometown_full" value={address.hometown_full} wide isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Tỉnh/TP" name="address.hometown_province" value={address.hometown_province} isEditing={isEditing} onChange={handleInputChange} />
        </div>
      </Section>

      <Section title="Thông tin nhân thân">
        <div className="field-grid">
          <Field label="Dân tộc" name="identity.ethnicity" value={identity.ethnicity} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Tôn giáo" name="identity.religion" value={identity.religion} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Ngày vào Đoàn" name="identity.union_join_date" type="date" value={identity.union_join_date} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Ngày cấp CCCD" name="identity.identity_issue_date" type="date" value={identity.identity_issue_date} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Nơi cấp" name="identity.identity_issue_place" value={identity.identity_issue_place} wide isEditing={isEditing} onChange={handleInputChange} />
        </div>
      </Section>

      <Section title="Gia đình">
        <div className="family-subtitle">Cha</div>
        <div className="field-grid">
          <Field label="Họ tên" name="family.father.name" value={family.father?.name} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Điện thoại" name="family.father.phone" type="tel" value={family.father?.phone} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Địa chỉ" name="family.father.address" value={family.father?.address} wide isEditing={isEditing} onChange={handleInputChange} />
        </div>
        <div className="family-subtitle">Mẹ</div>
        <div className="field-grid">
          <Field label="Họ tên" name="family.mother.name" value={family.mother?.name} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Điện thoại" name="family.mother.phone" type="tel" value={family.mother?.phone} isEditing={isEditing} onChange={handleInputChange} />
          <Field label="Địa chỉ" name="family.mother.address" value={family.mother?.address} wide isEditing={isEditing} onChange={handleInputChange} />
        </div>
      </Section>

      <Section title="Quá trình học tập">
        {studyHistory.length === 0 ? <EmptyNote text="Không có dữ liệu." /> : (
          <div className="student-card" style={{ padding: 12 }}>
            {studyHistory.map((x, idx) => (
              <div key={idx} style={{ borderBottom: "1px solid #eee", padding: "5px 0" }}>
                 <b>{x.from_year} - {x.to_year}:</b> {x.school} ({x.location})
              </div>
            ))}
            <div style={{fontSize: "12px", color: "gray", marginTop: 5}}>* Mục này hiện chưa hỗ trợ chỉnh sửa nhanh.</div>
          </div>
        )}
      </Section>

      <Section title="Cam kết & đồng ý">
        <div className="field-grid">
           <Field label="Đồng ý dữ liệu" name="consents.allow_school_use_personal_data" type="select" options={YES_NO_OPTS} value={source.consents?.allow_school_use_personal_data} isEditing={isEditing} onChange={handleInputChange} />
           <Field label="Ngày ký" name="declaration.signed_date" type="date" value={source.declaration?.signed_date} isEditing={isEditing} onChange={handleInputChange} />
        </div>
      </Section>
    </div>
  );
}

// --- SUB COMPONENTS (Đảm bảo chỉ khai báo 1 lần ở đây) ---

function Field({ label, value, wide, isEditing, onChange, name, type = "text", options = [], min, max, step }) {
  // ^^^ Đã thêm min, max, step vào danh sách tham số (đừng xóa dấu phẩy nào nhé)
  
  const val = value ?? "";
  
  // 1. Chế độ xem (Read-only)
  if (!isEditing) {
    let displayVal = val;
    if (type === "select" && options.length) {
       const opt = options.find(o => String(o.value) === String(val));
       if (opt) displayVal = opt.label;
    }
    return (
      <div className={`field${wide ? " field--wide" : ""}`}>
        <label>{label}</label>
        <input readOnly value={String(displayVal)} title={String(displayVal)} />
      </div>
    );
  }

  // 2. Chế độ sửa (Edit)
  return (
    <div className={`field${wide ? " field--wide" : ""}`}>
      <label style={{ color: "#0284c7" }}>{label}</label>
      {type === "select" ? (
        <select 
          className="field-input-edit"
          value={String(val)}
          onChange={(e) => onChange(name, e.target.value === "true" ? true : e.target.value === "false" ? false : e.target.value)}
          style={{ width: "100%", padding: "8px", border: "1px solid #0284c7", borderRadius: "4px" }}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={String(opt.value)}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="field-input-edit"
          value={val}
          onChange={(e) => onChange(name, e.target.value)}
          style={{ border: "1px solid #0284c7", background: "#f0f9ff" }}
          // Gán giá trị min/max/step vào input. Nếu không truyền thì nó là undefined (không lỗi)
          min={min}
          max={max}
          step={step}
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function EmptyNote({ text }) {
  return <div className="student-card" style={{ padding: 12, color: "#64748b" }}>{text}</div>;
}