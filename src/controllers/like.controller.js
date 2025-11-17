import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"


//let define a common function for all liking and dislinking
const toggleLike = async (Model, resourceId, userId)=>{
     //resourceid => videoId, commentId, tweetid etc

     //validation
     if (!mongoose.isValidObjectId(resourceId) || !isValidObjectId(userId)){
        throw new ApiError("Invalid ResourceId or userId");
     }//isValidObjectId is from mongoose.

     const likeField = Model.modelName.toLowerCase();
     //modelname => model property in mongoose
     //this name is the one you defined when you created the model using the model in models
     //Video.model => 'Video
     const query = {
        [likeField] : resourceId,
        likedBy : userId,
        //bracket notation allows you to dynamically set properties using variable
        //as likefield may be comment, tweet, video 
     }


     //checks whether it is liked or not
     const isLiked = await Like.findOne(query);


     let response;
     try {
        if(!isLiked){//means not liked already, so create new document
            response = await Like.create(query);
        }else{//if isLiked is found, then user has already liked
           response = await toggleCommentLike.deleteOne(query)
        }

        const totalLikes = await Like.countDocuments({[likeField]: resourceId });
        //countDocuments is from mongoose
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
        req.user?._id,//without optional chaining will give runtime error
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
    //TODO: toggle like on comment
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

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const {isLiked, totalLikes} = await toggleLike(
        Tweet,
        tweetId,
        req.user?._id
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
           200,
           {totalLikes},
           !isLiked 
              ? "tweet liked successfully"
              : "tweet unliked successfully"    
        )
    );
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;

    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId");
    }

    const likedVideo = await Like.aggregate([
        {
            //filter out the likes that don't belong to current user or corresponding video
            $match: {
                $and:[
                    {likedBy: new mongoose.Types.ObjectId(`${userId}`)},//liked bu this user
                    {video: {$exists : true}}//ensure that documents with reference to a video are considered
                ]
            }
        },
        //first lookup is for to find all the videos that the user has liked by matching video field
        //in the Like collection with the _id field in the Video collection.
        //videoDetails => containing the details fo the corresponding video from the video collection

        //nested lookup=> we use this to get the details of the user who owns the video for each video.
        //

        {              //first lookup fetches the details of the liked video and its owner
            $lookup:{//join b/w Like and Video collection to retireve details of video owner
                from: "videos",
                localField: "video",// The field in the Like collection that references the Video
                foreignField: "_id", // The field in the Video collection that matches
                as: "videoDetails",
                pipeline:[
                    {
                        $lookup: {//join b/w Video and User collection, retrieve teh owners details for each liked video
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
                details:{//this details now will contain all the resources that we want
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
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}