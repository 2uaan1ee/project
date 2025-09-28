// backend/src/routes/auth.routes.js
import { Router } from "express";
import passport from "passport";
import {
  login,
  forgot,
  resetPassword,
  refreshToken,
  logout,
} from "../controllers/auth.controller.js";
import { verifyJwt, signAccess, signRefresh, setRefreshCookie } from "../middleware/auth.js";

const router = Router();
const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";

/* ========== Local auth APIs ========== */
router.post("/login", (req, res, next) => {
  console.log("[route] /login -> entering controller");
  return login(req, res, next);                // ✅ đã import login ở trên
});

router.post("/forgot", forgot);
router.post("/reset",  resetPassword);

router.post("/refresh", refreshToken);
router.post("/logout",  logout);

// Ví dụ API cần JWT
router.get("/profile", verifyJwt, (req, res) => {
  res.json({ message: "Welcome!", user: req.user });
});

/* ========== Google OAuth ========== */
// Kick off OAuth: nhận gợi ý domain (hd) & login_hint từ query
router.get("/google", (req, res, next) => {
  const hd = String(req.query.hd || process.env.GOOGLE_HD || "uit.edu.vn").toLowerCase();
  const loginHint = String(req.query.login_hint || req.query.loginHint || "").trim().toLowerCase();

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    hd,
    loginHint: loginHint || undefined,
  })(req, res, next);
});

// Callback: custom để phát JWT + set refresh cookie
router.get("/google/callback", (req, res, next) => {
  console.log("[auth] HIT /api/auth/google/callback");
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("[auth] Google passport error:", err);
      return res.redirect(`${CLIENT}/auth/login?oauth=failed&reason=server_error`);
    }
    if (!user) {
      const reason = encodeURIComponent(info?.message || "unauthorized");
      return res.redirect(`${CLIENT}/auth/login?oauth=failed&reason=${reason}`);
    }

    const accessToken  = signAccess({ sub: String(user._id), email: user.email, role: user.role || "user" });
    const refreshToken = signRefresh({ sub: String(user._id) });
    setRefreshCookie(res, refreshToken);

    return res.redirect(`${CLIENT}/oauth/callback#token=${accessToken}`);
  })(req, res, next);
});

export default router;
