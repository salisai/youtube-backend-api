import {v2 as cloudinary} from "cloudinary";//cloudinary as a variable name here
import fs from "fs";
import { ApiError } from "./ApiError.js";

//These variables must be set up in your environment to authenticate with Cloudinary.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (localFilePath)=>{
    try{

        if(!localFilePath) {;
           throw new ApiError(500, "Local file path is required");
        }

        const fileExists = await fs.promises.access(localFilePath, fs.constants.F_OK);
        if (!fileExists) {
          throw new Error('Local file does not exist');
        }

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"//type auto detection
        })

        //file has been uploaded successfully 
        console.log("File is uploaded on cloudinary",response.url);
        return response;//to user 
    
    }catch(error){
        try {
            await fs.promises.unlink(localFilePath);
            console.log("Local file removed due to upload failure");
        } catch (fsError) {
            console.error("Error deleting local file:", fsError);
        }
    }
}

const deleteFromCloudinary = async (pathId)=>{
    try{
        const response = await cloudinary.uploader.destroy(
            pathId, {invalidate: true, resource_type: "image"}
        );
        return response;
    }catch (error){
        throw new ApiError(500, "Something wrong while deleting from cloudinary")
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}




