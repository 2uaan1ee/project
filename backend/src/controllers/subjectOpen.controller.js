import SubjectOpen from "../models/subjectOpen.model.js";
import TrainingProgram from "../models/trainingProgram.model.js";
import Subject from "../models/subject.model.js";
import xlsx from "xlsx";

// Helper function để validate subjects tồn tại trong database
async function validateSubjectsExist(subjectIds) {
  // Bulk fetch to avoid sequential DB calls
  const uniqueIds = [...new Set(subjectIds)];
  const found = await Subject.find({ subject_id: { $in: uniqueIds } }).select("subject_id").lean();
  const foundSet = new Set((found || []).map((s) => s.subject_id));
  const validSubjects = [];
  const invalidSubjects = [];
  uniqueIds.forEach((id) => {
    if (foundSet.has(id)) validSubjects.push(id);
    else invalidSubjects.push(id);
  });
  return { valid: validSubjects, invalid: invalidSubjects };
}

// Helper function để validate môn học mở với training program
async function validateWithTrainingProgram(academicYear, semester, subjectIds) {
  console.log(`[Validation] Checking training programs for semester: ${semester}`);

  // HK3 là học kỳ hè - không cần validate với CTĐT
  if (semester === "HK3") {
    console.log(`[Validation] ℹ️ HK3 is summer semester - skipping training program validation`);
    return {
      valid: true,
      message: "Học kỳ hè không cần kiểm tra theo chương trình đào tạo",
      missingByMajor: [],
      isSummerSemester: true,
    };
  }

  // Map semester:
  // HK1 (học kỳ 1 các năm) -> các học kỳ lẻ: 1, 3, 5, 7
  // HK2 (học kỳ 2 các năm) -> các học kỳ chẵn: 2, 4, 6, 8
  const semestersToCheck = semester === "HK1"
    ? ["Học kỳ 1", "Học kỳ 3", "Học kỳ 5", "Học kỳ 7"]
    : ["Học kỳ 2", "Học kỳ 4", "Học kỳ 6", "Học kỳ 8"];

  console.log(`[Validation] Mapping ${semester} to semesters:`, semestersToCheck);

  // Lấy tất cả training programs của các học kỳ tương ứng
  const trainingPrograms = await TrainingProgram.find({
    semester: { $in: semestersToCheck }
  });

  console.log(`[Validation] Found ${trainingPrograms.length} training programs across ${semestersToCheck.join(", ")}`);

  if (trainingPrograms.length === 0) {
    console.warn(`[Validation] ⚠️ No training programs found for ${semester} (checked: ${semestersToCheck.join(", ")})`);
    // CẢNH BÁO: Không có CTĐT để so sánh
    return {
      valid: true, // Cho phép nhưng có warning
      message: `⚠️ CẢNH BÁO: Không tìm thấy chương trình đào tạo cho ${semester}. Không thể kiểm tra tính đầy đủ.`,
      missingByMajor: [],
      warning: true,
      noTrainingProgram: true,
    };
  }

  // Group programs by major and faculty để gộp các môn từ nhiều học kỳ
  const programsByMajor = {};
  trainingPrograms.forEach(program => {
    const key = `${program.major}|||${program.faculty}`;
    if (!programsByMajor[key]) {
      programsByMajor[key] = {
        major: program.major,
        faculty: program.faculty,
        subjects: new Set(),
        semesters: [],
      };
    }
    programsByMajor[key].semesters.push(program.semester);
    (program.subjects || []).forEach(subj => programsByMajor[key].subjects.add(subj));
  });

  const missingByMajor = [];
  let totalRequiredSubjects = 0;

  // Kiểm tra từng ngành (đã gộp môn từ nhiều học kỳ)
  for (const key in programsByMajor) {
    const program = programsByMajor[key];
    const requiredSubjects = Array.from(program.subjects);
    totalRequiredSubjects += requiredSubjects.length;

    const missingSubjects = requiredSubjects.filter(
      (subjectId) => !subjectIds.includes(subjectId)
    );

    if (missingSubjects.length > 0) {
      console.log(`[Validation] ❌ ${program.major} (${program.faculty}): Missing ${missingSubjects.length}/${requiredSubjects.length} subjects from ${program.semesters.join(", ")}`);
      missingByMajor.push({
        major: program.major,
        faculty: program.faculty,
        semesters: program.semesters,
        requiredCount: requiredSubjects.length,
        missingCount: missingSubjects.length,
        missingSubjects: missingSubjects.slice(0, 20), // Giới hạn 20 môn
        totalMissing: missingSubjects.length,
      });
    } else {
      console.log(`[Validation] ✅ ${program.major} (${program.faculty}): All ${requiredSubjects.length} subjects present from ${program.semesters.join(", ")}`);
    }
  }

  if (missingByMajor.length > 0) {
    const totalMissing = missingByMajor.reduce((sum, m) => sum + m.missingCount, 0);
    const uniqueMajors = Object.keys(programsByMajor).length;
    console.log(`[Validation] ❌ FAILED: ${missingByMajor.length}/${uniqueMajors} majors have missing subjects`);

    return {
      valid: false,
      message: `Danh sách môn học mở chưa đủ theo chương trình đào tạo ${semester} (${missingByMajor.length}/${uniqueMajors} ngành thiếu môn)`,
      missingByMajor,
      checkedSemesters: semestersToCheck,
      stats: {
        totalPrograms: trainingPrograms.length,
        uniqueMajors,
        programsWithMissing: missingByMajor.length,
        totalMissingSubjects: totalMissing,
        subjectsInFile: subjectIds.length,
      },
    };
  }

  const uniqueMajors = Object.keys(programsByMajor).length;
  console.log(`[Validation] ✅ PASSED: All ${uniqueMajors} majors satisfied (checked ${trainingPrograms.length} program records)`);
  return {
    valid: true,
    message: `Danh sách môn học mở hợp lệ cho ${semester} (đủ cho ${uniqueMajors} ngành)`,
    missingByMajor: [],
    checkedSemesters: semestersToCheck,
    stats: {
      totalPrograms: trainingPrograms.length,
      uniqueMajors,
      subjectsInFile: subjectIds.length,
    },
  };
}

