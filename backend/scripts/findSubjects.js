import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

const collectionName = process.env.SUBJECT_COLLECTION || "subject";
const codes = process.argv.slice(2).map((code) => code.trim().toUpperCase()).filter(Boolean);

if (!codes.length) {
  console.error("⚠️  Vui lòng truyền ít nhất 1 mã môn, ví dụ: npm run find:subjects CE005 IT001");
  process.exit(1);
}

(async () => {
  try {
    await connectDB();
    const collection = mongoose.connection.db.collection(collectionName);
    const docs = await collection
      .find({ $or: [{ subject_id: { $in: codes } }, { subject_code: { $in: codes } }] })
      .toArray();

    if (!docs.length) {
      console.log("❌ Không tìm thấy mã nào trong database");
    } else {
      docs.forEach((doc) => {
        console.log("────────────────────────");
        console.log("subject_id:", doc.subject_id);
        console.log("subject_name:", doc.subject_name);
        console.log("subject_type:", doc.subject_type);
        console.log("theory_credits:", doc.theory_credits);
        console.log("practice_credits:", doc.practice_credits);
        console.log("subject_code:", doc.subject_code);
      });
    }
  } catch (err) {
    console.error("❌ Lỗi tìm môn:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();
