// src/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import passport from "passport";

import authRoutes from "./src/routes/auth.routes.js";
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
