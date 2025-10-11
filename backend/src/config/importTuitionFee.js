import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./db.js";
import TrainingProgram from "../models/trainingProgram.model.js";
import TuitionFee from "../models/tuitionFee.model.js";

// Load .env ở thư mục backend (đi từ src/config ra root backend)
dotenv.config({ path: "backend/.env" });

// ------------------------------
// Helpers
// ------------------------------
function randomIncrease(value) {
  if (!value) return value;
  const match = value.match(/([\d.,]+)/);
  if (!match) return value;

  const base = parseFloat(match[1].replace(/,/g, ""));
  const percent = 8 + Math.random() * 4; // 8–12%
  const increased = base * (1 + percent / 100);

  return {
    value: value.replace(match[1], increased.toLocaleString("vi-VN", { maximumFractionDigits: 0 })),
    percent: percent.toFixed(1),
  };
}

function increaseTuition(baseYearData) {
  const clone = JSON.parse(JSON.stringify(baseYearData));

  const r1 = randomIncrease(clone.regular_semester.new_course_fee);
  const r2 = randomIncrease(clone.regular_semester.retake_fee);
  const r3 = randomIncrease(clone.regular_semester.improve_fee);
  const r4 = randomIncrease(clone.summer_or_off_hours.retake_fee);
  const r5 = randomIncrease(clone.summer_or_off_hours.improve_fee);

  clone.regular_semester.new_course_fee = r1.value;
  clone.regular_semester.retake_fee = r2.value;
  clone.regular_semester.improve_fee = r3.value;
  clone.summer_or_off_hours.retake_fee = r4.value;
  clone.summer_or_off_hours.improve_fee = r5.value;

  // Lưu % tăng trung bình
  clone.percent_increase = (
    (parseFloat(r1.percent) +
      parseFloat(r2.percent) +
      parseFloat(r3.percent) +
      parseFloat(r4.percent) +
      parseFloat(r5.percent)) /
    5
  ).toFixed(1);

  return clone;
}

// ------------------------------
// Dữ liệu gốc 2020–2025
// ------------------------------
const tuitionData = [
  {
    academic_year: "2020-2021",
    applicable_cohorts: ["2020"],
    regular_semester: {
      new_course_fee: "11,700,000 VND/năm",
      retake_fee: "390,000 VND/tín chỉ",
      improve_fee: "420,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "585,000 VND/tín chỉ",
      improve_fee: "630,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2021-2022",
    applicable_cohorts: ["2020"],
    regular_semester: {
      new_course_fee: "12,000,000 VND/năm",
      retake_fee: "370,000 VND/tín chỉ",
      improve_fee: "370,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "555,000 VND/tín chỉ",
      improve_fee: "555,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2021-2022",
    applicable_cohorts: ["2021"],
    regular_semester: {
      new_course_fee: "24,000,000 VND/năm",
      retake_fee: "720,000 VND/tín chỉ",
      improve_fee: "720,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "1,080,000 VND/tín chỉ",
      improve_fee: "1,080,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2022-2023",
    applicable_cohorts: ["2020"],
    regular_semester: {
      new_course_fee: "14,500,000 VND/năm",
      retake_fee: "435,000 VND/tín chỉ",
      improve_fee: "435,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "650,000 VND/tín chỉ",
      improve_fee: "650,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2022-2023",
    applicable_cohorts: ["2021", "2022"],
    regular_semester: {
      new_course_fee: "29,000,000 VND/năm",
      retake_fee: "870,000 VND/tín chỉ",
      improve_fee: "870,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "1,300,000 VND/tín chỉ",
      improve_fee: "1,300,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2023-2024",
    applicable_cohorts: ["2020"],
    regular_semester: {
      new_course_fee: "16,000,000 VND/năm",
      retake_fee: "470,000 VND/tín chỉ",
      improve_fee: "470,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "705,000 VND/tín chỉ",
      improve_fee: "705,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2023-2024",
    applicable_cohorts: ["2021", "2022", "2023"],
    regular_semester: {
      new_course_fee: "32,000,000 VND/năm",
      retake_fee: "950,000 VND/tín chỉ",
      improve_fee: "950,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "1,425,000 VND/tín chỉ",
      improve_fee: "1,425,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2024-2025",
    applicable_cohorts: ["2020"],
    regular_semester: {
      new_course_fee: "505,000 VND/tín chỉ",
      retake_fee: "505,000 VND/tín chỉ",
      improve_fee: "505,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "760,000 VND/tín chỉ",
      improve_fee: "760,000 VND/tín chỉ",
    },
  },
  {
    academic_year: "2024-2025",
    applicable_cohorts: ["2021", "2022", "2023", "2024"],
    regular_semester: {
      new_course_fee: "32,800,000 VND/năm",
      retake_fee: "980,000 VND/tín chỉ",
      improve_fee: "980,000 VND/tín chỉ",
    },
    summer_or_off_hours: {
      retake_fee: "1,470,000 VND/tín chỉ",
      improve_fee: "1,470,000 VND/tín chỉ",
    },
  },
];

// ------------------------------
// Import logic
// ------------------------------
async function main() {
  await connectDB();

  const programs = await TrainingProgram.find({});
  const programMap = Object.fromEntries(programs.map((p) => [p.code, p._id]));

  const entries = [];
  const baseYears = [...tuitionData];

  // 🔹 Sinh các năm học tiếp theo đến 2030–2031
  const endYear = 2030;

  let currentYears = tuitionData.filter((t) => t.academic_year === "2024-2025");
  let nextYearStart = 2025;

  while (nextYearStart < endYear) {
    const newBatch = [];
    for (const item of currentYears) {
      const increased = increaseTuition(item);
      increased.academic_year = `${nextYearStart}-${nextYearStart + 1}`;
      newBatch.push(increased);
    }
    baseYears.push(...newBatch);
    currentYears = newBatch;
    nextYearStart++;
  }

  // 🔹 Tạo document cho từng năm & học kỳ
  for (const item of baseYears) {
    const semesters = ["1", "2", "Hè"];
    for (const sem of semesters) {
      entries.push({
        academic_year: item.academic_year,
        semester: sem,
        tuition_details: [
          {
            program_id: programMap.STD,
            new_course_fee: item.regular_semester.new_course_fee,
            retake_fee: item.regular_semester.retake_fee,
            improve_fee: item.regular_semester.improve_fee,
          },
        ],
        note: item.percent_increase
          ? `Tăng trung bình ${item.percent_increase}% so với năm trước`
          : `Áp dụng cho khóa ${item.applicable_cohorts.join(", ")}`,
      });
    }
  }

  // 🔹 Upsert
  for (const entry of entries) {
    await TuitionFee.updateOne(
      {
        academic_year: entry.academic_year,
        semester: entry.semester,
        "tuition_details.program_id": entry.tuition_details[0].program_id,
      },
      { $set: entry },
      { upsert: true }
    );
  }

  console.log(`✅ Imported ${entries.length} tuition fee records (2020–${endYear})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Import error:", err);
  process.exit(1);
});
