// src/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import passport from "passport";

import authRoutes from "./src/routes/auth.routes.js";
import studentRoutes from "./src/routes/students.routes.js";
import subjectRoutes from "./src/routes/subject.routes.js";
import { connectDB } from "./src/config/db.js";
import { initGoogleAuth } from "./src/config/googleAuth.js";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // để FE có thể gửi/nhận cookie refresh
  })
);

// Passport (Google OAuth)
app.use(passport.initialize());
initGoogleAuth();

// Routes
app.get("/", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", (req, _res, next) => {
  console.log(`[AUTH] ${req.method} ${req.originalUrl}`);
  next();
}, authRoutes);
app.use("/api/students", (req, _res, next) => {
  console.log(`[STUDENTS] ${req.method} ${req.originalUrl}`);
  next();
}, studentRoutes);
app.use("/api/subjects", (req, _res, next) => {
  console.log(`[SUBJECTS] ${req.method} ${req.originalUrl}`);
  next();
}, subjectRoutes);


// Start server sau khi kết nối DB
const port = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });
