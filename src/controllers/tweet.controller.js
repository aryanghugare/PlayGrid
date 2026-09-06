import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import jwt from "jsonwebtoken";
import { Like } from "../models/like.model.js";
import { text, objectId, pagination, pageResult, publicUserFields } from "../utils/validation.js";

const createTweet = asyncHandler(async (req, res) => {
    const content = text(req.body.content, "Post", { max: 2000 });


    const owner = req?.user._id;


    const createTweet = await Tweet.create({
        content: content,
        owner: owner,
        name: req.user.username,

    });

    if (!createTweet) throw new ApiError(402, "Tweet not saved on the database ")


    await createTweet.populate("owner", publicUserFields);
    return res.status(201)
        .json(new ApiResponse(201, createTweet, "Tweet has been created suceesfully "))

})
// 1st method , here i am extracting the userId from the cookies , and then finding the every tweet made by that user 
/*
const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // In this method , I will be extracting every tweet of that user 
    const userTweets = (await Tweet.find({ owner: userId }).select("content -_id "));
    return res
        .status(200)
        .json(new ApiResponse(200, userTweets, "User tweet fetched successfully"))
})
*/
// 2nd Method 
// Here , the default route , which is chai and code gave 
const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params;
    //  here  we can also do  the destructring like const{userId} = req.params



    // In this method , I will be extracting every tweet of that user 
    const paging = pagination(req.query);
    const filter = userId.userId ? { owner: objectId(userId.userId) } : {};
    const userTweets = await Tweet.find(filter).populate("owner", publicUserFields).sort({ createdAt: -1, _id: -1 }).skip(paging.skip).limit(paging.limit);
    const total = await Tweet.countDocuments(filter);
    return res
        .status(200)
        .json(new ApiResponse(200, pageResult(userTweets, total, paging), "User tweet fetched successfully"))
})
const updateTweet = asyncHandler(async (req, res) => {
    const tweetId = objectId(req.params.tweetId);
    const content = text(req.body.content, "Post", { max: 2000 });
    const UpdatedTweet = await Tweet.findOneAndUpdate({ _id: tweetId, owner: req.user._id }, {
        content: content
    },
        {
            new: true, runValidators: true
        }
    ).populate("owner", publicUserFields)


    if (!UpdatedTweet) throw new ApiError(404, "Post not found or not owned by you");
    res.status(200)
        .json(new ApiResponse(200, UpdatedTweet, "Tweet Updated "))
})



const deleteTweet = asyncHandler(async (req, res) => {
    const tweetId = objectId(req.params.tweetId);
    const deletedTweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id });
    if (!deletedTweet) throw new ApiError(404, "Post not found or not owned by you");
    await Like.deleteMany({ tweet: tweetId });
    res.status(200)
        .json(new ApiResponse(200, null, "Tweet Deleted SuccessFully!!!"))
})


export { createTweet, getUserTweets, updateTweet, deleteTweet }