// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,         // giữ lại index ở đây
    lowercase: true,
    trim: true,
  },
  name:         { type: String, default: "" },
  role:         { type: String, default: "user", enum: ["user","admin"] },
  passwordHash: { type: String },
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

// ❌ XOÁ dòng này
// UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User
  || mongoose.model("User", UserSchema, "user_account");
