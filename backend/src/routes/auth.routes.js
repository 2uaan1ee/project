import { Router } from "express";
import passport from "passport";
import { signAccess, signRefresh, setRefreshCookie } from "../middleware/auth.js";
const router = Router();
const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";

// 🚀 Kick off OAuth with hints
router.get("/google", (req, res, next) => {
  // Ưu tiên hd từ query (vd: gm.uit.edu.vn), fallback domain chính (uit.edu.vn)
  const hd = (req.query.hd || "uit.edu.vn").toLowerCase();
  const login_hint = (req.query.login_hint || "").toLowerCase();

  // Lưu ý: passport-google-oauth20 sẽ forward các authParams như hd, loginHint, prompt...
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    hd,                               // ✅ gợi ý domain Google Workspace
    loginHint: login_hint || undefined, // ✅ gợi ý email nếu có
  })(req, res, next);
});

// ✅ Custom callback để phát JWT + set refresh cookie, đồng thời hiện lý do fail nếu có
router.get("/google/callback", (req, res, next) => {
  console.log("HIT /api/auth/google/callback");
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Passport error:", err);
      return res.redirect(`${CLIENT}/auth/login?oauth=failed&reason=server_error`);
    }
    if (!user) {
      const reason = encodeURIComponent(info?.message || "unknown");
      return res.redirect(`${CLIENT}/auth/login?oauth=failed&reason=${reason}`);
    }
    const accessToken  = signAccess({ sub: String(user._id), email: user.email, role: user.role || "user" });
    const refreshToken = signRefresh({ sub: String(user._id) });
    setRefreshCookie(res, refreshToken);
    return res.redirect(`${CLIENT}/oauth/callback#token=${accessToken}`);
  })(req, res, next);
});

export default router;
