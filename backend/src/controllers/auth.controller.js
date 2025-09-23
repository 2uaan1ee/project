import bcrypt from "bcryptjs";
import crypto from "crypto";
import fetch from "node-fetch";
import User from "../models/User.js";
import { signJwt } from "../middleware/auth.js";

const ok = (res, data = {}) => res.json(data);
const bad = (res, code, message) => res.status(code).json({ message });

async function verifyRecaptcha(token) {
  if (!token) return false;
  try {
    const resp = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`,
      { method: "POST" }
    );
    const data = await resp.json();
    return !!data.success;
  } catch (e) {
    console.error("reCAPTCHA verify error:", e);
    return false;
  }
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return bad(res, 400, "Missing email or password");

  const user = await User.findOne({ email });
  if (!user) return bad(res, 404, "User not found");

  const match = await bcrypt.compare(String(password), user.passwordHash);
  if (!match) return bad(res, 401, "Invalid password");

  // phát JWT
  const token = signJwt({
    sub: String(user._id),
    email: user.email,
    role: user.role || "user",
  });

  return ok(res, { token }); // Frontend đọc field này
}

export async function forgot(req, res) {
  const { email, captcha, recaptchaToken } = req.body || {};
  if (!email) return bad(res, 400, "Missing email");

  // Verify reCAPTCHA
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) return bad(res, 400, "reCAPTCHA failed");

  const user = await User.findOne({ email });
  if (!user) return bad(res, 404, "User not found");

  const raw = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const exp = new Date(Date.now() + 1000 * 60 * 15);

  user.resetTokenHash = resetTokenHash;
  user.resetTokenExp = exp;
  await user.save();

  const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/auth/reset?token=${raw}&email=${encodeURIComponent(email)}`;

  await sendMail({
    to: email,
    subject: "Password Reset",
    html: `<p>Click để đặt lại mật khẩu (hiệu lực 15 phút):</p><p><a href="${link}">${link}</a></p>`,
  });

  return ok(res, { message: "Reset link sent if the email exists" });
}

export async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body || {};
  if (!email || !token || !newPassword) return bad(res, 400, "Missing fields");

  const user = await User.findOne({ email });
  if (!user || !user.resetTokenHash || !user.resetTokenExp)
    return bad(res, 400, "Invalid or expired token");

  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  if (tokenHash !== user.resetTokenHash || new Date() > user.resetTokenExp)
    return bad(res, 400, "Invalid or expired token");

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.resetTokenHash = undefined;
  user.resetTokenExp = undefined;
  await user.save();

  return ok(res, { message: "Password updated" });
}