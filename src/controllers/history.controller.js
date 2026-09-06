import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import { objectId } from "../utils/validation.js";
import { accessibleVideo } from "../services/videos.js";
export async function recordHistory(req, res) {
  const video = await accessibleVideo(req.params.videoId, req.user);
  // An atomic pipeline de-duplicates and bounds history while preserving recency.
  await User.updateOne({ _id: req.user._id }, [
    {
      $set: {
        watchHistory: {
          $slice: [
            {
              $concatArrays: [
                [video._id],
                {
                  $filter: {
                    input: { $ifNull: ["$watchHistory", []] },
                    as: "id",
                    cond: { $ne: ["$$id", video._id] },
                  },
                },
              ],
            },
            500,
          ],
        },
      },
    },
  ]);
  res.json(new ApiResponse(200, null, "History updated"));
}
export async function removeHistory(req, res) {
  const update = req.params.videoId
    ? { $pull: { watchHistory: objectId(req.params.videoId) } }
    : { $set: { watchHistory: [] } };
  await User.updateOne({ _id: req.user._id }, update);
  res.json(new ApiResponse(200, null, "History cleared"));
}
