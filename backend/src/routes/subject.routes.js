// src/routes/subjectRoutes.js
import { Router } from "express";
import {
  createOrUpdateSubject,
  listSubjects,
} from "../controllers/subject.controller.js";

const router = Router();

// /api/subjects
router
  .route("/")
  .get(listSubjects)        // GET /api/subjects
  .post(createOrUpdateSubject); // POST /api/subjects

export default router;
