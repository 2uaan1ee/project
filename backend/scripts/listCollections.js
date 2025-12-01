import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

(async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Không truy cập được đối tượng DB sau khi kết nối");
    }

    const collections = await db.listCollections().toArray();
    if (!collections.length) {
      console.log("⚠️  Database hiện chưa có collection nào");
      return;
    }

    console.log("📂 Các collection hiện có:");
    collections
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((col, idx) => {
        console.log(`${String(idx + 1).padStart(2, "0")}. ${col.name}`);
      });
  } catch (err) {
    console.error("❌ Không thể lấy danh sách collection:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();
