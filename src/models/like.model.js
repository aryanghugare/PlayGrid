import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },


},
    { timestamps: true }


)


// Each like belongs to one target, and the user cannot like the same target twice.
likeSchema.pre("validate", function () {
    if ([this.video, this.comment, this.tweet].filter(Boolean).length !== 1) this.invalidate("video", "Exactly one like target is required");
});
for (const target of ["video", "comment", "tweet"]) {
    likeSchema.index({ likedBy: 1, [target]: 1 }, { unique: true, partialFilterExpression: { [target]: { $type: "objectId" } } });
}

export const Like = mongoose.model("Like", likeSchema)