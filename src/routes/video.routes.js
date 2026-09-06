import { Router } from "express";
import * as c from "../controllers/video.controller.js";
import {
  listComments,
  createComment,
} from "../controllers/comment.controller.js";
import { optionalJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import { videoUpload, upload } from "../middlewares/multer.middleware.js";
import { rateLimit } from "../middlewares/security.middleware.js";
const router = Router();
router.get("/", c.listVideos);
router.get("/feed/subscriptions", verifyJWT, c.listVideos);
router.post(
  "/",
  verifyJWT,
  rateLimit({ limit: 20 }),
  videoUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  c.createVideo
);
router.get("/:videoId", optionalJWT, c.getVideo);
router.patch("/:videoId", verifyJWT, upload.single("thumbnail"), c.updateVideo);
router.delete("/:videoId", verifyJWT, c.deleteVideo);
router.patch("/:videoId/publication", verifyJWT, c.publishVideo);
router.post(
  "/:videoId/views",
  optionalJWT,
  rateLimit({ limit: 120 }),
  c.recordView
);
router.get("/:videoId/comments", optionalJWT, listComments);
router.post("/:videoId/comments", verifyJWT, createComment);
export default router;
