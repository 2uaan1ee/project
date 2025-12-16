import { Router } from "express";
import { listPaymentFilters, summarizePayments } from "../controllers/tuition.controller.js";
import { verifyJwt } from "../middleware/auth.js";

const router = Router();

router.get("/filters", verifyJwt, listPaymentFilters);
router.get("/", verifyJwt, summarizePayments);

export default router;