// Lấy danh sách môn học mở (admin xem tất cả, user chỉ xem public)
export async function getSubjectOpenList(req, res) {
  try {
    const { academicYear, semester } = req.query;
    const isAdmin = req.user && req.user.role === "admin";

    let query = {};

    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    // Nếu không phải admin, chỉ lấy danh sách public
    if (!isAdmin) {
      query.isPublic = true;
    }

    const subjectOpenList = await SubjectOpen.find(query).sort({ createdAt: -1 }).lean();

    // Collect all subject_ids across lists and fetch subject info in bulk to improve performance
    const allSubjectIds = new Set();
    subjectOpenList.forEach((item) => {
      (item.subjects || []).forEach((s) => {
        if (s && s.subject_id) allSubjectIds.add(s.subject_id);
      });
    });

    const subjectInfos = await Subject.find({ subject_id: { $in: Array.from(allSubjectIds) } }).lean();
    const infoMap = {};
    subjectInfos.forEach((si) => {
      infoMap[si.subject_id] = si;
    });

    const result = subjectOpenList.map((item) => {
      const subjectsWithDetails = (item.subjects || []).map((subj) => {
        const subjectInfo = infoMap[subj.subject_id] || {};
        return {
          stt: subj.stt,
          subject_id: subj.subject_id,
          subject_name: subjectInfo.subject_name || subj.subject_name || "N/A",
          theory_credits: subjectInfo.theory_credits || subj.theory_credits || 0,
          practice_credits: subjectInfo.practice_credits || subj.practice_credits || 0,
          class_code: subj.class_code || "",
        };
      });

      return {
        _id: item._id,
        academicYear: item.academicYear,
        semester: item.semester,
        subjects: subjectsWithDetails,
        isPublic: item.isPublic,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error getting subject open list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Tạo danh sách môn học mở từ file Excel
export async function importSubjectOpenFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Không tìm thấy file" });
    }

    const { academicYear, semester } = req.body;

    if (!academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin năm học hoặc học kỳ",
      });
    }

    // Kiểm tra định dạng file
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "File không đúng định dạng. Chỉ chấp nhận .xlsx, .xls hoặc .csv",
      });
    }

    // Kiểm tra kích thước file (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "File quá lớn. Kích thước tối đa 5MB",
      });
    }

    // Đọc file Excel
    let workbook, data;
    try {
      workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        return res.status(400).json({
          success: false,
          message: "File Excel không có sheet nào",
        });
      }

      const worksheet = workbook.Sheets[sheetName];
      // Read sheet as raw rows so we can detect header row within first 10 rows
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      data = rows; // keep for backward compatibility variable name
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Không thể đọc file. Vui lòng kiểm tra lại định dạng file",
        error: parseError.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "File không có dữ liệu hoặc định dạng không đúng",
      });
    }
    // Detect header row within the first 10 rows and map columns
    const rows = data; // array of arrays
    const maxHeaderSearch = Math.min(10, rows.length);

    const normalize = (s) =>
      String(s || "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    const mapHeaderToField = (text) => {
      const t = normalize(text);
      if (!t) return null;
      if (t === "STT") return "stt";
      if (t.includes("MAMH") || t.includes("MA MH") || t.includes("MA MON") || t.includes("MAMON") || t.includes("MA MON HOC") || t.includes("MAMONHOC") || t.includes("MA MON HOC")) return "subject_id";
      if (t.includes("MA LOP") || t.includes("MALOP")) return "class_code";
      if ((t.includes("TEN") && t.includes("MON")) || t.includes("TEN MON HOC") || t.includes("TENMONHOC")) return "subject_name";
      if (t.includes("MA GIANG") || t.includes("MAGIANGVIEN") || t.includes("MAGV")) return "teacher_id";
      if (t.includes("TEN GIANG") || t.includes("TENGIANGVIEN") || t.includes("TENGV")) return "teacher_name";
      if (t.includes("SI SO") || t === "SISO" || t === "S I S O") return "capacity";
      if (t.includes("TONG") && t.includes("TC") || t === "TC" || t.includes("TO TC") || t.includes("TOTC") || t.includes("TO TC")) return "credits";
      if (t.includes("THUC HANH") || t.includes("THU CHANH") || t.includes("TH\u1EF0C HANH")) return "practice_credits";
      if (t === "HTGD") return "htgd";
      if (t.includes("THU") && t.length <= 6) return "day";
      if (t.includes("TIET")) return "period";
      if (t.includes("CACH") || t.includes("CACH TUAN") || t.includes("CACHTUAN")) return "week_pattern";
      if (t.includes("PHONG")) return "room";
      if (t.includes("KHOA HOC") || t.includes("KHOAHOC")) return "course";
      if (t.includes("HOC KY") || t.includes("HOC KY") || t === "HK") return "semester_label";
      if (t.includes("NAM HOC") || t.includes("NAMHOC")) return "academicYear_label";
      if (t.includes("HE DT") || t.includes("HEDT") || t.includes("HEDAO")) return "education_system";
      if (t.includes("KHOA QL") || (t.includes("KHOA") && t.includes("QL")) || t === "KHOA") return "faculty";
      if (t === "NBD" || t.includes("NGAY BD") || (t.includes("NGAY") && t.includes("BD"))) return "start_date";
      if (t === "NKT" || t.includes("NGAY KT") || (t.includes("NGAY") && t.includes("KT"))) return "end_date";
      if (t.includes("GHI")) return "notes";
      if (t.includes("DA DK") || t.includes("DADK") || t.includes("DK") || t.includes("DANG KY")) return "registered_flag";
      return null;
    };

    let headerRowIndex = -1;
    let headerRow = [];
    for (let i = 0; i < maxHeaderSearch; i++) {
      const r = rows[i] || [];
      const mapped = r.map((c) => mapHeaderToField(c));
      // We require at least one recognizable subject_id and stt
      if (mapped.includes("subject_id") || mapped.includes("stt")) {
        headerRowIndex = i;
        headerRow = r;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy hàng header trong 10 dòng đầu. Vui lòng đảm bảo file tkb_he dùng header chuẩn.",
        expectedHeaders: [
          "STT", "MÃ MH", "MÃ LỚP", "TÊN MÔN HỌC", "MÃ GIẢNG VIÊN", "TÊN GIẢNG VIÊN", "SĨ SỐ", "TỐ TC", "THỰC HÀNH", "HTGD", "THỨ", "TIẾT", "CÁCH TUẦN", "PHÒNG HỌC", "KHOÁ HỌC", "HỌC KỲ", "NĂM HỌC", "HỆ ĐT", "KHOA QL", "NBD", "NKT", "GHICHU", "Đã ĐK"
        ],
      });
    }

    // Build column -> field mapping
    const colToField = {};
    for (let c = 0; c < headerRow.length; c++) {
      const fld = mapHeaderToField(headerRow[c]);
      if (fld) colToField[c] = fld;
    }

    // Ensure we can find subject_id column
    const hasSubjectId = Object.values(colToField).includes("subject_id");
    if (!hasSubjectId) {
      return res.status(400).json({
        success: false,
        message: "Header không chứa cột mã môn học (MÃ MH / MÃ MÔN).",
      });
    }

    // Parse rows after headerRowIndex
    const subjects = [];
    const errors = [];

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((cell) => cell === "")) continue; // skip empty rows

      const subjectObj = {};
      for (const [colIdx, field] of Object.entries(colToField)) {
        const val = row[colIdx] !== undefined ? row[colIdx] : "";
        if (val === "") continue;
        try {
          switch (field) {
            case "stt":
              subjectObj.stt = Number(val) || undefined;
              break;
            case "subject_id":
              subjectObj.subject_id = String(val).trim().toUpperCase();
              break;
            case "capacity":
              subjectObj.capacity = Number(val) || undefined;
              break;
            case "credits":
              subjectObj.credits = Number(val) || undefined;
              break;
            case "practice_credits":
              subjectObj.practice_credits = Number(val) || undefined;
              break;
            case "start_date":
            case "end_date":
              const d = new Date(val);
              if (!isNaN(d)) subjectObj[field] = d;
              else subjectObj[field] = null;
              break;
            default:
              subjectObj[field] = String(val).trim();
          }
        } catch (e) {
          // ignore single-cell parse errors
          subjectObj[field] = String(val).trim();
        }
      }

      // Validate minimal
      const rowNumber = r + 1;
      if (!subjectObj.subject_id) {
        errors.push(`Dòng ${rowNumber}: Thiếu mã môn học`);
        continue;
      }

      // Normalize subject id format
      if (!/^[A-Z]{1,4}\d{2,4}$/i.test(subjectObj.subject_id)) {
        // allow but warn
        errors.push(`Dòng ${rowNumber}: Mã môn '${subjectObj.subject_id}' có thể không đúng định dạng`);
      }

      if (!subjectObj.stt) subjectObj.stt = subjects.length + 1;

      subjects.push(subjectObj);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "File có lỗi định dạng hoặc thiếu dữ liệu",
        errors: errors.slice(0, 50),
        totalErrors: errors.length,
      });
    }

    if (subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dữ liệu môn học hợp lệ trong file sau header",
      });
    }

    // Kiểm tra trùng lặp: chỉ coi là trùng khi toàn bộ các cột giống nhau -> giữ lại 1 bản
    const canonicalize = (obj) => {
      const keys = Object.keys(obj).sort();
      const out = {};
      keys.forEach((k) => {
        const v = obj[k];
        if (v instanceof Date) out[k] = v.toISOString();
        else if (v === null || v === undefined) out[k] = "";
        else out[k] = String(v).trim();
      });
      return JSON.stringify(out);
    };

    const seen = new Set();
    const uniqueSubjects = [];
    let identicalDuplicatesCount = 0;
    subjects.forEach((s) => {
      const key = canonicalize(s);
      if (seen.has(key)) {
        identicalDuplicatesCount += 1;
      } else {
        seen.add(key);
        uniqueSubjects.push(s);
      }
    });

    if (identicalDuplicatesCount > 0) {
      console.log(`[Import] ⚠️ Removed ${identicalDuplicatesCount} identical duplicate rows from file`);
    }

    // Use deduplicated subjects moving forward
    const finalSubjects = uniqueSubjects;

    // Validate subjects tồn tại trong database (use unique subject IDs)
    const subjectIds = [...new Set(finalSubjects.map((s) => s.subject_id))];
    console.log(`[Import] Validating ${subjectIds.length} unique subject IDs for ${academicYear} ${semester}...`);
    const { valid, invalid } = await validateSubjectsExist(subjectIds);

    if (invalid.length > 0) {
      console.log(`[Import] ❌ Found ${invalid.length} invalid subjects:`, invalid);
      return res.status(400).json({
        success: false,
        message: `Có ${invalid.length} môn học không tồn tại trong hệ thống`,
        invalidSubjects: invalid,
        totalInvalid: invalid.length,
        totalValid: valid.length,
        hint: "Vui lòng kiểm tra lại mã môn học hoặc thêm môn học vào hệ thống trước khi import",
      });
    }

    console.log(`[Import] ✅ All ${valid.length} subjects are valid`);

    // Validate với training program
    console.log(`[Import] Checking against training programs for ${semester}...`);
    const validation = await validateWithTrainingProgram(
      academicYear,
      semester,
      valid
    );

    // Nếu có cảnh báo (không tìm thấy training program)
    if (validation.warning && validation.noTrainingProgram) {
      console.warn(`[Import] ⚠️ ${validation.message}`);
      return res.status(400).json({
        success: false,
        message: validation.message,
        noTrainingProgram: true,
        hint: `Không thể kiểm tra danh sách vì chưa có chương trình đào tạo cho ${semester}. Vui lòng import training programs trước.`,
      });
    }

    if (!validation.valid) {
      console.log(`[Import] ❌ Missing subjects detected:`, validation.missingByMajor);
      return res.status(400).json({
        success: false,
        message: validation.message,
        missingByMajor: validation.missingByMajor,
        totalSubjectsInFile: valid.length,
        stats: validation.stats,
        hint: "Danh sách thiếu môn theo chương trình đào tạo. Vui lòng bổ sung các môn còn thiếu",
      });
    }

    console.log(`[Import] ✅ All training program requirements met (${validation.stats?.totalPrograms || 0} programs checked)`);

    // Kiểm tra xem đã tồn tại danh sách chưa
    const existingList = await SubjectOpen.findOne({ academicYear, semester });

    if (existingList) {
      console.log(`[Import] 📝 Updating existing list (${existingList.subjects.length} → ${subjects.length} subjects)`);
      // Cập nhật danh sách hiện có
      const oldCount = existingList.subjects.length;
      existingList.subjects = subjects;
      existingList.updatedAt = new Date();
      await existingList.save();

      console.log(`[Import] ✅ Updated successfully by ${req.user?.email}`);
      return res.json({
        success: true,
        message: `Cập nhật danh sách môn học mở thành công (${oldCount} → ${subjects.length} môn)`,
        data: existingList,
        stats: {
          totalSubjects: subjects.length,
          previousCount: oldCount,
          isUpdate: true,
        },
      });
    }

    // Tạo mới danh sách
    console.log(`[Import] 📝 Creating new list with ${subjects.length} subjects`);
    const newSubjectOpen = new SubjectOpen({
      academicYear,
      semester,
      subjects,
      isPublic: false,
      createdBy: req.user?.email || "admin",
    });

    await newSubjectOpen.save();

    console.log(`[Import] ✅ Created successfully by ${req.user?.email}`);
    res.json({
      success: true,
      message: `Import danh sách môn học mở thành công (${subjects.length} môn)`,
      data: newSubjectOpen,
      stats: {
        totalSubjects: subjects.length,
        isUpdate: false,
        isPublic: false,
      },
    });
  } catch (error) {
    console.error("Error importing subject open from Excel:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Tạo hoặc cập nhật danh sách môn học mở (manual)
export async function createOrUpdateSubjectOpen(req, res) {
  try {
    const { academicYear, semester, subjects } = req.body;

    if (!academicYear || !semester || !subjects || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Validate subjects tồn tại
    const subjectIds = subjects.map((s) => s.subject_id);
    const { valid, invalid } = await validateSubjectsExist(subjectIds);

    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Có môn học không tồn tại trong hệ thống",
        invalidSubjects: invalid,
      });
    }

    // Validate với training program
    const validation = await validateWithTrainingProgram(
      academicYear,
      semester,
      valid
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        missingByMajor: validation.missingByMajor,
      });
    }

    // Kiểm tra xem đã tồn tại danh sách chưa
    const existingList = await SubjectOpen.findOne({ academicYear, semester });

    if (existingList) {
      // Cập nhật danh sách hiện có
      existingList.subjects = subjects;
      existingList.updatedAt = new Date();
      await existingList.save();

      return res.json({
        success: true,
        message: "Cập nhật danh sách môn học mở thành công",
        data: existingList,
      });
    }

    // Tạo mới danh sách
    const newSubjectOpen = new SubjectOpen({
      academicYear,
      semester,
      subjects,
      isPublic: false,
      createdBy: req.user?.email || "admin",
    });

    await newSubjectOpen.save();

    res.json({
      success: true,
      message: "Tạo danh sách môn học mở thành công",
      data: newSubjectOpen,
    });
  } catch (error) {
    console.error("Error creating/updating subject open:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Thêm một môn học vào danh sách
export async function addSubjectToList(req, res) {
  try {
    const { id } = req.params; // ID của SubjectOpen
    let { subject_id } = req.body;
    const { stt } = req.body;

    if (!subject_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã môn học",
      });
    }

    // Chuẩn hóa mã môn học (uppercase + trim)
    subject_id = String(subject_id).trim().toUpperCase();

    // Validate subject tồn tại
    const subject = await Subject.findOne({ subject_id });
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: `Môn học '${subject_id}' không tồn tại trong hệ thống`,
      });
    }

    const subjectOpen = await SubjectOpen.findById(id);
    if (!subjectOpen) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh sách môn học mở",
      });
    }

    // Kiểm tra môn học đã tồn tại trong danh sách chưa
    const exists = subjectOpen.subjects.some((s) => s.subject_id === subject_id);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Môn học đã tồn tại trong danh sách",
      });
    }

    // Thêm môn học
    subjectOpen.subjects.push({
      stt: stt || subjectOpen.subjects.length + 1,
      subject_id,
    });

    // Validate lại với training program
    const subjectIds = subjectOpen.subjects.map((s) => s.subject_id);
    const validation = await validateWithTrainingProgram(
      subjectOpen.academicYear,
      subjectOpen.semester,
      subjectIds
    );

    // Chỉ warning, vẫn cho phép thêm
    if (!validation.valid) {
      subjectOpen.updatedAt = new Date();
      await subjectOpen.save();

      return res.json({
        success: true,
        message: "Thêm môn học thành công (có cảnh báo)",
        warning: validation.message,
        missingByMajor: validation.missingByMajor,
        data: subjectOpen,
      });
    }

    subjectOpen.updatedAt = new Date();
    await subjectOpen.save();

    res.json({
      success: true,
      message: "Thêm môn học thành công",
      data: subjectOpen,
    });
  } catch (error) {
    console.error("Error adding subject to list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Xóa một môn học khỏi danh sách
export async function removeSubjectFromList(req, res) {
  try {
    const { id, subject_id } = req.params;

    const subjectOpen = await SubjectOpen.findById(id);
    if (!subjectOpen) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh sách môn học mở",
      });
    }

    // Xóa môn học
    subjectOpen.subjects = subjectOpen.subjects.filter(
      (s) => s.subject_id !== subject_id
    );

    subjectOpen.updatedAt = new Date();
    await subjectOpen.save();

    res.json({
      success: true,
      message: "Xóa môn học thành công",
      data: subjectOpen,
    });
  } catch (error) {
    console.error("Error removing subject from list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Xóa toàn bộ danh sách môn học mở
export async function deleteSubjectOpenList(req, res) {
  try {
    const { id } = req.params;

    const subjectOpen = await SubjectOpen.findByIdAndDelete(id);
    if (!subjectOpen) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh sách môn học mở",
      });
    }

    res.json({
      success: true,
      message: "Xóa danh sách môn học mở thành công",
    });
  } catch (error) {
    console.error("Error deleting subject open list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Toggle trạng thái public/private
export async function togglePublicStatus(req, res) {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    const subjectOpen = await SubjectOpen.findById(id);
    if (!subjectOpen) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh sách môn học mở",
      });
    }

    subjectOpen.isPublic = isPublic !== undefined ? isPublic : !subjectOpen.isPublic;
    subjectOpen.updatedAt = new Date();
    await subjectOpen.save();

    res.json({
      success: true,
      message: `${subjectOpen.isPublic ? "Công khai" : "Ẩn"} danh sách thành công`,
      data: subjectOpen,
    });
  } catch (error) {
    console.error("Error toggling public status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Validate danh sách hiện tại với training program
export async function validateCurrentList(req, res) {
  try {
    const { id } = req.params;

    const subjectOpen = await SubjectOpen.findById(id);
    if (!subjectOpen) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh sách môn học mở",
      });
    }

    const subjectIds = subjectOpen.subjects.map((s) => s.subject_id);
    const validation = await validateWithTrainingProgram(
      subjectOpen.academicYear,
      subjectOpen.semester,
      subjectIds
    );

    res.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error("Error validating current list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
