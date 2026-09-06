import { ApiError } from "../utils/ApiError.js";
export function allowedOrigins() {
  return (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
export function browserWriteGuard(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("Origin");
  const sameOrigin = process.env.APP_ORIGIN;
  if (origin && !allowedOrigins().includes(origin) && origin !== sameOrigin)
    return next(new ApiError(403, "Request origin is not allowed"));
  if (!origin && req.get("Sec-Fetch-Site") === "cross-site")
    return next(new ApiError(403, "Cross-site request denied"));
  next();
}
export function rateLimit({ limit = 30, windowMs = 15 * 60 * 1000 } = {}) {
  const entries = new Map();
  const timer = setInterval(() => {
    for (const [key, value] of entries)
      if (value.until < Date.now()) entries.delete(key);
  }, windowMs);
  timer.unref();
  return (req, res, next) => {
    if (process.env.NODE_ENV === "test") return next();
    const key = req.ip;
    const now = Date.now();
    const value = entries.get(key);
    if (!value || value.until < now)
      entries.set(key, { count: 1, until: now + windowMs });
    else if (++value.count > limit) {
      res.set("Retry-After", String(Math.ceil((value.until - now) / 1000)));
      return next(new ApiError(429, "Too many requests. Try again later"));
    }
    next();
  };
}
