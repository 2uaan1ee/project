import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import Subject from "../src/models/subject.model.js";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

const limitArg = Number(process.argv[2]);
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 200;

(async () => {
  try {
    await connectDB();
    const subjects = await Subject.find({})
      .sort({ code: 1, subject_id: 1 })
      .limit(limit)
      .lean();

    if (!subjects.length) {
      console.log("⚠️  Không tìm thấy môn học nào trong database");
      process.exit(0);
    }

    console.log(`📚 Danh sách môn học (tối đa ${limit})`);
    const normalizeRecord = (s) => ({
      code: s.code || s.subject_id || s.subject_code || s.id,
      name: s.name || s.subject_name || s.subjectEL_name,
      type: s.type || s.subject_type || s.status,
      theoryCredits: s.credits ?? s.theory_credits ?? null,
      practiceCredits: s.practice_credits ?? null,
    });

    console.table(subjects.map(normalizeRecord));
  } catch (err) {
    console.error("❌ Không thể lấy danh sách môn học:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();
