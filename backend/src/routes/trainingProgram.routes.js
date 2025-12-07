import express from "express";
import {
  uploadTrainingProgram,
  getFaculties,
  getMajorsByFaculty,
  getTrainingProgramByMajor,
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  deleteAllTrainingPrograms,
} from "../controllers/trainingProgram.controller.js";
import { verifyJwt, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// ====== Admin routes (requires authentication and admin role) ======
router.post("/upload", verifyJwt, requireAdmin, uploadTrainingProgram);
router.get("/admin/all", verifyJwt, requireAdmin, getAllPrograms);
router.get("/admin/:id", verifyJwt, requireAdmin, getProgramById);
router.post("/admin/create", verifyJwt, requireAdmin, createProgram);
router.put("/admin/:id", verifyJwt, requireAdmin, updateProgram);
router.delete("/admin/:id", verifyJwt, requireAdmin, deleteProgram);
router.delete("/delete-all", verifyJwt, requireAdmin, deleteAllTrainingPrograms);

// ====== User routes (requires authentication) ======
router.get("/faculties", verifyJwt, getFaculties);
router.get("/majors", verifyJwt, getMajorsByFaculty);
router.get("/program", verifyJwt, getTrainingProgramByMajor);

export default router;
