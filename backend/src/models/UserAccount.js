import mongoose from "mongoose";
import validator from "validator";

const userAccountSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: {
    type: String, required: true, lowercase: true, trim: true,
    validate: [validator.isEmail, "Invalid email"]
  },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

// dùng lại model nếu hot-reload
export default mongoose.models.UserAccount
  || mongoose.model("UserAccount", userAccountSchema, "user_account");
