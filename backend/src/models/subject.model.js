import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema(
  {
    subject_id: String,
    subject_name: String,
    subjectEL_name: String,
    faculty_id: String,
    subject_type: String,
    theory_credits: Number,
    practice_credits: Number,
    total_periods: Number,
    prerequisite_id: [String],
    equivalent_id: [String],
    previous_id: [String],
    old_id: [String],
  },
  { timestamps: true, collection: "subject" }
);

export default mongoose.models.Subject ||
  mongoose.model("Subject", SubjectSchema);
