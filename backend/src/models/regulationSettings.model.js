import mongoose from "mongoose";

const RegulationSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    max_student_majors: { type: Number, default: 1, min: 0 },
    credit_coefficient_practice: { type: Number, default: 1, min: 0 },
    credit_coefficient_theory: { type: Number, default: 1, min: 0 },
  },
  {
    timestamps: true,
    collection: "regulation_settings",
  }
);

export default mongoose.models.RegulationSettings
  || mongoose.model("RegulationSettings", RegulationSettingsSchema, "regulation_settings");
