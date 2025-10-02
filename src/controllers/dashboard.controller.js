import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getChannelStats = asyncHandler(async (req, res) => {
    // Total Subscribers 
    const { channelId } = req.params;
   const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
// total Videos
const totalVideos = await Video.countDocuments({owner : channelId})

    res.status(200).json(new ApiResponse(200, "Channel stats fetched successfully", { subscribers : totalSubscribers, videos : totalVideos }));


})

