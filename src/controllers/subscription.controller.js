import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    const {subs} = req.query;
    const userId = req.user?._id;

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid channel id");
    }

    if(subs === "true"){
        await Subscription.deleteOne(
            {
                channel: channelId,
                subscriber: userId
            }
        )
    }else{
        await Subscription.create({
            channel: channelId,
            subscriber: userId
        })
    }

    return res
     .status(200)
     .json(
        new ApiResponse(200, {}, "Subscription toggled")
     )

    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid channel id");
    }

//     const subscribers = await Subscription.find({
//         channel: channelId
//     })//where channel field matches the provided channelId
//    .populate("subscriber", ["username", "email"])
//     //pouplate method replaces subsciber field in each Subscription
//     //only the username and email of the subscriber is included in the result
    
    
    //or by using the aggregation pipeline
    const subscriberCount = await Subscription.countDocuments({
        channel: new mongoose.Types.ObjectId(channelId)
    });

    //if I am making app like facebook where I will retirieve the followers or subscribers details 
    //but if I want to make youtube like where I dont need to retrieve subscribers details just the count

    //as in facebook focus is more on user and followers and in youtube 
    //all focus is on content not users

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribers, "Subscribers fetched successfully")
    )


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "channels",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id : 0,
                channelId:"$channelDetails._id",
                channelName: "$channelDetails.name" 
            }
        }
    ]);

    //WE CAN ALSO DO THAT WITHOUT HAVING CHANNEL COLLECTION
    // const subscribedChannels = await Subscription.find(
    //     { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    //     { channel: 1 } // Only return the channel field
    // );

    if(!subscribedChannels){
        throw new ApiError(404, "No subscribed channels found");
    }

    return res 
     .status(200)
     .json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}