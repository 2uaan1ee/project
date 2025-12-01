// src/routes/subjectRoutes.js
import { Router } from "express";
import {
  createOrUpdateSubject,
  listSubjects,
  openSubjects,
} from "../controllers/subject.controller.js";

const router = Router();

// /api/subjects
router
  .route("/")
  .get(listSubjects)        // GET /api/subjects
  .post(createOrUpdateSubject); // POST /api/subjects

router.post("/open", openSubjects); // POST /api/subjects/open

export default router;
