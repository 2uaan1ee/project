import mongoose from "mongoose";


const OpenedSubjectSchema = new mongoose.Schema(
  {
    semester: {
      type: String,
      enum: ["1", "2", "summer"],
      required: true,
      trim: true,
    },
    year: { type: String, required: true, trim: true },
    subject_ids: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
      default: [],
    },
  },
  { collection: "opened_subject", timestamps: true }
);
OpenedSubjectSchema.index({ semester: 1, year: 1 }, { unique: true });

export const OpenedSubject =
  mongoose.models.OpenedSubject || mongoose.model("OpenedSubject", OpenedSubjectSchema, "opened_subject");
