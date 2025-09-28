// models/User.js (cả web admin & web chính)
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,  // ✅ tự động toLowerCase
    trim: true,       // ✅ tự động trim
  },
  name:         { type: String, default: "" },
  role:         { type: String, default: "user", enum: ["user","admin"] },
  passwordHash: { type: String },      // rỗng nếu login Google
  googleId:     { type: String },

  resetTokenHash: { type: String },
  resetTokenExp:  { type: Date },

  isVerified: { type: Boolean, default: true },
  invitedBy:  { type: String },
  invitedAt:  { type: Date },
}, {
  timestamps: true,
  collection: "user_account",
});

// đảm bảo unique theo email (phòng khi index chưa tạo)
UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User
  || mongoose.model("User", UserSchema, "user_account");
