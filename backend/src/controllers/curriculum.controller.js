import asyncHandler from "express-async-handler";
import Curriculum from "../models/curriculum.model.js";
import Subject from "../models/subject.model.js";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeCode = (value) => normalizeString(value).toUpperCase();
const extractSubjectCode = (subject) =>
  normalizeCode(subject?.code || subject?.subject_id || subject?.subject_code || subject?.id);

const parseSemesterIndex = (label) => {
  const match = normalizeString(label).match(/(\d+)/);
  return match ? Number(match[1]) : undefined;
};

const normalizeSubjectList = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") {
        return { code: normalizeCode(item), note: "" };
      }
      if (item && typeof item.code === "string") {
        return {
          code: normalizeCode(item.code),
          note: normalizeString(item.note),
        };
      }
      return null;
    })
    .filter((entry) => entry && entry.code);
};

const buildSubjectMap = async (codes) => {
  if (!codes.length) return new Map();
  const subjects = await Subject.find({
    $or: [{ subject_id: { $in: codes } }, { subject_code: { $in: codes } }],
  });
  const map = new Map();
  subjects.forEach((subject) => {
    const docCode = extractSubjectCode(subject);
    if (!docCode) return;
    if (!subject.code) {
      subject.code = docCode;
    }
    if (!subject.name && subject.subject_name) {
      subject.name = subject.subject_name;
    }
    if (subject.credits == null && subject.theory_credits != null) {
      subject.credits = subject.theory_credits;
    }
    if (!subject.type && subject.subject_type) {
      subject.type = subject.subject_type;
    }
    map.set(docCode, subject);
  });
  return map;
};

const mapSubjects = async (subjectItems, cachedMap) => {
  const normalized = normalizeSubjectList(subjectItems);
  if (!normalized.length) {
    return { subjects: [], missing: [] };
  }
  const uniqueCodes = Array.from(new Set(normalized.map((item) => item.code)));
  const subjectMap = cachedMap || (await buildSubjectMap(uniqueCodes));
  const missing = uniqueCodes.filter((code) => !subjectMap.has(code));
  if (missing.length) {
    return { missing };
  }
  const subjects = normalized.map((item) => {
    const found = subjectMap.get(item.code);
    return {
      subject: found._id,
      code: found.code,
      name: found.name,
      credits: found.credits,
      type: found.type,
      note: item.note,
    };
  });
  return { subjects };
};

const buildProgramFilter = (major, programCode) => {
  const filter = { major };
  const defaultProgramMatch = [{ programCode: null }, { programCode: { $exists: false } }, { programCode: "" }];
  if (programCode === null) {
    filter.$or = defaultProgramMatch;
  } else if (programCode) {
    filter.programCode = programCode;
  } else {
    filter.$or = defaultProgramMatch;
  }
  return filter;
};

const findRepeatedCodes = (codes = []) => {
  const seen = new Set();
  const duplicates = new Set();
  codes.forEach((code) => {
    if (!code) return;
    if (seen.has(code)) {
      duplicates.add(code);
    } else {
      seen.add(code);
    }
  });
  return Array.from(duplicates);
};

const detectSemesterConflicts = async ({ major, programCode, semester, subjectCodes, ignoreId }) => {
  if (!major) {
    return { semesterExists: false, duplicateSubjects: [], repeatedSubjects: [] };
  }
  const normalizedSemester = normalizeString(semester).toLowerCase();
  const normalizedCodes = (subjectCodes || []).map(normalizeCode).filter(Boolean);
  const repeatedSubjects = findRepeatedCodes(normalizedCodes);
  const codeSet = new Set(normalizedCodes);
  const duplicatesMap = new Map();
  let semesterExists = false;

  const docs = await Curriculum.find(buildProgramFilter(major, programCode)).select("semester subjects");
  docs.forEach((doc) => {
    const isSameDoc = ignoreId && doc._id.toString() === ignoreId;
    const docSemester = normalizeString(doc.semester).toLowerCase();
    if (!isSameDoc && normalizedSemester && docSemester === normalizedSemester) {
      semesterExists = true;
    }
    if (isSameDoc) return;
    doc.subjects.forEach((subject) => {
      const code = normalizeCode(subject.code);
      if (!code || !codeSet.has(code)) return;
      if (!duplicatesMap.has(code)) {
        duplicatesMap.set(code, new Set());
      }
      duplicatesMap.get(code).add(doc.semester);
    });
  });

  const duplicateSubjects = Array.from(duplicatesMap.entries()).map(([code, semesters]) => ({
    code,
    semesters: Array.from(semesters),
  }));

  return { semesterExists, duplicateSubjects, repeatedSubjects };
};

