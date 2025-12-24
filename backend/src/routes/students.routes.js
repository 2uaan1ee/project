import { Router } from "express";
import asyncHandler from "express-async-handler";
import StudentV3 from "../models/StudentV3.js";

const router = Router();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeGender(g) {
  if (g === "Nam") return "Male";
  if (g === "Nữ") return "Female";
  return g || "";
}

function normalizeStudentV3(doc) {
  if (!doc) return null;

  const s = doc;
  const name = s.name || s.full_name || "";
  const birthplace = s.birthplace || s.birthplace_province || "";

  const major_id = s.major_id || s.major?.major_id || "";

  const contact = {
    school_email: s.contact?.school_email || "",
    alias_email: s.contact?.alias_email || "",
    personal_email: s.contact?.personal_email || s.contact?.email || "",
    phone: s.contact?.phone || "",
  };

  const address = {
    permanent_address: s.address?.permanent_address || s.household_address || "",
    temporary_address: s.address?.temporary_address || "",
    hometown: s.address?.hometown || s.address?.hometown_full || "",
    is_remote_area: !!(s.address?.is_remote_area || s.priority_flags?.is_remote_area),
    hometown_full: s.address?.hometown_full || "",
    hometown_district: s.address?.hometown_district || "",
    hometown_province: s.address?.hometown_province || "",
  };

  const identity = {
    identity_number: s.identity?.identity_number || "",
    identity_issue_date: s.identity?.identity_issue_date || "",
    identity_issue_place: s.identity?.identity_issue_place || "",
    ethnicity: s.identity?.ethnicity || "",
    religion: s.identity?.religion || "",
    origin: s.identity?.origin || "",
    union_join_date: s.identity?.union_join_date || "",
    party_join_date: s.identity?.party_join_date || "",
    highest_position: s.identity?.highest_position || "",
    is_ethnic_minority: !!s.identity?.is_ethnic_minority,
  };

  const fatherRaw = s.family?.father || {};
  const motherRaw = s.family?.mother || {};
  const guardianRaw = s.family?.guardian || {};

  const family = {
    father: {
      name: fatherRaw.name || "",
      job: fatherRaw.job || fatherRaw.occupation || "",
      phone: fatherRaw.phone || "",
      address: fatherRaw.address || fatherRaw.household_address || "",
    },
    mother: {
      name: motherRaw.name || "",
      job: motherRaw.job || motherRaw.occupation || "",
      phone: motherRaw.phone || "",
      address: motherRaw.address || motherRaw.household_address || "",
    },
    guardian: {
      name: guardianRaw.name || "",
      job: guardianRaw.job || guardianRaw.occupation || "",
      phone: guardianRaw.phone || "",
      address: guardianRaw.address || guardianRaw.household_address || "",
    },
  };

  const priority = {
    code: s.priority?.code || "NONE",
    label: s.priority?.label || "Không ưu tiên",
    discount_rate: Number(s.priority?.discount_rate || 0),
    reason: s.priority?.reason || "",
  };

  const priority_flags = {
    is_child_of_martyr: !!s.priority_flags?.is_child_of_martyr,
    is_child_of_invalid: !!s.priority_flags?.is_child_of_invalid,
    is_remote_area: !!s.priority_flags?.is_remote_area,
    is_ethnic_minority: !!s.priority_flags?.is_ethnic_minority,
  };

  return {
    ...s,
    // FE cũ dùng
    name,
    birthplace,
    gender: normalizeGender(s.gender),
    major_id,
    contact,
    address,
    identity,
    family,
    priority,
    priority_flags,
  };
}

// GET /api/students?search=...&page=1&limit=20&grad=all|true|false&sort=student_id|name|class_id&order=asc|desc
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search || "").trim();

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const skip = (page - 1) * limit;

    const grad = String(req.query.grad || "all"); // all|true|false
    const sortKey = String(req.query.sort || "student_id"); // student_id|name|class_id
    const order = String(req.query.order || "asc"); // asc|desc

    const filter = {};

    // filter tốt nghiệp
    if (grad === "true") filter.isGraduate = true;
    else if (grad === "false") filter.isGraduate = false;

    // search
    if (search) {
      const safe = escapeRegex(search);
      const prefix = new RegExp(`^${safe}`, "i");
      const contains = new RegExp(safe, "i");
      filter.$or = [
        { student_id: prefix },
        { class_id: prefix },
        { name: contains },
        { full_name: contains },
      ];
    }

    // sort whitelist
    const SORT_MAP = {
      student_id: "student_id",
      name: "full_name", // ưu tiên full_name cho v3
      class_id: "class_id",
    };
    const sortField = SORT_MAP[sortKey] || "student_id";
    const sortDir = order === "desc" ? -1 : 1;

    // projection list (nhẹ)
    const projection = {
      student_id: 1,
      class_id: 1,
      gender: 1,
      name: 1,
      full_name: 1,
      major_id: 1,
      major: 1,
      isGraduate: 1,
    };

    const [docs, total] = await Promise.all([
      StudentV3.find(filter)
        .select(projection)
        .sort({ [sortField]: sortDir, student_id: 1 }) // tie-break MSSV
        .skip(skip)
        .limit(limit)
        .lean(),
      StudentV3.countDocuments(filter),
    ]);

    const items = docs.map((d) => {
      const n = normalizeStudentV3(d);
      return {
        _id: d._id,
        student_id: n.student_id,
        name: n.name,
        class_id: n.class_id,
        major_id: n.major_id,
        gender: n.gender,
        isGraduate: !!d.isGraduate,
      };
    });

    return res.json({ items, total, page, limit });
  })
);

// GET /api/students/:student_id
router.get(
  "/:student_id",
  asyncHandler(async (req, res) => {
    const { student_id } = req.params;
    const doc = await StudentV3.findOne({ student_id }).lean();

    if (!doc) return res.status(404).json({ message: "Student not found" });
    return res.json(normalizeStudentV3(doc));
  })
);

export default router;
