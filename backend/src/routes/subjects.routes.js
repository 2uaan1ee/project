import express from "express";
import multer from "multer";
import { load } from "cheerio";
import Subject from "../models/subject.model.js";
import { requireAdmin, verifyJwt } from "../middleware/auth.js";
import { getRegulationSettingsSnapshot } from "../services/regulationSettings.js";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

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

const normalizeSubjectIdList = (value) => {
    const list = normalizeArrayField(value);
    if (list === undefined) return undefined;
    return list.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
};

const normalizeNumberField = (value) => {
    if (value === undefined) return undefined;
    if (value === "" || value == null) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
};

const findMissingSubjectIds = async (ids) => {
    if (!ids || ids.length === 0) return [];
    const uniqueIds = Array.from(new Set(ids));
    const existing = await Subject.find(
        { subject_id: { $in: uniqueIds } },
        { subject_id: 1 }
    ).lean();
    const existingSet = new Set(existing.map((item) => item.subject_id));
    return uniqueIds.filter((id) => !existingSet.has(id));
};

const splitCellHtml = (html = "") =>
    String(html || "")
        .split(/<br\s*\/?>/i)
        .map((s) => s.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean);

const toInt = (value) => {
    const n = parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(n) ? n : 0;
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

router.post("/import-html", verifyJwt, requireAdmin, (req, res) => {
    upload.single("file")(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
            }
            if (err) {
                return res.status(400).json({ message: err.message || "Lỗi upload" });
            }

            const file = req.file;
            if (!file) {
                return res.status(400).json({ message: "Thiếu file HTML" });
            }

            const originalName = String(file.originalname || "").toLowerCase();
            const mimeType = String(file.mimetype || "").toLowerCase();
            if (!originalName.endsWith(".html") && !mimeType.includes("html")) {
                return res.status(400).json({ message: "Chỉ hỗ trợ file .html" });
            }

            const html = file.buffer.toString("utf8");
            const $ = load(html);

            const settings = await getRegulationSettingsSnapshot();
            const coeffTheory = Number(settings.creditCoefficientTheory) || 0;
            const coeffPractice = Number(settings.creditCoefficientPractice) || 0;

            const errors = [];
            const docs = [];
            $("table.tablesorter tbody tr").each((_idx, el) => {
                const $row = $(el);
                const $td = $row.find("td");

                const subject_id = String($td.eq(1).text() || "").trim();
                const subject_name = String($td.eq(2).text() || "").trim();
                const subjectEL_name = String($td.eq(3).text() || "").trim();

                const statusImg = $td.eq(4).find("img").attr("src") || "";
                const status = statusImg.includes("checked.png") ? "open" : "closed";

                const facultyShort = String($td.eq(5).text() || "").trim();
                const subject_type = String($td.eq(6).text() || "").trim();

                const old_id = splitCellHtml($td.eq(7).html());
                const equivalent_id = splitCellHtml($td.eq(8).html());
                const prerequisite_id = splitCellHtml($td.eq(9).html());
                const previous_id = splitCellHtml($td.eq(10).html());

                const theory_credits = toInt($td.eq(11).text());
                const practice_credits = toInt($td.eq(12).text());

                if (!subject_id) {
                    errors.push({
                        row: _idx + 1,
                        subject_id: "",
                        reason: "Thiếu mã môn học",
                    });
                    return;
                }

                if (!subject_name) {
                    errors.push({
                        row: _idx + 1,
                        subject_id,
                        reason: "Thiếu tên môn học",
                    });
                    return;
                }

                if (!subjectEL_name) {
                    errors.push({
                        row: _idx + 1,
                        subject_id,
                        reason: "Thiếu tên môn học tiếng Anh",
                    });
                    return;
                }

                if (!subject_type) {
                    errors.push({
                        row: _idx + 1,
                        subject_id,
                        reason: "Thiếu loại môn học",
                    });
                    return;
                }

                if (!facultyShort) {
                    errors.push({
                        row: _idx + 1,
                        subject_id,
                        reason: "Thiếu khoa quản lý",
                    });
                    return;
                }

                if (theory_credits < 0 || practice_credits < 0) {
                    errors.push({
                        row: _idx + 1,
                        subject_id,
                        reason: "Tín chỉ phải lớn hơn hoặc bằng 0",
                    });
                    return;
                }

                docs.push({
                    subject_id,
                    subject_name,
                    subjectEL_name,
                    faculty_id: facultyShort ? `KHOA_${facultyShort}` : "",
                    subject_type,
                    old_id,
                    equivalent_id,
                    prerequisite_id,
                    previous_id,
                    theory_credits,
                    practice_credits,
                    total_periods:
                        theory_credits * coeffTheory + practice_credits * coeffPractice,
                    status,
                });
            });

            if (!docs.length) {
                return res.status(400).json({
                    message: "Không tìm thấy dữ liệu môn học hợp lệ trong bảng.",
                    invalid: errors.length,
                    errors: errors.slice(0, 20),
                });
            }

            const ops = docs.map((doc) => ({
                updateOne: {
                    filter: { subject_id: doc.subject_id },
                    update: { $set: doc },
                    upsert: true,
                },
            }));

            const result = await Subject.bulkWrite(ops, { ordered: false });
            return res.json({
                message: "Đã nhập danh sách môn học",
                parsed: docs.length,
                upserted: result.upsertedCount || 0,
                modified: result.modifiedCount || 0,
                invalid: errors.length,
                errors: errors.slice(0, 20),
            });
        } catch (error) {
            console.error("Error importing subjects:", error);
            return res.status(500).json({ message: "Lỗi khi nhập danh sách môn học" });
        }
    });
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

        const prerequisiteIds = normalizeSubjectIdList(req.body.prerequisite_id);
        const equivalentIds = normalizeSubjectIdList(req.body.equivalent_id);
        if (req.body.prerequisite_id !== undefined) {
            payload.prerequisite_id = prerequisiteIds;
        }
        if (req.body.equivalent_id !== undefined) {
            payload.equivalent_id = equivalentIds;
        }
        const arrayFields = ["old_id", "previous_id"];
        arrayFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                payload[field] = normalizeArrayField(req.body[field]);
            }
        });

        const missingPrereq = await findMissingSubjectIds(prerequisiteIds);
        if (missingPrereq.length > 0) {
            return res.status(400).json({
                message: `Môn tiên quyết không tồn tại: ${missingPrereq.join(", ")}`,
            });
        }
        const missingEquivalent = await findMissingSubjectIds(equivalentIds);
        if (missingEquivalent.length > 0) {
            return res.status(400).json({
                message: `Môn tương đương không tồn tại: ${missingEquivalent.join(", ")}`,
            });
        }

        if (req.body.theory_credits !== undefined) {
            payload.theory_credits = normalizeNumberField(req.body.theory_credits);
        }

        if (req.body.practice_credits !== undefined) {
            payload.practice_credits = normalizeNumberField(req.body.practice_credits);
        }
        if (payload.theory_credits != null && payload.theory_credits < 0) {
            return res.status(400).json({ message: "TC lý thuyết phải lớn hơn hoặc bằng 0" });
        }
        if (payload.practice_credits != null && payload.practice_credits < 0) {
            return res.status(400).json({ message: "TC thực hành phải lớn hơn hoặc bằng 0" });
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

        const prerequisiteIds = normalizeSubjectIdList(req.body.prerequisite_id);
        const equivalentIds = normalizeSubjectIdList(req.body.equivalent_id);
        if (req.body.prerequisite_id !== undefined) {
            update.prerequisite_id = prerequisiteIds;
        }
        if (req.body.equivalent_id !== undefined) {
            update.equivalent_id = equivalentIds;
        }
        const arrayFields = ["old_id", "previous_id"];
        arrayFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                update[field] = normalizeArrayField(req.body[field]);
            }
        });

        const missingPrereq = await findMissingSubjectIds(prerequisiteIds);
        if (missingPrereq.length > 0) {
            return res.status(400).json({
                message: `Môn tiên quyết không tồn tại: ${missingPrereq.join(", ")}`,
            });
        }
        const missingEquivalent = await findMissingSubjectIds(equivalentIds);
        if (missingEquivalent.length > 0) {
            return res.status(400).json({
                message: `Môn tương đương không tồn tại: ${missingEquivalent.join(", ")}`,
            });
        }

        if (req.body.theory_credits !== undefined) {
            update.theory_credits = normalizeNumberField(req.body.theory_credits);
        }

        if (req.body.practice_credits !== undefined) {
            update.practice_credits = normalizeNumberField(req.body.practice_credits);
        }
        if (update.theory_credits != null && update.theory_credits < 0) {
            return res.status(400).json({ message: "TC lý thuyết phải lớn hơn hoặc bằng 0" });
        }
        if (update.practice_credits != null && update.practice_credits < 0) {
            return res.status(400).json({ message: "TC thực hành phải lớn hơn hoặc bằng 0" });
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
