// config/db.js
import mongoose from "mongoose";

export async function connectDB(uriFromArg) {
  const uri = uriFromArg || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGO_URI / MONGODB_URI");

  // Nếu URI không có tên DB ở cuối, dùng 'myapp' làm mặc định
  const hasDbInPath = /^mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(uri);
  const dbName = hasDbInPath ? undefined : "myapp";

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 7000,
    });
    console.log(`✅ MongoDB connected to Atlas`);
  } catch (err) {
    console.error("❌ Mongo connect error:", err.message);
    console.error("➡ Kiểm tra:");
    console.error("  1) URI Atlas đúng chưa (user/pass, cluster, dbname, appName)?");
    console.error("  2) Password đã URL-encode?");
    console.error("  3) Atlas Network Access đã allow IP của bạn / 0.0.0.0/0?");
    console.error("  4) User có quyền readWrite trên DB?");
    throw err;
  }
}