export const listCurricula = asyncHandler(async (req, res) => {
  const { major, programCode, semester } = req.query;
  const filter = {};
  if (major) filter.major = major;
  if (programCode) filter.programCode = programCode === "null" ? null : programCode;
  if (semester) filter.semester = semester;

  const data = await Curriculum.find(filter).sort({ semesterIndex: 1, semester: 1 });
  res.json(data);
});

export const listMajors = asyncHandler(async (_req, res) => {
  const docs = await Curriculum.find({}, "major faculty programCode");
  const map = new Map();

  docs.forEach((doc) => {
    if (!map.has(doc.major)) {
      map.set(doc.major, {
        major: doc.major,
        faculties: new Set(),
        programCodes: new Set(),
      });
    }
    const entry = map.get(doc.major);
    if (doc.faculty) entry.faculties.add(doc.faculty);
    if (doc.programCode) entry.programCodes.add(doc.programCode);
  });

  const result = Array.from(map.values())
    .map((entry) => ({
      major: entry.major,
      faculties: Array.from(entry.faculties),
      programCodes: Array.from(entry.programCodes),
    }))
    .sort((a, b) => a.major.localeCompare(b.major));

  res.json(result);
});

export const lookupSubjects = asyncHandler(async (req, res) => {
  const codesParam = normalizeString(req.query.codes);
  if (!codesParam) {
    return res.status(400).json({ message: "Thiếu danh sách mã môn" });
  }
  const codes = Array.from(
    new Set(
      codesParam
        .split(",")
        .map(normalizeCode)
        .filter(Boolean)
    )
  );
  if (!codes.length) {
    return res.status(400).json({ message: "Không có mã môn hợp lệ" });
  }
  const subjectMap = await buildSubjectMap(codes);
  const missing = codes.filter((code) => !subjectMap.has(code));
  const subjects = codes
    .filter((code) => subjectMap.has(code))
    .map((code) => {
      const s = subjectMap.get(code);
      return {
        code: s.code,
        name: s.name,
        credits: s.credits,
        type: s.type,
      };
    });
  res.json({ subjects, missing });
});

