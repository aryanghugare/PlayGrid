import mongoose, { Schema } from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // the one who is subscribing 
        ref: "User"

    },

    channel: {
        type: Schema.Types.ObjectId, // The one to whom the 'subscriber' is subscribing 
        ref: "User"
    },



}, { timestamps: true })


// A user can follow a channel only once, including concurrent requests.
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema)