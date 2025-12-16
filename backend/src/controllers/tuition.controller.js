import asyncHandler from "express-async-handler";
import TuitionPayment from "../models/tuitionPayment.model.js";
import Student from "../models/Students.js";

const studentCollection =
  Student.collection?.name || Student.collection?.collectionName || "students";

const parseSemester = (value) => {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const listPaymentFilters = asyncHandler(async (_req, res) => {
  const data = await TuitionPayment.aggregate([
    {
      $group: {
        _id: {
          academic_year: "$academic_year",
          semester: "$semester",
          label: "$semester_label",
        },
      },
    },
    {
      $group: {
        _id: "$_id.academic_year",
        semesters: {
          $addToSet: {
            semester: "$_id.semester",
            label: "$_id.label",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        academic_year: "$_id",
        semesters: 1,
      },
    },
    { $sort: { academic_year: -1 } },
  ]);

  const normalized = data.map((entry) => ({
    academic_year: entry.academic_year,
    semesters: (entry.semesters || []).sort((a, b) => (a.semester ?? 0) - (b.semester ?? 0)),
  }));

  res.json(normalized);
});

export const summarizePayments = asyncHandler(async (req, res) => {
  const { academic_year, semester } = req.query;
  const semesterNumber = parseSemester(semester);

  if (!academic_year || semesterNumber === null) {
    return res.status(400).json({ message: "Thiếu năm học hoặc học kỳ" });
  }

  const match = {
    academic_year: academic_year,
    semester: semesterNumber,
  };

  const pipeline = [
    { $match: match },
    { $sort: { paid_at: 1, payment_sequence: 1, _id: 1 } },
    {
      $group: {
        _id: "$student_id",
        student_id: { $first: "$student_id" },
        registration_no: { $first: "$registration_no" },
        academic_year: { $first: "$academic_year" },
        semester: { $first: "$semester" },
        semester_label: { $first: "$semester_label" },
        tuition_total: { $max: "$tuition_total" },
        total_paid: { $sum: "$amount_paid" },
        last_remaining: { $last: "$remaining_balance" },
        payments: {
          $push: {
            amount_paid: "$amount_paid",
            paid_at: "$paid_at",
            receipt_number: "$receipt_number",
            payment_sequence: "$payment_sequence",
            remaining_balance: "$remaining_balance",
          },
        },
      },
    },
    {
      $lookup: {
        from: studentCollection,
        localField: "student_id",
        foreignField: "student_id",
        as: "student",
      },
    },
    {
      $lookup: {
        from: "course_registrations",
        let: { sid: "$student_id", ay: "$academic_year", sem: "$semester" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$student_id", "$$sid"] },
                  { $eq: ["$academic_year", "$$ay"] },
                  { $eq: ["$semester", "$$sem"] },
                ],
              },
            },
          },
          { $project: { name: 1, major_id: 1, faculty: 1, class_id: 1 } },
          { $limit: 1 },
        ],
        as: "registration",
      },
    },
    {
      $addFields: {
        student_name: {
          $ifNull: [
            { $arrayElemAt: ["$student.name", 0] },
            { $arrayElemAt: ["$registration.name", 0] },
          ],
        },
        class_id: {
          $ifNull: [
            { $arrayElemAt: ["$student.class_id", 0] },
            { $arrayElemAt: ["$registration.class_id", 0] },
          ],
        },
        major_id: {
          $ifNull: [
            { $arrayElemAt: ["$student.major_id", 0] },
            { $arrayElemAt: ["$registration.major_id", 0] },
          ],
        },
        faculty: {
          $ifNull: [
            { $arrayElemAt: ["$student.faculty", 0] },
            { $arrayElemAt: ["$registration.faculty", 0] },
          ],
        },
      },
    },
    { $project: { student: 0, registration: 0 } },
    {
      $addFields: {
        remaining_balance: {
          $ifNull: ["$last_remaining", { $subtract: ["$tuition_total", "$total_paid"] }],
        },
      },
    },
    { $match: { remaining_balance: { $gt: 0 } } },
    { $sort: { student_id: 1 } },
  ];

  const summary = await TuitionPayment.aggregate(pipeline);

  res.json(summary);
});