export const createSemester = asyncHandler(async (req, res) => {
  const major = normalizeString(req.body?.major);
  const faculty = normalizeString(req.body?.faculty);
  const programCode = normalizeString(req.body?.programCode) || null;
  const semester = normalizeString(req.body?.semester);
  const notes = normalizeString(req.body?.notes);
  const subjectsInput = req.body?.subjects;

  if (!major || !semester) {
    return res.status(400).json({ message: "Thiếu ngành hoặc học kỳ" });
  }
  const { subjects, missing } = await mapSubjects(subjectsInput);
  if (missing && missing.length) {
    return res.status(400).json({ message: `Không tồn tại mã môn học: ${missing.join(", ")}` });
  }
  if (!subjects.length) {
    return res.status(400).json({ message: "Danh sách môn học không được rỗng" });
  }

  const semesterIndex = parseSemesterIndex(semester);
  const conflictCheck = await detectSemesterConflicts({
    major,
    programCode,
    semester,
    subjectCodes: subjects.map((subject) => subject.code),
  });

  if (conflictCheck.repeatedSubjects.length) {
    return res.status(400).json({
      message: `Mã môn bị trùng trong danh sách: ${conflictCheck.repeatedSubjects.join(", ")}`,
    });
  }

  if (conflictCheck.semesterExists) {
    return res.status(409).json({
      message: `Học kỳ ${semester} đã tồn tại cho ngành/chương trình này. Vui lòng chỉnh sửa học kỳ hiện có.`,
    });
  }

  if (conflictCheck.duplicateSubjects.length) {
    const detail = conflictCheck.duplicateSubjects
      .map((item) => `${item.code} (đã có ở ${item.semesters.join(", ")})`)
      .join(", ");
    return res.status(409).json({
      message: `Một số môn đã tồn tại ở học kỳ khác: ${detail}`,
      conflicts: conflictCheck.duplicateSubjects,
    });
  }

  const doc = await Curriculum.create({
    major,
    faculty,
    programCode,
    semester,
    semesterIndex,
    subjects,
    notes,
    createdBy: req.user?.sub,
    updatedBy: req.user?.sub,
  });

  res.status(201).json(doc);
});

export const uploadJson = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không tìm thấy file tải lên" });
  }

  let parsed;
  try {
    parsed = JSON.parse(req.file.buffer.toString("utf-8"));
  } catch (err) {
    return res.status(400).json({ message: "File JSON không hợp lệ" });
  }

  if (!Array.isArray(parsed) || !parsed.length) {
    return res.status(400).json({ message: "File JSON phải là mảng và có ít nhất 1 phần tử" });
  }

  const fallback = {
    major: normalizeString(req.body?.major),
    faculty: normalizeString(req.body?.faculty),
    programCode: normalizeString(req.body?.programCode) || null,
  };

  let entries;
  try {
    entries = parsed.map((entry, idx) => {
      const major = normalizeString(entry.major) || fallback.major;
      const faculty = normalizeString(entry.faculty) || fallback.faculty;
      const semester = normalizeString(entry.semester);
      const programCode = normalizeString(entry.programCode) || fallback.programCode;
      const notes = normalizeString(entry.notes || entry.note);
      const subjects = normalizeSubjectList(entry.subjects);

      if (!major || !semester) {
        throw new Error(`Dòng ${idx + 1}: thiếu thông tin ngành hoặc học kỳ`);
      }
      if (!subjects.length) {
        throw new Error(`Dòng ${idx + 1}: danh sách môn học rỗng`);
      }

      return {
        major,
        faculty,
        semester,
        semesterIndex: parseSemesterIndex(semester),
        programCode,
        notes,
        subjects,
      };
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Dữ liệu JSON không hợp lệ" });
  }

  const codes = Array.from(
    new Set(
      entries.flatMap((entry) => entry.subjects.map((subject) => subject.code))
    )
  );
  const subjectMap = await buildSubjectMap(codes);
  const missing = codes.filter((code) => !subjectMap.has(code));
  if (missing.length) {
    return res.status(400).json({ message: `Không tồn tại mã môn học: ${missing.join(", ")}` });
  }

  const ops = entries.map((entry) => {
    const mappedSubjects = entry.subjects.map((subject) => {
      const found = subjectMap.get(subject.code);
      return {
        subject: found._id,
        code: found.code,
        name: found.name,
        credits: found.credits,
        type: found.type,
        note: subject.note,
      };
    });

    return {
      updateOne: {
        filter: { major: entry.major, programCode: entry.programCode, semester: entry.semester },
        update: {
          $set: {
            faculty: entry.faculty,
            semesterIndex: entry.semesterIndex,
            subjects: mappedSubjects,
            notes: entry.notes,
            updatedBy: req.user?.sub,
          },
          $setOnInsert: {
            createdBy: req.user?.sub,
          },
        },
        upsert: true,
      },
    };
  });

  if (!ops.length) {
    return res.status(400).json({ message: "Không có dữ liệu để import" });
  }

  await Curriculum.bulkWrite(ops, { ordered: false });

  res.json({ message: `Đã cập nhật ${ops.length} học kỳ`, total: ops.length });
});

