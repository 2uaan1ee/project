import fs from "fs";
import path from "path";
import RegulationAttachment from "../models/regulationAttachment.model.js";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const REGULATION_DIR = path.join(UPLOAD_ROOT, "regulations");
const PUBLIC_PATH = "/uploads/regulations";

function buildPublicPath(fileName) {
  return path.posix.join(PUBLIC_PATH, fileName);
}

export async function listAttachments(_req, res) {
  const files = await RegulationAttachment.find().sort({ createdAt: -1 }).lean();
  return res.json({
    success: true,
    attachments: files,
  });
}

export async function uploadAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Chưa chọn file" });
  }

  const file = req.file;
  const doc = await RegulationAttachment.create({
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    path: buildPublicPath(file.filename),
    uploadedBy: req.user?.sub || null,
    uploaderEmail: req.user?.email || null,
  });

  return res.json({
    success: true,
    attachment: doc,
    message: "Tải file thành công",
  });
}

export async function deleteAttachment(req, res) {
  const { id } = req.params;
  const doc = await RegulationAttachment.findById(id);
  if (!doc) {
    return res.status(404).json({ success: false, message: "Không tìm thấy file" });
  }

  const fullPath = path.join(REGULATION_DIR, doc.fileName);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error("[regulation] Không thể xoá file trên ổ đĩa:", err.message);
  }

  await doc.deleteOne();
  return res.json({ success: true, message: "Đã xoá file đính kèm" });
}
