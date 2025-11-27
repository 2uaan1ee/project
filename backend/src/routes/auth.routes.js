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

import {
  verifyJwt,
  signAccess,
  signRefresh,
  setRefreshCookie,
} from "../middleware/auth.js";

const router = Router();
const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";

/* ===========================================
   LOCAL AUTH
=========================================== */
router.post("/login", (req, res, next) => {
  console.log("[route] /login -> entering controller");
  return login(req, res, next);
});

router.post("/forgot", forgot);
router.post("/reset", resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

/* ===========================================
   PROTECTED ROUTE EXAMPLE
=========================================== */
router.get("/profile", verifyJwt, (req, res) => {
  res.json({ message: "Welcome!", user: req.user });
});

/* ===========================================
   GOOGLE OAUTH – STEP 1
=========================================== */
router.get("/google", (req, res, next) => {
  console.log("[auth] HIT /api/auth/google");

  const hd = String(req.query.hd || process.env.GOOGLE_HD || "uit.edu.vn").toLowerCase();
  const loginHint = String(req.query.login_hint || req.query.loginHint || "").trim().toLowerCase();

  console.log("[auth] Google login params:", { hd, loginHint });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    hd,
    loginHint: loginHint || undefined,
  })(req, res, next);
});

/* ===========================================
   GOOGLE OAUTH – STEP 2 (CALLBACK)
=========================================== */
router.get("/google/callback", (req, res, next) => {
  console.log("[auth] HIT /api/auth/google/callback");

  // IMPORTANT: profile DOES NOT come from passport directly.
  // It must be attached in googleAuth.js via user._googleProfile.
  passport.authenticate("google", { session: false }, (err, user, info) => {
    console.log("---- GOOGLE CALLBACK DEBUG ----");
    console.log("err:", err);
    console.log("user:", user);
    console.log("info:", info);

    const profile = user?._googleProfile;

    console.log("profile:", profile && {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      avatar: profile.photos?.[0]?.value,
      provider: profile.provider,
    });
    console.log("--------------------------------");

    // ERROR CASE
    if (err) {
      console.error("❌ [auth] Google passport error:", err);
      return res.redirect(`${CLIENT}/auth/login?oauth=failed&reason=server_error`);
    }

    if (!user) {
      const reason = encodeURIComponent(info?.message || "unauthorized");
      console.warn(`⚠️ [auth] Google login failed: ${reason}`);
      return res.redirect(`${CLIENT}/auth/login?oauth=failed&reason=${reason}`);
    }

    try {
      // SIGN JWT TOKENS
      const accessToken = signAccess({
        sub: String(user._id),
        email: user.email,
        role: user.role ?? "user",
      });
      const refreshToken = signRefresh({ sub: String(user._id) });

      console.log("[auth] accessToken:", accessToken.slice(0, 25) + "...");
      console.log("[auth] refreshToken:", refreshToken.slice(0, 25) + "...");

      setRefreshCookie(res, refreshToken);

      // GET AVATAR FROM PROFILE (Google Photo)
      const avatar = profile?.photos?.[0]?.value || "";
      const name = user.name || "";
      const email = user.email || "";

      console.log("[auth] Final user info being sent to FE:", {
        name,
        email,
        avatar
      });

      const redirectURL =
        `${CLIENT}/oauth/callback` +
        `?token=${accessToken}` +
        `&name=${encodeURIComponent(name)}` +
        `&email=${encodeURIComponent(email)}` +
        `&avatar=${encodeURIComponent(avatar)}`;

      console.log("[auth] Redirecting FE to:", redirectURL);

      console.log(`✅ [auth] Google login success for ${user.email}`);

      return res.redirect(redirectURL);

    } catch (tokenErr) {
      console.error("❌ [auth] Token signing error:", tokenErr);
      return res.redirect(`${CLIENT}/auth/login?oauth=failed&reason=token_error`);
    }
  })(req, res, next);
});

export default router;
