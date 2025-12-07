import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/training-program.css";

export default function AdminTrainingProgram() {
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // For CRUD operations
  const [allPrograms, setAllPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    major: "",
    faculty: "",
    semester: "",
    subjects: []
  });
  const [subjectInput, setSubjectInput] = useState("");
  const [subjectsWithNames, setSubjectsWithNames] = useState([]);

  const token = localStorage.getItem("token");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/json") {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
      setError("Vui lòng chọn file JSON");
    }
  };

  useEffect(() => {
    fetchAllPrograms();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      fetchMajorsByFaculty(selectedFaculty);
      setSelectedMajor("");
      setFilteredPrograms([]);
    } else {
      setMajors([]);
      setSelectedMajor("");
      setFilteredPrograms([]);
    }
  }, [selectedFaculty]);

  useEffect(() => {
    if (selectedFaculty && selectedMajor) {
      const filtered = allPrograms.filter(
        p => p.faculty === selectedFaculty && p.major === selectedMajor
      );
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms([]);
    }
  }, [selectedMajor, allPrograms]);

  const fetchAllPrograms = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/training-programs/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAllPrograms(data.programs || []);
        
        // Extract unique faculties
        const uniqueFaculties = [...new Set(data.programs.map(p => p.faculty))].filter(Boolean);
        setFaculties(uniqueFaculties);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMajorsByFaculty = (faculty) => {
    const uniqueMajors = [...new Set(
      allPrograms
        .filter(p => p.faculty === faculty)
        .map(p => p.major)
    )].filter(Boolean);
    setMajors(uniqueMajors);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn file JSON để upload");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("http://localhost:5000/api/training-programs/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        let msg = `${result.message} - Đã cập nhật ${result.count} chương trình`;
        
        if (result.warnings && result.warnings.length > 0) {
          msg += `\n\n⚠️ Cảnh báo: Có ${result.warnings.length} học kỳ chứa môn học không tồn tại:`;
          result.warnings.forEach(w => {
            msg += `\n- ${w.message}`;
          });
        }
        
        setMessage(msg);
        setFile(null);
        document.getElementById("fileInput").value = "";
        fetchAllPrograms(); // Refresh list
      } else {
        setError(result.message || "Lỗi khi upload file");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Lỗi khi đọc hoặc upload file JSON");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({ 
      major: selectedMajor || "", 
      faculty: selectedFaculty || "", 
      semester: "", 
      subjects: [] 
    });
    setSubjectsWithNames([]);
    setSubjectInput("");
    setShowModal(true);
  };

  const fetchSubjectNames = async (subjectIds) => {
    try {
      const details = await Promise.all(
        subjectIds.map(async (id) => {
          const res = await fetch(`http://localhost:5000/api/subjects?search=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            const subject = data.subjects?.find(s => s.subject_id === id);
            return {
              subject_id: id,
              subject_name: subject?.subject_name || "Không tìm thấy",
              exists: !!subject
            };
          }
          
          return {
            subject_id: id,
            subject_name: "Không tìm thấy",
            exists: false
          };
        })
      );
      
      setSubjectsWithNames(details);
    } catch (err) {
      console.error("Error fetching subject names:", err);
    }
  };

  const handleEdit = (program) => {
    setEditingId(program._id);
    setFormData({
      major: program.major,
      faculty: program.faculty,
      semester: program.semester,
      subjects: program.subjects || []
    });
    
    // Set subjects with names if available
    if (program.subjectsDetails) {
      setSubjectsWithNames(program.subjectsDetails);
    } else {
      setSubjectsWithNames(
        (program.subjects || []).map(id => ({
          subject_id: id,
          subject_name: "Đang tải...",
          exists: true
        }))
      );
      // Fetch names asynchronously
      fetchSubjectNames(program.subjects || []);
    }
    
    setSubjectInput("");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa học kỳ này?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/training-programs/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage("Xóa học kỳ thành công");
        fetchAllPrograms();
      } else {
        const data = await res.json();
        setError(data.message || "Lỗi khi xóa");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Không thể xóa học kỳ");
    }
  };

  const handleDeleteAllMajorPrograms = async () => {
    if (!selectedFaculty || !selectedMajor) return;

    const confirmMsg = `Bạn có chắc chắn muốn xóa TOÀN BỘ chương trình của ngành "${selectedMajor}"?\n\nHành động này sẽ xóa tất cả ${filteredPrograms.length} học kỳ và KHÔNG THỂ HOÀN TÁC!`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      // Delete all programs one by one
      const deletePromises = filteredPrograms.map(program =>
        fetch(`http://localhost:5000/api/training-programs/admin/${program._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      await Promise.all(deletePromises);

      setMessage(`Đã xóa toàn bộ chương trình của ngành ${selectedMajor}`);
      setSelectedMajor("");
      fetchAllPrograms();
    } catch (err) {
      console.error("Delete all error:", err);
      setError("Không thể xóa toàn bộ chương trình");
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const url = editingId
      ? `http://localhost:5000/api/training-programs/admin/${editingId}`
      : "http://localhost:5000/api/training-programs/admin/create";

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setShowModal(false);
        fetchAllPrograms();
      } else {
        setError(data.message || "Lỗi khi lưu chương trình");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Không thể lưu chương trình");
    }
  };

  const handleAddSubject = async () => {
    const trimmed = subjectInput.trim().toUpperCase();
    console.log("handleAddSubject called, input:", trimmed);
    
    if (!trimmed) {
      console.log("Empty input");
      return;
    }
    
    // Check if already in current form
    if (formData.subjects.includes(trimmed)) {
      console.log("Subject already added in current form");
      alert(`⚠️ Môn học "${trimmed}" đã có trong học kỳ này!`);
      setSubjectInput("");
      return;
    }

    // Check if subject exists in other semesters of the same major
    const otherPrograms = filteredPrograms.filter(p => p._id !== editingId);
    const existsInOtherSemester = otherPrograms.find(p => 
      p.subjects && p.subjects.includes(trimmed)
    );
    
    if (existsInOtherSemester) {
      alert(`❌ KHÔNG THỂ THÊM!\n\nMôn học "${trimmed}" đã có trong "${existsInOtherSemester.semester}".\n\nMỗi môn chỉ được học 1 lần trong toàn bộ chương trình.`);
      setSubjectInput("");
      return;
    }

    // Validate subject exists in database
    try {
      console.log("Fetching subject from API...");
      const res = await fetch(`http://localhost:5000/api/subjects?search=${trimmed}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("API response data:", data);
        const subject = data.subjects?.find(s => s.subject_id === trimmed);
        
        console.log("Found subject:", subject);
        
        if (!subject) {
          alert(`❌ Môn học "${trimmed}" không tồn tại trong database!\n\nVui lòng kiểm tra lại mã môn học.`);
          setSubjectInput("");
          return;
        }
        
        // Add to both arrays
        console.log("Adding subject to form...");
        setFormData({ ...formData, subjects: [...formData.subjects, trimmed] });
        setSubjectsWithNames([
          ...subjectsWithNames,
          {
            subject_id: trimmed,
            subject_name: subject.subject_name,
            exists: true
          }
        ]);
        setSubjectInput("");
        setError(""); // Clear error on success
        alert(`✅ Thêm thành công!\n\nMôn học: ${trimmed} - ${subject.subject_name}`);
        console.log("Subject added successfully");
      } else {
        alert(`❌ Lỗi kết nối!\n\nKhông thể kết nối đến server. Vui lòng thử lại.`);
      }
    } catch (err) {
      console.error("Error validating subject:", err);
      alert(`❌ Lỗi!\n\nKhông thể kiểm tra môn học:\n${err.message}`);
    }
  };

  const handleRemoveSubject = (subjectId) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter(s => s !== subjectId)
    });
    setSubjectsWithNames(subjectsWithNames.filter(s => s.subject_id !== subjectId));
  };

  return (
    <div className="admin-training-program">
      <div className="page-header">
        <h1>Quản lý Chương trình Đào tạo</h1>
        <button className="btn-back" onClick={() => nav("/app/dashboard")}>
          ← Quay lại
        </button>
      </div>
      <p className="description">
        Upload file JSON chứa chương trình đào tạo của các ngành/khoa. 
        File phải có định dạng như mẫu Khoa_CNPM_K19_2025.json.
      </p>

      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            id="fileInput"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && <span className="file-name">Đã chọn: {file.name}</span>}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="upload-btn"
        >
          {uploading ? "Đang upload..." : "Upload và Cập nhật"}
        </button>
      </div>

      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      <div className="format-example">
        <h3>Định dạng file JSON mẫu:</h3>
        <pre>{`[
  {
    "major": "Kỹ thuật phần mềm",
    "faculty": "Khoa Công nghệ phần mềm",
    "semester": "Học kỳ 1",
    "subjects": ["MA006", "MA003", "ENG01", "SE005", "IT001"]
  },
  {
    "major": "Kỹ thuật phần mềm",
    "faculty": "Khoa Công nghệ phần mềm",
    "semester": "Học kỳ 2",
    "subjects": ["IT002", "IT003", "MA004", "MA005", "ENG02"]
  }
]`}</pre>
      </div>

      {/* CRUD Section */}
      <div className="crud-section">
        <div className="crud-header">
          <h2>Quản lý Chương trình theo Ngành</h2>
        </div>

        {/* Filter by Faculty and Major */}
        <div className="admin-filter-section">
          <div className="filter-group">
            <label htmlFor="admin-faculty">Chọn Khoa:</label>
            <select
              id="admin-faculty"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Chọn khoa --</option>
              {faculties.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="admin-major">Chọn Ngành:</label>
            <select
              id="admin-major"
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              disabled={!selectedFaculty || loading}
            >
              <option value="">-- Chọn ngành --</option>
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <div className="loading">Đang tải...</div>}

        {!loading && !selectedMajor && (
          <div className="no-data">
            <p>👆 Vui lòng chọn khoa và ngành để xem danh sách chương trình</p>
          </div>
        )}

        {!loading && selectedMajor && filteredPrograms.length === 0 && (
          <div className="no-data">
            <p>Chưa có chương trình nào cho ngành này</p>
            <button className="btn-create" onClick={handleCreateNew}>
              ➕ Thêm chương trình mới
            </button>
          </div>
        )}

        {!loading && selectedMajor && filteredPrograms.length > 0 && (
          <>
            <div className="major-info">
              <h3>📚 {selectedMajor} - {selectedFaculty}</h3>
              <div className="major-actions">
                <button className="btn-create" onClick={handleCreateNew}>
                  ➕ Thêm học kỳ mới
                </button>
                <button className="btn-delete-all" onClick={handleDeleteAllMajorPrograms}>
                  🗑️ Xóa toàn bộ chương trình
                </button>
              </div>
            </div>
            <div className="programs-table">
              <table>
                <thead>
                  <tr>
                    <th>Học kỳ</th>
                    <th>Số môn học</th>
                    <th>Môn học</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrograms.map((program) => (
                    <tr key={program._id}>
                      <td><strong>{program.semester || "-"}</strong></td>
                      <td>
                        {program.subjectsDetails?.length || program.subjects?.length || 0}
                        {program.subjectsDetails?.some(s => !s.exists) && (
                          <span className="warning-badge" title="Có môn học không tồn tại">⚠️</span>
                        )}
                      </td>
                      <td>
                        <div className="subject-preview">
                          {program.subjectsDetails?.slice(0, 3).map((s, idx) => (
                            <span key={idx} className={`subject-chip ${!s.exists ? 'invalid' : ''}`}>
                              {s.subject_id}
                            </span>
                          ))}
                          {program.subjectsDetails?.length > 3 && (
                            <span className="subject-chip more">+{program.subjectsDetails.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(program)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(program._id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Sửa chương trình" : "Thêm chương trình mới"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="modal-form">
              <div className="form-group">
                <label>Khoa *</label>
                <input
                  type="text"
                  required
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  placeholder="Ví dụ: Khoa Công nghệ phần mềm"
                  disabled={!!selectedFaculty}
                  title={selectedFaculty ? "Khoa đã được chọn từ bộ lọc" : ""}
                />
              </div>

              <div className="form-group">
                <label>Ngành *</label>
                <input
                  type="text"
                  required
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="Ví dụ: Kỹ thuật phần mềm"
                  disabled={!!selectedMajor}
                  title={selectedMajor ? "Ngành đã được chọn từ bộ lọc" : ""}
                />
              </div>

              <div className="form-group">
                <label>Học kỳ *</label>
                <input
                  type="text"
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="Ví dụ: Học kỳ 1"
                />
              </div>

              <div className="form-group">
                <label>Môn học</label>
                <div className="subject-input-wrapper">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                    placeholder="Nhập mã môn học (ví dụ: MA006)"
                  />
                  <button
                    type="button"
                    className="btn-add-subject"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddSubject();
                    }}
                  >
                    Thêm
                  </button>
                </div>
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Nhập mã môn học và nhấn Thêm. Chỉ môn học có trong database mới được thêm.
                </small>
                <div className="subjects-tags">
                  {subjectsWithNames.length > 0 ? (
                    subjectsWithNames.map((subject, idx) => (
                      <span 
                        key={idx} 
                        className={`subject-tag-full ${!subject.exists ? 'invalid' : ''}`}
                      >
                        <span className="tag-code">{subject.subject_id}</span>
                        <span className="tag-name">{subject.subject_name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(subject.subject_id)}
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    formData.subjects.map((subject, idx) => (
                      <span key={idx} className="subject-tag">
                        {subject}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(subject)}
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-save">
                  {editingId ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
