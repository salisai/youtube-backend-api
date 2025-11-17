import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
    //polymorphic reference
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likeBy:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

// Create compound indexes to ensure uniqueness and optimize queries
likeSchema.index({ video: 1, likeBy: 1 }, { unique: true }); 
likeSchema.index({ comment: 1, likeBy: 1 }, { unique: true }); 
likeSchema.index({ tweet: 1, likeBy: 1 }, { unique: true }); 


export const Like = mongoose.model("Like", likeSchema);