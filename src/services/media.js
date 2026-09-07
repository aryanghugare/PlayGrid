import { v2 as cloudinary } from "cloudinary";
import { mkdir, copyFile, unlink, open } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";
export const mediaDirectory = path.resolve(
  process.env.MEDIA_DIRECTORY || "data/media"
);
export async function assertMedia(file, kind) {
  if (!file)
    throw new ApiError(
      400,
      `${kind === "video" ? "Video" : "Image"} file is required`
    );
  const handle = await open(file.path, "r");
  const header = Buffer.alloc(16);
  try {
    await handle.read(header, 0, 16, 0);
  } finally {
    await handle.close();
  }
  const image =
    header.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
    header
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (header.toString("ascii", 0, 4) === "RIFF" &&
      header.toString("ascii", 8, 12) === "WEBP");
  const video =
    header.toString("ascii", 4, 8) === "ftyp" ||
    header.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]));
  if (!(kind === "video" ? video : image))
    throw new ApiError(
      400,
      "File contents do not match a supported media format"
    );
  if (kind === "image" && file.size > 10 * 1024 * 1024)
    throw new ApiError(413, "Images must be 10 MB or smaller");
}
export async function storeMedia(file, kind) {
  await assertMedia(file, kind);
  if (process.env.MEDIA_DRIVER === "local") {
    await mkdir(mediaDirectory, { recursive: true });
    const ext = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
    }[file.mimetype];
    if (!ext) throw new ApiError(400, "Unsupported media type");
    const id = randomUUID() + ext;
    await copyFile(file.path, path.join(mediaDirectory, id));
    return { url: `/media/${id}`, publicId: `local:${id}` };
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
  });
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: kind,
      folder: "playgrid",
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
    };
  } catch {
    throw new ApiError(502, "Media storage is unavailable. Please try again");
  }
}
export async function removeMedia(id, kind = "image") {
  if (!id) return;
  try {
    if (id.startsWith("local:")) {
      const name = id.slice(6);
      if (path.basename(name) !== name) return;
      await unlink(path.join(mediaDirectory, name));
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
      });
      await cloudinary.uploader.destroy(id, { resource_type: kind });
    }
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Media cleanup failed for", id);
  }
}
