import {
  getRegulationSettingsSnapshot,
  upsertRegulationSettings,
} from "../services/regulationSettings.js";

export async function getRegulationSettings(_req, res) {
  const settings = await getRegulationSettingsSnapshot();
  return res.json({
    success: true,
    settings: {
      maxStudentMajors: settings.maxStudentMajors,
      creditCoefficientPractice: settings.creditCoefficientPractice,
      creditCoefficientTheory: settings.creditCoefficientTheory,
    },
  });
}

export async function updateRegulationSettings(req, res) {
  const {
    maxStudentMajors,
    creditCoefficientPractice,
    creditCoefficientTheory,
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

  const settings = await upsertRegulationSettings({
    maxStudentMajors,
    creditCoefficientPractice,
    creditCoefficientTheory,
  });
  return res.json({
    success: true,
    settings,
  });
}
