// src/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import passport from "passport";
import path from "path";

import authRoutes from "./src/routes/auth.routes.js";
import studentRoutes from "./src/routes/students.routes.js";
import tuitionRoutes from "./src/routes/tuition.routes.js";
import { connectDB } from "./src/config/db.js";
import { initGoogleAuth } from "./src/config/googleAuth.js";
import regulationRoutes from "./src/routes/regulations.routes.js";

import subjectRoutes from "./src/routes/subjects.routes.js";
import trainingProgramRoutes from "./src/routes/trainingProgram.routes.js";
import subjectOpenRoutes from "./src/routes/subjectOpen.routes.js";

dotenv.config();

const app = express();
const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

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

app.use("/api/subjects", subjectRoutes);
app.use("/api/training-programs", (req, _res, next) => {
  console.log(`[TRAINING-PROGRAMS] ${req.method} ${req.originalUrl}`);
  next();
}, trainingProgramRoutes);
app.use("/api/subject-open", (req, _res, next) => {
  console.log(`[SUBJECT-OPEN] ${req.method} ${req.originalUrl}`);
  next();
}, subjectOpenRoutes);
app.use(
  "/api/tuition-payments",
  (req, _res, next) => {
    console.log(`[TUITION] ${req.method} ${req.originalUrl}`);
    next();
  },
  tuitionRoutes
);
app.use("/api/regulations", (req, _res, next) => {
  console.log(`[REGULATIONS] ${req.method} ${req.originalUrl}`);
  next();
}, regulationRoutes);
app.use("/uploads", express.static(uploadsDir));


// Start server sau khi kết nối DB
const port = process.env.PORT || 5000;

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
