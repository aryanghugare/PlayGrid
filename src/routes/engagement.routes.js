import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { setLike, likedVideos } from "../controllers/like.controller.js";
import * as p from "../controllers/playlist.controller.js";
export const commentRouter = Router();
commentRouter.use(verifyJWT);
commentRouter.route("/:commentId").patch(updateComment).delete(deleteComment);
export const likeRouter = Router();
likeRouter.use(verifyJWT);
likeRouter.get("/videos", likedVideos);
likeRouter.route("/:target/:targetId").put(setLike).delete(setLike);
export const playlistRouter = Router();
playlistRouter.use(verifyJWT);
playlistRouter.route("/").get(p.listPlaylists).post(p.createPlaylist);
playlistRouter
  .route("/:playlistId")
  .get(p.getPlaylist)
  .patch(p.updatePlaylist)
  .delete(p.deletePlaylist);
playlistRouter
  .route("/:playlistId/videos/:videoId")
  .put(p.setPlaylistVideo)
  .delete(p.setPlaylistVideo);
