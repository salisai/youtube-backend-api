//sab se pehla kaam kia karna hai 
//helper file asyncHandler like a wrapper 
//faida e hai k har koi cheez ko try catch mai nahi daala jai ga, we will easily use asyncHandler

import { asyncHandler } from "./utils/asynchandlers.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"//e user aap k database say direct contact kar sakta hai
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)//fetching the user first

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        //access token hum user ko de detay hai 
        //refresh token data base mai bhi save kartay hai

        user.refreshToken = refreshToken//database mai dalna
        //yaha par tho password nahi and password is required so what to do then

        await user.save({validateBeforeSave: false})//no validation, bypassing it

         //The user document, now containing the refresh token, is saved back to the database
         //The validateBeforeSave: false option is used here to bypass validation rules that are normally applied before saving.
         //This is particularly useful when there are required fields (like password) that are not being modified in this operation, 
             //and you want to avoid unnecessary validation errors

         //By setting validateBeforeSave: false, you prevent Mongoose from throwing a validation error due to the missing password.

        return {accessToken, refreshToken}

    } catch (err) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

//Some improvements:
//1. Ensure that refresh token is stored securly, in client side as well in database.
//2. Validation and error handling
//3. Extensibility:
//4. Consider implementing {token rotation} for refresh tokens, where a new refresh token is 
//   issued every time the old one is used, enhancing security by reducing the impact of a stolen refresh token. 




//this is higher order function
const registerUser = asyncHandler(async(req,res)=>{
        
        //1.get use details from frontend. Use postman if have no frontend 
        //2.validation lagana parega like (is email correct?) etc
        //3.check if user already registered: username and email sai 
        //4.check for images, check for avatar 
        //5.upload them to cloudinary, avatar check karna 
        //6.create user object --create entry in db 
        //7.remove password and refresh token field from response, like sensitive data
        //8.check for user creation, like validation
        //9.return response

        //1.
        const {fullname,email,username,password} = req.body;//extract the data from req.body

        //2.
        // if(fullname ===""){
        //     throw new ApiError(400, "fullname is required");
        // }or do like below which is standard way 

        //. often validation may be in separate files
        if(//form validation, it can be done through map
            [fullname, email, username, password].some((fields)=>
            fields?.trim()==="")
            //aik bhi field nay agar true return kia tho matlub wo khali hai
            //this code checks if any of the provided variables are either undefined, null or contain only whitespace
            //some()=> checks whther at least one element in the array passes the test implemented by the functin the cb
            // trim()=> removes whitespace from both ends of the string

            //If any of the fields (fullname, email, username, or password) are null or undefined, attempting to call trim() 
            //directly on them would result in a runtime error, as trim() is a method that can only be called on strings.
        ){
            throw new ApiError(400, "All fields are required");
        }



        //3. its simple
        const existedUser =await User.findOne({
            $or:[{ username }, { email }]
        })//ya email mel jaye ya username. Agar user already hai tho
        // agay proceed nahi karna hai but error throw karna hai direct
 
        if(existedUser){
            throw new ApiError(409,"User with email or username already exists")
        }



        //4
        const avatarLocalPath = req.files?.avatar[0]?.path;  //to get the path //to get the first property
        const coverImageLocalPath = req.files?.coverImage[0]?.path;
        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is required");
        }
        //these line extract file paths from the request object
        //req.files => this object contains all files uploaded in a request 
        //?. => optional chaining, ho ya na ho
        //if req.files, req.files.avatar, or req.files.avatar[0] is null or undefined, 
          //the expression short-circuits and returns undefined instead of throwing an error due to optional chaining.
        //[0] => means accessing the first file

        
        
        //5
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)


        if(!avatar){
            throw new ApiError(500, "Avatar is required");
        }

        //6
        const user = await User.create({
            fullname,
            avatar: avatar?.url || "",
            coverImage:  coverImage?.url || "",//agar coverimage ho tho us mai sai url nikaal lo but agar nahi hai tho empty rehnay do usse
            email,
            password,
            username: username.toLowerCase() 
        })

        //7.
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )//agar user successfully create hua tho e kuch response dega
        //-password => means password nahi chahye

        //and password means just password chahye


        //8.
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering the user");
        }


        //9
        return res.status(201).json(
            new ApiResponse(200,createdUser, "User registerd successfully")
        )

    })  


