import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total likes etc.
    const userId = req.user?._id;

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, "Invalid user id");
    }

    const response = await UserActivation.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                fullname: 1,
                username: 1,
                avatar: 1
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videoDetails",
                pipeline: [
                    {
                        $group: {
                            _id: "",
                            views: {
                                $sum: "$views"
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            views: "$views"
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoDetails: {
                    $first: "$videoDetails"
                }
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subInfo"
            }
        },
        {
            $addFields: {
                subsInfo: {
                    $size: "$subInfo"
                }
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "owner",
                as: "likeInfo",
                pipeline:[
                    {

                    }
                ]
            }
        }
    ]);

    if(!response){
        throw new ApiError(500, "Channel not found");
    }

    return res 
     .status(200)
     .json(new ApiResponse(200, response, "Fetched user dashboard data"));


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;

    const response = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            },
        },
        {
            $addFields:{
                likes: {
                    $size: "$likes"
                }
            }
        }
    ]);

    if(!response){
        throw new ApiError(500, "Channel not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            response,
            "Succesfullt fetched videos and likes."
        )
    );

})

export {
    getChannelStats, 
    getChannelVideos
    }