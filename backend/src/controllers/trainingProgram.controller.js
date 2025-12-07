import TrainingProgram from "../models/trainingProgram.model.js";
import Subject from "../models/subject.model.js";

// Helper function to validate subjects
async function validateSubjects(subjectIds) {
  if (!subjectIds || subjectIds.length === 0) {
    return { valid: [], invalid: [] };
  }

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

// Admin: Upload và cập nhật chương trình đào tạo từ file JSON
export async function uploadTrainingProgram(req, res) {
  try {
    const data = req.body; // Expect array of training program objects

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Dữ liệu phải là một mảng" });
    }

    const results = [];
    const warnings = [];

    for (const item of data) {
      const { major, faculty, semester, subjects } = item;
      
      if (!major || !faculty || !semester || !subjects) {
        continue; // Skip invalid items
      }

      // Validate subjects against database
      const { valid, invalid } = await validateSubjects(subjects);
      
      if (invalid.length > 0) {
        warnings.push({
          semester,
          invalidSubjects: invalid,
          message: `Học kỳ "${semester}" có ${invalid.length} môn không tồn tại: ${invalid.join(", ")}`
        });
      }

      // Only save valid subjects
      const updated = await TrainingProgram.findOneAndUpdate(
        { major, faculty, semester },
        { major, faculty, semester, subjects: valid },
        { upsert: true, new: true }
      );
      results.push(updated);
    }

    res.json({
      message: "Cập nhật chương trình đào tạo thành công",
      count: results.length,
      data: results,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error("Error uploading training program:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật chương trình đào tạo" });
  }
}

// User: Lấy danh sách các khoa
export async function getFaculties(req, res) {
  try {
    const faculties = await TrainingProgram.distinct("faculty");
    res.json({ faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khoa" });
  }
}

// User: Lấy danh sách các ngành theo khoa
export async function getMajorsByFaculty(req, res) {
  try {
    const { faculty } = req.query;
    if (!faculty) {
      return res.status(400).json({ message: "Thiếu tham số faculty" });
    }

    const majors = await TrainingProgram.distinct("major", { faculty });
    res.json({ majors });
  } catch (error) {
    console.error("Error fetching majors:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ngành" });
  }
}

// User: Lấy chương trình đào tạo theo ngành và khoa (with subject details)
export async function getTrainingProgramByMajor(req, res) {
  try {
    const { faculty, major } = req.query;
    
    if (!faculty || !major) {
      return res.status(400).json({ message: "Thiếu tham số faculty hoặc major" });
    }

    const programs = await TrainingProgram.find({ faculty, major }).sort({ semester: 1 });
    
    // Populate subject details
    const programsWithDetails = await Promise.all(
      programs.map(async (program) => {
        const subjectsWithDetails = await Promise.all(
          (program.subjects || []).map(async (subjectId) => {
            const subject = await Subject.findOne({ subject_id: subjectId });
            return {
              subject_id: subjectId,
              subject_name: subject?.subject_name || "Không tìm thấy",
              exists: !!subject
            };
          })
        );
        
        return {
          ...program.toObject(),
          subjectsDetails: subjectsWithDetails
        };
      })
    );
    
    res.json({ programs: programsWithDetails });
  } catch (error) {
    console.error("Error fetching training program:", error);
    res.status(500).json({ message: "Lỗi khi lấy chương trình đào tạo" });
  }
}

// Admin: Lấy tất cả chương trình đào tạo (with subject details)
export async function getAllPrograms(req, res) {
  try {
    const programs = await TrainingProgram.find({}).sort({ faculty: 1, major: 1, semester: 1 });
    
    // Populate subject details for admin view
    const programsWithDetails = await Promise.all(
      programs.map(async (program) => {
        const subjectsWithDetails = await Promise.all(
          (program.subjects || []).map(async (subjectId) => {
            const subject = await Subject.findOne({ subject_id: subjectId });
            return {
              subject_id: subjectId,
              subject_name: subject?.subject_name || "Không tìm thấy",
              exists: !!subject
            };
          })
        );
        
        return {
          ...program.toObject(),
          subjectsDetails: subjectsWithDetails
        };
      })
    );
    
    res.json({ programs: programsWithDetails });
  } catch (error) {
    console.error("Error fetching all programs:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách chương trình" });
  }
}

// Admin: Lấy chi tiết 1 chương trình theo ID
export async function getProgramById(req, res) {
  try {
    const { id } = req.params;
    const program = await TrainingProgram.findById(id);
    
    if (!program) {
      return res.status(404).json({ message: "Không tìm thấy chương trình" });
    }
    
    res.json({ program });
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ message: "Lỗi khi lấy chương trình" });
  }
}

// Admin: Tạo mới 1 chương trình
export async function createProgram(req, res) {
  try {
    const { major, faculty, semester, subjects } = req.body;
    
    if (!major || !faculty || !semester) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    
    // Kiểm tra trùng lặp
    const existing = await TrainingProgram.findOne({ major, faculty, semester });
    if (existing) {
      return res.status(400).json({ message: "Chương trình này đã tồn tại" });
    }
    
    // Validate subjects
    const { valid, invalid } = await validateSubjects(subjects || []);
    
    if (invalid.length > 0) {
      return res.status(400).json({ 
        message: "Có môn học không tồn tại trong database",
        invalidSubjects: invalid
      });
    }
    
    const program = await TrainingProgram.create({
      major,
      faculty,
      semester,
      subjects: valid
    });
    
    res.status(201).json({ message: "Tạo chương trình thành công", program });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Lỗi khi tạo chương trình" });
  }
}

// Admin: Cập nhật 1 chương trình
export async function updateProgram(req, res) {
  try {
    const { id } = req.params;
    const { major, faculty, semester, subjects } = req.body;
    
    // Validate subjects
    const { valid, invalid } = await validateSubjects(subjects || []);
    
    if (invalid.length > 0) {
      return res.status(400).json({ 
        message: "Có môn học không tồn tại trong database",
        invalidSubjects: invalid
      });
    }
    
    const program = await TrainingProgram.findByIdAndUpdate(
      id,
      { major, faculty, semester, subjects: valid },
      { new: true, runValidators: true }
    );
    
    if (!program) {
      return res.status(404).json({ message: "Không tìm thấy chương trình" });
    }
    
    res.json({ message: "Cập nhật chương trình thành công", program });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật chương trình" });
  }
}

// Admin: Xóa 1 chương trình
export async function deleteProgram(req, res) {
  try {
    const { id } = req.params;
    
    const program = await TrainingProgram.findByIdAndDelete(id);
    
    if (!program) {
      return res.status(404).json({ message: "Không tìm thấy chương trình" });
    }
    
    res.json({ message: "Xóa chương trình thành công" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Lỗi khi xóa chương trình" });
  }
}

// Admin: Xóa toàn bộ chương trình đào tạo (optional)
export async function deleteAllTrainingPrograms(req, res) {
  try {
    await TrainingProgram.deleteMany({});
    res.json({ message: "Đã xóa toàn bộ chương trình đào tạo" });
  } catch (error) {
    console.error("Error deleting training programs:", error);
    res.status(500).json({ message: "Lỗi khi xóa chương trình đào tạo" });
  }
}
