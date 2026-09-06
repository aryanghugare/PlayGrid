import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { accessibleVideo } from "../services/videos.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import { ApiError } from "../utils/ApiError.js";
import {
  objectId,
  text,
  pagination,
  pageResult,
  publicUserFields,
} from "../utils/validation.js";
export async function listComments(req, res) {
  await accessibleVideo(req.params.videoId, req.user);
  const p = pagination(req.query),
    filter = { video: req.params.videoId };
  const [items, total] = await Promise.all([
    Comment.find(filter)
      .populate("owner", publicUserFields)
      .sort({ createdAt: -1, _id: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Comment.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, pageResult(items, total, p)));
}
export async function createComment(req, res) {
  await accessibleVideo(req.params.videoId, req.user);
  const item = await Comment.create({
    video: req.params.videoId,
    owner: req.user._id,
    content: text(req.body.content, "Comment", { max: 2000 }),
  });
  await item.populate("owner", publicUserFields);
  res.status(201).json(new ApiResponse(201, item, "Comment added"));
}
export async function updateComment(req, res) {
  const item = await Comment.findOne({
    _id: objectId(req.params.commentId),
    owner: req.user._id,
  });
  if (!item) throw new ApiError(404, "Comment not found or not owned by you");
  await accessibleVideo(String(item.video), req.user);
  item.content = text(req.body.content, "Comment", { max: 2000 });
  await item.save();
  await item.populate("owner", publicUserFields);
  res.json(new ApiResponse(200, item, "Comment updated"));
}
export async function deleteComment(req, res) {
  const item = await Comment.findOneAndDelete({
    _id: objectId(req.params.commentId),
    owner: req.user._id,
  });
  if (!item) throw new ApiError(404, "Comment not found or not owned by you");
  await Like.deleteMany({ comment: item._id });
  res.json(new ApiResponse(200, null, "Comment deleted"));
}
