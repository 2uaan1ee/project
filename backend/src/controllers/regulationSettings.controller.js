import {
  getRegulationSettingsSnapshot,
  upsertRegulationSettings,
} from "../services/regulationSettings.js";
import CourseRegistration from "../models/CourseRegistration.js";
import HistoryChange from "../models/historyChange.model.js";

export async function getRegulationSettings(_req, res) {
  const settings = await getRegulationSettingsSnapshot();
  return res.json({
    success: true,
    settings: {
      maxStudentMajors: settings.maxStudentMajors,
      creditCoefficientPractice: settings.creditCoefficientPractice,
      creditCoefficientTheory: settings.creditCoefficientTheory,
      practiceCreditCost: settings.practiceCreditCost,
      theoryCreditCost: settings.theoryCreditCost,
      allowPriorityDiscount: settings.allowPriorityDiscount,
      updatedAt: settings.updatedAt,
    },
  });
}

export async function updateRegulationSettings(req, res) {
  const {
    maxStudentMajors,
    creditCoefficientPractice,
    creditCoefficientTheory,
    practiceCreditCost,
    theoryCreditCost,
    allowPriorityDiscount,
  } = req.body || {};

  if (maxStudentMajors === undefined || maxStudentMajors === null) {
    return res.status(400).json({
      success: false,
      message: "Thiếu giá trị Số ngành học tối đa.",
    });
  }
  if (creditCoefficientPractice === undefined || creditCoefficientPractice === null) {
    return res.status(400).json({
      success: false,
      message: "Thiếu hệ số tín chỉ / tiết cho tín chỉ thực hành.",
    });
  }
  if (creditCoefficientTheory === undefined || creditCoefficientTheory === null) {
    return res.status(400).json({
      success: false,
      message: "Thiếu hệ số tín chỉ / tiết cho tín chỉ lý thuyết.",
    });
  }
  if (practiceCreditCost === undefined || practiceCreditCost === null) {
    return res.status(400).json({
      success: false,
      message: "Thiếu chi phí 1 tín chỉ thực hành.",
    });
  }
  if (theoryCreditCost === undefined || theoryCreditCost === null) {
    return res.status(400).json({
      success: false,
      message: "Thiếu chi phí 1 tín chỉ lý thuyết.",
    });
  }

  const practiceCostValue = Number(practiceCreditCost);
  const theoryCostValue = Number(theoryCreditCost);
  if (!Number.isFinite(practiceCostValue) || practiceCostValue < 0) {
    return res.status(400).json({
      success: false,
      message: "Chi phí 1 tín chỉ thực hành không hợp lệ.",
    });
  }
  if (!Number.isFinite(theoryCostValue) || theoryCostValue < 0) {
    return res.status(400).json({
      success: false,
      message: "Chi phí 1 tín chỉ lý thuyết không hợp lệ.",
    });
  }
  const practiceCoefficientValue = Number(creditCoefficientPractice);
  const theoryCoefficientValue = Number(creditCoefficientTheory);
  if (!Number.isFinite(practiceCoefficientValue) || practiceCoefficientValue <= 0) {
    return res.status(400).json({
      success: false,
      message: "Hệ số tín chỉ / tiết cho tín chỉ thực hành phải lớn hơn 0.",
    });
  }
  if (!Number.isFinite(theoryCoefficientValue) || theoryCoefficientValue <= 0) {
    return res.status(400).json({
      success: false,
      message: "Hệ số tín chỉ / tiết cho tín chỉ lý thuyết phải lớn hơn 0.",
    });
  }
  const currentFee = await CourseRegistration.findOne({
    "tuition.fee_per_credit_theory": { $exists: true },
    "tuition.fee_per_credit_practice": { $exists: true },
  })
    .select({ "tuition.fee_per_credit_theory": 1, "tuition.fee_per_credit_practice": 1 })
    .lean();
  const feesChanged =
    Number(currentFee?.tuition?.fee_per_credit_practice) !== practiceCostValue
    || Number(currentFee?.tuition?.fee_per_credit_theory) !== theoryCostValue;

  if (feesChanged) {
    const snapshotAt = new Date();
    const registrations = await CourseRegistration.find({}).lean();
    if (registrations.length > 0) {
      const historyDocs = registrations.map((doc) => {
        const { _id, ...rest } = doc;
        return {
          ...rest,
          original_id: _id,
          history_changed_at: snapshotAt,
          history_change_type: "regulation_fee_update",
        };
      });
      await HistoryChange.insertMany(historyDocs);
    }
    await CourseRegistration.updateMany(
      {},
      [
        {
          $set: {
            "tuition.fee_per_credit_theory": theoryCostValue,
            "tuition.fee_per_credit_practice": practiceCostValue,
            "tuition.amount_theory": {
              $multiply: [
                { $ifNull: ["$tuition.total_theory_credits", 0] },
                theoryCostValue,
              ],
            },
            "tuition.amount_practice": {
              $multiply: [
                { $ifNull: ["$tuition.total_practice_credits", 0] },
                practiceCostValue,
              ],
            },
            "tuition.amount_total": {
              $add: [
                {
                  $multiply: [
                    { $ifNull: ["$tuition.total_theory_credits", 0] },
                    theoryCostValue,
                  ],
                },
                {
                  $multiply: [
                    { $ifNull: ["$tuition.total_practice_credits", 0] },
                    practiceCostValue,
                  ],
                },
              ],
            },
          },
        },
      ]
    );
  }

  if (allowPriorityDiscount === false) {
    await CourseRegistration.updateMany(
      {},
      {
        $set: {
          "tuition.discount_rate": 0,
        },
      }
    );
  }

  const settings = await upsertRegulationSettings({
    maxStudentMajors,
    creditCoefficientPractice,
    creditCoefficientTheory,
    allowPriorityDiscount,
  });
  return res.json({
    success: true,
    settings: {
      ...settings,
      practiceCreditCost: practiceCostValue,
      theoryCreditCost: theoryCostValue,
    },
  });
}
