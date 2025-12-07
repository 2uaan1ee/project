import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/training-program.css";

export default function TrainingProgram() {
  const nav = useNavigate();
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [programs, setPrograms] = useState([]);
  
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // Fetch faculties on component mount
  useEffect(() => {
    fetchFaculties();
  }, []);

  // Fetch majors when faculty changes
  useEffect(() => {
    if (selectedFaculty) {
      fetchMajors(selectedFaculty);
      setSelectedMajor("");
      setPrograms([]);
    } else {
      setMajors([]);
      setSelectedMajor("");
      setPrograms([]);
    }
  }, [selectedFaculty]);

  // Fetch programs when major changes
  useEffect(() => {
    if (selectedFaculty && selectedMajor) {
      fetchPrograms(selectedFaculty, selectedMajor);
    } else {
      setPrograms([]);
    }
  }, [selectedMajor]);

  const fetchFaculties = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/training-programs/faculties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFaculties(data.faculties || []);
      } else {
        setError(data.message || "Lỗi khi tải danh sách khoa");
      }
    } catch (err) {
      console.error("Error fetching faculties:", err);
      setError("Không thể kết nối đến server");
    }
  };

  const fetchMajors = async (faculty) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/training-programs/majors?faculty=${encodeURIComponent(faculty)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMajors(data.majors || []);
      } else {
        setError(data.message || "Lỗi khi tải danh sách ngành");
      }
    } catch (err) {
      console.error("Error fetching majors:", err);
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async (faculty, major) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/training-programs/program?faculty=${encodeURIComponent(faculty)}&major=${encodeURIComponent(major)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPrograms(data.programs || []);
      } else {
        setError(data.message || "Lỗi khi tải chương trình đào tạo");
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="training-program">
      <div className="page-header">
        <h1>Chương trình Đào tạo</h1>
        <button className="btn-back" onClick={() => nav("/app/dashboard")}>
          ← Quay lại
        </button>
      </div>
      <p className="description">
        Chọn khoa và ngành để xem chương trình đào tạo chi tiết
      </p>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="faculty">Khoa:</label>
          <select
            id="faculty"
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
          <label htmlFor="major">Ngành:</label>
          <select
            id="major"
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

      {error && <div className="message error">{error}</div>}

      {loading && <div className="loading">Đang tải...</div>}

      {programs.length > 0 && !loading && (
        <div className="programs-list">
          <h2>
            Chương trình: {selectedMajor} - {selectedFaculty}
          </h2>
          {programs.map((program, index) => (
            <div key={index} className="program-item">
              <h3>{program.semester}</h3>
              <div className="subjects-list">
                {program.subjectsDetails && program.subjectsDetails.length > 0 ? (
                  <ul>
                    {program.subjectsDetails.map((subject, idx) => (
                      <li key={idx} className={!subject.exists ? "subject-not-found" : ""}>
                        <span className="subject-code">{subject.subject_id}</span>
                        <span className="subject-name">{subject.subject_name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Không có môn học</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && selectedFaculty && selectedMajor && programs.length === 0 && !error && (
        <div className="no-data">Không có dữ liệu chương trình đào tạo cho ngành này</div>
      )}
    </div>
  );
}
