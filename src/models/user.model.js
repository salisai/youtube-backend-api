import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//define UserSchema
const userSchema = new Schema(
    {
      username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim: true,  
      },
      email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      },
      fullname : {
        type : String,
        required : true,
        trim: true,
        index : true
      },
      avatar : {
        type : String, 
      },
      coverImage : {
        type : String //url 
      },
      watchHistory :  [
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
      ],
      password : {
        type : String,
        required : [true, "Password is required"],
        minlength: 6
      },
      refreshToken : { 
        type : String
      }
    },
    {timestamps : true}
)


userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next();
   
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next()
})

//hide sensitive fields
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
}


userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password,)// this.password => encrypted password
}


userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {//payload
            _id : this._id,
            username : this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


//for identity check 
userSchema.methods.generateRefreshToken = function (){ 
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

//on logout invalidate
userSchema.methods.invalidateRefreshToken = function () {
  this.refreshToken = null;
  return this.save({validateBeforeSave: false});
}

export const User = mongoose.model("User",userSchema);




