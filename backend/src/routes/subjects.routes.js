import { Router } from "express";
import { verifyJwt } from "../middleware/auth.js";
import { listSubjects } from "../controllers/subject.controller.js";

const router = Router();

router.use(verifyJwt);
router.get("/", listSubjects);

export default router;
