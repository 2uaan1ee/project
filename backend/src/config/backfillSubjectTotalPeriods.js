import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Subject from "../models/subject.model.js";
import { getRegulationSettingsSnapshot } from "../services/regulationSettings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const args = new Set(process.argv.slice(2));
const updateAll = args.has("--all") || args.has("-a");

async function run() {
  await connectDB();

  const settings = await getRegulationSettingsSnapshot();
  const coeffTheory = Number(settings.creditCoefficientTheory) || 0;
  const coeffPractice = Number(settings.creditCoefficientPractice) || 0;

  const filter = updateAll
    ? {}
    : {
        $or: [{ total_periods: { $exists: false } }, { total_periods: null }],
      };

  const subjects = await Subject.find(filter)
    .select({ _id: 1, theory_credits: 1, practice_credits: 1, total_periods: 1 })
    .lean();

  if (!subjects.length) {
    console.log("No subjects matched for backfill.");
    return;
  }

  const ops = [];
  for (const subject of subjects) {
    const theory = Number(subject.theory_credits) || 0;
    const practice = Number(subject.practice_credits) || 0;
    const totalPeriods = theory * coeffTheory + practice * coeffPractice;

    if (updateAll && Number(subject.total_periods) === totalPeriods) continue;

    ops.push({
      updateOne: {
        filter: { _id: subject._id },
        update: { $set: { total_periods: totalPeriods } },
      },
    });
  }

  if (!ops.length) {
    console.log("No subjects required updates.");
    return;
  }

  const result = await Subject.bulkWrite(ops, { ordered: false });
  console.log(
    `Backfill done. matched=${result.matchedCount} modified=${result.modifiedCount}`
  );
}

run()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
