// src/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email:        { type: String, unique: true, index: true, required: true },
    name:         { type: String },
    role:         { type: String, default: "user" },
    passwordHash: { type: String }, // trống nếu đăng nhập Google
    googleId:     { type: String },

    resetTokenHash: { type: String },
    resetTokenExp:  { type: Date },
  },
  {
    timestamps: true,
    collection: "user_account", // ⬅️ lưu đúng collection này
  }
);

// Dùng model đã tồn tại nếu có (tránh lỗi khi hot-reload)
export default mongoose.models.User
  || mongoose.model("User", UserSchema, "user_account"); // ⬅️ tham số 3 củng cố tên collection
