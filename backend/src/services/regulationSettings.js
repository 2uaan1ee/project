import RegulationSettings from "../models/regulationSettings.model.js";
import CourseRegistration from "../models/CourseRegistration.js";

const SETTINGS_KEY = "global";
const DEFAULT_MAX_STUDENT_MAJORS = 1;
const DEFAULT_CREDIT_COEFFICIENT = 1;
const DEFAULT_CREDIT_COST = 1;
const DEFAULT_ALLOW_PRIORITY_DISCOUNT = true;

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

function normalizeCreditCost(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_CREDIT_COST;
  return n;
}

function normalizeAllowPriorityDiscount(value) {
  if (value === undefined || value === null) return DEFAULT_ALLOW_PRIORITY_DISCOUNT;
  return Boolean(value);
}

async function loadSettings() {
  if (cachePromise) return cachePromise;
  cachePromise = RegulationSettings.findOne({ key: SETTINGS_KEY })
    .lean()
    .then(async (doc) => {
      const registrationFees = await getCourseRegistrationFees();
      cachedSettings = {
        maxStudentMajors: normalizeMaxStudentMajors(doc?.max_student_majors),
        creditCoefficientPractice: normalizeCreditCoefficient(doc?.credit_coefficient_practice),
        creditCoefficientTheory: normalizeCreditCoefficient(doc?.credit_coefficient_theory),
        practiceCreditCost: registrationFees.practiceCreditCost,
        theoryCreditCost: registrationFees.theoryCreditCost,
        allowPriorityDiscount: normalizeAllowPriorityDiscount(doc?.allow_priority_discount),
        createdAt: doc?.createdAt ?? null,
        updatedAt: doc?.updatedAt ?? null,
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
  if (cacheReady && cachedSettings) {
    const registrationFees = await getCourseRegistrationFees();
    cachedSettings = {
      ...cachedSettings,
      practiceCreditCost: registrationFees.practiceCreditCost,
      theoryCreditCost: registrationFees.theoryCreditCost,
    };
    return cachedSettings;
  }
  return loadSettings();
}

export async function upsertRegulationSettings({
  maxStudentMajors,
  creditCoefficientPractice,
  creditCoefficientTheory,
  allowPriorityDiscount,
}) {
  const normalized = {
    maxStudentMajors: normalizeMaxStudentMajors(maxStudentMajors),
    creditCoefficientPractice: normalizeCreditCoefficient(creditCoefficientPractice),
    creditCoefficientTheory: normalizeCreditCoefficient(creditCoefficientTheory),
    allowPriorityDiscount: normalizeAllowPriorityDiscount(allowPriorityDiscount),
  };
  const doc = await RegulationSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      $set: {
        key: SETTINGS_KEY,
        max_student_majors: normalized.maxStudentMajors,
        credit_coefficient_practice: normalized.creditCoefficientPractice,
        credit_coefficient_theory: normalized.creditCoefficientTheory,
        allow_priority_discount: normalized.allowPriorityDiscount,
      },
      $unset: {
        practice_credit_cost: "",
        theory_credit_cost: "",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const registrationFees = await getCourseRegistrationFees();
  cachedSettings = {
    maxStudentMajors: normalizeMaxStudentMajors(doc?.max_student_majors),
    creditCoefficientPractice: normalizeCreditCoefficient(doc?.credit_coefficient_practice),
    creditCoefficientTheory: normalizeCreditCoefficient(doc?.credit_coefficient_theory),
    practiceCreditCost: registrationFees.practiceCreditCost,
    theoryCreditCost: registrationFees.theoryCreditCost,
    allowPriorityDiscount: normalizeAllowPriorityDiscount(doc?.allow_priority_discount),
    createdAt: doc?.createdAt ?? null,
    updatedAt: doc?.updatedAt ?? null,
  };
  cacheReady = true;
  return cachedSettings;
}

async function getCourseRegistrationFees() {
  const doc = await CourseRegistration.findOne({
    "tuition.fee_per_credit_theory": { $exists: true },
    "tuition.fee_per_credit_practice": { $exists: true },
  })
    .select({ "tuition.fee_per_credit_theory": 1, "tuition.fee_per_credit_practice": 1 })
    .lean();
  return {
    practiceCreditCost: normalizeCreditCost(doc?.tuition?.fee_per_credit_practice),
    theoryCreditCost: normalizeCreditCost(doc?.tuition?.fee_per_credit_theory),
  };
}
