import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

(async () => {
  try {
    await connectDB();
    const doc = await mongoose.connection.db.collection(process.env.SUBJECT_COLLECTION || "subject").findOne();
    if (!doc) {
      console.log("⚠️  Collection subject không có bản ghi nào");
    } else {
      console.log("📄 Mẫu document đầu tiên trong collection:");
      console.dir(doc, { depth: null, colors: true });
    }
  } catch (err) {
    console.error("❌ Không thể đọc dữ liệu subject:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();
