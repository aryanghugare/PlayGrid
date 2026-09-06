import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import {
  text,
  objectId,
  pagination,
  pageResult,
  boolean,
} from "../utils/validation.js";
import {
  accessibleVideo,
  videoDTO,
  populateOwner,
} from "../services/videos.js";
import { storeMedia, removeMedia } from "../services/media.js";
export async function listVideos(req, res) {
  const p = pagination(req.query),
    filter = { isPublished: true };
  if (req.query.owner) filter.owner = objectId(req.query.owner);
  if (req.query.q) {
    const query = text(req.query.q, "Search", { max: 120 }).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { decription: { $regex: query, $options: "i" } },
    ];
  }
  if (req.path === "/feed/subscriptions") {
    const channels = await Subscription.find({
      subscriber: req.user._id,
    }).distinct("channel");
    filter.owner = { $in: channels };
  }
  const sort =
    req.query.sort === "popular"
      ? { views: -1, _id: -1 }
      : { createdAt: -1, _id: -1 };
  const [items, total] = await Promise.all([
    Video.find(filter)
      .populate(populateOwner)
      .sort(sort)
      .skip(p.skip)
      .limit(p.limit)
      .lean(),
    Video.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, pageResult(items.map(videoDTO), total, p)));
}
export async function getVideo(req, res) {
  const video = await accessibleVideo(req.params.videoId, req.user);
  await video.populate(populateOwner);
  const [likesCount, liked, subscribersCount, subscribed] = await Promise.all([
    Like.countDocuments({ video: video._id }),
    req.user ? Like.exists({ video: video._id, likedBy: req.user._id }) : null,
    Subscription.countDocuments({ channel: video.owner?._id }),
    req.user
      ? Subscription.exists({
          channel: video.owner?._id,
          subscriber: req.user._id,
        })
      : null,
  ]);
  res.json(
    new ApiResponse(200, {
      ...videoDTO(video),
      likesCount,
      isLiked: Boolean(liked),
      subscribersCount,
      isSubscribed: Boolean(subscribed),
    })
  );
}
export async function createVideo(req, res) {
  const title = text(req.body.title, "Title", { max: 120 });
  const description = text(req.body.description ?? "", "Description", {
    min: 0,
    max: 5000,
  });
  const isPublished =
    req.body.isPublished === undefined
      ? false
      : boolean(req.body.isPublished, "Publication state");
  let movie, thumbnail;
  try {
    movie = await storeMedia(req.files?.video?.[0], "video");
    thumbnail = await storeMedia(req.files?.thumbnail?.[0], "image");
    const duration = movie.duration ?? Number(req.body.durationSeconds);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 86400)
      throw new ApiError(
        400,
        "Video duration must be between 0 and 86400 seconds"
      );
    const video = await Video.create({
      title,
      description,
      isPublished,
      duration,
      owner: req.user._id,
      videoFile: movie.url,
      videoPublicId: movie.publicId,
      thumbnail: thumbnail.url,
      thumbnailPublicId: thumbnail.publicId,
    });
    await video.populate(populateOwner);
    res
      .status(201)
      .json(new ApiResponse(201, videoDTO(video), "Video uploaded"));
  } catch (error) {
    await Promise.all([
      removeMedia(movie?.publicId, "video"),
      removeMedia(thumbnail?.publicId),
    ]);
    throw error;
  }
}
export async function updateVideo(req, res) {
  const video = await accessibleVideo(req.params.videoId, req.user, true);
  if (req.body.title !== undefined)
    video.title = text(req.body.title, "Title", { max: 120 });
  if (req.body.description !== undefined) {
    video.description = text(req.body.description, "Description", {
      min: 0,
      max: 5000,
    });
    video.decription = undefined;
  }
  let thumbnail;
  const old = video.thumbnailPublicId;
  try {
    if (req.file) {
      thumbnail = await storeMedia(req.file, "image");
      video.thumbnail = thumbnail.url;
      video.thumbnailPublicId = thumbnail.publicId;
    }
    await video.save();
  } catch (error) {
    await removeMedia(thumbnail?.publicId);
    throw error;
  }
  if (thumbnail) await removeMedia(old);
  await video.populate(populateOwner);
  res.json(new ApiResponse(200, videoDTO(video), "Video updated"));
}
export async function publishVideo(req, res) {
  const video = await accessibleVideo(req.params.videoId, req.user, true);
  video.isPublished = boolean(req.body.isPublished, "Publication state");
  await video.save();
  res.json(
    new ApiResponse(
      200,
      videoDTO(video),
      video.isPublished ? "Video published" : "Video unpublished"
    )
  );
}
export async function deleteVideo(req, res) {
  const video = await accessibleVideo(req.params.videoId, req.user, true);
  const comments = await Comment.find({ video: video._id }).distinct("_id");
  await video.deleteOne();
  await Promise.all([
    Comment.deleteMany({ video: video._id }),
    Like.deleteMany({
      $or: [{ video: video._id }, { comment: { $in: comments } }],
    }),
    Playlist.updateMany(
      { videos: video._id },
      { $pull: { videos: video._id } }
    ),
    User.updateMany(
      { watchHistory: video._id },
      { $pull: { watchHistory: video._id } }
    ),
  ]);
  await Promise.all([
    removeMedia(video.videoPublicId, "video"),
    removeMedia(video.thumbnailPublicId),
  ]);
  res.json(new ApiResponse(200, null, "Video deleted"));
}
export async function recordView(req, res) {
  const video = await accessibleVideo(req.params.videoId, req.user);
  // Each explicit playback event counts once per mounted player; not unique-view analytics.
  const updated = await Video.findByIdAndUpdate(
    video._id,
    { $inc: { views: 1 } },
    { new: true }
  );
  res.json(new ApiResponse(200, { views: updated.views }));
}
