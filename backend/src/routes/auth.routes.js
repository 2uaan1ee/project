import { Router } from "express";
import { login, forgot, resetPassword } from "../controllers/auth.controller.js";
import { verifyJwt } from "../middleware/auth.js";
const router = Router();
router.get("/profile", verifyJwt, (req, res) => {
    // req.user có chứa payload từ token
    res.json({ message: "Welcome!", user: req.user });
    });
router.post("/login", login);         // POST /api/auth/login
router.post("/forgot", forgot);       // POST /api/auth/forgot
router.post("/reset", resetPassword); // POST /api/auth/reset

export default router;
