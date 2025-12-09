import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponses.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Try catch all these methods for better error handling 
const getChannelStats = asyncHandler(async (req, res) => {
    // Total Subscribers 
    let channelId = req.user?._id;
   const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
// total Videos
const totalVideos = await Video.countDocuments({owner : channelId})

  return  res.status(200).json(new ApiResponse(200, "Channel stats fetched successfully", { subscribers : totalSubscribers, videos : totalVideos }));


})

const getChannelVideos = asyncHandler(async (req, res) => {
    //  Get all the videos uploaded by the channel
let channelId = req.user?._id;
if(!channelId) throw new ApiError(409,"You dont have access!!!")
const videos = await Video.find({
owner : channelId
}).select(" title description owner thumbnail")


return res.status(202)
.json( new ApiResponse(202,
videos,
"Channel Videos fetched successfully "))

})

export {
getChannelStats ,
getChannelVideos ,
}

