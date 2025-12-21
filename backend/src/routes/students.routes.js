// routes/students.routes.js
import { Router } from "express";
import Student from "../models/Students.js";
import asyncHandler from "express-async-handler";

const router = Router();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/students?search=...&page=1&limit=20
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search || "").trim();

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      const safe = escapeRegex(search);

      // prefix cho MSSV/lớp để có cơ hội nhanh hơn
      const prefix = new RegExp(`^${safe}`, "i");
      const contains = new RegExp(safe, "i");

      filter.$or = [
        { student_id: prefix },
        { class_id: prefix },
        { name: contains },
      ];
    }

    // chỉ trả field cần cho list để nhẹ JSON
    const projection = "student_id name class_id major_id gender";

    const [items, total] = await Promise.all([
      Student.find(filter)
        .select(projection)
        .sort({ student_id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  })
);

// GET /api/students/:student_id (detail giữ nguyên)
router.get(
  "/:student_id",
  asyncHandler(async (req, res) => {
    const { student_id } = req.params;
    const student = await Student.findOne({ student_id }).lean();

    if (!student) return res.status(404).json({ message: "Student not found" });
    return res.json(student);
  })
);

export default router;
