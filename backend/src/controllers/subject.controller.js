// src/controllers/subject.controller.js
import { Subject, SubjectType } from "../models/subject.model.js";
import { OpenedSubject } from "../models/opened-subject.model.js";

const ensureArray = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  if (typeof v === "string") {
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [v];
};

const numOrUndef = (v) =>
  v === null || v === undefined || v === "" ? undefined : Number(v);

function normalizeSubject(doc) {
  return {
    ...doc,
    equivalent_id: ensureArray(doc.equivalent_id),
    prerequisite_id: ensureArray(doc.prerequisite_id),
    previous_id: ensureArray(doc.previous_id),
    old_id: ensureArray(doc.old_id),
    theory_credits: numOrUndef(doc.theory_credits),
    practice_credits: numOrUndef(doc.practice_credits),
  };
}

export const createOrUpdateSubject = async (req, res) => {
  try {
    const {
      subject_id,
      subject_name,
      subjectEL_name,
      faculty_id,
      subject_type, // code "LT" / "TH"
      old_id,
      equivalent_id,
      prerequisite_id,
      previous_id,
      theory_credits,
      practice_credits,
      status,
      upsert,
    } = req.body;

    if (!subject_id) {
      return res.status(400).json({ message: "subject_id là bắt buộc" });
    }
    if (!subject_type) {
      return res
        .status(400)
        .json({ message: "subject_type (code) là bắt buộc" });
    }

    const subjectTypeDoc = await SubjectType.findOne({ code: subject_type });
    if (!subjectTypeDoc) {
      return res.status(400).json({
        message: `Không tìm thấy SubjectType với code=${subject_type}`,
      });
    }

    const now = new Date();
    const doc = normalizeSubject({
      subject_id,
      subject_name,
      subjectEL_name,
      faculty_id,
      subject_type: subjectTypeDoc._id,
      old_id,
      equivalent_id,
      prerequisite_id,
      previous_id,
      theory_credits,
      practice_credits,
      status,
    });

    if (upsert) {
      const { createdAt, updatedAt, ...rest } = doc;
      const result = await Subject.updateOne(
        { subject_id: doc.subject_id },
        {
          $set: { ...rest, updatedAt: updatedAt || now },
          $setOnInsert: { createdAt: createdAt || now },
        },
        { upsert: true }
      );
      return res.json({ ok: true, mode: "upsert", result });
    }

    const created = await Subject.create(doc);
    return res.status(201).json({ ok: true, mode: "insert", subject: created });
  } catch (err) {
    console.error("❌ createOrUpdateSubject error:", err);
    res.status(500).json({
      message: "Lỗi server khi lưu môn học",
      error: err.message,
    });
  }
};

export const listSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .limit(100)
      .populate("subject_type");
    res.json(subjects);
  } catch (err) {
    console.error("❌ listSubjects error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getOpenedSubjects = async (req, res) => {
  try {
    const { year, semester } = req.query || {};
    const normalizedYear = String(year || "").trim();
    const normalizedSemester = String(semester || "").trim();

    const filter = {};
    if (normalizedYear) {
      filter.year = normalizedYear;
    }
    if (normalizedSemester) {
      filter.semester = normalizedSemester;
    }

    const openedSubjects = await OpenedSubject.find(filter)
      .populate("subject_ids")
      .sort({ year: -1, semester: 1 });

    return res.json({
      ok: true,
      opened_subjects: openedSubjects,
      count: openedSubjects.length,
    });
  } catch (err) {
    console.error("❌ getOpenedSubjects error:", err);
    res.status(500).json({
      message: "Không thể tải danh sách môn học đã mở.",
      error: err.message,
    });
  }
};

export const openSubjects = async (req, res) => {
  try {
    const { year, semester, subject_ids } = req.body || {};

    const normalizedYear = String(year || "").trim();
    const normalizedSemester = String(semester || "").trim();
    const subjectCodes = Array.from(
      new Set(
        ensureArray(subject_ids)
          .map((code) => String(code || "").trim())
          .filter(Boolean)
      )
    );

    if (!normalizedYear || !normalizedSemester) {
      return res
        .status(400)
        .json({ message: "Năm học và học kỳ là bắt buộc." });
    }

    if (subjectCodes.length === 0) {
      return res
        .status(400)
        .json({ message: "Cần ít nhất 1 mã môn học để mở đăng ký." });
    }

    const subjects = await Subject.find({
      subject_id: { $in: subjectCodes },
    }).select("_id subject_id");

    const missing = subjectCodes.filter(
      (code) => !subjects.some((subject) => subject.subject_id === code)
    );

    if (missing.length) {
      return res.status(400).json({
        message: `Không tìm thấy các mã môn học: ${missing.join(", ")}`,
        missing_subject_ids: missing,
      });
    }

    const opened = await OpenedSubject.findOneAndUpdate(
      { year: normalizedYear, semester: normalizedSemester },
      { $set: { subject_ids: subjects.map((subject) => subject._id) } },
      { upsert: true, new: true }
    ).populate("subject_ids");

    return res.json({
      ok: true,
      opened_subject: opened,
      subject_count: subjects.length,
    });
  } catch (err) {
    console.error("❌ openSubjects error:", err);
    res.status(500).json({
      message: "Đã xảy ra lỗi khi lưu danh sách môn học mở đăng ký.",
      error: err.message,
    });
  }
};
