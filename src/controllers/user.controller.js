import { asyncHandler } from "./utils/asynchandlers.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({validateBeforeSave: false})//no validation, bypassing it
        return {accessToken, refreshToken}

    } catch (err) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}



const registerUser = asyncHandler(async(req,res)=>{
    
        const {fullname,email,username,password} = req.body;

        if([fullname, email, username, password].some((fields)=>
            fields?.trim()==="")
        ){
            throw new ApiError(400, "All fields are required");
        }

        const existedUser =await User.findOne({
            $or:[{ username }, { email }]
        })
 
        if(existedUser){
            throw new ApiError(409,"User with email or username already exists")
        }


        const avatarLocalPath = req.files?.avatar[0]?.path;  //to get the path //to get the first property
        const coverImageLocalPath = req.files?.coverImage[0]?.path;
        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is required");
        }
        
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)


        if(!avatar){
            throw new ApiError(500, "Avatar is required");
        }

        const user = await User.create({
            fullname,
            avatar: avatar?.url || "",
            coverImage:  coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase() 
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return res
        .status(201)
        .json(
            new ApiResponse(200,createdUser, "User registerd successfully")
        )

    })  


const loginUser = asyncHandler(async (req,res)=>{
    const {email, password}=req.body;
    
    if(!(password || email)){
        throw new ApiError(400,"Username or password is required")
    }

    const user = User.findOne({
        $or:[{email},{password}]
    })
    
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options = {
        httpOnly : true,
        secure: true
    }
    
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },
    "User logged in successfully"
     )
  )
    
})


const logoutUser = asyncHandler(async(req,res)=>{
    const userId = req.user?._id;
    
    if(!userId){
        throw new ApiError(401,"unauthorized request")
    }

    User.findByIdAndUpdate(
        userId,
        {  
            $unset: { refreshToken: 1}
        },
        {
            new: true 
        }
    )

    const CookieOptions = {
        httpOnly : true,
        secure: true,
        // sameSite: 'strict'
    }

    res.clearCookie("accessToken", CookieOptions);
    res.clearCookie("refreshToken", CookieOptions);

    return res
    .status(200)
    .json(new ApiResponse(200,{},"User logged out"))
})


const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
     
    
     try {
        const decodedToken = jwt.verify(
           incomingRefreshToken,
           process.env.REFRESH_TOKEN_SECRET
        )
   
        const user = await User.findById(decodedToken?._id);

        if(!user){
           throw new ApiError(401, "invalid refresh token")
        }
   
        if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401, "Refresh token is expired")
        }
   
        const options = {
           httpOnly : true,
           secure: true
        }
   
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
   
        return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
           new ApiResponse(
               200,
               {accessToken, refreshToken:newRefreshToken},
               "Access token refreshed"
           )
        )
     } catch (err) {
        throw new ApiError(401, error?.message || 
            "Invalid refresh token"
        )
     }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user?._id);

    const {oldPassword, newPassword} = req.body;

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid password")
    }
    
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req,res)=>{
    const user = req.user;
    
    if(!user){
        throw new ApiError(401, "unauthorized request. User not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
         200, 
         user, 
        "current user fetched successfuly"
    ));
})

//to update only full name and email
const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullname, email,} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "All fields are required")
    }

    const emailExists = await User.findOne({email});
    
    if (emailExists && emailExists._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Email already in use");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Account details updated successfully"))
})


const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploadig on avatar")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url,
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfuly")
    )
})



const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploadig on cover image")
    }

    //update cover image
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url,
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "cover image updated successfuly")
    )
})



const getUserChannelprofile = asyncHandler(async(req,res)=>{
    const {username} = req.params
   
   if(!username?.trim){
    throw new ApiError(400,"username is missing")
   }

   const channel = await User.aggregate([
    {
        $match:{
            username: username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields:{
            subscribersCount:{
                $size: "$subscribers"
            },
            channelsSubscribedToCount:{
                $size: "$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then: true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            fullname:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1,
            createdAt:1
        }
    }

    //after running this mongodb will return an array called
    //channel.  
   ]) 

   if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
   }
   
   return res
   .status(200)
   .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
   )
})


const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {  
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as:"watchHistory",
                pipeline:[//fetching video owner details
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1 ,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})


export { 
    registerUser, 
    loginUser ,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelprofile,
    getWatchHistory,
 };
