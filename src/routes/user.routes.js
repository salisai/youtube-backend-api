import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelprofile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(  //matlub agar register enter kia tho post method mai userRegister call hojayega
  upload.fields([ //I am recieving here two files
    {
      name: "avatar",
      maxCount: 1, //the number of avatar
    },
    {
      name: "coverImage",
      maxCount: 1,
    }, //isse tarah middleware inject kartay hai
  ]), //fields accept array
  registerUser
);


//upload.fields => it is methods from multer middleware package.
//Now the question is why we upload files before user registered?
//another question answer is we will manually upload these files?

//what if we don't upload files?
//If the user doesn't upload an avatar or cover image, the upload.fields() middleware will still run, but req.files will simply be an empty object or contain undefined for those fields.
//good pracitce:
               //Default Values: If the application expects an avatar and cover image, you could assign default images if none are provided during registration. This is a common practice in many applications.
               //Error Handling: If your application requires these files and they are not provided, you could return an error response to the client, asking them to upload the necessary files.
               //Optional Fields: If these fields are optional, your registerUser function can simply skip over the file handling if req.files is empty or doesn't contain the expected fields

//because
//1. Data integrity: Uploading files before user registration allows you to ensure that 
//   the files are processed and ready to be associated with the user data at the time of registration. 
//   If there’s an issue with the file upload, you can handle it before trying to create a user, maintaining data integrity. 

//2. validation and error handling.


//Now lets learn the workflow:
//1. client request : A client sends a POST request to /register, including form data for the user's details, avatar, and cover image.
//2. Multer middleware: The upload.fields() middleware intercepts the request, processes the files, and attaches them to req.files.
//3. RegisterUser : After the files are processed, registerUser is called. It now has access to both the form data and the uploaded files, allowing it to create a new user and associate the uploaded avatar and cover image with that user.
 


//array => aik hi field mai multiple files leta hai
//faida kia howa isse?
//ache practice ye hai agar aap api define kar rahay
//aur iska version tho batayeay





router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

//secured routes

//WE can also do like this as all are secure routes

// router.use(verifyJWT);
// router.post("/logout", logoutUser);
// router.post("/change-password", changeCurrentPassword);
// router.get("/current-user", getCurrentUser);
// router.patch("/update-account", updateAccountDetails);
// router.patch("/avatar", upload.single("avatar"), updateUserAvatar);
// router.patch("/cover-image", upload.single("coverImage"), updateUserCoverImage);
// router.get("/c/:username", getUserChannelProfile);
// router.get("/history", getWatchHistory);


router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelprofile);
router.route("/history").get(verifyJWT, getWatchHistory);


export default router;
