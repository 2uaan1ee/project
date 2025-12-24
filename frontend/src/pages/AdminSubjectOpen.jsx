// pages/AdminSubjectOpen.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  Box,
  Typography,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminSubjectOpen = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog states
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openAddSubjectDialog, setOpenAddSubjectDialog] = useState(false);
  const [openValidationDialog, setOpenValidationDialog] = useState(false);

  // Form states
  const [importForm, setImportForm] = useState({
    academicYear: "2025-2026",
    semester: "HK2",
    file: null,
  });

  const [addSubjectForm, setAddSubjectForm] = useState({
    subject_id: "",
    stt: "",
  });

  const [validationResult, setValidationResult] = useState(null);

  // Fetch danh sách môn học mở
  const fetchLists = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/subject-open`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLists(response.data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tải danh sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Import từ Excel
  const handleImportExcel = async () => {
    try {
      if (!importForm.file) {
        setError("Vui lòng chọn file Excel");
        return;
      }

      setLoading(true);
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", importForm.file);
      formData.append("academicYear", importForm.academicYear);
      formData.append("semester", importForm.semester);

      const response = await axios.post(
        `${API_URL}/api/subject-open/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(response.data.message);
      setOpenImportDialog(false);
      setImportForm({ academicYear: "2025-2026", semester: "HK2", file: null });
      fetchLists();
    } catch (err) {
      if (err.response?.data?.missingByMajor) {
        setValidationResult({
          valid: false,
          message: err.response.data.message,
          missingByMajor: err.response.data.missingByMajor,
        });
        setOpenValidationDialog(true);
      } else if (err.response?.data?.invalidSubjects) {
        setError(
          `Có môn học không tồn tại: ${err.response.data.invalidSubjects.join(", ")}`
        );
      } else {
        setError(err.response?.data?.message || "Lỗi khi import");
      }
    } finally {
      setLoading(false);
    }
  };

  // Thêm môn học manual
  const handleAddSubject = async () => {
    try {
      if (!selectedList || !addSubjectForm.subject_id) {
        setError("Vui lòng chọn danh sách và nhập mã môn học");
        return;
      }

      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/subject-open/${selectedList._id}/subjects`,
        addSubjectForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.warning) {
        setValidationResult({
          valid: false,
          message: response.data.warning,
          missingByMajor: response.data.missingByMajor,
        });
        setOpenValidationDialog(true);
      } else {
        setSuccess(response.data.message);
      }

      setOpenAddSubjectDialog(false);
      setAddSubjectForm({ subject_id: "", stt: "" });
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thêm môn học");
    } finally {
      setLoading(false);
    }
  };

  // Xóa môn học
  const handleDeleteSubject = async (listId, subjectId) => {
    if (!confirm("Bạn có chắc muốn xóa môn học này?")) return;

    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      await axios.delete(
        `${API_URL}/api/subject-open/${listId}/subjects/${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Xóa môn học thành công");
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa môn học");
    } finally {
      setLoading(false);
    }
  };

  // Xóa danh sách
  const handleDeleteList = async (listId) => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ danh sách này?")) return;

    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      await axios.delete(`${API_URL}/api/subject-open/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Xóa danh sách thành công");
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa danh sách");
    } finally {
      setLoading(false);
    }
  };

  // Toggle public/private
  const handleTogglePublic = async (listId, currentStatus) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/api/subject-open/${listId}/toggle-public`,
        { isPublic: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thay đổi trạng thái");
    } finally {
      setLoading(false);
    }
  };

  // Validate danh sách
  const handleValidateList = async (listId) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/subject-open/${listId}/validate`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setValidationResult(response.data.validation);
      setOpenValidationDialog(true);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi validate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Quản lý Môn học Mở</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => navigate("/app/dashboard")}
          >
            ← Quay về trang chủ
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setOpenImportDialog(true)}
          >
            Import từ Excel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Danh sách các kì */}
      {lists.map((list) => (
        <Paper key={list._id} sx={{ p: 2, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <div>
              <Typography variant="h6">
                {list.academicYear} - {list.semester}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip
                  icon={list.isPublic ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  label={list.isPublic ? "Public" : "Private"}
                  color={list.isPublic ? "success" : "default"}
                  size="small"
                />
                <Chip
                  label={`${list.subjects.length} môn`}
                  color="primary"
                  size="small"
                />
              </Box>
            </div>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleValidateList(list._id)}
              >
                Kiểm tra
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={list.isPublic}
                    onChange={() => handleTogglePublic(list._id, list.isPublic)}
                  />
                }
                label="Public"
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedList(list);
                  setOpenAddSubjectDialog(true);
                }}
              >
                Thêm môn
              </Button>
              <IconButton
                color="error"
                onClick={() => handleDeleteList(list._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Mã môn</TableCell>
                  <TableCell>Tên môn</TableCell>
                  <TableCell align="center">Tín chỉ LT</TableCell>
                  <TableCell align="center">Tín chỉ TH</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.subjects.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell>{subject.stt || index + 1}</TableCell>
                    <TableCell>{subject.subject_id}</TableCell>
                    <TableCell>{subject.subject_name}</TableCell>
                    <TableCell align="center">{subject.theory_credits}</TableCell>
                    <TableCell align="center">{subject.practice_credits}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDeleteSubject(list._id, subject.subject_id)
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}

      {/* Dialog Import Excel */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)}>
        <DialogTitle>Import từ Excel</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Năm học"
              value={importForm.academicYear}
              onChange={(e) =>
                setImportForm({ ...importForm, academicYear: e.target.value })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={importForm.semester}
                onChange={(e) =>
                  setImportForm({ ...importForm, semester: e.target.value })
                }
              >
                <MenuItem value="HK1">HK1</MenuItem>
                <MenuItem value="HK2">HK2</MenuItem>
                <MenuItem value="HK3">HK3</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" component="label">
              Chọn file Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) =>
                  setImportForm({ ...importForm, file: e.target.files[0] })
                }
              />
            </Button>
            {importForm.file && (
              <Typography variant="body2" color="text.secondary">
                Đã chọn: {importForm.file.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>Hủy</Button>
          <Button onClick={handleImportExcel} variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Thêm môn học */}
      <Dialog
        open={openAddSubjectDialog}
        onClose={() => setOpenAddSubjectDialog(false)}
      >
        <DialogTitle>Thêm môn học</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Mã môn học"
              value={addSubjectForm.subject_id}
              onChange={(e) =>
                setAddSubjectForm({ ...addSubjectForm, subject_id: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Số thứ tự"
              type="number"
              value={addSubjectForm.stt}
              onChange={(e) =>
                setAddSubjectForm({ ...addSubjectForm, stt: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddSubjectDialog(false)}>Hủy</Button>
          <Button onClick={handleAddSubject} variant="contained">
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Validation Result */}
      <Dialog
        open={openValidationDialog}
        onClose={() => setOpenValidationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {validationResult?.valid ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircleIcon color="success" />
              Danh sách hợp lệ
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon color="warning" />
              Danh sách chưa đủ
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {validationResult?.valid ? (
            <Alert severity="success">{validationResult.message}</Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {validationResult?.message}
                {validationResult?.checkedSemesters && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Đã kiểm tra các học kỳ: {validationResult.checkedSemesters.join(", ")}
                  </Typography>
                )}
              </Alert>
              {validationResult?.missingByMajor?.map((item, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.major} - {item.faculty}
                  </Typography>
                  {item.semesters && (
                    <Typography variant="caption" color="text.secondary">
                      Các học kỳ: {item.semesters.join(", ")}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Còn thiếu {item.totalMissing || item.missingSubjects.length} môn
                    {item.requiredCount && ` / ${item.requiredCount} môn bắt buộc`}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    {item.missingSubjects.map((subjectId, i) => (
                      <Chip key={i} label={subjectId} size="small" color="error" variant="outlined" />
                    ))}
                    {item.totalMissing > item.missingSubjects.length && (
                      <Chip
                        label={`+${item.totalMissing - item.missingSubjects.length} môn nữa`}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>
                </Paper>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenValidationDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminSubjectOpen;
