import express from "express";
import multer from "multer";
import {
  getSubjectOpenList,
  importSubjectOpenFromExcel,
  createOrUpdateSubjectOpen,
  addSubjectToList,
  removeSubjectFromList,
  deleteSubjectOpenList,
  togglePublicStatus,
  validateCurrentList,
} from "../controllers/subjectOpen.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Cấu hình multer cho upload file Excel/CSV
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)"));
    }
  },
});

// Public routes (user có thể xem danh sách public)
router.get("/", authenticateToken, getSubjectOpenList);

// Admin routes
router.post(
  "/import",
  authenticateToken,
  requireAdmin,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File quá lớn. Kích thước tối đa 5MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Lỗi upload: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  importSubjectOpenFromExcel
);

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  createOrUpdateSubjectOpen
);

router.post(
  "/:id/subjects",
  authenticateToken,
  requireAdmin,
  addSubjectToList
);

router.delete(
  "/:id/subjects/:subject_id",
  authenticateToken,
  requireAdmin,
  removeSubjectFromList
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  deleteSubjectOpenList
);

router.patch(
  "/:id/toggle-public",
  authenticateToken,
  requireAdmin,
  togglePublicStatus
);

router.get(
  "/:id/validate",
  authenticateToken,
  requireAdmin,
  validateCurrentList
);

export default router;
