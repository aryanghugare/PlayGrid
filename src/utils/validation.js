import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";
export function text(value, name, { min = 1, max = 5000 } = {}) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new ApiError(
      400,
      `${name} must be between ${min} and ${max} characters`
    );
  return value.trim();
}
export function objectId(value) {
  if (typeof value !== "string" || !mongoose.isObjectIdOrHexString(value))
    throw new ApiError(400, "Invalid resource ID");
  return value;
}
export function pagination(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw new ApiError(400, "Invalid pagination (page >= 1, limit 1–100)");
  return { page, limit, skip: (page - 1) * limit };
}
export function pageResult(items, total, { page, limit }) {
  return { items, total, page, limit, hasNextPage: page * limit < total };
}
export function boolean(value, name = "value") {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new ApiError(400, `${name} must be true or false`);
}
export function email(value) {
  const result = text(value, "Email", { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    throw new ApiError(400, "Enter a valid email address");
  return result;
}
export function password(value) {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    Buffer.byteLength(value) > 72
  )
    throw new ApiError(
      400,
      "Password must be at least 8 characters and at most 72 bytes"
    );
  return value;
}
export const publicUserFields =
  "_id username fullName avatar coverImage createdAt";
export function safeUser(user) {
  const value = user.toObject ? user.toObject() : user;
  const {
    password,
    refreshToken,
    sessionVersion,
    avatarPublicId,
    coverImagePublicId,
    ...safe
  } = value;
  return safe;
}
