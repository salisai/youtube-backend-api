//simple goal is k files meray paas files system k through aaye ge 
//i.e server par upload hogaye hai server say ab local path dengay and we will upload that on cloudinary   
//file remove karna => ?
//v2 as cloudinary => here cloudinary is the name in the curly bracket of the variable which contains cloudinary package
//unlink => delete karna file system say 
//link => upload karna 

import {v2 as cloudinary} from "cloudinary";//cloudinary as a variable name here
import fs from "fs";
import { ApiError } from "./ApiError.js";

//These variables must be set up in your environment to authenticate with Cloudinary.

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})



//localFilePath mai isko donga aur it wil upload the file on cloudinary and 
//will give some response back
const uploadOnCloudinary = async (localFilePath)=>{//localFilePath is a varialble name
    try{

        if(!localFilePath) {;
           throw new ApiError(500, "Local file path is required");
        }

        //can add here new feature like
        //This code snippet is checking if a file exists at the specified localFilePath.

        // const fileExists = await fs.promises.access(localFilePath, fs.constants.F_OK);
        // if (!fileExists) {
        //   throw new Error('Local file does not exist');
        // }

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"//upload option  here auto means k wo khud detect karay ga the file type (image, video, etc.).
        })

        //file has been uploaded successfully 
        console.log("File is uploaded on cloudinary",response.url);
        return response;//to user 
    
    }catch(error){
        // fs.unlinkSync(localFilePath)//remove the locally saved temporary file as 
        //return null;
        //upload operation got failed

        //or
        // await fs.promises.unlink(localFilePath);//this code is non-blockign allow othe code to execute while the file is being deleted
        // return null;

        //or
        // try {
        //     await fs.promises.unlink(localFilePath);
        //     console.log("Local file removed due to upload failure");
        // } catch (fsError) {
        //     console.error("Error deleting local file:", fsError);
        // }

        //all these three versions all great
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







//SOME GENERAL THINGS: 
/*
Types of exporting methods:

1. Named exports: 
    These exports must be imported using their exact names.
    Used to export multiple named variables, functions

    export const myFunction = () => { ... };
    or
    export { myFunction, myVariable, MyClass };

    importing like
    import { myFunction, myVariable, MyClass } from './myModule';



2. Default exports:
   Used to export a single default item from a module.
   It’s typically used when a module is supposed to expose one primary functionality.

   export default myFunction;


*/