const loginUser = asyncHandler(async (req,res)=>{
    /* steps to do this:

    1.req.body say data lena
    2.check user username or email, is it exist
    3.find the user
    4.check if user exist 
    5. check password
    6. access and refresh generate karna and send them to user
    7.send cookie & response     
    */


    //1.
    const {email, password, username}=req.body;
    //2.
    if(!(username || email)){// or (!username && !email) same work
        throw new ApiError(400,"Username or password is required")
    }

    //3.
    const user = User.findOne({
        $or:[{email},{username}]
    })
    //4.
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    //5.
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid credentials")
    }

    //6
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")//jho fileds nahi chahye then select that fields
    
    const options = {
        httpOnly : true,//This option specifies that the cookie should be accessible only by the web server, not by JavaScript running in the browser.
        //This helps to mitigate certain types of cross-site scripting (XSS) attacks, as it prevents client-side scripts from accessing the cookie's contents.
        
        secure: true//This option ensures that the cookie is only sent over HTTPS, not over HTTP.
    }


    //Access Token: The client needs the access token to include in the headers of future API requests, allowing it to authenticate the user.
    //Refresh Token: The refresh token is stored securely (often in an HTTP-only cookie) on the client side. When the access token expires,
       // the client can use the refresh token to request a new access token without forcing the user to log in again
    
    //The loggedInUser object contains the user's details that the client might need to display or use in the application
      
    
    //7.
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
            //
        },
    "User logged in successfully"
     )
  )
    
})

//give me code for forwardpassword




const logoutUser = asyncHandler(async(req,res)=>{
    //problem => user kaha say lao, in middleware
    const userId = req.user?._id;
    
    //why we are checking that user exist or not?
    //to unsure that the request is coming from an authorized user is essential.
    //for consistency 
    if(!userId){
        throw new ApiError(401,"unauthorized request")
    }

    // User.updateOne(
    //     { _id: userId },  // Search by userId
    //     { $unset: { refreshToken: 1 } }  // Remove the refreshToken field
    // );

    //this above one is also true
    

    User.findByIdAndUpdate(
        userId,
        {  //unset removes fields from document
            //1 means it should be removed, cuz to invalidate the refresh token,
            //means the user will not be able to use that token to obtain new access tokens in the future
            $unset: { refreshToken: 1}
        },
        {
            new: true 
            //specifies that the method should return the upload document and 
            //update is applied.
        }
    )

    //this is also repeated 
    const CookieOptions = {
        httpOnly : true,
        secure: true,
        // sameSite: 'strict'
    }

    //can add this code for best practices
    res.clearCookie("accessToken", CookieOptions);
    res.clearCookie("refreshToken", CookieOptions);

    //this is repeated again, look in previous method
    return res
    .status(200)
    // .clearCookie("accessToken",CookieOptions)
    // .clearCookie("refreshToken",CookieOptions)
    .json(new ApiResponse(200,{},"User logged out"))



    // it means that now you dont have the refresh token to generated 
    //access token for yourself. Then to use software you have to login again and 
    //generate new refresh token for yourself


    //every time a user logs in, a new pair of refresh and access tokens are generated, 
    //and these tokens are usually different and random for each session. 

    //Once logged in, a new access token may be generated whenever the current access 
    //token expires and the client requests a new one using the refresh token.

    //Question: what if the life of access token was 5 minutes for a software I used and I used 
    //that software for 15 minutes then what happen is it will automatically logout or something else will happen?

    //Answer:  During the first 5 minutes, the access token is valid, and you can use the software without any interruptions.
    //         Once the 5 minutes have passed, the access token expires.
    //         If you try to perform an action that requires authentication,  the server will detect that the access token has expired.
    //         and it is automatic
})

//this is an endpoint to refresh an access token using refresh token
const refreshAccessToken = asyncHandler(async(req,res)=>{

    //1. first get the refresh token
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken //agar koi mobile app use kar raha tho 

    //2. check if you have the refresh token
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
     
    
     try {
        //to verify the authenticity of the incoming refresh token
        const decodedToken = jwt.verify(
           incomingRefreshToken,
           process.env.REFRESH_TOKEN_SECRET//give it the key
           //this must match the the secret used when the token was originally generated.
           //if the token is valid then jwt decodes it and returns the payload, containing userId in this case
        )
   
        //to find the user in db using the id extracted from the decoded token
        const user = await User.findById(decodedToken?._id);

        if(!user){
           throw new ApiError(401, "invalid refresh token")
        }
   
        //compares the incoming refresh token with the refresh token in db
        if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401, "Refresh token is expired")
        }
   
        const options = {
           httpOnly : true,//providing protection against XSS attacks.
           secure: true
        }
   
        //generate signs a new access token with a short span and a new refresh token with a longer span`
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


     //there is one confusion. that when the access 
     //token expires then this function will run and this function is generating new access token but as well as refresh token so it
     // means that every time when the access token is generating along with this refresh token is also generated newly?

     //why is this?
     //One time use: This limits the risk if the refresh token is compromised because it cannot be reused.
     //token rotation:  It makes it harder for attackers to use stolen refresh tokens because each token is valid for only one use.
     //                 Once it's used to obtain a new access token, it is replaced with a new refresh token.
     //this is used for application which are very risky like banking applications.

     //Reusing the Same Refresh Token for example better for SPAs

     //3. Sliding expiration fo refresh tokens:
     //   it extends the validity of the refresh token with each use

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    /*
    1. get user id from req and find the user
    2. get current and old password from req.body
    3. check if password is correct
    4. update password and save it 
    5. send response
    */
   
    //1.
    const user = await User.findById(req.user?._id);

    //2.
    const {oldPassword, newPassword} = req.body;

    //3.
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid password")
    }
    
    //4.
    user.password = newPassword

    await user.save({validateBeforeSave: false})
    //it means that you telling the Mongoose not to run 
    //validation on the document before saving it to the database

    //this means that any validation rules defined in your mongoose schema 
    //will be bypassed and the document will be saved without checking it it meets thos validation
    //criteria. why this cuz You are making a minor update that doesn't require re-validation
    //it improve the performance slightly

    //5.
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

    //validation: this approach ensures that both fields must be given
    //this is not partial update
    if(!fullname || !email){
        throw new ApiError(400, "All fields are required")
    }

    //what if the email already exists?
    const emailExists = await User.findOne({email});
    
    // if(emailExists){
    //     throw new ApiError(400, "Email already exists")
    // }

    //there is a problem with this approach that this will not differentiate between 
    //whether the email belongs to the current user or another user?

    //instead do this one
    if (emailExists && emailExists._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Email already in use");
    }
    //yeah I got it.


    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {//set operator update the fullname and email fields with the new values
                fullname,
                email
            }
        },
        {new: true}//means to return the updated document
    ).select("-password")//exlclude the password from the fields

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Account details updated successfully"))
})

//How to improve this further?
//1. Error handling can be improved further
//2. Validation layer: use library like Joi or express validator to handle input validation.
     //this will separate validation logic from business logiv, making the code cleaner and more maintainable.
//3. Atomic conditions: 
//4. Logging: add logging for both successful operations and errors.
//5. input sanitization: implement it to prevent potential security vulnerabilities. like injection attacks.
     //this can done before passing the data to the database

//6. Rate limiting or debouncing: to protect this endpoint from spammed with multiple requests, which could potentially lead
     //lead to race conditions or database load issues
//7. Always validate that the user is authenticated and authorized to make changes to the account. 
//8. Another thing is try to implement partial updating like if I want to keep the fullname or email the same then its done.
//after implementing these things your application is the best.


