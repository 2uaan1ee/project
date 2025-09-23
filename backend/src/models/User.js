import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },

  // quên mật khẩu
  resetTokenHash: String,
  resetTokenExp: Date,
}, { timestamps: true, collection: "user_account", });

export default mongoose.model("User", userSchema);
