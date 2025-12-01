import dotenv from "dotenv";
import mongoose from "mongoose";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { connectDB } from "../src/config/db.js";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

const collectionName = process.env.SUBJECT_COLLECTION || "subject";
const outArg = process.argv[2];
const defaultName = `subjects_export_${new Date().toISOString().slice(0, 10)}.csv`;
const outputPath = resolve(process.cwd(), outArg || defaultName);

const pick = (value, fallback = "") => (value ?? fallback);
const toCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  if (/[",\n]/.test(str)) {
    return `"${str}"`;
  }
  return str;
};

const normalizeSubject = (doc) => ({
  code: doc.code || doc.subject_id || doc.subject_code || doc.id || "",
  name: doc.name || doc.subject_name || "",
  englishName: doc.subjectEL_name || "",
  type: doc.type || doc.subject_type || doc.status || "",
  theoryCredits: doc.credits ?? doc.theory_credits ?? "",
  practiceCredits: doc.practice_credits ?? "",
  facultyId: doc.faculty_id || "",
  status: doc.status || "",
  prerequisites: Array.isArray(doc.prerequisite_id) ? doc.prerequisite_id.join(";") : "",
});

(async () => {
  try {
    await connectDB();
    const cursor = mongoose.connection.db.collection(collectionName).find({}).sort({ subject_id: 1 });
    const docs = await cursor.toArray();
    if (!docs.length) {
      console.log(`⚠️  Không có dữ liệu trong collection ${collectionName}`);
      return;
    }

    const normalized = docs.map(normalizeSubject);
    const headers = Object.keys(normalized[0]);
    const lines = [headers.join(","), ...normalized.map((row) => headers.map((key) => toCsvValue(row[key])).join(","))];

    await writeFile(outputPath, lines.join("\n"), "utf8");
    console.log(`✅ Đã xuất ${normalized.length} môn học ra file ${outputPath}`);
  } catch (err) {
    console.error("❌ Lỗi xuất CSV:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();
