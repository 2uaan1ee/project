// backend/src/controllers/tuition.controller.js
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import TuitionPayment from "../models/tuitionPayment.model.js";
import Student from "../models/StudentV3.js";

const studentCollection =
  Student.collection?.name || Student.collection?.collectionName || "students";

const parseSemester = (value) => {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * ✅ Helper: tìm collection tuition maps mới nhất theo prefix
 * nếu TUITION_MAPS_COLLECTION chưa set trong .env
 */
async function resolveTuitionMapsCollectionName() {
  const envName = process.env.TUITION_MAPS_COLLECTION;
  if (envName && String(envName).trim()) return String(envName).trim();

  const db = mongoose.connection.db;
  const cols = await db
    .listCollections({ name: { $regex: /^student_tuition_maps_agg_/ } })
    .toArray();

  if (!cols.length) return null;

  cols.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return cols[cols.length - 1].name;
}

/**
 * ✅ NEW: list tuition maps for StudentListTuition.jsx
 * GET /api/tuition-payments/maps?page=1&limit=20&search=abc
 */
// backend/src/controllers/tuition.controller.js
export const listTuitionMaps = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const search = String(req.query.search || "").trim();

  const colName = await resolveTuitionMapsCollectionName();
  if (!colName) {
    return res.status(500).json({
      message:
        "Không tìm thấy collection student_tuition_maps_agg_. Hãy set TUITION_MAPS_COLLECTION trong .env",
    });
  }

  const db = mongoose.connection.db;
  const col = db.collection(colName);

  const filter = {};
  if (search) {
    filter.$or = [
      { student_id: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { class_id: { $regex: search, $options: "i" } },
      { major_id: { $regex: search, $options: "i" } },
      { registration_no: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  // ✅ chỉ join trên page hiện tại -> nhẹ
  const pipeline = [
    { $match: filter },
    { $sort: { student_id: 1, academic_year: -1, semester: -1, registration_round: -1 } },
    { $skip: skip },
    { $limit: limit },

    // ✅ join sang students_v3.0 (hoặc students collection model của bạn)
    {
      $lookup: {
        from: studentCollection, // lấy từ Student model bạn import ở đầu file
        let: { sid: "$student_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$student_id", "$$sid"] } } },
          { $project: { _id: 0, student_id: 1, isGraduate: 1, name: 1, full_name: 1, class_id: 1 } },
          { $limit: 1 },
        ],
        as: "_stu",
      },
    },
    {
      $addFields: {
        _stu0: { $arrayElemAt: ["$_stu", 0] },

        // ✅ field bạn cần cho FE filter
        isGraduate: { $ifNull: [{ $arrayElemAt: ["$_stu.isGraduate", 0] }, false] },

        // ✅ optional: fill name/class nếu maps thiếu
        name: { $ifNull: ["$name", { $ifNull: ["$_stu0.name", "$_stu0.full_name"] }] },
        class_id: { $ifNull: ["$class_id", "$_stu0.class_id"] },
      },
    },
    { $project: { _stu: 0, _stu0: 0 } },
  ];

  const [items, total] = await Promise.all([
    col.aggregate(pipeline, { allowDiskUse: true }).toArray(),
    col.countDocuments(filter),
  ]);

  res.json({ items, total, page, limit, collection: colName });
});


// =======================
// CŨ: filters
// =======================
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

// =======================
// CŨ: summarize payments (gộp theo student_id)
// =======================
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
        student_major_raw: { $arrayElemAt: ["$student.major_id", 0] },
        registration_major_raw: { $arrayElemAt: ["$registration.major_id", 0] },
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
            {
              $cond: [
                { $isArray: "$student_major_raw" },
                { $arrayElemAt: ["$student_major_raw", 0] },
                "$student_major_raw",
              ],
            },
            {
              $cond: [
                { $isArray: "$registration_major_raw" },
                { $arrayElemAt: ["$registration_major_raw", 0] },
                "$registration_major_raw",
              ],
            },
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
    { $project: { student: 0, registration: 0, student_major_raw: 0, registration_major_raw: 0 } },
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

// =======================
// ✅ NEW: receipts grouped by registration_no (1 post = 1 registration)
// GET /api/tuition-payments/student/:studentId?academic_year=...&semester=...
// =======================
export const listStudentReceiptsGrouped = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!studentId) return res.status(400).json({ message: "Thiếu studentId" });

  const { academic_year, semester } = req.query;
  const semesterNumber = parseSemester(semester);

  const match = { student_id: String(studentId) };
  if (academic_year) match.academic_year = String(academic_year);
  if (semester != null && semester !== "" && semesterNumber !== null) match.semester = semesterNumber;

  const pipeline = [
    { $match: match },

    // sort để payments trong group đúng thứ tự
    { $sort: { paid_at: 1, payment_sequence: 1, _id: 1 } },

    {
      $group: {
        _id: {
          registration_no: { $ifNull: ["$registration_no", "$receipt_number"] },
          academic_year: "$academic_year",
          semester: "$semester",
        },

        student_id: { $first: "$student_id" },
        registration_no: { $first: "$registration_no" },
        academic_year: { $first: "$academic_year" },
        semester: { $first: "$semester" },
        semester_label: { $first: "$semester_label" },

        tuition_total: { $max: "$tuition_total" },
        total_paid: { $sum: "$amount_paid" },
        last_remaining: { $last: "$remaining_balance" },
        last_paid_at: { $last: "$paid_at" },

        payments: {
          $push: {
            _id: "$_id",
            receipt_number: "$receipt_number",
            payment_sequence: "$payment_sequence",
            paid_at: "$paid_at",
            amount_paid: "$amount_paid",
            remaining_balance: "$remaining_balance",
          },
        },
      },
    },

    {
      $addFields: {
        remaining_balance: {
          $ifNull: ["$last_remaining", { $subtract: ["$tuition_total", "$total_paid"] }],
        },
        registration_key: {
          $ifNull: ["$registration_no", { $toString: "$_id.registration_no" }],
        },
      },
    },

    // sort group theo latest desc như feed
    { $sort: { last_paid_at: -1, registration_key: 1 } },

    {
      $project: {
        _id: 0,
        student_id: 1,
        registration_no: 1,
        registration_key: 1,
        academic_year: 1,
        semester: 1,
        semester_label: 1,
        tuition_total: 1,
        total_paid: 1,
        remaining_balance: 1,
        last_paid_at: 1,
        payments: 1,
      },
    },
  ];

  const items = await TuitionPayment.aggregate(pipeline);
  res.json({ items });
});
