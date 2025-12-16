// Script để kiểm tra training programs trong database
import mongoose from "mongoose";
import dotenv from "dotenv";
import TrainingProgram from "../models/trainingProgram.model.js";
import { connectDB } from "./db.js";

dotenv.config();

async function checkTrainingPrograms() {
  try {
    await connectDB();

    console.log("\n=== KIỂM TRA TRAINING PROGRAMS ===\n");

    // Đếm tổng số
    const total = await TrainingProgram.countDocuments();
    console.log(`📊 Tổng số training programs: ${total}`);

    if (total === 0) {
      console.log("\n⚠️ KHÔNG CÓ TRAINING PROGRAM NÀO!");
      console.log("💡 Cần import training programs trước khi import môn học mở");
      console.log("📝 Chạy: node src/config/importTrainingPrograms.js");
      process.exit(0);
    }

    // Lấy theo học kỳ
    const byHK1 = await TrainingProgram.find({ semester: "HK1" });
    const byHK2 = await TrainingProgram.find({ semester: "HK2" });
    const byHK3 = await TrainingProgram.find({ semester: "HK3" });

    console.log(`\n📚 Theo học kỳ:`);
    console.log(`   HK1: ${byHK1.length} ngành`);
    console.log(`   HK2: ${byHK2.length} ngành`);
    console.log(`   HK3: ${byHK3.length} ngành`);

    // Lấy tất cả
    const all = await TrainingProgram.find({});
    
    console.log(`\n📋 Chi tiết các ngành:\n`);
    
    const byFaculty = {};
    all.forEach(prog => {
      if (!byFaculty[prog.faculty]) {
        byFaculty[prog.faculty] = [];
      }
      byFaculty[prog.faculty].push(prog);
    });

    Object.keys(byFaculty).forEach(faculty => {
      console.log(`\n🏫 ${faculty}:`);
      byFaculty[faculty].forEach(prog => {
        console.log(`   - ${prog.major} (${prog.semester}): ${prog.subjects.length} môn`);
      });
    });

    // Chi tiết HK2
    if (byHK2.length > 0) {
      console.log(`\n\n🔍 CHI TIẾT HK2 (${byHK2.length} ngành):\n`);
      byHK2.forEach(prog => {
        console.log(`\n📌 ${prog.major} - ${prog.faculty}`);
        console.log(`   Số môn: ${prog.subjects.length}`);
        console.log(`   Các môn: ${prog.subjects.slice(0, 10).join(", ")}${prog.subjects.length > 10 ? "..." : ""}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

checkTrainingPrograms();
