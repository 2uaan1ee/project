import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // nhớ để trong .env
const JWT_EXPIRES_IN = "1h"; // thời gian sống của token

// Sinh JWT
export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware bảo vệ route
export function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // gắn payload vào req để dùng sau
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}