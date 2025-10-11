import mongoose from "mongoose";

const tuitionDetailSchema = new mongoose.Schema({
  program_id: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingProgram", required: true },
  new_course_fee: { type: String },
  retake_fee: { type: String },
  improve_fee: { type: String },
});

const tuitionFeeSchema = new mongoose.Schema(
  {
    academic_year: { type: String, required: true },
    semester: { type: String, enum: ["1", "2", "Hè"], required: true },
    tuition_details: [tuitionDetailSchema],
    note: { type: String },
  },
  { timestamps: true }
);

// 👇 Ép Mongoose dùng đúng tên collection snake_case
const TuitionFee = mongoose.model("TuitionFee", tuitionFeeSchema, "tuition_fees");

export default TuitionFee;
