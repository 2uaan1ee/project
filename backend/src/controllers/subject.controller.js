// src/controllers/subject.controller.js
import { Subject, SubjectType } from "../models/subject.model.js";

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
