import { ApiError } from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asynchandlers.js"
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js"


//jwt => to securly transmit information between parties.
export const verifyJWT =asyncHandler(async(req,_,next) =>{//By convention, an underscore _ is often used to indicate that the parameter is intentionally unused. 

    //token ka access
    try {
        //token ko extract krna hai yaha

        //.replace("Bearer ", ""): The replace method is then used to remove the "Bearer " prefix from this string,and replace with "", like nothing, leaving only the JWT itself.

        //?. => optional chaining, if any part of the chain is undefined or null it short-circuits and return undefined without throwing an error
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ","")
    
        //its simple
        if (!token) {
            throw new ApiError(401,"Unauthorized request")
        } 
    
        //This method(verify) and decodes the token
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        //The decodedToken contains the user’s _id. This line searches the database for a user with that _id
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    

        if(!user){
            TODO://  discuss about frontend
            throw new ApiError(401, "Invalid access token")
        }
    
        req.user = user;
        next()
        //If a valid user is found, it is attached to the req object as req.user. This makes the user’s information available to any subsequent middleware or route handlers.
    } catch (err) {
        throw new ApiError(401, err?.message || "Invalid access Token")
    }
})



/*
reflace() => used to find and replace specific text within a string.

string.replace(searchValue, newValue);

string: The string you want to modify.
searchValue: The substring or regular expression to search for.
newValue: The replacement text.

*/


/*
select() in Context of mongodb=>
To specify which field you want to include or exclude. Used for data projection and optimization.

why to use this?
1. Excluding sensitive data like passwords and refresh tokens helps protect user information.

2. Data Optimization: You can tailor the returned data to match your specific needs, avoiding unnecessary data transfer.

3. Performance: By selecting only the necessary fields, you reduce the amount of data transferred, improving query performance

select('name email -password')
this is also true

select() method is a powerful tool for controlling the data returned from a MongoDB query.

*/




/*
jsonwebtoken => for creating, sigining, verifying, and decoding JSON web tokens.

provide functions like sign, verify, decode etc

*/