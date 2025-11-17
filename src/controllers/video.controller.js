import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandlers.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
const { ObjectId } = require('mongoose').Types;


//our function is not in better way as we have used some randomization for 
//getting the 10 videos which is not goog way
const getAllVideos = asyncHandler(async(req, res)=>{
    
    //-createdAt means in descending order
    const {page=1, limit = 10, sort = "-createdAt"} = req.query;
    
    //randomly select a specified number of documents
    try {
        const aggregationPipeline = [
            {
                $lookup: {//left outer join between the Video collection and users collection
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "videoDetails",//the joined data is stored here
                    pipeline:[//user sai just fullname , avatar and username lena
                        {
                            $project: {
                                fullname: 1,
                                avatar: 1,
                                username: 1
                            }
                        }
                    ]
                }
            },
            {//
                $addFields: {//modification
                    details: {//no longer an array but a single object 
                        $first: "$details"
                    }
                }
            },
            {
                $sort:{
                    [sort.startsWith('-') ? sort.slice(1) : sort] : sort.startsWith('-') ? -1 : 1
                }
            }
        ];
    
        //
        const result = await Video.aggregatePaginate(
            Video.aggregate(aggregationPipeline),
            {
                page: parseInt(page),
                limit: parseInt(limit),
                customLabels: {
                    docs: 'videos',
                    totalDocs: 'totalVideos'
                }
            }
        )
    
        if(result.videos.length == 0){
            return res.status(200).json(
                new ApiResponse(200, {videos: [], pagination: result}, "No videos found")
            )
        }
    
        return res 
          .status(200)
          .json(
            new ApiResponse(200,{ Videos: result.videos, pagination: result}, "Video fetched successfuly")
          )
    
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching videos");
    }
}
)


const publishVideo = asyncHander(async(req,res)=>{
    const {title, description} = req.body

    //extract file paths using optional chaining
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    const videoFileLocalPath = req.files?.videoFile[0]?.path;


    if([title,description, thumbnailLocalPath, videoFileLocalPath].some(
            (field) => field?.trim() ===""
        )
    ){
        throw new ApiError(400, "All fields are required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    if (!thumbnail || !videoFile) {
        throw new ApiError(500, "Error while uploading files to Cloudinary");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title:title.trim(),
        description:duration.trim(),
        duration: videoFile.duration,
        isPublished: true,
        owner: req.user?._id
    });

    if(!video){
        throw new ApiError(
            500,
            "something is wrong while uploading the video"
        )
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
            200,
            video,
            "Video published successfully"
        )
      )
})

const getVideoById = asyncHander(async(req,res)=>{
    const {videoId}  =  req.params
    //get video by id
    if(!mongoose.Types.ObjectId.isValid(videoId)){
      throw new ApiError(400, "Invalid videoId");
   }

   const response = await Video.findById(videoId);

   if(!response){
    throw new ApiError(400, "Video not found");
   }

   return res 
     .status(200)
     .json(
        new ApiResponse(
            200, 
            response, 
            "Video details fetched successfully")
     )

})


const updateVideo = asyncHander(async(req,res)=>{
   const {videoId} = req.params;

   const {title, description} = req.body;

   if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "Invalid videoId");
   }

   const thumbnailLocalPath = req.file?.path;

   if(!title && !description && !thumbnailLocalPath){
    throw new ApiError(400, "At least one field is required");
   }

   let thumbnail;
   if(thumbnailLocalPath){
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail.url){
        throw new ApiError(
            400,
            "Error while uploading thumbnail in cloudinary"
        )
    }
   }

   const response = await Video.findByIdAndUpdate(
    videoId,
    {
        $set:{
            title,
            description,
            thumbnail
        }
    },
    {
        new: true
    }
   );

   if (!responce) {
    throw new ApiError(401, "Video details not found.");
   }

   return res
        .status(200)
        .json(
            new ApiResponse(200, responce, "Video details updated succesfully.")
        );

})


const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    
    if(!ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const responseAfterDelete = await Video.deleteOne({
        _id: videoId
    })

    if (!deleteResponce.acknowledged) {
        throw new ApiError(400, "Error while deteing video from db");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, responseAfterDelete , "Video deleted succesfully.")
        );

})

const togglePublishStatus = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;

    if(!ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished:!video.isPublished
            }
        },
        {
            new: true
        }
    )

    if(!video){
        throw new ApiError(400, "Error while updating video status")
    }

    return res
       .status(200)
       .json(
            new ApiResponse(200, video, "Video status updated successfully.")
        );
})
