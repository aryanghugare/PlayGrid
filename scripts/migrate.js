import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/db/index.js";
import { Video } from "../src/models/video.model.js";
import { Subscription } from "../src/models/subscription.model.js";
import { Like } from "../src/models/like.model.js";
import { User } from "../src/models/user.model.js";
// Explicit maintenance command; no existing records are deleted automatically.
try {
  await connectDB();
  const duplicates = await Subscription.aggregate([
    {
      $group: {
        _id: { subscriber: "$subscriber", channel: "$channel" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);
  if (duplicates.length)
    throw new Error(
      `${duplicates.length} duplicate subscription groups require manual reconciliation before creating indexes`
    );
  await Video.collection.updateMany(
    {
      decription: { $exists: true },
      $or: [{ description: { $exists: false } }, { description: "" }],
    },
    [{ $set: { description: "$decription" } }]
  );
  // Keep the legacy field until a backup and migration review confirm it can be removed.
  await User.updateMany(
    { sessionVersion: { $exists: false } },
    { $set: { sessionVersion: 0 } }
  );
  await Promise.all([
    Video.createIndexes(),
    Subscription.createIndexes(),
    Like.createIndexes(),
    User.createIndexes(),
  ]);
  console.log("Migration completed. Legacy description data retained.");
} finally {
  await mongoose.disconnect();
}
