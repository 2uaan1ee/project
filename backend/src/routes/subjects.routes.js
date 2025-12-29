import express from "express";
import Subject from "../models/subject.model.js";
import { requireAdmin, verifyJwt } from "../middleware/auth.js";
import { getRegulationSettingsSnapshot } from "../services/regulationSettings.js";

const router = express.Router();

const normalizeArrayField = (value) => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter(Boolean);
    }
    if (value == null) return [];
    const str = String(value).trim();
    if (!str) return [];
    return str.split(",").map((v) => v.trim()).filter(Boolean);
};

const normalizeNumberField = (value) => {
    if (value === undefined) return undefined;
    if (value === "" || value == null) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
};

router.get("/open", async (req, res) => {
    try {
        const data = await Subject.find({ status: "open" }).lean();
        res.json(data);
    } catch (err) {
        console.error("Error loading subjects:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/", verifyJwt, requireAdmin, async (req, res) => {
    try {
        const { subject_id } = req.body || {};
        const normalizedId = String(subject_id || "").trim().toUpperCase();
        if (!normalizedId) {
            return res.status(400).json({ message: "Thiếu mã môn học" });
        }

        const existing = await Subject.findOne({ subject_id: normalizedId }).lean();
        if (existing) {
            return res.status(409).json({ message: "Mã môn học đã tồn tại" });
        }

        const payload = {
            subject_id: normalizedId,
        };

        const stringFields = ["subject_name", "subjectEL_name", "faculty_id", "subject_type"];
        stringFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                payload[field] = String(req.body[field]).trim();
            }
        });

        const arrayFields = ["prerequisite_id", "equivalent_id", "old_id", "previous_id"];
        arrayFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                payload[field] = normalizeArrayField(req.body[field]);
            }
        });

        if (req.body.theory_credits !== undefined) {
            payload.theory_credits = normalizeNumberField(req.body.theory_credits);
        }

        if (req.body.practice_credits !== undefined) {
            payload.practice_credits = normalizeNumberField(req.body.practice_credits);
        }

        const settings = await getRegulationSettingsSnapshot();
        const totalPeriods =
            (Number(payload.theory_credits) || 0) * (Number(settings.creditCoefficientTheory) || 0) +
            (Number(payload.practice_credits) || 0) * (Number(settings.creditCoefficientPractice) || 0);
        payload.total_periods = totalPeriods;

        const created = await Subject.create(payload);
        return res.status(201).json({ subject: created });
    } catch (err) {
        console.error("Error creating subject:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/:subject_id", verifyJwt, requireAdmin, async (req, res) => {
    try {
        const { subject_id } = req.params;
        const existingSubject = await Subject.findOne({ subject_id }).lean();
        if (!existingSubject) {
            return res.status(404).json({ message: "Không tìm thấy môn học" });
        }
        const update = {};

        const stringFields = ["subject_name", "subjectEL_name", "faculty_id", "subject_type"];
        stringFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                update[field] = String(req.body[field]).trim();
            }
        });

        const arrayFields = ["prerequisite_id", "equivalent_id", "old_id", "previous_id"];
        arrayFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                update[field] = normalizeArrayField(req.body[field]);
            }
        });

        if (req.body.theory_credits !== undefined) {
            update.theory_credits = normalizeNumberField(req.body.theory_credits);
        }

        if (req.body.practice_credits !== undefined) {
            update.practice_credits = normalizeNumberField(req.body.practice_credits);
        }

        const theoryCredits = Object.prototype.hasOwnProperty.call(update, "theory_credits")
            ? update.theory_credits
            : existingSubject.theory_credits;
        const practiceCredits = Object.prototype.hasOwnProperty.call(update, "practice_credits")
            ? update.practice_credits
            : existingSubject.practice_credits;
        const settings = await getRegulationSettingsSnapshot();
        const totalPeriods =
            (Number(theoryCredits) || 0) * (Number(settings.creditCoefficientTheory) || 0) +
            (Number(practiceCredits) || 0) * (Number(settings.creditCoefficientPractice) || 0);
        update.total_periods = totalPeriods;

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
        }

        const subject = await Subject.findOneAndUpdate(
            { subject_id },
            { $set: update },
            { new: true }
        ).lean();

        if (!subject) {
            return res.status(404).json({ message: "Không tìm thấy môn học" });
        }

        res.json({ subject });
    } catch (err) {
        console.error("Error updating subject:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:subject_id", verifyJwt, requireAdmin, async (req, res) => {
    try {
        const { subject_id } = req.params;
        const subject = await Subject.findOneAndDelete({ subject_id }).lean();

        if (!subject) {
            return res.status(404).json({ message: "Không tìm thấy môn học" });
        }

        res.json({ message: "Đã xóa môn học", subject });
    } catch (err) {
        console.error("Error deleting subject:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Search subjects by ID or name (for validation)
router.get("/", verifyJwt, async (req, res) => {
    try {
        const { search } = req.query;
        
        if (!search) {
            const subjects = await Subject.find({}).lean();
            return res.json({ subjects });
        }
        
        const subjects = await Subject.find({
            $or: [
                { subject_id: { $regex: search, $options: "i" } },
                { subject_name: { $regex: search, $options: "i" } }
            ]
        }).lean();
        
        res.json({ subjects });
    } catch (err) {
        console.error("Error searching subjects:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