export const validateManualSemester = asyncHandler(async (req, res) => {
  const major = normalizeString(req.body?.major);
  const semester = normalizeString(req.body?.semester);
  const programCode = req.body?.programCode === null ? null : normalizeString(req.body?.programCode) || null;
  const subjectsInput = Array.isArray(req.body?.subjects) ? req.body.subjects : [];
  const subjectCodes = subjectsInput
    .map((item) => (typeof item === "string" ? normalizeCode(item) : normalizeCode(item?.code)))
    .filter(Boolean);

  if (!major || !semester || !subjectCodes.length) {
    return res.status(400).json({ message: "Thiếu dữ liệu để kiểm tra" });
  }

  const ignoreId = normalizeString(req.body?.ignoreId) || undefined;
  const conflicts = await detectSemesterConflicts({
    major,
    programCode,
    semester,
    subjectCodes,
    ignoreId,
  });

  res.json(conflicts);
});

export const updateSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await Curriculum.findById(id);
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy học kỳ" });
  }

  const major = normalizeString(req.body?.major) || existing.major;
  const faculty =
    req.body?.faculty !== undefined ? normalizeString(req.body?.faculty) : normalizeString(existing.faculty);
  const programCode =
    req.body?.programCode !== undefined
      ? (normalizeString(req.body?.programCode) || null)
      : existing.programCode ?? null;
  const semester = normalizeString(req.body?.semester) || existing.semester;
  const notes = req.body?.notes !== undefined ? normalizeString(req.body?.notes) : normalizeString(existing.notes);
  const subjectsInput = Array.isArray(req.body?.subjects) && req.body.subjects.length
    ? req.body.subjects
    : existing.subjects.map((subject) => ({ code: subject.code, note: subject.note }));

  if (!major || !semester) {
    return res.status(400).json({ message: "Thiếu ngành hoặc học kỳ" });
  }

  const { subjects, missing } = await mapSubjects(subjectsInput);
  if (missing && missing.length) {
    return res.status(400).json({ message: `Không tồn tại mã môn học: ${missing.join(", ")}` });
  }
  if (!subjects.length) {
    return res.status(400).json({ message: "Danh sách môn học không được rỗng" });
  }

  const conflictCheck = await detectSemesterConflicts({
    major,
    programCode,
    semester,
    subjectCodes: subjects.map((subject) => subject.code),
    ignoreId: id,
  });

  if (conflictCheck.repeatedSubjects.length) {
    return res.status(400).json({
      message: `Mã môn bị trùng trong danh sách: ${conflictCheck.repeatedSubjects.join(", ")}`,
    });
  }

  if (conflictCheck.semesterExists) {
    return res.status(409).json({
      message: `Đã có học kỳ ${semester} cho ngành/chương trình này.`,
    });
  }

  if (conflictCheck.duplicateSubjects.length) {
    const detail = conflictCheck.duplicateSubjects
      .map((item) => `${item.code} (đã có ở ${item.semesters.join(", ")})`)
      .join(", ");
    return res.status(409).json({
      message: `Một số môn đã tồn tại ở học kỳ khác: ${detail}`,
      conflicts: conflictCheck.duplicateSubjects,
    });
  }

  existing.set({
    major,
    faculty,
    programCode,
    semester,
    semesterIndex: parseSemesterIndex(semester),
    subjects,
    notes,
    updatedBy: req.user?.sub,
  });

  const updated = await existing.save();
  res.json(updated);
});

export const deleteSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await Curriculum.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Không tìm thấy học kỳ" });
  }
  res.json({ message: `Đã xóa học kỳ ${deleted.semester}`, id: deleted._id });
});
