// backend/src/config/importSubject.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { load } from "cheerio";          // ⬅️ dùng named import thay cho default
import { getRegulationSettingsSnapshot } from "../services/regulationSettings.js";

// ----- ESM __dirname -----
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load .env ở thư mục backend (đi từ src/config ra root backend)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ---- Kết nối Mongo ----
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/quanlene-db";

await mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 8000,
});
console.log("✅ MongoDB connected");

// ---- Mongoose Model ----
const SubjectSchema = new mongoose.Schema(
  {
    subject_id:      { type: String, required: true, unique: true, index: true },
    subject_name:    String,
    subjectEL_name:  String,
    faculty_id:      String,   // ví dụ: KHOA_HTTT
    subject_type:    String,   // CN/CSN/...
    old_id:          [String],
    equivalent_id:   [String],
    prerequisite_id: [String],
    previous_id:     [String],
    theory_credits:  { type: Number, default: 0 },
    practice_credits:{ type: Number, default: 0 },
    total_periods:   { type: Number, default: 0 },
    status:          { type: String, enum: ["open", "closed"], default: "open" },
  },
  { collection: "subject", timestamps: true }
);
SubjectSchema.index({ subject_id: 1 }, { unique: true });

const Subject =
  mongoose.models.Subject || mongoose.model("Subject", SubjectSchema, "subject");

// ---- Helper ----
function splitCellHtml(html = "") {
  // tách theo <br> và làm sạch
  return String(html || "")
    .split(/<br\s*\/?>/i)
    .map(s => s.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}

function i(text) {
  return (text || "").trim();
}

function toInt(x) {
  const n = parseInt(String(x).trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

// ---- ĐƯỜNG DẪN FILE HTML CẦN ĐỌC ----
// Đặt file trong: backend/src/config/“Danh mục môn học _ Cổng thông tin đào tạo.html”
const inputHtmlPath = path.join(
  __dirname,
  "Danh mục môn học _ Cổng thông tin đào tạo.html"
);

// ---- Main ----
async function main() {
  const html = await fs.readFile(inputHtmlPath, "utf8");

  const $ = load(html);

  const settings = await getRegulationSettingsSnapshot();
  const coeffTheory = Number(settings.creditCoefficientTheory) || 0;
  const coeffPractice = Number(settings.creditCoefficientPractice) || 0;

  const docs = [];
  $("table.tablesorter tbody tr").each((_idx, el) => {
    const $row = $(el);
    const $td  = $row.find("td");

    // các cột (đã xem mẫu bạn gửi)
    const subject_id     = i($td.eq(1).text());
    const subject_name   = i($td.eq(2).text());
    const subjectEL_name = i($td.eq(3).text());

    const statusImg = $td.eq(4).find("img").attr("src") || "";
    const status    = statusImg.includes("checked.png") ? "open" : "closed";

    const facultyShort = i($td.eq(5).text());    // ví dụ "HTTT"
    const subject_type = i($td.eq(6).text());

    const old_id          = splitCellHtml($td.eq(7).html());
    const equivalent_id   = splitCellHtml($td.eq(8).html());
    const prerequisite_id = splitCellHtml($td.eq(9).html());
    const previous_id     = splitCellHtml($td.eq(10).html());

    const theory_credits   = toInt($td.eq(11).text());
    const practice_credits = toInt($td.eq(12).text());

    if (!subject_id) return; // bỏ hàng lỗi

    const doc = {
      subject_id,
      subject_name,
      subjectEL_name,
      faculty_id: facultyShort ? `KHOA_${facultyShort}` : "",
      subject_type,
      old_id,
      equivalent_id,
      prerequisite_id,
      previous_id,
      theory_credits,
      practice_credits,
      total_periods:
        theory_credits * coeffTheory + practice_credits * coeffPractice,
      status, // "open" | "closed"
    };
    docs.push(doc);
  });

  if (!docs.length) {
    console.log("⚠️  Không tìm thấy hàng nào trong bảng.");
    return;
  }

  // Upsert theo subject_id (idempotent)
  const ops = docs.map(d => ({
    updateOne: {
      filter: { subject_id: d.subject_id },
      update: { $set: d },
      upsert: true,
    },
  }));

  const result = await Subject.bulkWrite(ops, { ordered: false });
  console.log("✅ Import xong.");
  console.log("   upserted:", result.upsertedCount || 0);
  console.log("   modified:", result.modifiedCount || 0);

  // thống kê nhanh
  const total  = await Subject.countDocuments();
  const openC  = await Subject.countDocuments({ status: "open" });
  const closeC = await Subject.countDocuments({ status: "closed" });
  console.log(`   Tổng: ${total} | mở: ${openC} | đóng: ${closeC}`);
}

main()
  .catch(err => {
    console.error("❌ Import error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(()=>{});
  });
