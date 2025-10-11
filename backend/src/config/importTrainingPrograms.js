import path from "path"; // ✅ thêm dòng này
import mongoose from "mongoose";
import dotenv from "dotenv";
import TrainingProgram from "../models/trainingProgram.model.js";
import { connectDB } from "./db.js";

// Load .env ở thư mục backend (đi từ src/config ra root backend)
dotenv.config({ path: "backend/.env" });

const programs = [
  { name: "Chương trình Chuẩn", code: "STD", description: "Đại học chính quy chương trình chuẩn theo quy định của Bộ GD&ĐT." },
  { name: "Chính quy Việt - Nhật", code: "VJ", description: "Chương trình hợp tác Việt - Nhật đào tạo kỹ sư CNTT với định hướng Nhật Bản." },
  { name: "Cử nhân Tài năng", code: "CN_TN", description: "Chương trình đào tạo Cử nhân Tài năng cho sinh viên xuất sắc." },
  { name: "Kỹ sư Tài năng", code: "KS_TN", description: "Chương trình đào tạo Kỹ sư Tài năng với chuẩn đầu ra cao." },
  { name: "Chương trình Chất lượng cao", code: "CLC", description: "Chương trình chất lượng cao giảng dạy bằng tiếng Anh." },
  { name: "Chương trình Tiên tiến", code: "TT", description: "Chương trình tiên tiến hợp tác quốc tế, học bằng tiếng Anh." },
  { name: "Cử nhân Liên thông CNTT", code: "LT_CNTT", description: "Chương trình liên thông đại học ngành Công nghệ Thông tin." },
  { name: "Văn bằng hai CNTT", code: "VB2_CNTT", description: "Chương trình đào tạo văn bằng hai ngành Công nghệ Thông tin." },
];

async function main() {
  await connectDB();

  const result = await TrainingProgram.bulkWrite(
    programs.map((p) => ({
      updateOne: {
        filter: { code: p.code },
        update: { $set: p },
        upsert: true,
      },
    }))
  );

  console.log("✅ Import done");
  console.log("Upserted:", result.upsertedCount || 0);
  console.log("Modified:", result.modifiedCount || 0);

  const total = await TrainingProgram.countDocuments();
  console.log("Total programs:", total);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Import error:", err);
  process.exit(1);
});
