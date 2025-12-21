import mongoose from "mongoose";
import dotenv from "dotenv";
import SubjectOpen from "../models/subjectOpen.model.js";
import { connectDB } from "./db.js";

dotenv.config();

const sampleData = [
  {
    academicYear: "2025-2026",
    semester: "HK2",
    subjects: [
      { stt: 1, subject_id: "IT001" },
      { stt: 2, subject_id: "IT002" },
      { stt: 3, subject_id: "IT003" },
      { stt: 4, subject_id: "IT004" },
      { stt: 5, subject_id: "IT005" },
    ],
    isPublic: false,
    createdBy: "admin@uit.edu.vn",
  },
  {
    academicYear: "2025-2026",
    semester: "HK3",
    subjects: [
      { stt: 1, subject_id: "IT006" },
      { stt: 2, subject_id: "IT007" },
    ],
    isPublic: true,
    createdBy: "admin@uit.edu.vn",
  },
];

async function seedSubjectOpen() {
  try {
    await connectDB();

    // Xóa dữ liệu cũ
    await SubjectOpen.deleteMany({});
    console.log("✅ Đã xóa dữ liệu cũ");

    // Thêm dữ liệu mới
    const result = await SubjectOpen.insertMany(sampleData);
    console.log(`✅ Đã thêm ${result.length} danh sách môn học mở`);

    console.log("\n📋 Danh sách đã thêm:");
    result.forEach((item) => {
      console.log(
        `   - ${item.academicYear} ${item.semester}: ${item.subjects.length} môn (${
          item.isPublic ? "Public" : "Private"
        })`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
}

seedSubjectOpen();
