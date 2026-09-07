import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { objectId, publicUserFields } from "../utils/validation.js";
export const visibleVideos = (user) =>
  user
    ? { $or: [{ isPublished: true }, { owner: user._id }] }
    : { isPublished: true };
export async function accessibleVideo(id, user, ownerOnly = false) {
  objectId(id);
  const video = await Video.findOne({
    _id: id,
    ...(ownerOnly ? { owner: user._id } : visibleVideos(user)),
  });
  if (!video) throw new ApiError(404, "Video not found");
  return video;
}
export function videoDTO(video) {
  const value = video.toObject ? video.toObject() : video;
  const { videoPublicId, thumbnailPublicId, decription, ...safe } = value;
  return {
    ...safe,
    description: value.description || decription || "",
    durationSeconds: value.duration,
  };
}
export const populateOwner = { path: "owner", select: publicUserFields };
