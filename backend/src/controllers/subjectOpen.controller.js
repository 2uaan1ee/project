import SubjectOpen from "../models/subjectOpen.model.js";
import TrainingProgram from "../models/trainingProgram.model.js";
import Subject from "../models/subject.model.js";
import xlsx from "xlsx";

// Helper function để validate subjects tồn tại trong database
async function validateSubjectsExist(subjectIds) {
  const validSubjects = [];
  const invalidSubjects = [];

  for (const subjectId of subjectIds) {
    const subject = await Subject.findOne({ subject_id: subjectId });
    if (subject) {
      validSubjects.push(subjectId);
    } else {
      invalidSubjects.push(subjectId);
    }
  }

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

    const subjectOpenList = await SubjectOpen.find(query).sort({ createdAt: -1 });

    // Populate thông tin môn học
    const result = await Promise.all(
      subjectOpenList.map(async (item) => {
        const subjectsWithDetails = await Promise.all(
          item.subjects.map(async (subj) => {
            const subjectInfo = await Subject.findOne({
              subject_id: subj.subject_id,
            });
            return {
              stt: subj.stt,
              subject_id: subj.subject_id,
              subject_name: subjectInfo?.subject_name || "N/A",
              theory_credits: subjectInfo?.theory_credits || 0,
              practice_credits: subjectInfo?.practice_credits || 0,
            };
          })
        );

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
      })
    );

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
      data = xlsx.utils.sheet_to_json(worksheet);
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

    // Kiểm tra headers có đúng không
    const firstRow = data[0];
    const hasValidHeaders = 
      firstRow.hasOwnProperty("Stt") || 
      firstRow.hasOwnProperty("STT") || 
      firstRow.hasOwnProperty("Môn học") || 
      firstRow.hasOwnProperty("Mã môn học") || 
      firstRow.hasOwnProperty("subject_id");

    if (!hasValidHeaders) {
      return res.status(400).json({
        success: false,
        message: "File không đúng định dạng. Cần có cột 'STT' và 'Môn học' (hoặc 'Mã môn học')",
        hint: "Tải template mẫu tại: backend/src/config/output/template_mon_hoc_mo.xlsx",
      });
    }

    // Parse dữ liệu từ Excel
    const subjects = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 vì index bắt đầu từ 0 và row 1 là header
      const subject_id = (row["Môn học"] || row["Mã môn học"] || row["subject_id"] || "").toString().trim();
      
      if (!subject_id) {
        errors.push(`Dòng ${rowNumber}: Thiếu mã môn học`);
        return;
      }

      // Kiểm tra format mã môn (VD: IT001, CS101)
      if (!/^[A-Z]{2,4}\d{3,4}$/i.test(subject_id)) {
        errors.push(`Dòng ${rowNumber}: Mã môn '${subject_id}' không đúng định dạng (VD: IT001, CS101)`);
      }

      const stt = row["Stt"] || row["STT"] || index + 1;
      
      subjects.push({
        stt: Number(stt) || index + 1,
        subject_id: subject_id.toUpperCase(), // Chuẩn hóa thành chữ HOA
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "File có lỗi định dạng",
        errors: errors.slice(0, 10), // Chỉ show 10 lỗi đầu
        totalErrors: errors.length,
      });
    }

    if (subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dữ liệu môn học hợp lệ trong file",
      });
    }

    // Kiểm tra trùng lặp trong file
    const subjectIds = subjects.map((s) => s.subject_id);
    const duplicates = subjectIds.filter((id, index) => subjectIds.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `File có ${[...new Set(duplicates)].length} môn học bị trùng lặp`,
        duplicates: [...new Set(duplicates)],
        hint: "Mỗi môn học chỉ nên xuất hiện 1 lần trong file",
      });
    }

    // Validate subjects tồn tại trong database
    console.log(`[Import] Validating ${subjects.length} subjects for ${academicYear} ${semester}...`);
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
    const { subject_id, stt } = req.body;

    if (!subject_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã môn học",
      });
    }

    // Validate subject tồn tại
    const subject = await Subject.findOne({ subject_id });
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Môn học không tồn tại trong hệ thống",
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
