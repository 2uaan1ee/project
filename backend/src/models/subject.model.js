// backend/src/models/subject.model.js
import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // mã môn
    name: { type: String, required: true },               // tên môn
    type: { type: String, enum: ["LT", "TH"], required: true }, // loại môn
    periods: { type: Number, required: true, min: 1 },    // số tiết
    credits: { type: Number, required: true },            // số tín chỉ = periods / (15 hoặc 30)
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema, "subjects");
export default Subject;
