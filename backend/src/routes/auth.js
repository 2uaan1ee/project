import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserAccount from "../models/UserAccount.js";

const r = Router();
const sign = (u) =>
  jwt.sign({ sub: u._id.toString(), email: u.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Đăng ký
r.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email & password are required" });
  const exists = await UserAccount.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserAccount.create({ name, email, passwordHash });
  const token = sign(user);
  res.status(201).json({ token, user: { id: user._id, name, email } });
});

// Đăng nhập
r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await UserAccount.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = sign(user);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

export default r;
