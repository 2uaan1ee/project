import mongoose from "mongoose";

const trainingProgramSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

// 👇 ép Mongoose dùng đúng collection name mong muốn
const TrainingProgram = mongoose.model("TrainingProgram", trainingProgramSchema, "training_programs");

export default TrainingProgram;