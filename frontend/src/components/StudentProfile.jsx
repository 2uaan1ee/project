import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/students.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function StudentProfile() {
  const { student_id } = useParams();
  const nav = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/students/${student_id}`);
        if (!res.ok) throw new Error("Student not found");
        const data = await res.json();
        setStudent(data);
      } catch (err) {
        console.error("[student-profile] fetch error", err);
        nav("/app/students", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [student_id, nav]);

  if (loading) return <div className="student-page">Đang tải hồ sơ...</div>;
  if (!student) return <div className="student-page">Không tìm thấy sinh viên.</div>;

  const { contact = {}, address = {}, identity = {}, family = {} } = student;

  return (
    <div className="student-page">
      <div className="profile-toolbar">
        <Link className="profile-back" to="/app/students">← Quay về danh sách</Link>
        <button className="print-btn" type="button" onClick={handlePrint}>
          🖨️ In lý lịch
        </button>
      </div>

      <div className="profile-hero student-card" style={{ padding: 0, border: "none", boxShadow: "none" }}>
        <div className="profile-hero__block">
          <span className="profile-hero__label">Mã sinh viên</span>
          <span className="profile-hero__value">{student.student_id}</span>
          <div className="profile-meta">
            <span className="meta-pill">CCCD: {identity.identity_number || "—"}</span>
            <span className="meta-pill">Lớp sinh hoạt: {student.class_id || "—"}</span>
            <span className="meta-pill">Chương trình: {student.program_type || student.program_id || "—"}</span>
          </div>
        </div>

        <div className="profile-hero__block">
          <span className="profile-hero__label">Họ và tên</span>
          <span className="profile-hero__value">{student.name}</span>
          <span>Ngày sinh: {student.birth_date || "—"}</span>
          <span>Nơi sinh: {student.birthplace || "—"}</span>
        </div>

        <div className="profile-hero__block">
          <span className="profile-hero__label">Ngành học</span>
          <span className="profile-hero__value">{student.major_id || "—"}</span>
          <span>Giới tính: {student.gender === "Male" ? "Nam" : "Nữ"}</span>
          <span>Đào tạo: {student.program_type || "—"}</span>
        </div>
      </div>

      <div className="section">
        <h3>Thông tin liên hệ</h3>
        <div className="field-grid">
          <Field label="Email trường" value={contact.school_email} />
          <Field label="Email cá nhân" value={contact.personal_email} />
          <Field label="Số điện thoại" value={contact.phone} />
          <Field label="Email khác" value={contact.alias_email} />
        </div>
      </div>

      <div className="section">
        <h3>Địa chỉ</h3>
        <div className="field-grid">
          <Field label="Địa chỉ thường trú" value={address.permanent_address} wide />
          <Field label="Địa chỉ tạm trú" value={address.temporary_address} wide />
          <Field label="Quê quán" value={address.hometown} />
          <Field label="Vùng sâu, vùng xa" value={address.is_remote_area ? "Có" : "Không"} />
        </div>
      </div>

      <div className="section">
        <h3>Thông tin nhân thân</h3>
        <div className="field-grid">
          <Field label="Dân tộc" value={identity.ethnicity} />
          <Field label="Tôn giáo" value={identity.religion} />
          <Field label="Thành phần gia đình" value={identity.origin} />
          <Field label="Ngày vào Đoàn" value={identity.union_join_date || "—"} />
          <Field label="Ngày vào Đảng" value={identity.party_join_date || "—"} />
          <Field label="Nơi cấp CCCD" value={identity.identity_issue_place} wide />
          <Field label="Ngày cấp CCCD" value={identity.identity_issue_date} />
        </div>
      </div>

      <div className="section">
        <h3>Gia đình</h3>
        <div className="field-grid">
          <Field label="Cha - Họ tên" value={family.father?.name} />
          <Field label="Cha - Nghề nghiệp" value={family.father?.job} />
          <Field label="Cha - Điện thoại" value={family.father?.phone} />
          <Field label="Cha - Địa chỉ" value={family.father?.address} wide />

          <Field label="Mẹ - Họ tên" value={family.mother?.name} />
          <Field label="Mẹ - Nghề nghiệp" value={family.mother?.job} />
          <Field label="Mẹ - Điện thoại" value={family.mother?.phone} />
          <Field label="Mẹ - Địa chỉ" value={family.mother?.address} wide />

          <Field label="Người giám hộ - Họ tên" value={family.guardian?.name || "—"} />
          <Field label="Người giám hộ - Điện thoại" value={family.guardian?.phone || "—"} />
          <Field label="Người giám hộ - Địa chỉ" value={family.guardian?.address || "—"} wide />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, wide }) {
  const val = value || "";
  const isLong = val.length > 40;
  const Input = isLong ? "textarea" : "input";
  return (
    <div className={`field${wide ? " field--wide" : ""}`}>
      <label>{label}</label>
      <Input
        readOnly
        value={val}
        rows={isLong ? 2 : 1}
        className={isLong ? "field-textarea" : ""}
      />
    </div>
  );
}
