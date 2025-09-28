// src/controllers/auth.controller.js
console.log("[auth.controller] loaded from:", import.meta.url);
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fetch from "node-fetch";
import User from "../models/User.js";
import {
  signAccess,
  signRefresh,
  setRefreshCookie,
  clearRefreshCookie,
  verifyRefresh,
} from "../middleware/auth.js";
import { sendMail } from "../utils/sendMail.js";

const ok  = (res, data = {}) => res.json(data);
const bad = (res, code, message) => res.status(code).json({ message });

// ========= Helpers & Constants =========
const DEFAULT_DOMAINS = "uit.edu.vn,gm.uit.edu.vn";
function getAllowedDomains() {
  return (process.env.ALLOWED_EMAIL_DOMAINS || DEFAULT_DOMAINS)
    .toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normEmail = v => String(v ?? "").trim().toLowerCase();
const isEmailAllowed = (email, domains = getAllowedDomains()) =>
  EMAIL_RE.test(normEmail(email)) && domains.some(d => normEmail(email).endsWith(`@${d}`));

export async function login(req, res) {
  const e = normEmail(req.body?.email);
  const { password } = req.body || {};
  console.log("[login] email =", JSON.stringify(e));
  console.log("[login] allowed =", getAllowedDomains());

  if (!e || !password) return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
  if (!isEmailAllowed(e)) {
    return res.status(403).json({ message: "Tài khoản email không được phép. Chỉ chấp nhận: " + getAllowedDomains().join(", ") });
  }

  const user = await User.findOne({ email: e });
  if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

  const match = await bcrypt.compare(String(password), user.passwordHash || "");
  if (!match) return res.status(401).json({ message: "Mật khẩu không đúng" });

  const payload = { sub: String(user._id), email: user.email, role: user.role || "user" };
  const accessToken  = signAccess(payload);
  const refreshToken = signRefresh({ sub: payload.sub });
  setRefreshCookie(res, refreshToken);
  return res.json({ token: accessToken });
}


// ===== REFRESH =====
export async function refreshToken(req, res) {
  const rt = req.cookies?.refresh_token;
  if (!rt) return bad(res, 401, "Thiếu refresh token");

  const decoded = verifyRefresh(rt);
  if (!decoded?.sub) return bad(res, 401, "Refresh token không hợp lệ");

  const user = await User.findById(decoded.sub);
  if (!user) return bad(res, 401, "Không tìm thấy người dùng");

  const accessToken = signAccess({
    sub: String(user._id),
    email: user.email,
    role: user.role || "user",
  });
  return ok(res, { token: accessToken });
}

// ===== LOGOUT =====
export async function logout(_req, res) {
  clearRefreshCookie(res);
  return ok(res, { message: "Đã đăng xuất" });
}

// ===== FORGOT =====
export async function forgot(req, res) {
  const { email, /*captcha,*/ recaptchaToken } = req.body || {};
  if (!email) return bad(res, 400, "Thiếu email");

  // cũng áp dụng giới hạn miền cho forgot
  if (!isEmailAllowed(email)) {
    return bad(
      res,
      403,
      "Tài khoản email không được phép. Chỉ chấp nhận: " + getAllowedDomains().join(", ")
    );
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) return bad(res, 400, "Xác minh reCAPTCHA thất bại");

  const user = await User.findOne({ email });
  if (!user) return bad(res, 404, "Không tìm thấy người dùng");

  const raw = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const exp = new Date(Date.now() + 1000 * 60 * 15); // 15 phút

  user.resetTokenHash = resetTokenHash;
  user.resetTokenExp  = exp;
  await user.save();

  const link =
    `${process.env.CLIENT_URL || "http://localhost:5173"}` +
    `/auth/reset?token=${raw}&email=${encodeURIComponent(email)}`;

  await sendMail({
    to: email,
    subject: "Password Reset",
    html: `<p>Nhấn vào liên kết để đặt lại mật khẩu (hiệu lực 15 phút):</p><p><a href="${link}">${link}</a></p>`,
  });

  return ok(res, { message: "Đã gửi liên kết đặt lại mật khẩu (nếu email tồn tại)" });
}

// ===== RESET PASSWORD =====
export async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body || {};
  if (!email || !token || !newPassword) return bad(res, 400, "Thiếu dữ liệu");
  if (!pwPolicy.test(newPassword)) {
    return bad(res, 400, "Mật khẩu ≥ 9 ký tự, có chữ hoa, chữ thường và ký tự đặc biệt");
  }

  const user = await User.findOne({ email });
  if (!user || !user.resetTokenHash || !user.resetTokenExp)
    return bad(res, 400, "Token không hợp lệ hoặc đã hết hạn");

  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  if (tokenHash !== user.resetTokenHash || new Date() > user.resetTokenExp)
    return bad(res, 400, "Token không hợp lệ hoặc đã hết hạn");

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.resetTokenHash = undefined;
  user.resetTokenExp  = undefined;
  await user.save();

  return ok(res, { message: "Đổi mật khẩu thành công" });
}

// ===== GOOGLE CALLBACK → phát JWT + set refresh cookie + redirect FE =====
export async function googleCallback(req, res) {
  const user = req.user;
  const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";

  if (!user) {
    // luôn chuyển về FE với lý do fail (FE có thể đọc query & hiện thông báo)
    return res.redirect(`${CLIENT}/auth/login?oauth=failed`);
  }

  const accessToken  = signAccess({ sub: String(user._id), email: user.email, role: user.role || "user" });
  const refreshToken = signRefresh({ sub: String(user._id) });
  setRefreshCookie(res, refreshToken);

  return res.redirect(`${CLIENT}/oauth/callback#token=${accessToken}`);
}
