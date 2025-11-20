import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"


const toggleLike = async (Model, resourceId, userId)=>{
     if (!mongoose.isValidObjectId(resourceId) || !isValidObjectId(userId)){
        throw new ApiError("Invalid ResourceId or userId");
     }

     const likeField = Model.modelName.toLowerCase();
     const query = {
        [likeField] : resourceId,
        likedBy : userId,
     }

     const isLiked = await Like.findOne(query);

     let response;
     try {
        if(!isLiked){
            response = await Like.create(query);
        }else{//toggle 
           response = await toggleCommentLike.deleteOne(query)
        }

        const totalLikes = await Like.countDocuments({[likeField]: resourceId });
        return { response, isLiked, totalLikes };

     } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong in ToggleLike."
        );
     }    

}


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    
    const {isLiked, totalLikes} = await toggleLike(
        Video,
        videoId,
        req.user?._id,
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
           200,
           {totalLikes},
           !isLiked 
              ? "Video liked successfully"
              : "Video unliked successfully"    
        )
    );
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {isLiked, totalLikes} = await toggleLike(
        Comment,
        commentId,
        req.user?._id
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
           200,
           {totalLikes},
           !isLiked 
              ? "comment liked successfully"
              : "comment unliked successfully"    
        )
    );

})


const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId");
    }

    const likedVideo = await Like.aggregate([
        {
            $match: {
                $and:[
                    {likedBy: new mongoose.Types.ObjectId(`${userId}`)},
                    {video: {$exists : true}}
                ]
            }
        },

        {   
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline:[
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{//convert ownerDetails array into a single document
                            ownerDetails:{
                                $first: "$ownerDetails"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                details:{
                    $first: "$videoDetails"
                }
            }
        }
        
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideo,
            "Liked videos fetched successfully"
        )
    )

})



export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}