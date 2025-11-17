import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile : {
            type : String,//cluodinary url
            required: [true, "Video file URL is required"],
            trim: true
        },
        thumbnail : {
            type : String,
            required : [true, "Thumbnail URL is required"]
        },
        title : {
            type : String,
            required : true,
            trim: true,
            maxlength: [150, "Title cannot be more than 150 characters"]
        },
        description : {
            type : String,
            required : true
        },
        duration : {
            type : Number,
        },
        views : {
            type : Number,
            default : 0
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {
        timestamps : true
    }
)


videoSchema.plugin(mongooseAggregatePaginate)

videoSchema.index({ title: "text", description: "text" }); 
videoSchema.index({ views: 1 }); 
videoSchema.index({ owner: 1, isPublished: 1 }); 

export const Video = mongoose.model("Video",videoSchema);


