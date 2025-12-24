// frontend/src/pages/StudentProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../lib/auth";
import "../styles/students.css";

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

// Mapping mã ngành -> tên
const MAJOR_LABELS = {
  TTNT: "Trí tuệ Nhân tạo",
  ATTT: "An toàn Thông tin",
  KHMT: "Khoa học Máy tính",
  MMTT: "Mạng máy tính & Truyền thông Dữ liệu",
  TKVM: "Thiết kế Vi mạch",
  KHDL: "Khoa học Dữ liệu",
  KTPM: "Kỹ thuật Phần mềm",
  TTDPT: "Truyền thông Đa phương tiện",
  KTMT: "Kỹ thuật Máy tính",
  CNTT: "Công nghệ Thông tin",
  HTTT: "Hệ thống Thông tin",
  TMDT: "Thương mại Điện tử",
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

function percent(x) {
  const n = Number(x || 0);
  return `${Math.round(n * 100)}%`;
}

export default function StudentProfile() {
  const { student_id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handlePrint = () => window.print();

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      setError("");
      try {
        const url = buildStudentUrl(student_id);
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Student not found");
        const data = await res.json();
        setStudent(data);
      } catch (err) {
        console.error("[student-profile] fetch error", err);
        setError("Không tải được hồ sơ sinh viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [student_id]);

  const majorDisplay = useMemo(() => formatMajor(student?.major_id), [student?.major_id]);

  if (loading) return <div className="student-page">Đang tải hồ sơ sinh viên...</div>;
  if (error) return <div className="student-page" style={{ color: "#b91c1c" }}>{error}</div>;
  if (!student) return <div className="student-page">Không tìm thấy sinh viên.</div>;

  const contact = student.contact || {};
  const address = student.address || {};
  const identity = student.identity || {};
  const family = student.family || {};
  const admission = student.admission || {};
  const truong_thpt = student.truong_thpt || {};
  const school_registered = student.school_registered || {};
  const emergency = student.emergency_contact || {};
  const priority = student.priority || { code: "NONE", label: "Không ưu tiên", discount_rate: 0 };

  const studyHistory = Array.isArray(student.study_history) ? student.study_history : [];
  const achievements = Array.isArray(student.achievements) ? student.achievements : [];

  return (
    <div className="student-page">
      <div className="profile-toolbar">
        <Link className="profile-back" to="/app/students">← Quay về danh sách</Link>
        <button className="print-btn" type="button" onClick={handlePrint}>🖨️ In lý lịch</button>
      </div>

      {/* HERO */}
      <div className="profile-hero student-card" style={{ padding: 0, border: "none", boxShadow: "none" }}>
        <div className="profile-hero__block">
          <span className="profile-hero__label">Mã số sinh viên (MSSV)</span>
          <span className="profile-hero__value">{student.student_id}</span>
          <div className="profile-meta">
            <span className="meta-pill">CCCD: {identity.identity_number || ""}</span>
            <span className="meta-pill">Lớp: {student.class_id || ""}</span>
            <span className="meta-pill">CTĐT: {student.program_type || student.program_id || ""}</span>
            <span className="meta-pill">KV: {admission.khu_vuc_tuyen_sinh || ""}</span>
            <span className="meta-pill">
              Ưu tiên: {priority.label || "Không ưu tiên"} ({percent(priority.discount_rate)})
            </span>
          </div>
        </div>

        <div className="profile-hero__block">
          <span className="profile-hero__label">Họ và tên</span>
          <span className="profile-hero__value">{student.name || student.full_name || ""}</span>
          <span>Ngày sinh: {student.birth_date || ""}</span>
          <span>Nơi sinh: {student.birthplace || student.birthplace_province || ""}</span>
        </div>

        <div className="profile-hero__block">
          <span className="profile-hero__label">Học tập</span>
          <span className="profile-hero__value">{majorDisplay || (student.major_id || "")}</span>
          <span>Giới tính: {prettyGender(student.gender)}</span>
          <span>Khoá: {student.cohort_year || ""} — Tốt nghiệp: {student.isGraduate ? "Đã tốt nghiệp" : "Chưa"}</span>
        </div>
      </div>

      {/* A. Thông tin trường/đăng ký */}
      <Section title="Thông tin trường">
        <div className="field-grid">
          <Field label="Ký hiệu trường" value={student.ky_hieu_truong || ""} />
          <Field label="Trường đăng ký học" value={school_registered.school_name || ""} wide />
          <Field label="Mã trường" value={school_registered.school_code || ""} />
        </div>
      </Section>

      {/* B. Tuyển sinh & ưu tiên */}
      <Section title="Tuyển sinh & ưu tiên">
        <div className="field-grid">
          <Field label="Khu vực tuyển sinh" value={admission.khu_vuc_tuyen_sinh || ""} />
          <Field label="Đối tượng ưu tiên" value={admission.priority_object || priority.label || ""} />
          <Field label="Mức giảm" value={percent(priority.discount_rate)} />
          <Field label="Mã ưu tiên" value={priority.code || ""} />
          <Field label="Lý do" value={priority.reason || ""} wide />
        </div>

        <div className="field-grid" style={{ marginTop: 10 }}>
          <Field label="Con liệt sĩ" value={student.priority_flags?.is_child_of_martyr ? "Có" : "Không"} />
          <Field label="Con thương binh" value={student.priority_flags?.is_child_of_invalid ? "Có" : "Không"} />
          <Field label="Vùng sâu/vùng xa" value={student.priority_flags?.is_remote_area ? "Có" : "Không"} />
          <Field label="Dân tộc thiểu số" value={student.priority_flags?.is_ethnic_minority ? "Có" : "Không"} />
        </div>
      </Section>

      {/* C. THPT */}
      <Section title="THPT">
        <div className="field-grid">
          <Field label="Trường THPT" value={truong_thpt.name || ""} wide />
          <Field label="Tỉnh/TP" value={truong_thpt.province || ""} />
          <Field label="Quận/Huyện" value={truong_thpt.district || ""} />
        </div>
      </Section>

      {/* D. Liên hệ */}
      <Section title="Thông tin liên hệ">
        <div className="field-grid">
          <Field label="Email trường" value={contact.school_email || ""} />
          <Field label="Email cá nhân" value={contact.personal_email || contact.email || ""} />
          <Field label="Số điện thoại" value={contact.phone || ""} />
          <Field label="Email khác" value={contact.alias_email || ""} />
        </div>
      </Section>

      {/* E. Địa chỉ */}
      <Section title="Địa chỉ">
        <div className="field-grid">
          <Field label="Địa chỉ thường trú" value={address.permanent_address || student.household_address || ""} wide />
          <Field label="Địa chỉ tạm trú" value={address.temporary_address || ""} wide />
          <Field label="Quê quán (đầy đủ)" value={address.hometown_full || address.hometown || ""} wide />
          <Field label="Huyện/Quận" value={address.hometown_district || ""} />
          <Field label="Tỉnh/TP" value={address.hometown_province || ""} />
          <Field label="Vùng sâu, vùng xa" value={address.is_remote_area ? "Có" : "Không"} />
        </div>
      </Section>

      {/* F. Khi cần báo tin */}
      <Section title="Khi cần báo tin">
        <div className="field-grid">
          <Field label="Người liên hệ" value={emergency.person || ""} />
          <Field label="Quan hệ" value={emergency.relation || ""} />
          <Field label="Điện thoại" value={emergency.phone || ""} />
          <Field label="Địa chỉ" value={emergency.address || ""} wide />
        </div>
      </Section>

      {/* G. Nhân thân */}
      <Section title="Thông tin nhân thân">
        <div className="field-grid">
          <Field label="Dân tộc" value={identity.ethnicity || ""} />
          <Field label="Tôn giáo" value={identity.religion || ""} />
          <Field label="Thành phần xuất thân" value={identity.origin || ""} />
          <Field label="Dân tộc thiểu số" value={identity.is_ethnic_minority ? "Có" : "Không"} />
          <Field label="Ngày vào Đoàn" value={identity.union_join_date || ""} />
          <Field label="Ngày vào Đảng" value={identity.party_join_date || ""} />
          <Field label="Ngày cấp CCCD" value={identity.identity_issue_date || ""} />
          <Field label="Nơi cấp CCCD" value={identity.identity_issue_place || ""} wide />
          <Field label="Chức vụ cao nhất" value={identity.highest_position || ""} wide />
        </div>
      </Section>

      {/* H. Gia đình */}
      <Section title="Gia đình">
        <div className="family-subtitle">Cha</div>
        <div className="field-grid">
          <Field label="Họ tên" value={family.father?.name || ""} />
          <Field label="Nghề nghiệp" value={family.father?.job || ""} />
          <Field label="Điện thoại" value={family.father?.phone || ""} />
          <Field label="Địa chỉ" value={family.father?.address || ""} wide />
        </div>

        <div className="family-subtitle">Mẹ</div>
        <div className="field-grid">
          <Field label="Họ tên" value={family.mother?.name || ""} />
          <Field label="Nghề nghiệp" value={family.mother?.job || ""} />
          <Field label="Điện thoại" value={family.mother?.phone || ""} />
          <Field label="Địa chỉ" value={family.mother?.address || ""} wide />
        </div>

        <div className="family-subtitle">Người giám hộ</div>
        <div className="field-grid">
          <Field label="Họ tên" value={family.guardian?.name || ""} />
          <Field label="Nghề nghiệp" value={family.guardian?.job || ""} />
          <Field label="Điện thoại" value={family.guardian?.phone || ""} />
          <Field label="Địa chỉ" value={family.guardian?.address || ""} wide />
        </div>
      </Section>

      {/* I. Quá trình học tập */}
      <Section title="Quá trình học tập">
        {studyHistory.length === 0 ? (
          <EmptyNote text="Không có dữ liệu quá trình học tập." />
        ) : (
          <div className="student-card" style={{ padding: 12 }}>
            {studyHistory.map((x, idx) => (
              <div key={idx} style={{ padding: "10px 6px", borderBottom: idx === studyHistory.length - 1 ? "none" : "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700 }}>
                  {x.from_year}–{x.to_year}: {x.school}
                </div>
                <div style={{ color: "#475569", marginTop: 4 }}>{x.location}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* J. Thành tích / khen thưởng */}
      <Section title="Thành tích, khen thưởng">
        {achievements.length === 0 ? (
          <EmptyNote text="Không có dữ liệu khen thưởng." />
        ) : (
          <div className="student-card" style={{ padding: 12 }}>
            {achievements.map((a, idx) => (
              <div key={idx} style={{ padding: "10px 6px", borderBottom: idx === achievements.length - 1 ? "none" : "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700 }}>{a.title}</div>
                <div style={{ color: "#475569", marginTop: 4 }}>{a.year}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* K. Cam kết / đồng ý */}
      <Section title="Cam kết & đồng ý">
        <div className="field-grid">
          <Field label="Đồng ý nhà trường dùng dữ liệu" value={student.consents?.allow_school_use_personal_data ? "Có" : "Không"} />
          <Field label="Cam đoan sinh viên" value={student.declaration?.student_commitment ? "Có" : "Không"} />
          <Field label="Ngày ký" value={student.declaration?.signed_date || ""} />
        </div>
      </Section>
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
  return (
    <div className="student-card" style={{ padding: 12, color: "#64748b", fontSize: 14 }}>
      {text}
    </div>
  );
}

/**
 * Field:
 * - auto textarea nếu dài hoặc label là địa chỉ/lý do
 */
function Field({ label, value, wide }) {
  const val = value ?? "";

  return (
    <div className={`field${wide ? " field--wide" : ""}`}>
      <label>{label}</label>
      <input
        readOnly
        value={String(val)}
        title={String(val)} // hover để xem full
      />
    </div>
  );
}
