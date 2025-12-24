// backend/src/routes/courseRegistrations.routes.js
import { Router } from "express";
import { verifyJwt, requireAdmin } from "../middleware/auth.js";
import {
    getAllRegistrations,
    getRegistrationById,
} from "../controllers/courseRegistrations.controller.js";

const router = Router();

// All routes require authentication and admin role
router.use(verifyJwt, requireAdmin);

// GET /api/course-registrations - List with pagination, search, sort
router.get("/", getAllRegistrations);

// GET /api/course-registrations/:id - Get full details
router.get("/:id", getRegistrationById);

export default router;