//this is to update userAvatar url in the database and upload the file to cloudinary
const updateUserAvatar = asyncHandler(async(req,res)=>{
    //optional chaining for safely checking
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    //the avatat will contain details like the url of the uploaded image.
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    //
    if(!avatar.url){
        throw new ApiError(400,"Error while uploadig on avatar")
    }

    //update avatar same like we did for fullname and email
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


// retirieve user profile based on username.
// It gathers information such as the user's full name, 
//username, number of subscribers, channels they are subscribed to,
// and whether the current logged-in user is subscribed to this channel.

const getUserChannelprofile = asyncHandler(async(req,res)=>{
    const {username} = req.params
   
    //validation
   if(!username?.trim){
    throw new ApiError(400,"username is missing")
   }

   //aggregation pipeline, having multiple stages
   const channel = await User.aggregate([
    //first pipline
    {
        $match:{//filtering using username we provided
            username: username?.toLowerCase()
        }
    },
    {
        $lookup:{//look up the subscription collection to find all
                 // users who have subscribed to this channel. Gives an array
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $lookup:{//this time look up the subscription collection again , this time to find all
                 //channels that this user has subscribed to. 
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields:{//add new fields to the rsulting data
            subscribersCount:{//using the size operator on the subscribers array we have got previously.
                $size: "$subscribers"
            },
            channelsSubscribedToCount:{//count the channels user suvbscribed
                $size: "$subscribedTo"
            },
            isSubscribed:{//checks if the currently logged-in user is in the subscribers list or not.
                          //if yes then true otherwise return false
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},//in means is it exists
                                           //subscriber field in each document within the subscribers array
                    then: true,
                    else:false
                }
            }
        }
    },
    {
        $project:{//specifies which fields to project means which fields to return 
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

   //if this accurs then it means there is no channel.
   if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
   }
   
   return res
   .status(200)
   .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
   )

   //it will return an array may be it has one element that you want or nothing at all.
    
   //some improvements needed:
   //1. Performance: ensure that the username field in the User collection is indexed.
        //this will speed up the $match operation.
    //2. You can use external services for better error logging.
    //3. implement rate limiting.
    //4. prevention of injection attacks.
})


//this below code retrieves a user's watch history from MongoDB, where each watched video 
//includes additional information about the video's owner (such as their full name, 
//username, and avatar)


const getWatchHistory = asyncHandler(async(req,res)=>{
    //mongodb id=>string => not id
    //mongoose convert the id automatically to mongodb object id
    //we get the string not the id, and we pass the string though mongoose to mongodb
    //and mongoose automatically do it 
    //id conversion
    const user = await User.aggregate([
        {    //this convert the user's _id from a string to a mongodb objectId
             //cuz mongodb requires the ID to be in objectId format
            $match:{//aggregation pipline ka jho code hai wo directly hi jata hai
                _id: new mongoose.Types.ObjectId(req.user._id)
            }//filter the documents in the user to find the specific user by their id.
        },
        {  //fetching watchHistory 
            $lookup:{//join between User and videos collection.
                    //it matches watchHistory from User with _id field in the videos.
                    //the resulting matched video documents are stored in an array named warchHistory with user.
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as:"watchHistory",
                pipeline:[//fetching video owner details
                    {
                        $lookup:{//processes each video in the watchHistory array by performing another join operation with the users collection.
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[//to project only specific fields, fullname and username and avatar from the users
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
                        $addFields:{//used to flatten the owner array so that it contains only the firt element
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

    //WE CAN ALSO DO THE ABOVE CODE LIKE THIS
    // const user = await User.findById(req.user._id)
    //         .populate({
    //             path: 'watchHistory',
    //             select: 'title description owner',
    //             populate: {
    //                 path: 'owner',
    //                 select: 'fullName username avatar'
    //             }
    //         });
})

//make something reuseable also in code

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
 };//this will make this function accessible to other files in the project



// Trim each field and check if it is empty
// if ((fullname && fullname.trim() === "") || 
//     (email && email.trim() === "") || 
//     (username && username.trim() === "") || 
//     (password && password.trim() === "")) {
    
//     console.log("There is at least one empty field.");
// } else {
//     console.log("All fields are filled.");
// }

//its not problem that you made the mistake, the problem is this that you can fix that bug or not


//session storage => refresh token -> in database
//refresh token comapares

//agar 401 request aye tho aik endpoint hit karo aur waha sai apna access token refresh
//karwalo, means naya token mil jaye ga, naya token kesay melega,aap us request mai refresh token 
//send karogay saath mai,ab refresh token jesay meray ko mela mai kia karoga, meray backend database mai
//store hai refresh token tho mai refresh token ko match karlonga, agar request sai jho aaya aur database wala
//same hui tho cahleay dobara sai session start kartay hai, iskay baad access token bhi response mai aye  ga aur refresh token bhi 
//renew hoga



//mongoose => object data modeling library for mongodb
