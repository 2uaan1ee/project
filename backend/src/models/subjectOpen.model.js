import mongoose from "mongoose";

const subjectOpenSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true }, // Năm học (VD: "2025-2026")
    semester: { type: String, required: true }, // Học kỳ (VD: "HK1", "HK2", "HK3")
    subjects: [
      {
        stt: { type: Number }, // Số thứ tự
        subject_id: { type: String, required: true }, // Mã môn học
        class_code: { type: String }, // MÃ LỚP
        subject_name: { type: String }, // TÊN MÔN HỌC
        teacher_id: { type: String }, // MÃ GIẢNG VIÊN
        teacher_name: { type: String }, // TÊN GIẢNG VIÊN
        capacity: { type: Number }, // SĨ SỐ
        credits: { type: Number }, // TỔ TC (tổng tín chỉ)
        practice_credits: { type: Number }, // THỰC HÀNH
        htgd: { type: String }, // HTGD
        day: { type: String }, // THỨ
        period: { type: String }, // TIẾT
        week_pattern: { type: String }, // CÁCH TUẦN
        room: { type: String }, // PHÒNG HỌC
        course: { type: String }, // KHOÁ HỌC
        semester_label: { type: String }, // HỌC KỲ (nếu cần ở hàng)
        academicYear_label: { type: String }, // NĂM HỌC (nếu cần ở hàng)
        education_system: { type: String }, // HỆ ĐT
        faculty: { type: String }, // KHOA QL
        start_date: { type: Date }, // NBD
        end_date: { type: Date }, // NKT
        notes: { type: String }, // GHICHU
        registered_flag: { type: String }, // Đã ĐK (giữ string để linh hoạt: 'Yes','No', số lượng...)
      },
    ],
    isPublic: { type: Boolean, default: false }, // Trạng thái hiển thị (mặc định là ẩn)
    createdBy: { type: String }, // Admin tạo danh sách
  },
  { timestamps: true }
);

// Index để query nhanh theo năm học và học kỳ
subjectOpenSchema.index({ academicYear: 1, semester: 1 });

const SubjectOpen = mongoose.model(
  "SubjectOpen",
  subjectOpenSchema,
  "subject_open"
);

export default SubjectOpen;
