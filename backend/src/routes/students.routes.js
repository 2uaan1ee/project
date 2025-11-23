// routes/students.routes.js
import { Router } from "express";
import Student from "../models/Students.js";
import asyncHandler from "express-async-handler";

const router = Router();

// GET /api/students?search=...
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const filter = {};

    if (search && String(search).trim() !== "") {
      const regex = new RegExp(String(search).trim(), "i");
      filter.$or = [
        { student_id: regex },
        { name: regex },
        { class_id: regex },
      ];
    }

    const students = await Student.find(filter).sort({ student_id: 1 });
    return res.json(students);
  })
);

// GET /api/students/:student_id
router.get(
  "/:student_id",
  asyncHandler(async (req, res) => {
    const { student_id } = req.params;

    const student = await Student.findOne({ student_id });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(student);
  })
);

export default router;
