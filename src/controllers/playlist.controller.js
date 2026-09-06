import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import {
  accessibleVideo,
  visibleVideos,
  videoDTO,
  populateOwner,
} from "../services/videos.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import { text, objectId, pagination, pageResult } from "../utils/validation.js";
async function own(req) {
  const item = await Playlist.findOne({
    _id: objectId(req.params.playlistId),
    owner: req.user._id,
  });
  if (!item) throw new ApiError(404, "Playlist not found");
  return item;
}
export async function listPlaylists(req, res) {
  const p = pagination(req.query),
    filter = { owner: req.user._id };
  const [items, total] = await Promise.all([
    Playlist.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Playlist.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, pageResult(items, total, p)));
}
export async function createPlaylist(req, res) {
  const item = await Playlist.create({
    name: text(req.body.name, "Name", { max: 100 }),
    description: text(req.body.description ?? "", "Description", {
      min: 0,
      max: 2000,
    }),
    owner: req.user._id,
  });
  res.status(201).json(new ApiResponse(201, item, "Playlist created"));
}
export async function getPlaylist(req, res) {
  const item = await own(req),
    p = pagination(req.query);
  const videos = await Video.find({
    _id: { $in: item.videos },
    ...visibleVideos(req.user),
  }).populate(populateOwner);
  const index = new Map(item.videos.map((id, i) => [String(id), i]));
  videos.sort((a, b) => index.get(String(a._id)) - index.get(String(b._id)));
  res.json(
    new ApiResponse(200, {
      ...item.toObject(),
      videos: pageResult(
        videos.slice(p.skip, p.skip + p.limit).map(videoDTO),
        videos.length,
        p
      ),
    })
  );
}
export async function updatePlaylist(req, res) {
  const item = await own(req);
  if (req.body.name !== undefined)
    item.name = text(req.body.name, "Name", { max: 100 });
  if (req.body.description !== undefined)
    item.description = text(req.body.description, "Description", {
      min: 0,
      max: 2000,
    });
  if (req.body.videoIds !== undefined) {
    if (
      !Array.isArray(req.body.videoIds) ||
      req.body.videoIds.length !== item.videos.length ||
      new Set(req.body.videoIds).size !== item.videos.length ||
      req.body.videoIds.some(
        (id) => !item.videos.some((existing) => String(existing) === id)
      )
    )
      throw new ApiError(
        400,
        "Reordering must contain every playlist video exactly once"
      );
    item.videos = req.body.videoIds;
  }
  await item.save();
  res.json(new ApiResponse(200, item, "Playlist updated"));
}
export async function deletePlaylist(req, res) {
  const item = await own(req);
  await item.deleteOne();
  res.json(new ApiResponse(200, null, "Playlist deleted"));
}
export async function setPlaylistVideo(req, res) {
  const item = await own(req),
    id = objectId(req.params.videoId);
  if (req.method === "PUT") {
    await accessibleVideo(id, req.user);
    const updated = await Playlist.findOneAndUpdate(
      {
        _id: item._id,
        owner: req.user._id,
        $or: [{ "videos.499": { $exists: false } }, { videos: id }],
      },
      { $addToSet: { videos: id } },
      { new: true }
    );
    if (!updated) throw new ApiError(400, "Playlist is limited to 500 videos");
    return res.json(new ApiResponse(200, updated, "Video saved"));
  }
  const updated = await Playlist.findByIdAndUpdate(
    item._id,
    { $pull: { videos: id } },
    { new: true }
  );
  res.json(new ApiResponse(200, updated, "Video removed"));
}
