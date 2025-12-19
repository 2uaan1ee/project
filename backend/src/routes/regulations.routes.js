import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import {
  deleteAttachment,
  listAttachments,
  uploadAttachment,
} from "../controllers/regulationAttachment.controller.js";

const router = express.Router();

// Tạm thời skip auth để upload file vì chưa phân quyền
// TODO: Thêm phân quyền
const skipAuth = true;
const maybeAuth = skipAuth ? (_req, _res, next) => next() : authenticateToken;
const maybeAdmin = skipAuth ? (_req, _res, next) => next() : requireAdmin;


const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const REGULATION_DIR = path.join(UPLOAD_ROOT, "regulations");

fs.mkdirSync(REGULATION_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, REGULATION_DIR),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, `${timestamp}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Định dạng không được hỗ trợ. Chỉ nhận PDF/DOC/DOCX/XLS/XLSX/TXT"));
    }
  },
});

router.get(
  "/attachments",
  maybeAuth,
  listAttachments
);

router.post(
  "/attachments",
  maybeAuth,
  maybeAdmin,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File quá lớn (tối đa 10MB)" });
        }
        return res.status(400).json({ success: false, message: `Lỗi upload: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  uploadAttachment
);

router.delete(
  "/attachments/:id",
  maybeAuth,
  maybeAdmin,
  deleteAttachment
);

export default router;
