import mongoose from "mongoose";

const subjectEntrySchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    credits: { type: Number },
    type: { type: String },
    note: { type: String },
  },
  { _id: false }
);

const curriculumSchema = new mongoose.Schema(
  {
    major: { type: String, required: true, trim: true },
    faculty: { type: String, trim: true },
    programCode: { type: String, trim: true, default: null },
    semester: { type: String, required: true, trim: true },
    semesterIndex: { type: Number },
    subjects: { type: [subjectEntrySchema], default: [] },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "training_curricula",
  }
);

curriculumSchema.index({ major: 1, programCode: 1, semester: 1 }, { unique: true });

const Curriculum = mongoose.model("Curriculum", curriculumSchema, "training_curricula");
export default Curriculum;
