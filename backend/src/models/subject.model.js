// src/models/subject.js
import mongoose from "mongoose";

const subjectTypeSchema = new mongoose.Schema(
  {
    code: { type: String, enum: ["LT", "TH"], required: true },
    subject_coeff: { type: Number },
    unit_price: { type: Number }
  },
  { collection: "subject_type", timestamps: true }
);

export const SubjectType =
  mongoose.models.SubjectType ||
  mongoose.model("SubjectType", subjectTypeSchema, "subject_type");

const SubjectSchema = new mongoose.Schema(
  {
    subject_id:      { type: String, required: true, unique: true, index: true },
    subject_name:    String,
    subjectEL_name:  String,
    faculty_id:      String,   // ví dụ: KHOA_HTTT
    subject_type:    { type: mongoose.Schema.Types.ObjectId, ref: "SubjectType" },
    old_id:          [String],
    equivalent_id:   [String],
    prerequisite_id: [String],
    previous_id:     [String],
    theory_credits:  { type: Number, default: 0 },
    practice_credits:{ type: Number, default: 0 },
  },
  { collection: "subject", timestamps: true }
);
SubjectSchema.index({ subject_id: 1 }, { unique: true });

export const Subject =
  mongoose.models.Subject || mongoose.model("Subject", SubjectSchema, "subject");
