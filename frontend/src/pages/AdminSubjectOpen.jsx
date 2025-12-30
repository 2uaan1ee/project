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

// Separate component for Adding Subject to avoid re-rendering entire list on input change
const AddSubjectDialog = ({ open, onClose, onAdd }) => {
  const [subjectId, setSubjectId] = useState("");
  const [subjectLookup, setSubjectLookup] = useState({
    loading: false,
    found: null,
    notFound: false,
  });

  // Reset logic when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSubjectId("");
      setSubjectLookup({ loading: false, found: null, notFound: false });
    }
  }, [open]);

  // Lookup subject by ID
  const lookupSubject = async (sid) => {
    if (!sid || sid.trim().length < 2) {
      setSubjectLookup({ loading: false, found: null, notFound: false });
      return;
    }

    try {
      setSubjectLookup({ loading: true, found: null, notFound: false });
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/subjects?search=${encodeURIComponent(sid.trim())}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const subjects = response.data.subjects || [];
      const exactMatch = subjects.find(
        (s) => s.subject_id.toLowerCase() === sid.trim().toLowerCase()
      );

      if (exactMatch) {
        setSubjectLookup({ loading: false, found: exactMatch, notFound: false });
      } else {
        setSubjectLookup({ loading: false, found: null, notFound: true });
      }
    } catch (err) {
      console.error("Error looking up subject:", err);
      setSubjectLookup({ loading: false, found: null, notFound: false });
    }
  };

  // Debounce lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (subjectId) {
        lookupSubject(subjectId);
      } else {
        setSubjectLookup({ loading: false, found: null, notFound: false });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [subjectId]);

  const handleConfirm = () => {
    const finalId = subjectLookup.found ? subjectLookup.found.subject_id : subjectId;
    onAdd(finalId);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Thêm môn học</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={2}>
          <TextField
            label="Mã môn học"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            fullWidth
            placeholder="Ví dụ: CS101"
            helperText="STT sẽ tự động được gán theo thứ tự cuối cùng trong danh sách"
            autoFocus
          />

          {/* Subject lookup feedback */}
          {subjectLookup.loading && (
            <Alert severity="info" icon={false}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Đang tìm kiếm...</Typography>
              </Box>
            </Alert>
          )}

          {subjectLookup.found && (
            <Alert severity="success">
              <Typography variant="body2" fontWeight="bold">
                {subjectLookup.found.subject_name}
              </Typography>
              <Box display="flex" gap={2} mt={1}>
                <Typography variant="caption" color="text.secondary">
                  Tín chỉ LT: {subjectLookup.found.theory_credits || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tín chỉ TH: {subjectLookup.found.practice_credits || 0}
                </Typography>
              </Box>
            </Alert>
          )}

          {subjectLookup.notFound && (
            <Alert severity="warning">
              <Typography variant="body2">
                Không tìm thấy môn học với mã "{subjectId}"
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!subjectLookup.found}
        >
          Thêm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
  const [importYearError, setImportYearError] = useState("");

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
      const yearMatch = String(importForm.academicYear || "").trim().match(/^(\d{4})-(\d{4})$/);
      const yearError = yearMatch && Number(yearMatch[2]) === Number(yearMatch[1]) + 1
        ? ""
        : "Năm học sai định dạng";
      if (yearError) {
        setImportYearError(yearError);
        return;
      }
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
      setImportYearError("");
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
  const handleAddSubject = async (subjectId) => {
    try {
      if (!selectedList || !subjectId) {
        setError("Vui lòng chọn danh sách và nhập mã môn học");
        return;
      }

      // Tự động tính STT = STT cuối cùng + 1
      const lastStt = selectedList.subjects.length > 0
        ? Math.max(...selectedList.subjects.map(s => s.stt || 0))
        : 0;
      const nextStt = lastStt + 1;

      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/subject-open/${selectedList._id}/subjects`,
        {
          subject_id: subjectId,
          stt: nextStt,
        },
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
      <Dialog
        open={openImportDialog}
        onClose={() => {
          setOpenImportDialog(false);
          setImportYearError("");
        }}
      >
        <DialogTitle>Import từ Excel</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Năm học"
              value={importForm.academicYear}
              onChange={(e) => {
                const nextValue = e.target.value;
                setImportForm({ ...importForm, academicYear: nextValue });
                const match = String(nextValue || "").trim().match(/^(\d{4})-(\d{4})$/);
                const nextError = match && Number(match[2]) === Number(match[1]) + 1
                  ? ""
                  : "Năm học sai định dạng";
                setImportYearError(nextError);
              }}
              error={Boolean(importYearError)}
              helperText={importYearError || "Ví dụ: 2025-2026"}
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
          <Button
            onClick={() => {
              setOpenImportDialog(false);
              setImportYearError("");
            }}
          >
            Hủy
          </Button>
          <Button onClick={handleImportExcel} variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Thêm môn học */}
      <AddSubjectDialog
        open={openAddSubjectDialog}
        onClose={() => setOpenAddSubjectDialog(false)}
        onAdd={handleAddSubject}
      />

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
