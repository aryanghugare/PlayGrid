import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import {
  objectId,
  pagination,
  pageResult,
  publicUserFields,
} from "../utils/validation.js";
async function target(req) {
  const channel = objectId(req.params.channelId);
  if (String(req.user._id) === channel)
    throw new ApiError(400, "You cannot subscribe to yourself");
  if (!(await User.exists({ _id: channel })))
    throw new ApiError(404, "Channel not found");
  return { channel, subscriber: req.user._id };
}
export async function setSubscription(req, res) {
  const filter = await target(req);
  const subscribed = req.method !== "DELETE";
  if (subscribed) {
    try {
      await Subscription.updateOne(
        filter,
        { $setOnInsert: filter },
        { upsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  } else await Subscription.deleteMany(filter);
  res.json(
    new ApiResponse(200, {
      isSubscribed: subscribed,
      subscribersCount: await Subscription.countDocuments({
        channel: filter.channel,
      }),
    })
  );
}
export async function getSubscribedChannels(req, res) {
  const p = pagination(req.query),
    filter = { subscriber: req.user._id };
  const [rows, total] = await Promise.all([
    Subscription.find(filter)
      .populate("channel", publicUserFields)
      .sort({ createdAt: -1, _id: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Subscription.countDocuments(filter),
  ]);
  res.json(
    new ApiResponse(
      200,
      pageResult(rows.map((r) => r.channel).filter(Boolean), total, p)
    )
  );
}
