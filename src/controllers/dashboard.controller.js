import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponses.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { pagination, pageResult } from "../utils/validation.js";
import { videoDTO, populateOwner } from "../services/videos.js";

// Try catch all these methods for better error handling 
const getChannelStats = asyncHandler(async (req, res) => {
    // Total Subscribers 
    let channelId = req.user?._id;
   const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
// total Videos
const totalVideos = await Video.countDocuments({owner : channelId})

  const videoIds = await Video.find({ owner: channelId }).distinct("_id");
  const [metrics, likes] = await Promise.all([
    Video.aggregate([{ $match: { owner: channelId } }, { $group: { _id: null, views: { $sum: "$views" }, published: { $sum: { $cond: ["$isPublished", 1, 0] } } } }]),
    Like.countDocuments({ video: { $in: videoIds } })
  ]);
  return  res.status(200).json(new ApiResponse(200, { subscribers : totalSubscribers, videos : totalVideos, views: metrics[0]?.views || 0, published: metrics[0]?.published || 0, likes }, "Channel stats fetched successfully"));


})

const getChannelVideos = asyncHandler(async (req, res) => {
    //  Get all the videos uploaded by the channel
let channelId = req.user?._id;
if(!channelId) throw new ApiError(409,"You dont have access!!!")
const paging = pagination(req.query);
const total = await Video.countDocuments({ owner: channelId });
const videos = await Video.find({
owner : channelId
}).populate(populateOwner).sort({ createdAt: -1, _id: -1 }).skip(paging.skip).limit(paging.limit)


return res.status(200)
.json( new ApiResponse(200,
pageResult(videos.map(videoDTO), total, paging),
"Channel Videos fetched successfully "))

})

export {
getChannelStats ,
getChannelVideos ,
}

