import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import {
  accessibleVideo,
  visibleVideos,
  videoDTO,
  populateOwner,
} from "../services/videos.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import { objectId, pagination, pageResult } from "../utils/validation.js";
export async function setLike(req, res) {
  const { target, targetId } = req.params;
  objectId(targetId);
  if (!["video", "tweet", "comment"].includes(target))
    throw new ApiError(400, "Unknown like target");
  if (target === "video") await accessibleVideo(targetId, req.user);
  else {
    const item = await (target === "tweet" ? Tweet : Comment).findById(
      targetId
    );
    if (!item) throw new ApiError(404, "Content not found");
    if (target === "comment")
      await accessibleVideo(String(item.video), req.user);
  }
  const filter = { [target]: targetId, likedBy: req.user._id },
    isLiked = req.method === "PUT";
  if (isLiked) {
    try {
      await Like.updateOne(
        filter,
        { $setOnInsert: filter },
        { upsert: true, runValidators: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  } else await Like.deleteMany(filter);
  res.json(
    new ApiResponse(200, {
      isLiked,
      likesCount: await Like.countDocuments({ [target]: targetId }),
    })
  );
}
export async function likedVideos(req, res) {
  const p = pagination(req.query);
  const ids = await Like.find({
    likedBy: req.user._id,
    video: { $exists: true },
  })
    .sort({ createdAt: -1, _id: -1 })
    .distinct("video");
  const filter = { _id: { $in: ids }, ...visibleVideos(req.user) };
  const [items, total] = await Promise.all([
    Video.find(filter)
      .populate(populateOwner)
      .sort({ createdAt: -1, _id: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Video.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, pageResult(items.map(videoDTO), total, p)));
}
