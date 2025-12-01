// backend/src/models/subject.model.js
import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subject_id: { type: String, required: true, unique: true },
    subject_name: { type: String, required: true },
    subjectEL_name: { type: String },
    subject_type: { type: String },
    theory_credits: { type: Number },
    practice_credits: { type: Number },
    faculty_id: { type: String },
    status: { type: String, default: "open" },
    prerequisite_id: { type: [String], default: [] },
    equivalent_id: { type: [String], default: [] },
    previous_id: { type: [String], default: [] },
    subject_code: { type: String },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const normalize = (value) => (typeof value === "string" ? value.trim() : "");
const prefer = (...values) => values.find((value) => normalize(value)) || "";

subjectSchema.virtual("code")
  .get(function () {
    return prefer(this.subject_code, this.subject_id, this.id);
  })
  .set(function (value) {
    const normalized = normalize(value).toUpperCase();
    this.subject_id = normalized;
  });

subjectSchema.virtual("name")
  .get(function () {
    return this.subject_name;
  })
  .set(function (value) {
    this.subject_name = value;
  });

subjectSchema.virtual("englishName")
  .get(function () {
    return this.subjectEL_name;
  })
  .set(function (value) {
    this.subjectEL_name = value;
  });

subjectSchema.virtual("type")
  .get(function () {
    return this.subject_type;
  })
  .set(function (value) {
    this.subject_type = value;
  });

subjectSchema.virtual("credits")
  .get(function () {
    return this.theory_credits;
  })
  .set(function (value) {
    this.theory_credits = value;
  });

subjectSchema.virtual("practiceCredits")
  .get(function () {
    return this.practice_credits;
  })
  .set(function (value) {
    this.practice_credits = value;
  });

subjectSchema.set("toObject", { virtuals: true });
subjectSchema.set("toJSON", { virtuals: true });

const SUBJECT_COLLECTION = process.env.SUBJECT_COLLECTION || "subject";
const Subject = mongoose.model("Subject", subjectSchema, SUBJECT_COLLECTION);
export default Subject;
