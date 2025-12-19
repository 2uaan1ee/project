import RegulationSettings from "../models/regulationSettings.model.js";

const SETTINGS_KEY = "global";
const DEFAULT_MAX_STUDENT_MAJORS = 1;
const DEFAULT_CREDIT_COEFFICIENT = 1;

let cachedSettings = null;
let cacheReady = false;
let cachePromise = null;

function normalizeMaxStudentMajors(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_MAX_STUDENT_MAJORS;
  return Math.floor(n);
}

function normalizeCreditCoefficient(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_CREDIT_COEFFICIENT;
  return n;
}

async function loadSettings() {
  if (cachePromise) return cachePromise;
  cachePromise = RegulationSettings.findOne({ key: SETTINGS_KEY })
    .lean()
    .then((doc) => {
      cachedSettings = {
        maxStudentMajors: normalizeMaxStudentMajors(doc?.max_student_majors),
        creditCoefficientPractice: normalizeCreditCoefficient(doc?.credit_coefficient_practice),
        creditCoefficientTheory: normalizeCreditCoefficient(doc?.credit_coefficient_theory),
      };
      cacheReady = true;
      cachePromise = null;
      return cachedSettings;
    })
    .catch((err) => {
      cachePromise = null;
      throw err;
    });
  return cachePromise;
}

export async function getMaxStudentMajors() {
  if (cacheReady && cachedSettings) return cachedSettings.maxStudentMajors;
  const settings = await loadSettings();
  return settings.maxStudentMajors;
}

export async function getRegulationSettingsSnapshot() {
  if (cacheReady && cachedSettings) return cachedSettings;
  return loadSettings();
}

export async function upsertRegulationSettings({
  maxStudentMajors,
  creditCoefficientPractice,
  creditCoefficientTheory,
}) {
  const normalized = {
    maxStudentMajors: normalizeMaxStudentMajors(maxStudentMajors),
    creditCoefficientPractice: normalizeCreditCoefficient(creditCoefficientPractice),
    creditCoefficientTheory: normalizeCreditCoefficient(creditCoefficientTheory),
  };
  const doc = await RegulationSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      key: SETTINGS_KEY,
      max_student_majors: normalized.maxStudentMajors,
      credit_coefficient_practice: normalized.creditCoefficientPractice,
      credit_coefficient_theory: normalized.creditCoefficientTheory,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  cachedSettings = {
    maxStudentMajors: normalizeMaxStudentMajors(doc?.max_student_majors),
    creditCoefficientPractice: normalizeCreditCoefficient(doc?.credit_coefficient_practice),
    creditCoefficientTheory: normalizeCreditCoefficient(doc?.credit_coefficient_theory),
  };
  cacheReady = true;
  return cachedSettings;
}
