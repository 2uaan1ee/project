// backend/src/routes/tuition.routes.js
import { Router } from "express";
import {
    listTuitionMaps,
    listPaymentFilters,
    summarizePayments,
    listStudentReceiptsGrouped,
} from "../controllers/tuition.controller.js";
import { verifyJwt } from "../middleware/auth.js";

const router = Router();

// ✅ StudentListTuition.jsx dùng: /api/tuition-payments/maps
router.get("/maps", verifyJwt, listTuitionMaps);

// cũ
router.get("/filters", verifyJwt, listPaymentFilters);
router.get("/", verifyJwt, summarizePayments);

// ✅ StudentTuitionReceipts.jsx dùng: /api/tuition-payments/student/:studentId
router.get("/student/:studentId", verifyJwt, listStudentReceiptsGrouped);

export default router;
