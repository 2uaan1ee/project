// backend/src/routes/avatar.routes.js
import { Router } from "express";
import axios from "axios";

const router = Router();

const MAX_BYTES = 2 * 1024 * 1024;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_LIMIT = 100;
const cache = new Map();

function isAllowedAvatarUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "lh3.googleusercontent.com" || host.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key, value) {
  if (cache.size >= CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, value);
}

router.get("/avatar-proxy", async (req, res) => {
  const url = String(req.query.url || "");

  if (!isAllowedAvatarUrl(url)) {
    return res.status(400).json({ message: "invalid_avatar_url" });
  }

  const cached = getFromCache(url);
  if (cached) {
    res.set("Content-Type", cached.contentType || "image/jpeg");
    res.set("Cache-Control", "public, max-age=600");
    return res.send(cached.data);
  }

  try {
    const resp = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 8000,
      maxContentLength: MAX_BYTES,
      maxBodyLength: MAX_BYTES,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const contentType = resp.headers["content-type"] || "image/jpeg";
    const data = Buffer.from(resp.data);

    setCache(url, { ts: Date.now(), contentType, data });

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=600");
    return res.send(data);
  } catch {
    return res.status(502).json({ message: "avatar_fetch_failed" });
  }
});

export default router;
