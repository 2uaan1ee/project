import mongoose from "mongoose";

const trainingProgramSchema = new mongoose.Schema(
  {
    major: { type: String, required: true }, // Ngành học
    faculty: { type: String, required: true }, // Khoa
    semester: { type: String, required: true }, // Học kỳ
    subjects: [{ type: String }], // Mảng các mã môn học
  },
  { timestamps: true }
);

// Index để query nhanh theo ngành, khoa, học kỳ
trainingProgramSchema.index({ major: 1, faculty: 1, semester: 1 });

const TrainingProgram = mongoose.model("TrainingProgram", trainingProgramSchema, "training_programs");

export default TrainingProgram;