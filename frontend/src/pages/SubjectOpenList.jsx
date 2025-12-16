// pages/SubjectOpenList.jsx - Trang xem môn học mở cho User
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SubjectOpenList = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025-2026");
  const [selectedSemester, setSelectedSemester] = useState("");

  // Fetch danh sách môn học mở (chỉ public)
  const fetchLists = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      
      let url = `${API_URL}/api/subject-open`;
      const params = new URLSearchParams();
      if (selectedYear) params.append("academicYear", selectedYear);
      if (selectedSemester) params.append("semester", selectedSemester);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`API lỗi (${response.status})`);
      }

      const data = await response.json();
      setLists(data.success ? data.data || [] : []);
      setError("");
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách");
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [selectedYear, selectedSemester]);

  // Lấy danh sách năm học và học kỳ có sẵn
  const availableYears = [...new Set(lists.map((l) => l.academicYear))];
  const availableSemesters = [...new Set(lists.map((l) => l.semester))];

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Danh sách Môn học Mở
      </Typography>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl style={{ minWidth: 200 }}>
          <InputLabel>Năm học</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
            <MenuItem value="2025-2026">2025-2026</MenuItem>
            <MenuItem value="2026-2027">2026-2027</MenuItem>
          </Select>
        </FormControl>

        <FormControl style={{ minWidth: 150 }}>
          <InputLabel>Học kỳ</InputLabel>
          <Select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="HK1">HK1</MenuItem>
            <MenuItem value="HK2">HK2</MenuItem>
            <MenuItem value="HK3">HK3</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : lists.length === 0 ? (
        <Alert severity="info">
          Chưa có danh sách môn học mở cho kỳ này hoặc danh sách chưa được công khai.
        </Alert>
      ) : (
        lists.map((list) => (
          <Paper key={list._id} sx={{ mb: 3, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {list.academicYear} - {list.semester}
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label={`${list.subjects.length} môn`}
                  color="primary"
                  size="small"
                />
                {list.isPublic && (
                  <Chip label="Public" color="success" size="small" />
                )}
              </Box>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã môn</TableCell>
                    <TableCell>Tên môn học</TableCell>
                    <TableCell align="center">Tín chỉ LT</TableCell>
                    <TableCell align="center">Tín chỉ TH</TableCell>
                    <TableCell align="center">Tổng TC</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.subjects.map((subject, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{subject.stt || index + 1}</TableCell>
                      <TableCell>
                        <strong>{subject.subject_id}</strong>
                      </TableCell>
                      <TableCell>{subject.subject_name}</TableCell>
                      <TableCell align="center">{subject.theory_credits}</TableCell>
                      <TableCell align="center">{subject.practice_credits}</TableCell>
                      <TableCell align="center">
                        <strong>
                          {subject.theory_credits + subject.practice_credits}
                        </strong>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Cập nhật lần cuối: {new Date(list.updatedAt).toLocaleString("vi-VN")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng: {list.subjects.reduce((sum, s) => sum + s.theory_credits + s.practice_credits, 0)} tín chỉ
              </Typography>
            </Box>
          </Paper>
        ))
      )}
    </div>
  );
};

export default SubjectOpenList;
