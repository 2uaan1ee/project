import mongoose from "mongoose";

/**
 * Model đọc collection students_v3.0
 * - strict: false để không kẹt schema nếu data có field mới
 */
const StudentV3Schema = new mongoose.Schema(
    {
        student_id: { type: String, required: true, index: true },
        full_name: String,
        name: String,
        class_id: String,
        gender: String, // "Nam"/"Nữ" hoặc "Male"/"Female"
        isGraduate: Boolean,
        major_id: mongoose.Schema.Types.Mixed,
        major: mongoose.Schema.Types.Mixed,
    },
    {
        strict: false,
        collection: "students_v3.0",
        timestamps: false,
    }
);

StudentV3Schema.index({ student_id: 1 });
StudentV3Schema.index({ class_id: 1 });
StudentV3Schema.index({ full_name: 1 });
StudentV3Schema.index({ name: 1 });
StudentV3Schema.index({ isGraduate: 1 });

export default mongoose.model("StudentV3", StudentV3Schema);
