import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, "./public/temp")
      //I will keep all files in public folder that we can easily access them
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
  
export const upload = multer({ storage })