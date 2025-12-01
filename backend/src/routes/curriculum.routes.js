import { Router } from "express";
import multer from "multer";
import {
  createSemester,
  deleteSemester,
  listCurricula,
  listMajors,
  lookupSubjects,
  updateSemester,
  uploadJson,
  validateManualSemester,
} from "../controllers/curriculum.controller.js";
import { requireRole, verifyJwt } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.use(verifyJwt);

router.get("/", listCurricula);
router.get("/majors", listMajors);
router.get("/subjects/lookup", requireRole("admin"), lookupSubjects);
router.post("/manual/validate", requireRole("admin"), validateManualSemester);
router.post("/", requireRole("admin"), createSemester);
router.post("/upload", requireRole("admin"), upload.single("file"), uploadJson);
router.patch("/:id", requireRole("admin"), updateSemester);
router.delete("/:id", requireRole("admin"), deleteSemester);

export default router;
