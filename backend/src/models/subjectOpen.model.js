import mongoose from "mongoose";

const subjectOpenSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true }, // Năm học (VD: "2025-2026")
    semester: { type: String, required: true }, // Học kỳ (VD: "HK1", "HK2", "HK3")
    subjects: [
      {
        stt: { type: Number }, // Số thứ tự
        subject_id: { type: String, required: true }, // Mã môn học
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
