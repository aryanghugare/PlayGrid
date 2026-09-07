import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(

    {
        videoFile: {
            type: String, // cloudinary url
            required: true,

        },
        thumbnail: {
            type: String, // cloudinary url
            required: true,

        },

        title: {
            type: String,
            required: true,

        },
        // Keep the legacy spelling readable while new writes use description.
        description: { type: String, default: "", maxlength: 5000 },
        videoPublicId: String,
        thumbnailPublicId: String,
        decription: {
            type: String,

        },

        duration: {
            type: Number, // cloudinary url 
            required: true
        },
        views: {
            type: Number,
            default: 0,
        },

        isPublished: {
            type: Boolean,
            default: false,
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }





    }, { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ isPublished: 1, createdAt: -1, _id: -1 });

export const Video = mongoose.model("Video", videoSchema)