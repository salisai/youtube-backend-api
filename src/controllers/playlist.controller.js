import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    if(!name || !description){
        throw new ApiError(400, "Name and description are required")
    }

    //create playlist
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if(!playlist){
        throw new ApiError(500, "Failed to create playlist");
    }

    return res 
      .status(200)
      .json(
        new ApiResponse(201, playlist, "Playlist created successfully")
      )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError("Invalid userId")
    }

    // const userPlaylists = await Playlist.find({owner: userId});
    //OR
    
    const userPlaylists = await Playlist.aggregate([
        {
            $match: new mongoose.Types.ObjectId(`${userId}`)
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistDetails",
                pipeline:[
                    {
                        $project: {
                            thumbnail: 1
                        }
                    }
                ]
            }
        }
    ])

    // if(!userPlaylists || userPlaylists.length === 0){
    //     return res.
    //      status(404)
    //      .json(new ApiResponse(404, [],"No playlists by this user"));
    // }

    //or do this in easy way


    return res
      .status(200)
      .json(
        userPlaylists.length ?
        new ApiResponse(200, userPlaylists, "User playlists fetched successfully")

        : new ApiResponse(200, userPlaylists, "No playlists found for this user")

    )
})



const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    //TODO: get playlist by id

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError("Invalid playlistId")    
    }

    //const playlist = await Playlist.findById(playlistId).populate('videos', 'thumbnail title'); // Adjust fields as needed
    
    //series of stages that process and transform documents
    //each stage perform an operation and pass the result to next stage

    const playlist = await Playlist.aggregate([
        {
            $match: {//playlist with desired Id only
                _id: new mongoose.Types.ObjectId(`${playlistId}`)
            }
        },
        {
            $lookup:{//join between videos and playlist collection
                from: "videos",//from the videos model
                localField: "videos",//inside the playlist model,its array of ids
                foreignField: "_id",//the id of specific video document
                as: "playlistVideos",//result will store here
                pipeline:[//this do further processing of each video document found in the videos collection,
                          //before it is added to the playlistVideos array
                    {
                        $lookup:{//join between users collection and playlist, cuz to get details about the owner of each video
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerInfo",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            userInfo:{
                                $first: "$ownerInfo"
                            }
                            //or
                            //owner: {$//arrayElemAt: ["$userInfo",0]}
                        }
                        
                    },
                    {
                        $project:{//these things to get about the video
                            title: 1,
                            description:1,
                            duration:1,
                            views: 1,
                            thumbnail: 1,
                            owner: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{//
                videoCount: {
                    $size: "$playlistVideos"
                }
            }
        }
    ])

    //Now there is one confusion that what will be there inside the playlist after execution
    //so it will be like this
    /*
    {
        _id:"",            //here all things we be from the playlist collection, like id name description owner
        name:"",
        description:"",
        owner:"",
        videos: [
            video_id_1,
            video_id_2,
        ...
        ],
        playlistVideos: [     this is the array of videos objects
           {
              id: "video_id_1",
              title: "",
              description: "",
              duration: "",
              views: "",
              thumbnail: "",
              owner: "",
              userInfo: {
                  fullname: "",
                  username: "",
                  avatar: ""
              }
           },
           {
              id: "video_id_2",
              title: "",
              description: "",
              duration: "",
              views: "",
              thumbnail: "",
              owner: "",
              userInfo: {
                  fullname: "",
                  username: "",
                  avatar: ""
              }
           } 
        ],
        videoCount: 2
        
    }
    
    */


    if(!playlist || playlist.length === 0){
        throw new ApiError(500, "playlist not found")
    }

    res.status(200).json(new ApiResponse(200, playlist[0], "Playlist retrieved successfully"));

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(playlistId) ||!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError("Invalid playlistId or videoId")
    }

    //first find the playlist where to add
    const playlist = await Playlist.findById({_id:playlistId, owner: req.user._id})
    if(!playlist){
        throw new ApiError(500, "Playlist not found")
    }

    //then the video to add
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video is already in the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } }, // Add the video ID to the videos array
        { new: true } // Return the updated document
    );

    if(!response){
        throw new ApiError(404, "Playlist not found");
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200, response, "Video added to playlist successfully")
    )


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    // TODO: remove video from playlist

    if(!mongoose.Types.ObjectId.isValid(playlistId) ||!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError("Invalid playlistId or videoId")
    }

    //first find the playlist where to remove
    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(500, "Playlist not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndDelete(
        playlistId,
        { $pull: { videos: videoId } }, // Remove the video ID from the videos array
        { new: true } // Return the updated document
    )

    //or
    // playlist.videos.pull(videoId);
    // await playlist.save();
    // await playlist.populate('videos', 'title thumbnail duration');

    if(!updatedPlaylist){
        throw new ApiError(404, "Playlist not found");
    }

    return res
     .status(200)
     .json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
      )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(401,"Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    const updatedPlaylists = await Playlist.findByIdAndDelete(playlistId);


    if(!updatedPlaylists){
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylists, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(401,"Invalid playlistId")
    }

    if(!name || !description){
       throw new ApiError(401,"Name or description is required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name, 
                description
            }
        },
        {new : true}
    )

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

     return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}