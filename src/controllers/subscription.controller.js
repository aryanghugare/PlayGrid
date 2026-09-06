import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponses.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { objectId, pagination, pageResult, publicUserFields } from "../utils/validation.js";



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const userID = req.user._id;
    objectId(channelId);
    if (String(userID) === channelId) throw new ApiError(400, "You cannot subscribe to yourself");
    if (!await User.exists({ _id: channelId })) throw new ApiError(404, "Channel not found");
    // we are looking for already existing subscription 
    const presentSubscription = await Subscription.findOne({
        subscriber: userID,
        channel: channelId

    })

    if (!presentSubscription) {
        const newSubscription = await Subscription.create(
            {
                subscriber: userID,
                channel: channelId


            }
        )

        res.status(200)
            .json(
                new ApiResponse(200, { isSubscribed: true, subscribersCount: await Subscription.countDocuments({ channel: channelId }) }, "Subsribed SuccessFully")
            )
    }

    else {

        // Different ways to delete a record , in this case subscription 
        // Subscription.deleteOne({ _id: presentSubscription._id })
        // Subscription.findOneAndDelete(presentSubscription)
        await Subscription.findByIdAndDelete(presentSubscription._id);
        res.status(200)
            .json(new ApiResponse(200, { isSubscribed: false, subscribersCount: await Subscription.countDocuments({ channel: channelId }) }, "Unsubscribbed successfully"))

    }



})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    objectId(subscriberId);
    const paging = pagination(req.query);
    const allSubscribers = await Subscription.find({
        channel: subscriberId

    }).sort({ createdAt: -1, _id: -1 }).skip(paging.skip).limit(paging.limit)
    const total = await Subscription.countDocuments({ channel: subscriberId });


    // 1st way to return the list of all the subscribers
    // const subList = await User.populate(allSubscribers, { path: "subscriber", select: " fullName email " })
    // 2nd way to return the list of subscribers 
    const subList = await User.find({
        _id: allSubscribers.map(sub => sub.subscriber)
    }).select(publicUserFields)

    res.status(200).json(new ApiResponse(200, pageResult(subList, total, paging), "Subscribers fetched successfully"))

})



export { toggleSubscription, getUserChannelSubscribers }