import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.routes.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Routes
app.get("/", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes); // tất cả route auth bắt đầu bằng /api/auth
// Kết nối DB rồi start server
const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () =>
      console.log(`🚀 API running on http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });
