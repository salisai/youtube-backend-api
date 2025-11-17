import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;//1 and 10 default values you can change it after


    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id");
    }


    //to fetch comments related to the video.
    try {
        const allVideoComments = Comment.aggregate([
           { 
                $match:{//to find the specific video whose comments to find
                        //filter comments based on videoId 
                    video: new mongoose.Types.ObjectId(videoId)
                }
           }, 
           {   //want to retrieve specific fields do this
               $lookup:{//join users data with the comments collection.
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [//that don't give me all user fields just these
                        {
                            $project:{
                                fullname: 1,
                                avatar: 1,
                                username:1
                            }
                        }
                    ]
                }//ownerDetails will contain the user data
    
                //lookup => to perform outer join b/w two collections.
                //to combine related data into a single result set.
                //takes the owner field from each document in the comments, look ups the corresponding user document in the users collection
    
                //from => specify the collection u wanna join with teh current collection.(in this case user collection)
                //localField => (owner) this is the field in the current collection, that you wanna match with foriegn field in the "from", (user here) collection
                //           =>owner stores the _id of a user who owns or crated the comment.
                //foriegn field=>field in the from collection(users). here _id refers to the id field in the users collection.
    
           },
           {
                $lookup:{//join between comments and likes
                         //the goal is to gather infromation about many likes a particular comment has recieved based on the owner of the comment.
                    
                    from: "likes",//in mongodb Like is changed to likes name
                    localField: "owner",
                    foreignField: "likeBy",
                    as: "likes",//result will be store here in this array
                    pipeline:[
                        {   //filter the documents from the likes collection to include 
                            //those likes that are associated with the specific comment.
                            $match:{//means
                                comment: {$exists: true}//whether the comment exists in the likes document. if yes then include only that
                            }
                        }
                    ]
                }
           },
           {
                $addFields: {
                    ownerDetails:{//extract the first element from the ownerDetails array which typically contains single user object.
                                  //purpose is to convert array into object
                        $first: "$ownerDetails"
                    }
                }
           },
           {
                $addFields:{//same as above
                    likes: {
                        $size: "$likes"
                    }
                }
           },
           {    //to skip over specific number of documents
                $skip: (page -1) * limit,
                //if page=1, limit=10 then skip=0 means skip no documents
                //if page=2, limit=10 then skip=10 means skip the first 10 documents start at 11th
           },
           {
                $limit: parseInt(limit)
                //limit specify the number of documents to return from the result set.
                //for controlling the size of each page in pagination
                
                //if limit=10, pipeline will return only 10 documents.
                //if limit=5 the pipeline will return ony 5 documents.
    
                //combined effect of pagination:
                //page 1: skip=0 documents, return the first 10(limit=10)
                //page 2: skip=first 10, return the next 10 documents(limit=10)
                //page 3: skip=first 20, return the next 10(limit=10)
                //and and so on    
            },
            {
                $sort:{
                    createdAt: -1
                }//
            }
        ])
    
    
        const comments = await Comment.aggregatePaginate(allVideoComments, { page, limit})
    
        if(comments.length ==0){
            return res.status(200).json(new ApiResponse(200,[]
                ,"No comments found for this video"))
        }
    
        return res
        .status(200)
        .json(new ApiResponse(
             200, 
             comments, //array of documents returned
            "Video comments fetched successfully"
        ));
    } catch (error) {
        throw new ApiError(500,"Something went wrong while getting all comments")
    }

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;
    const {userId} = req.user?._id;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const response = await Comment.create(
        {
            content,
            video: videoId,//video is field in comment model
            owner: userId
        }
    )

    if(!response){
        throw new ApiError(400, "Something went wrong while adding comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            response,
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    //validate content
    if(!content ||content?.trim()===""){
        throw new ApiError(400, "Comment is empty")
    }

    //validate comment id
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment id");
    }

    //this is the main code
    const response = await Comment.findByIdAndUpdate(
        commentId,
        { 
            $set:{
                content,
            }
        },
        { 
            new : true,
            runValidators: true//
        }
    )

    if(!response){
        throw new ApiError(400, "Something went wrong while updating comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            response,
            "Comment updated successfully"
        )
    )
 
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    try {
        if(!mongoose.Types.ObjectId.isValid(commentId)){
            throw new ApiError(400, "Invalid comment id");
        }
    
        const deletedComment = await Comment.findByIdAndDelete(commentId);
        //this above code find the comment and delete it, if there was no comment with that id 
        //then it will return null, otherwise it will return the comment

        if (!deletedComment) {
            throw new ApiError(404, "Comment not found");
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Comment deleted successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting comment");
    }



})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}